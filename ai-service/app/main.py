import asyncio
import time
import uuid
import json
import base64
import hmac
import hashlib
import logging
import re
import unicodedata
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

import asyncpg
from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import httpx

from qdrant_client.http.models import Filter, FieldCondition, MatchValue

from app.config import settings
from app.db import close_db_pool, get_pool, init_db_pool, init_qdrant, close_qdrant, get_qdrant
from app.llm_client import RuntimeLlmManager, build_llm_client_for_mode
from app.query_rewriter import QueryRewriter
from app.hybrid_search import HybridSearcher
from app.reranker import Reranker
from app.judge import LlmJudge
from app.schemas import AskRequest, FeedbackRequest, FeedbackResponse, ProviderConfigResponse, ProviderModeUpdateRequest, RagRequestDetail
from app.security import require_service_auth
from app.rag_processing import (
    _context_contains_question_terms,
    _fold_for_match,
    _has_non_table_context,
    _is_obvious_out_of_scope,
    _is_plain_greeting,
    _is_safe_query_variant,
    _normalize_answer_text,
    _normalize_for_compare,
    _parse_markdown_table_rows,
    _question_lookup_terms,
    _rank_context_chunks,
    _sanitize_context_text,
    _strip_json_products_block,
    _tokenize_for_rank,
    _try_answer_from_markdown_table,
    _try_answer_from_plain_text_context,
    _try_product_recommend_from_markdown_table,
)


llm_manager = RuntimeLlmManager(settings)
logger = logging.getLogger(__name__)
KB_NOT_FOUND_ANSWER = "Tôi là Trợ lý AI, tôi có thể giúp gì cho bạn không?"
KB_NOT_FOUND_MARKER = "__WISEBOT_KB_NOT_FOUND__"

# ── Khởi tạo các service nâng cao RAG ─────────────────────────────────────
query_rewriter = QueryRewriter(llm_manager.client)  # sẽ được refresh khi switch mode
hybrid_searcher = HybridSearcher()
reranker = Reranker(llm_manager.client)
judge = LlmJudge(shared_llm=llm_manager.client)  # Judge: dedicated DeepSeek hoặc shared LLM


async def _warmup_llm_model() -> None:
    for attempt in range(1, 4):
        try:
            await llm_manager.client.chat(
                system_prompt="Return exactly OK.",
                user_prompt="OK",
                temperature=0.0,
            )
            logger.info(
                "AI warmup completed with provider=%s model=%s",
                llm_manager.client.provider_key,
                llm_manager.client.model_name,
            )
            return
        except Exception:
            if attempt == 3:
                logger.warning("AI warmup failed after %d attempts", attempt, exc_info=True)
                return
            await asyncio.sleep(2 * attempt)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db_pool()
    await init_qdrant()
    persisted_mode = await _load_persisted_provider_mode()
    if persisted_mode and persisted_mode != llm_manager.mode:
        try:
            await llm_manager.switch_mode(persisted_mode)
            # Refresh RAG advanced services với LLM client sau khi switch
            global query_rewriter, reranker, judge
            query_rewriter = QueryRewriter(llm_manager.client)
            reranker = Reranker(llm_manager.client)
            judge.set_shared_llm(llm_manager.client)
        except Exception:
            logger.exception("Failed to restore persisted AI mode '%s'", persisted_mode)
    warmup_task = asyncio.create_task(_warmup_llm_model())
    yield
    if not warmup_task.done():
        warmup_task.cancel()
    await llm_manager.close()
    await judge.close()
    await close_qdrant()
    await close_db_pool()


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)


@app.get("/health")
async def healthcheck() -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("SELECT 1")
    return {"status": "ok", "service": settings.app_name}


@app.get("/v1/provider")
async def provider_info(_: dict[str, Any] = Depends(require_service_auth)) -> dict[str, str]:
    llm_client = llm_manager.client
    return {
        "mode": llm_manager.mode,
        "provider": llm_client.provider_key,
        "provider_name": llm_client.provider_name,
        "model_name": llm_client.model_name,
    }


async def _load_persisted_provider_mode() -> str | None:
    headers = {"X-Internal-Api-Key": settings.internal_config_api_key}
    last_error: Exception | None = None

    for attempt in range(1, 6):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{settings.user_service_base_url}{settings.system_setting_mode_path}",
                    headers=headers,
                )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            payload = response.json()
            data = payload.get("data") if isinstance(payload, dict) else None
            value = data.get("value") if isinstance(data, dict) else None
            return str(value).strip().lower() if value else None
        except Exception as exc:
            last_error = exc
            if attempt < 5:
                await asyncio.sleep(2)

    logger.warning("Failed to load persisted AI provider mode after retries: %s", last_error)
    return None


async def _persist_provider_mode(mode: str) -> None:
    headers = {
        "X-Internal-Api-Key": settings.internal_config_api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "value": mode,
        "description": "System-wide AI provider mode for answer generation",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.put(
            f"{settings.user_service_base_url}{settings.system_setting_mode_path}",
            headers=headers,
            json=payload,
        )
    response.raise_for_status()


@app.put("/v1/provider", response_model=ProviderConfigResponse)
async def update_provider_mode(
    payload: ProviderModeUpdateRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> ProviderConfigResponse:
    next_mode = payload.mode.strip().lower()
    preview_client = build_llm_client_for_mode(settings, next_mode)
    await preview_client.close()
    await _persist_provider_mode(next_mode)
    client = await llm_manager.switch_mode(payload.mode)

    # Refresh các RAG advanced service với LLM client mới
    global query_rewriter, reranker, judge
    query_rewriter = QueryRewriter(client)
    reranker = Reranker(client)
    judge.set_shared_llm(client)

    return ProviderConfigResponse(
        mode=llm_manager.mode,
        provider=client.provider_key,
        provider_name=client.provider_name,
        model_name=client.model_name,
    )


async def _judge_and_persist(
    judge_instance: LlmJudge,
    pool: asyncpg.Pool,
    request_id: uuid.UUID,
    question: str,
    answer: str,
    retrieved_chunks: list[dict],
) -> None:
    """Chạy judge ngầm, ghi kết quả vào DB khi xong."""
    try:
        scores = await judge_instance.evaluate(
            question=question,
            answer=answer,
            retrieved_chunks=retrieved_chunks,
        )
        if any(scores.get(k, 0) > 0 for k in ("faithfulness", "answer_relevance", "context_relevance")):
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE ai_service.ai_rag_requests
                    SET judge_faithfulness=$2, judge_answer_relevance=$3,
                        judge_context_relevance=$4, judge_brief=$5
                    WHERE id=$1
                    """,
                    request_id,
                    scores.get("faithfulness", 0),
                    scores.get("answer_relevance", 0),
                    scores.get("context_relevance", 0),
                    scores.get("brief", ""),
                )
    except Exception:
        logger.warning("Background judge failed for request %s", request_id, exc_info=True)


def _build_prompts(question: str, retrieved_chunks: list[dict], page_context: dict | None = None) -> tuple[str, str]:
    """Build prompt for RAG chat. Product JSON is reserved for the dedicated recommend API."""
    context_lines: list[str] = []
    for chunk in _rank_context_chunks(question, retrieved_chunks):
        context_lines.append(_sanitize_context_text(chunk["chunk_text"]))

    context_text = "\n\n---\n\n".join(context_lines) if context_lines else ""
    recommend_mode = bool(page_context and page_context.get("recommendMode") is True)

    # Build page context info
    page_info = ""
    if page_context:
        product_name = page_context.get("productName") or page_context.get("product_name", "")
        product_category = page_context.get("productCategory") or page_context.get("product_category", "")
        page_title = page_context.get("pageTitle") or page_context.get("page_title", "")
        if product_name:
            page_info += f"- Đang xem: {product_name}\n"
        if product_category:
            page_info += f"- Danh mục: {product_category}\n"
        if page_title and not product_name:
            page_info += f"- Trang: {page_title}\n"

    common_rules = (
        "Bạn là trợ lý AI WISEBOT, có nhiệm vụ trả lời dựa trên tài liệu được cung cấp.\n"
        "\n"
        "LUẬT CHUNG BẮT BUỘC (PHẢI TUÂN THỦ TUYỆT ĐỐI):\n"
        " - CHỈ trả lời bằng TIẾNG VIỆT.\n"
        " - CHỈ dùng thông tin có trong CONTEXT.\n"
        " - KHÔNG xin lỗi khi đã có thông tin.\n"
        " - KHÔNG dùng kiến thức bên ngoài CONTEXT dù biết chắc chắn.\n"
        " - KHÔNG suy đoán, KHÔNG tự bịa thông tin dưới bất kỳ hình thức nào.\n"
        " - KHÔNG tự tạo tên riêng, số liệu, giá tiền, ngày tháng, điều kiện, chính sách, quy trình, số điện thoại, email, địa chỉ, link hoặc kết luận nếu CONTEXT không nêu rõ.\n"
        " - KHÔNG tự ý suy diễn chính sách, quy định, khuyến mãi, ưu đãi nếu CONTEXT không đề cập.\n"
        f" - KHÔNG trả lời các câu hỏi về pháp lý, y tế, tài chính, đầu tư nếu ngoài KB — trả lời đúng marker {KB_NOT_FOUND_MARKER}.\n"
        " - KHÔNG đưa ra lời khuyên mang tính cá nhân, đánh giá chủ quan hoặc phán xét sản phẩm/dịch vụ.\n"
        " - KHÔNG hứa hẹn, cam kết hoặc bảo đảm bất kỳ điều gì thay mặt doanh nghiệp.\n"
        f" - Nếu KB/CONTEXT không có thông tin phù hợp: CHỈ trả lời đúng marker {KB_NOT_FOUND_MARKER} — TUYỆT ĐỐI KHÔNG thêm bất kỳ câu nào khác trước hoặc sau.\n"
        " - Nếu CONTEXT có thông tin: trả lời TRỰC TIẾP câu trả lời, KHÔNG mở đầu bằng \"Xin lỗi\" hoặc \"Tuy nhiên\".\n"
        " - Nếu CONTEXT chỉ có một phần thông tin: CHỈ trả lời phần có căn cứ, KHÔNG nói \"không tìm thấy\" rồi lại trả lời — chỉ chọn 1 trong 2.\n"
        f" - Nếu câu hỏi không liên quan đến lĩnh vực của tài liệu, trả lời đúng marker {KB_NOT_FOUND_MARKER}\n"
        " - Không hiển thị citation markers trong câu trả lời vì hệ thống sẽ xử lý nguồn riêng.\n"
        " - Trả lời thẳng, rõ ràng, súc tích, dễ hiểu, tối đa 3-4 câu.\n"
        " - KHÔNG nhắc lại câu hỏi của người dùng.\n"
        " - KHÔNG dùng các cụm mở đầu như \"Theo thông tin trong CONTEXT\", \"Theo tài liệu\", \"Dựa trên thông tin\", \"Theo như\". Trả lời TRỰC TIẾP.\n"
        " - Không nhắc lại toàn bộ CONTEXT.\n"
        " - Không nói rằng bạn là mô hình AI hoặc đề cập đến bản thân bạn.\n"
        " - Không thêm nhận xét chung chung hoặc kết luận ngoài phạm vi câu hỏi.\n"
    )

    common_rules += (
        "\n"
        "QUY TAC HIEN THI BAT BUOC:\n"
        " - Khong bao gio nhac den cac nhan ky thuat nhu CONTEXT, DU LIEU NOI BO, ngu canh, tai lieu, thong tin duoc cung cap trong cau tra loi.\n"
        " - Khong mo dau bang cac cum: \"Theo thong tin trong CONTEXT\", \"Theo CONTEXT\", \"Theo thong tin\", \"Dua tren thong tin\", \"Dua tren tai lieu\", \"Theo tai lieu\".\n"
        " - Tra loi truc tiep nhu mot nhan vien ho tro dang noi voi khach hang.\n"
        " - Neu cau tra loi co nhieu muc phi, hay dung gach dau dong ngan gon.\n"
        " - Chi tra loi dung cau hoi hien tai cua nguoi dung, khong tra loi cac cau hoi khac xuat hien trong du lieu.\n"
        f" - Neu du lieu chi co thong tin lien he/hotline/kenh ho tro ma KHONG co dap an truc tiep cho cau hoi, tra loi dung marker {KB_NOT_FOUND_MARKER}.\n"
        " - Khong duoc bien hotline, app, van phong, bo phan ho tro thanh cau tra loi thay the cho noi dung khong co trong KB.\n"
        f" - Loi chao ngan nhu 'xin chao', 'hi', 'hello' ma KB khong co kich ban chao rieng thi tra loi dung marker {KB_NOT_FOUND_MARKER}.\n"
        " - Cac cau hoi ve quy dinh, chinh sach, quy trinh noi bo co trong KB KHONG phai cau hoi phap ly; hay tra loi binh thuong dua tren KB.\n"
        " - Chi tu choi cau hoi phap ly khi nguoi dung xin tu van luat, tranh chap, hop dong, kien tung hoac nghia vu phap ly ngoai KB.\n"
    )

    if recommend_mode:
        system_prompt = (
            common_rules
            + "\n"
            "CHẾ ĐỘ RECOMMEND API:\n"
            "\n"
            "Chế độ này dùng khi người dùng hỏi về gợi ý, tư vấn hoặc lựa chọn sản phẩm cụ thể.\n"
            "\n"
            "Nếu câu hỏi yêu cầu gợi ý sản phẩm, tư vấn chọn sản phẩm, so sánh sản phẩm, tìm sản phẩm phù hợp với nhu cầu, "
            "hãy trả lời theo đúng format sau:\n"
            "\n"
            "1. Viết 1-2 câu giới thiệu ngắn gọn bằng tiếng Việt.\n"
            "2. Sau đó ghi đúng dòng sau:\n"
            "__JSON_PRODUCTS__\n"
            "3. Tiếp theo là JSON array chứa tối đa 3 sản phẩm phù hợp nhất từ CONTEXT.\n"
            "4. Sau đó ghi đúng dòng sau:\n"
            "__END_JSON__\n"
            "5. Cuối cùng viết 1 câu kết ngắn gọn bằng tiếng Việt.\n"
            "\n"
            "QUY TẮC CHỌN SẢN PHẨM (BẮT BUỘC):\n"
            " - CHỈ lấy sản phẩm xuất hiện trong CONTEXT. KHÔNG tự bịa sản phẩm.\n"
            " - KHÔNG tự bịa id, name, price, imageUrl, detailUrl dưới bất kỳ hình thức nào.\n"
            " - Chỉ đưa sản phẩm vào JSON nếu CONTEXT có ít nhất id, tên sản phẩm và giá.\n"
            " - Map cột tương đương từ CONTEXT sang JSON: name lấy từ name/ten/tên/ten_san_pham/title; price lấy từ price/gia/giá/gia_vnd; imageUrl lấy từ imageUrl/image_url/image/anh/ảnh; detailUrl lấy từ detailUrl/detail_url/url/link.\n"
            " - Nếu CONTEXT có nhiều hơn 3 sản phẩm, chọn tối đa 3 sản phẩm phù hợp nhất với câu hỏi.\n"
            " - Nếu người dùng hỏi theo ngân sách, nhu cầu, danh mục hoặc đặc điểm cụ thể, ưu tiên sản phẩm khớp với các điều kiện đó dựa trên dữ liệu trong CONTEXT.\n"
            " - KHÔNG suy diễn sản phẩm 'tương tự' hoặc 'cùng loại' nếu CONTEXT không nêu rõ mối quan hệ.\n"
            " - KHÔNG khẳng định sản phẩm còn hàng, hết hàng, đang khuyến mãi nếu CONTEXT không nói rõ.\n"
            " - KHÔNG so sánh sản phẩm nếu CONTEXT không có đủ dữ liệu để so sánh.\n"
            " - Nếu không có sản phẩm phù hợp hoặc dữ liệu sản phẩm không đủ id/tên/giá, KHÔNG dùng JSON, chỉ trả lời đúng câu: "
            f"\"{KB_NOT_FOUND_MARKER}\"\n"
            "\n"
            "QUY TẮC JSON (BẮT BUỘC):\n"
            " - JSON phải hợp lệ và parse được bằng JSON.parse.\n"
            " - Không dùng markdown.\n"
            " - Không bọc JSON bằng ```json hoặc ```.\n"
            " - Không thêm comment trong JSON.\n"
            " - JSON array phải nằm giữa hai marker __JSON_PRODUCTS__ và __END_JSON__.\n"
            " - price phải là number, đơn vị VND, không có dấu phẩy, không phải string.\n"
            " - id phải là số lấy đúng từ CONTEXT.\n"
            " - name phải lấy đúng tên sản phẩm từ CONTEXT, có thể map từ cột ten_san_pham/tên/name/title.\n"
            " - imageUrl lấy từ CONTEXT; nếu CONTEXT không có thì để chuỗi rỗng.\n"
            " - detailUrl lấy từ CONTEXT; nếu CONTEXT không có thì để chuỗi rỗng.\n"
            " - reason chỉ viết 1 câu ngắn, phải dựa trên thông tin thực tế trong CONTEXT, không suy diễn.\n"
            "\n"
            "Cấu trúc mỗi object trong JSON array:\n"
            "{\n"
            '  "id": <số, id sản phẩm từ CONTEXT>,\n'
            '  "name": "<tên sản phẩm từ CONTEXT>",\n'
            '  "price": <số, giá VND>,\n'
            '  "imageUrl": "<url ảnh từ CONTEXT, nếu không có thì để chuỗi rỗng>",\n'
            '  "detailUrl": "<url chi tiết từ CONTEXT, nếu không có thì để chuỗi rỗng>",\n'
            '  "reason": "<1 câu ngắn giải thích vì sao phù hợp, CHỈ dựa trên CONTEXT>"\n'
            "}\n"
            "\n"
            "Ví dụ format hợp lệ:\n"
            "Dựa trên thông tin tìm thấy, tôi gợi ý một số sản phẩm phù hợp nhất với nhu cầu của bạn.\n"
            "__JSON_PRODUCTS__\n"
            "[\n"
            "  {\n"
            '    "id": 1,\n'
            '    "name": "Tên sản phẩm",\n'
            '    "price": 250000,\n'
            '    "imageUrl": "",\n'
            '    "detailUrl": "",\n'
            '    "reason": "Sản phẩm này phù hợp vì có đặc điểm đúng với nhu cầu được nêu."\n'
            "  }\n"
            "]\n"
            "__END_JSON__\n"
            "Bạn có thể xem thêm chi tiết sản phẩm trước khi lựa chọn.\n"
            "\n"
            "CÂU HỎI KHÔNG PHẢI GỢI Ý SẢN PHẨM:\n"
            " - Nếu câu hỏi là chính sách, FAQ, hướng dẫn, giao hàng, đổi trả, bảo hành, thanh toán, điều khoản, học phí, đặt lịch hoặc phí dịch vụ, "
            "hãy trả lời văn bản bình thường, KHÔNG dùng JSON.\n"
            " - Với các câu hỏi này, TUYỆT ĐỐI KHÔNG dùng __JSON_PRODUCTS__ hoặc __END_JSON__.\n"
            f" - Nếu người dùng hỏi về thông tin chung chung không có trong KB/CONTEXT, trả lời đúng marker {KB_NOT_FOUND_MARKER}\n"
        )
    else:
        system_prompt = (
            common_rules
            + "\n"
            "CHẾ ĐỘ CHAT THƯỜNG:\n"
            " - Luôn trả lời bằng văn bản tự nhiên, tối đa 3-4 câu.\n"
            " - TUYỆT ĐỐI KHÔNG xuất JSON sản phẩm.\n"
            " - TUYỆT ĐỐI KHÔNG dùng các marker __JSON_PRODUCTS__ hoặc __END_JSON__.\n"
            " - Với câu hỏi về chính sách giao hàng, đổi trả, bảo hành, học phí, đặt lịch, phí dịch vụ, điều khoản hoặc hướng dẫn sử dụng, "
            "CHỈ tóm tắt đúng các ý có trong CONTEXT, KHÔNG thêm bất kỳ thông tin nào ngoài CONTEXT.\n"
            " - Có thể dùng gạch đầu dòng nếu câu trả lời có nhiều ý, nhưng vẫn phải dựa hoàn toàn trên CONTEXT.\n"
            " - Nếu người dùng hỏi ngoài phạm vi thông tin có trong KB/CONTEXT, "
            f"trả lời đúng marker {KB_NOT_FOUND_MARKER}\n"
            " - Nếu người dùng yêu cầu thực hiện hành động (gửi email, đặt hàng, tạo tài khoản, thanh toán), "
            f"trả lời đúng marker {KB_NOT_FOUND_MARKER}\n"
            " - KHÔNG đưa ra lời khuyên cá nhân, đánh giá chủ quan hoặc khuyến nghị mua hàng.\n"
            " - KHÔNG suy diễn chính sách khuyến mãi, giảm giá, ưu đãi nếu CONTEXT không nêu rõ.\n"
            f" - Nếu câu hỏi có thể hiểu sai theo nhiều nghĩa, KHÔNG tự chọn một nghĩa — hãy trả lời dựa trên thông tin trong CONTEXT hoặc trả lời đúng marker {KB_NOT_FOUND_MARKER}\n"
        )

    user_prompt = f"CÂU HỎI:\n{question.strip()}\n"

    if page_info and page_info.strip():
        user_prompt += f"\nNGỮ CẢNH TRANG:\n{page_info.strip()}\n"

    user_prompt += (
        f"\nDỮ LIỆU NỘI BỘ ĐỂ TRẢ LỜI (không được nhắc tên phần này trong câu trả lời):\n{context_text.strip() if context_text else ''}\n"
        "\n"
        "YÊU CẦU:\n"
        f"Trả lời trực tiếp câu hỏi của người dùng bằng dữ liệu ở trên. Nếu dữ liệu không chứa đáp án trực tiếp, chỉ trả lời marker {KB_NOT_FOUND_MARKER}. Không nhắc tên phần dữ liệu, không nói 'theo thông tin', và tuân thủ toàn bộ luật trong system prompt.\n"
        "\n"
        "TRẢ LỜI:"
    )

    return system_prompt, user_prompt

def _generate_service_token() -> str:
    now = int(time.time())
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').decode().rstrip("=")
    payload = base64.urlsafe_b64encode(
        json.dumps(
            {
                "sub": settings.app_name,
                "iss": settings.service_jwt_issuer,
                "iat": now,
                "exp": now + 60,
            },
            separators=(",", ":"),
        ).encode()
    ).decode().rstrip("=")
    message = f"{header}.{payload}"
    signature = hmac.new(
        settings.service_jwt_secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{message}.{signature_b64}"


def _raise_llm_http_exception(exc: httpx.HTTPError) -> None:
    if isinstance(exc, httpx.HTTPStatusError):
        status_code = exc.response.status_code
        detail = exc.response.text
        raise HTTPException(
            status_code=status_code,
            detail=f"LLM request failed ({status_code}): {detail}",
        ) from exc

    raise HTTPException(
        status_code=502,
        detail=f"LLM service unreachable: {exc}",
    ) from exc


def _to_jsonb_param(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


async def _retrieve_context(
    tenant_id: uuid.UUID,
    question: str,
    top_k: int,
    collection_id: uuid.UUID | None,
    knowledge_base_id: uuid.UUID | None,
) -> list[dict]:
    if not collection_id and not knowledge_base_id:
        raise HTTPException(status_code=400, detail="Either collection_id or knowledge_base_id is required")

    payload: dict[str, Any] = {
        "tenant_id": str(tenant_id),
        "query": question,
        "top_k": top_k,
    }
    if collection_id:
        payload["collection_id"] = str(collection_id)
    if knowledge_base_id:
        payload["knowledge_base_id"] = str(knowledge_base_id)

    headers = {
        "Authorization": f"Bearer {_generate_service_token()}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.embedding_base_url}{settings.embedding_search_path}",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            body = response.json()
    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code
        detail = exc.response.text
        raise HTTPException(
            status_code=status_code,
            detail=f"Embedding search failed ({status_code}): {detail}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Embedding service unreachable: {exc}",
        ) from exc

    items = body.get("items")
    if not isinstance(items, list):
        return []

    retrieved: list[dict] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        source_document_id = item.get("source_document_id")
        source_chunk_id = item.get("source_chunk_id")
        if not source_document_id or not source_chunk_id:
            continue
        retrieved.append(
            {
                "source_document_id": uuid.UUID(str(source_document_id)),
                "source_chunk_id": uuid.UUID(str(source_chunk_id)),
                "chunk_index": int(item.get("chunk_index", 0)),
                "chunk_text": str(item.get("chunk_text", "")),
                "score": float(item.get("score", 0.0)),
            }
        )
    return retrieved


async def _resolve_collection_id(
    collection_id: uuid.UUID | None,
    knowledge_base_id: uuid.UUID | None,
    tenant_id: uuid.UUID,
) -> uuid.UUID | None:
    """Resolve collection_id từ knowledge_base_id nếu cần."""
    if collection_id:
        return collection_id
    if not knowledge_base_id:
        return None

    try:
        headers = {"Authorization": f"Bearer {_generate_service_token()}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.embedding_base_url}/v1/collections/resolve",
                params={"tenant_id": str(tenant_id), "knowledge_base_id": str(knowledge_base_id)},
                headers=headers,
            )
            if resp.status_code == 200:
                data = resp.json()
                return uuid.UUID(str(data.get("id")))
    except Exception:
        logger.warning("Failed to resolve collection for knowledge_base %s", knowledge_base_id)
    return None


async def _include_document_header_chunks(
    chunks: list[dict],
    tenant_id: uuid.UUID,
    collection_id: uuid.UUID | None,
) -> list[dict]:
    if not chunks or not collection_id:
        return chunks

    existing_ids = {str(chunk.get("source_chunk_id")) for chunk in chunks}
    document_ids = {chunk.get("source_document_id") for chunk in chunks if chunk.get("source_document_id")}
    if not document_ids:
        return chunks

    qdrant = await get_qdrant()
    extra_chunks: list[dict] = []
    for document_id in document_ids:
        try:
            scroll_filter = Filter(
                must=[
                    FieldCondition(key="tenant_id", match=MatchValue(value=str(tenant_id))),
                    FieldCondition(key="source_document_id", match=MatchValue(value=str(document_id))),
                    FieldCondition(key="chunk_index", match=MatchValue(value=0)),
                ]
            )
            points, _ = await qdrant.scroll(
                collection_name=str(collection_id),
                scroll_filter=scroll_filter,
                limit=1,
                with_payload=True,
                with_vectors=False,
            )
        except Exception as exc:
            logger.debug("Failed to fetch header chunk for document %s: %s", document_id, exc)
            continue

        for point in points:
            payload_data = point.payload or {}
            source_chunk_id = str(payload_data.get("source_chunk_id") or point.id)
            if source_chunk_id in existing_ids:
                continue
            source_document_id = payload_data.get("source_document_id")
            if not source_document_id:
                continue
            extra_chunks.append(
                {
                    "source_document_id": uuid.UUID(str(source_document_id)),
                    "source_chunk_id": uuid.UUID(source_chunk_id),
                    "chunk_index": int(payload_data.get("chunk_index", 0)),
                    "chunk_text": str(payload_data.get("chunk_text", "")),
                    "score": 0.0,
                }
            )
            existing_ids.add(source_chunk_id)

    return [*extra_chunks, *chunks]


async def _include_document_all_chunks(
    chunks: list[dict],
    tenant_id: uuid.UUID,
    collection_id: uuid.UUID | None,
    limit_per_document: int = 200,
) -> list[dict]:
    if not chunks or not collection_id:
        return chunks

    existing_ids = {str(chunk.get("source_chunk_id")) for chunk in chunks}
    document_ids = {chunk.get("source_document_id") for chunk in chunks if chunk.get("source_document_id")}
    if not document_ids:
        return chunks

    qdrant = await get_qdrant()
    extra_chunks: list[dict] = []
    for document_id in document_ids:
        try:
            scroll_filter = Filter(
                must=[
                    FieldCondition(key="tenant_id", match=MatchValue(value=str(tenant_id))),
                    FieldCondition(key="source_document_id", match=MatchValue(value=str(document_id))),
                ]
            )
            points, _ = await qdrant.scroll(
                collection_name=str(collection_id),
                scroll_filter=scroll_filter,
                limit=limit_per_document,
                with_payload=True,
                with_vectors=False,
            )
        except Exception as exc:
            logger.debug("Failed to fetch document chunks for document %s: %s", document_id, exc)
            continue

        for point in points:
            payload_data = point.payload or {}
            source_chunk_id = str(payload_data.get("source_chunk_id") or point.id)
            if source_chunk_id in existing_ids:
                continue
            source_document_id = payload_data.get("source_document_id")
            if not source_document_id:
                continue
            extra_chunks.append(
                {
                    "source_document_id": uuid.UUID(str(source_document_id)),
                    "source_chunk_id": uuid.UUID(source_chunk_id),
                    "chunk_index": int(payload_data.get("chunk_index", 0)),
                    "chunk_text": str(payload_data.get("chunk_text", "")),
                    "score": 0.0,
                }
            )
            existing_ids.add(source_chunk_id)

    merged = [*chunks, *extra_chunks]
    return sorted(
        merged,
        key=lambda item: (
            str(item.get("source_document_id") or ""),
            int(item.get("chunk_index") or 0),
        ),
    )


def _is_support_policy_question(question: str) -> bool:
    q_norm = _fold_for_match(question)
    markers = {
        "chinhsach", "thanhtoan", "doitra", "baohanh", "tragop", "giaohang",
        "donhang", "hotro", "dichvu", "caidat", "ungdung", "khieunai",
        "baotri", "suachua", "huongdan",
    }
    return any(marker in q_norm for marker in markers)


def _looks_like_product_table_chunk(text: str) -> bool:
    lowered = (text or "").lower()
    pipe_count = lowered.count("|")
    return pipe_count >= 12 and any(
        marker in lowered
        for marker in ("ten\\_san\\_pham", "ten_san_pham", "gia\\_vnd", "gia_vnd", "image\\_url", "detail\\_url")
    )


async def _include_relevant_text_chunks(
    chunks: list[dict],
    question: str,
    tenant_id: uuid.UUID,
    collection_id: uuid.UUID | None,
    limit: int = 200,
) -> list[dict]:
    if not collection_id or not _is_support_policy_question(question):
        return chunks

    question_terms = _question_lookup_terms(question)
    if not question_terms:
        return chunks

    existing_ids = {str(chunk.get("source_chunk_id")) for chunk in chunks}
    qdrant = await get_qdrant()
    try:
        scroll_filter = Filter(
            must=[
                FieldCondition(key="tenant_id", match=MatchValue(value=str(tenant_id))),
            ]
        )
        points, _ = await qdrant.scroll(
            collection_name=str(collection_id),
            scroll_filter=scroll_filter,
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )
    except Exception as exc:
        logger.debug("Failed to fetch relevant text chunks for KB: %s", exc)
        return chunks

    scored_extra: list[tuple[int, dict]] = []
    for point in points:
        payload_data = point.payload or {}
        source_chunk_id = str(payload_data.get("source_chunk_id") or point.id)
        if source_chunk_id in existing_ids:
            continue

        chunk_text = str(payload_data.get("chunk_text", ""))
        if not chunk_text or _looks_like_product_table_chunk(chunk_text):
            continue

        text_terms = _question_lookup_terms(chunk_text)
        overlap = len(question_terms & text_terms)
        text_norm = _normalize_for_compare(chunk_text)
        bonus = 2 if any(term in text_norm for term in ("hoi", "hỏi", "traloi", "trảlời")) else 0
        score = overlap + bonus
        if score <= 0:
            continue

        source_document_id = payload_data.get("source_document_id")
        if not source_document_id:
            continue

        try:
            chunk = {
                "source_document_id": uuid.UUID(str(source_document_id)),
                "source_chunk_id": uuid.UUID(source_chunk_id),
                "chunk_index": int(payload_data.get("chunk_index", 0)),
                "chunk_text": chunk_text,
                "score": 0.0,
            }
        except (TypeError, ValueError):
            continue

        scored_extra.append((score, chunk))
        existing_ids.add(source_chunk_id)

    if not scored_extra:
        return chunks

    extra_chunks = [chunk for _, chunk in sorted(scored_extra, key=lambda item: item[0], reverse=True)[:20]]
    return [*chunks, *extra_chunks]


def _resolve_dynamic_top_k(question: str, default_top_k: int) -> int:
    """Giữ top_k trung tính để phù hợp nhiều loại KB/lĩnh vực khác nhau."""
    return default_top_k


async def _multi_query_retrieve(
    tenant_id: uuid.UUID,
    question: str,
    top_k: int,
    collection_id: uuid.UUID | None,
    knowledge_base_id: uuid.UUID | None,
) -> list[dict]:
    """Multi-query trung tính: luôn search câu gốc, chỉ thêm biến thể còn bám ý chính."""
    queries = [question]
    try:
        variants = await query_rewriter.rewrite_multi_query(
            question, num_queries=settings.multi_query_count
        )
    except Exception as exc:
        logger.warning("Multi-query rewrite failed, using original query: %s", exc)
        variants = []

    for variant in variants:
        normalized_variant = (variant or "").strip()
        if not normalized_variant or normalized_variant in queries:
            continue
        if _is_safe_query_variant(question, normalized_variant):
            queries.append(normalized_variant)

    if len(queries) <= 1:
        # Chỉ có câu gốc, fallback về single query
        return await _retrieve_context(
            tenant_id=tenant_id,
            question=queries[0],
            top_k=top_k,
            collection_id=collection_id,
            knowledge_base_id=knowledge_base_id,
        )

    # Search tất cả biến thể song song
    tasks = [
        _retrieve_context(
            tenant_id=tenant_id,
            question=q,
            top_k=top_k,
            collection_id=collection_id,
            knowledge_base_id=knowledge_base_id,
        )
        for q in queries
    ]
    results_list = await asyncio.gather(*tasks, return_exceptions=True)

    # Gộp kết quả, deduplicate theo source_chunk_id, giữ score cao nhất
    seen: dict[str, dict] = {}
    for results in results_list:
        if isinstance(results, Exception):
            logger.warning("Multi-query variant failed: %s", results)
            continue
        for chunk in results:
            key = str(chunk["source_chunk_id"])
            if key not in seen or chunk["score"] > seen[key]["score"]:
                seen[key] = chunk

    merged = sorted(seen.values(), key=lambda c: c["score"], reverse=True)
    logger.info(
        "Multi-query: %d variants → %d unique chunks (retrieval_top_k=%d)",
        len(queries), len(merged), top_k,
    )
    return merged[:top_k]


@app.post("/v1/rag/feedback")
async def rag_feedback(
    payload: FeedbackRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> FeedbackResponse:
    """Ghi nhận feedback (thumbs up/down) cho câu trả lời."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO ai_service.ai_rag_feedback
            (request_id, tenant_id, session_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            """,
            payload.request_id,
            payload.tenant_id,
            payload.session_id,
            payload.rating,
            payload.comment,
        )
    feedback_id = row["id"]
    logger.info(
        "Feedback recorded | request_id=%s rating=%s feedback_id=%d",
        payload.request_id, "👍" if payload.rating else "👎", feedback_id,
    )
    return FeedbackResponse(
        id=feedback_id,
        request_id=payload.request_id,
        rating=payload.rating,
        message="Feedback recorded",
    )


@app.post("/v1/rag/stream")
async def rag_ask_stream(
    payload: AskRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> StreamingResponse:
    llm_client = llm_manager.client
    pool = await get_pool()

    request_id = uuid.uuid4()
    trace_id = str(uuid.uuid4())

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ai_service.ai_rag_requests
            (id, tenant_id, session_id, message_id, trace_id, temperature, top_k, max_tokens, status, started_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'RUNNING', CURRENT_TIMESTAMP)
            """,
            request_id,
            payload.tenant_id,
            payload.session_id,
            payload.message_id,
            trace_id,
            payload.temperature,
            payload.top_k,
            settings.max_tokens,
        )

    async def event_stream():
        llm_start = time.perf_counter()
        answer_parts: list[str] = []
        retrieved: list[dict] = []
        final_llm: dict[str, Any] = {}

        try:
            # ── Bước 1: Query Rewriting ────────────────────────────────────
            rewritten_question = await query_rewriter.rewrite(payload.question)

            # ── Dynamic top_k ──────────────────────────────────────────────
            effective_top_k = _resolve_dynamic_top_k(payload.question, payload.top_k)
            retrieval_top_k = min(max(effective_top_k * settings.rerank_top_k_multiplier, 20), 20)

            # ── Bước 2: Vector Search (Multi-Query) ─────────────────────────
            if settings.multi_query_enabled:
                multi_retrieved = await _multi_query_retrieve(
                    tenant_id=payload.tenant_id,
                    question=payload.question,
                    top_k=retrieval_top_k,
                    collection_id=payload.collection_id,
                    knowledge_base_id=payload.knowledge_base_id,
                )
            else:
                multi_retrieved = await _retrieve_context(
                    tenant_id=payload.tenant_id,
                    question=rewritten_question,
                    top_k=retrieval_top_k,
                    collection_id=payload.collection_id,
                    knowledge_base_id=payload.knowledge_base_id,
                )
            retrieved.extend(multi_retrieved)

            # ── Bước 3: Hybrid Search ───────────────────────────────────────
            resolved_collection = await _resolve_collection_id(
                payload.collection_id, payload.knowledge_base_id, payload.tenant_id
            )
            if hybrid_searcher.enabled and retrieved:
                qdrant = await get_qdrant()
                retrieved = await hybrid_searcher.search(
                    qdrant_client=qdrant,
                    vector_results=retrieved,
                    tenant_id=payload.tenant_id,
                    query_text=rewritten_question,
                    top_k=retrieval_top_k,
                    collection_id=resolved_collection or payload.collection_id,
                )

            table_context_chunks = await _include_document_header_chunks(
                list(retrieved),
                tenant_id=payload.tenant_id,
                collection_id=resolved_collection or payload.collection_id,
            )

            # ── Bước 4: Re-ranking ─────────────────────────────────────────
            if reranker.enabled and len(retrieved) > effective_top_k:
                retrieved = await reranker.rerank(
                    question=payload.question,
                    chunks=retrieved,
                    final_top_k=effective_top_k,
                )

            # ── Lọc chunk score thấp ───────────────────────────────────────
            # Đã comment: Qdrant ở embedding-service đã filter score_threshold
            # if retrieved:
            #     avg_score = sum(c["score"] for c in retrieved) / len(retrieved)
            #     min_score = settings.min_similarity_score
            #     if retrieved[0]["score"] < min_score or avg_score < min_score * 0.8:
            #         logger.info("Stream: low relevance, returning not-found")
            #         retrieved = []

            if _is_obvious_out_of_scope(payload.question):
                retrieved = []
            elif _is_plain_greeting(payload.question) and not _context_contains_question_terms(payload.question, retrieved):
                retrieved = []

            if not retrieved:
                async with pool.acquire() as conn:
                    await conn.execute(
                        """
                        UPDATE ai_service.ai_rag_requests
                        SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                        WHERE id=$1
                        """,
                        request_id,
                    )

                done_event = {
                    "type": "DONE",
                    "request_id": str(request_id),
                    "trace_id": trace_id,
                    "answer": KB_NOT_FOUND_ANSWER,
                    "model_name": llm_client.model_name,
                    "citations": [],
                }
                for token in re.findall(r"\S+\s*", KB_NOT_FOUND_ANSWER):
                    yield f"data: {json.dumps({'type': 'TOKEN', 'token': token}, ensure_ascii=True)}\n\n"
                yield f"data: {json.dumps(done_event, ensure_ascii=True)}\n\n"
                return

            if payload.page_context and payload.page_context.get("recommendMode") is True:
                recommend_context_chunks = await _include_document_all_chunks(
                    table_context_chunks or retrieved,
                    tenant_id=payload.tenant_id,
                    collection_id=resolved_collection or payload.collection_id,
                )
                recommend_answer = _try_product_recommend_from_markdown_table(
                    payload.question,
                    recommend_context_chunks,
                )
                if recommend_answer:
                    source_chunks = recommend_context_chunks[:20]
                    for token in re.findall(r"\S+\s*", recommend_answer):
                        yield f"data: {json.dumps({'type': 'TOKEN', 'token': token}, ensure_ascii=True)}\n\n"

                    async with pool.acquire() as conn:
                        async with conn.transaction():
                            for rank_no, result in enumerate(source_chunks, start=1):
                                await conn.execute(
                                    """
                                    INSERT INTO ai_service.ai_rag_retrieval_results
                                    (request_id, source_document_id, source_chunk_id, score, rank_no, snippet)
                                    VALUES ($1, $2, $3, $4, $5, $6)
                                    """,
                                    request_id,
                                    result["source_document_id"],
                                    result["source_chunk_id"],
                                    result["score"],
                                    rank_no,
                                    result["chunk_text"][:500],
                                )
                            await conn.execute(
                                """
                                UPDATE ai_service.ai_rag_requests
                                SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                                WHERE id=$1
                                """,
                                request_id,
                            )

                    done_event = {
                        "type": "DONE",
                        "request_id": str(request_id),
                        "trace_id": trace_id,
                        "answer": recommend_answer,
                        "model_name": llm_client.model_name,
                        "citations": [
                            {
                                "source_document_id": str(item["source_document_id"]),
                                "source_chunk_id": str(item["source_chunk_id"]),
                                "chunk_index": item["chunk_index"],
                                "score": item["score"],
                                "snippet": (item.get("chunk_text") or "")[:300],
                            }
                            for item in source_chunks
                        ],
                    }
                    yield f"data: {json.dumps(done_event, ensure_ascii=True)}\n\n"
                    return

            table_answer = _try_answer_from_markdown_table(payload.question, table_context_chunks or retrieved)
            if table_answer:
                source_chunks = table_context_chunks or retrieved
                for token in re.findall(r"\S+\s*", table_answer):
                    yield f"data: {json.dumps({'type': 'TOKEN', 'token': token}, ensure_ascii=True)}\n\n"

                async with pool.acquire() as conn:
                    async with conn.transaction():
                        for rank_no, result in enumerate(source_chunks, start=1):
                            await conn.execute(
                                """
                                INSERT INTO ai_service.ai_rag_retrieval_results
                                (request_id, source_document_id, source_chunk_id, score, rank_no, snippet)
                                VALUES ($1, $2, $3, $4, $5, $6)
                                """,
                                request_id,
                                result["source_document_id"],
                                result["source_chunk_id"],
                                result["score"],
                                rank_no,
                                result["chunk_text"][:500],
                            )
                        await conn.execute(
                            """
                            UPDATE ai_service.ai_rag_requests
                            SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                            WHERE id=$1
                            """,
                            request_id,
                        )

                done_event = {
                    "type": "DONE",
                    "request_id": str(request_id),
                    "trace_id": trace_id,
                    "answer": table_answer,
                    "model_name": llm_client.model_name,
                    "citations": [
                        {
                            "source_document_id": str(item["source_document_id"]),
                            "source_chunk_id": str(item["source_chunk_id"]),
                            "chunk_index": item["chunk_index"],
                            "score": item["score"],
                            "snippet": (item.get("chunk_text") or "")[:300],
                        }
                        for item in source_chunks
                    ],
                }
                yield f"data: {json.dumps(done_event, ensure_ascii=True)}\n\n"
                return

            plain_text_context_chunks = await _include_document_all_chunks(
                table_context_chunks or retrieved,
                tenant_id=payload.tenant_id,
                collection_id=resolved_collection or payload.collection_id,
            )
            plain_text_context_chunks = await _include_relevant_text_chunks(
                plain_text_context_chunks,
                question=payload.question,
                tenant_id=payload.tenant_id,
                collection_id=resolved_collection or payload.collection_id,
            )
            plain_text_answer = _try_answer_from_plain_text_context(payload.question, plain_text_context_chunks)
            if plain_text_answer:
                source_chunks = plain_text_context_chunks[:20]
                for token in re.findall(r"\S+\s*", plain_text_answer):
                    yield f"data: {json.dumps({'type': 'TOKEN', 'token': token}, ensure_ascii=True)}\n\n"

                async with pool.acquire() as conn:
                    async with conn.transaction():
                        for rank_no, result in enumerate(source_chunks, start=1):
                            await conn.execute(
                                """
                                INSERT INTO ai_service.ai_rag_retrieval_results
                                (request_id, source_document_id, source_chunk_id, score, rank_no, snippet)
                                VALUES ($1, $2, $3, $4, $5, $6)
                                """,
                                request_id,
                                result["source_document_id"],
                                result["source_chunk_id"],
                                result["score"],
                                rank_no,
                                result["chunk_text"][:500],
                            )
                        await conn.execute(
                            """
                            UPDATE ai_service.ai_rag_requests
                            SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                            WHERE id=$1
                            """,
                            request_id,
                        )

                done_event = {
                    "type": "DONE",
                    "request_id": str(request_id),
                    "trace_id": trace_id,
                    "answer": plain_text_answer,
                    "model_name": llm_client.model_name,
                    "citations": [
                        {
                            "source_document_id": str(item["source_document_id"]),
                            "source_chunk_id": str(item["source_chunk_id"]),
                            "chunk_index": item["chunk_index"],
                            "score": item["score"],
                            "snippet": (item.get("chunk_text") or "")[:300],
                        }
                        for item in source_chunks
                    ],
                }
                yield f"data: {json.dumps(done_event, ensure_ascii=True)}\n\n"
                return

            if (
                not (payload.page_context and payload.page_context.get("recommendMode") is True)
                and _parse_markdown_table_rows(table_context_chunks or retrieved)
                and not _has_non_table_context(table_context_chunks or retrieved)
            ):
                async with pool.acquire() as conn:
                    await conn.execute(
                        """
                        UPDATE ai_service.ai_rag_requests
                        SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                        WHERE id=$1
                        """,
                        request_id,
                    )

                done_event = {
                    "type": "DONE",
                    "request_id": str(request_id),
                    "trace_id": trace_id,
                    "answer": KB_NOT_FOUND_ANSWER,
                    "model_name": llm_client.model_name,
                    "citations": [],
                }
                for token in re.findall(r"\S+\s*", KB_NOT_FOUND_ANSWER):
                    yield f"data: {json.dumps({'type': 'TOKEN', 'token': token}, ensure_ascii=True)}\n\n"
                yield f"data: {json.dumps(done_event, ensure_ascii=True)}\n\n"
                return

            system_prompt, user_prompt = _build_prompts(payload.question, retrieved, payload.page_context)

            try:
                async for item in llm_client.chat_stream(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    temperature=payload.temperature,
                ):
                    message = item.get("message") if isinstance(item, dict) else None
                    token = ""
                    if isinstance(message, dict):
                        token = str(message.get("content") or "")

                    if token:
                        answer_parts.append(token)

                    if item.get("done") is True:
                        final_llm = item
            except httpx.HTTPError as exc:
                _raise_llm_http_exception(exc)

            latency_ms = int((time.perf_counter() - llm_start) * 1000)
            answer_text = "".join(answer_parts).strip()
            if not (payload.page_context and payload.page_context.get("recommendMode") is True):
                answer_text = _strip_json_products_block(answer_text)
            answer_text = _normalize_answer_text(answer_text, payload.question)
            if not answer_text:
                answer_text = KB_NOT_FOUND_ANSWER

            for token in re.findall(r"\S+\s*", answer_text):
                yield f"data: {json.dumps({'type': 'TOKEN', 'token': token}, ensure_ascii=True)}\n\n"

            async with pool.acquire() as conn:
                async with conn.transaction():
                    for rank_no, result in enumerate(retrieved, start=1):
                        await conn.execute(
                            """
                            INSERT INTO ai_service.ai_rag_retrieval_results
                            (request_id, source_document_id, source_chunk_id, score, rank_no, snippet)
                            VALUES ($1, $2, $3, $4, $5, $6)
                            """,
                            request_id,
                            result["source_document_id"],
                            result["source_chunk_id"],
                            result["score"],
                            rank_no,
                            result["chunk_text"][:500],
                        )

                    prompt_tokens = final_llm.get("prompt_eval_count") if isinstance(final_llm, dict) else None
                    completion_tokens = final_llm.get("eval_count") if isinstance(final_llm, dict) else None
                    total_tokens = None
                    if isinstance(prompt_tokens, int) and isinstance(completion_tokens, int):
                        total_tokens = prompt_tokens + completion_tokens

                    await conn.execute(
                        """
                        INSERT INTO ai_service.ai_llm_calls
                        (request_id, provider, model_name, prompt_tokens, completion_tokens, total_tokens,
                         latency_ms, finish_reason, request_payload, response_payload)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb)
                        """,
                        request_id,
                        llm_client.provider_key,
                        final_llm.get("model") if isinstance(final_llm, dict) else llm_client.model_name,
                        prompt_tokens,
                        completion_tokens,
                        total_tokens,
                        latency_ms,
                        final_llm.get("done_reason", "stop") if isinstance(final_llm, dict) else "stop",
                        _to_jsonb_param({"system": system_prompt, "user": user_prompt}),
                        _to_jsonb_param(
                            (final_llm.get("raw") if isinstance(final_llm, dict) else None)
                            or (final_llm if isinstance(final_llm, dict) else {})
                        ),
                    )

                    await conn.execute(
                        """
                        UPDATE ai_service.ai_rag_requests
                        SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                        WHERE id=$1
                        """,
                        request_id,
                    )

            # ── Bước 5: LLM-as-a-Judge (chạy ngầm) ─────────────────────────
            asyncio.create_task(
                _judge_and_persist(
                    judge, pool, request_id, payload.question, answer_text, retrieved
                )
            )

            citations_payload = [
                {
                    "source_document_id": str(item["source_document_id"]) if item.get("source_document_id") else None,
                    "source_chunk_id": str(item["source_chunk_id"]) if item.get("source_chunk_id") else None,
                    "chunk_index": item.get("chunk_index"),
                    "score": item.get("score"),
                    "snippet": (item.get("chunk_text") or "")[:300],
                }
                for item in retrieved
            ]
            done_event = {
                "type": "DONE",
                "request_id": str(request_id),
                "trace_id": trace_id,
                "answer": answer_text,
                "model_name": str(final_llm.get("model") if isinstance(final_llm, dict) and final_llm.get("model") else llm_client.model_name),
                "citations": citations_payload,
            }
            yield f"data: {json.dumps(done_event, ensure_ascii=True)}\n\n"
        except Exception as exc:
            logger.exception("RAG stream failed for request %s", request_id)
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE ai_service.ai_rag_requests
                    SET status='FAILED', error_message=$2, finished_at=CURRENT_TIMESTAMP
                    WHERE id=$1
                    """,
                    request_id,
                    str(exc),
                )

            error_event = {"type": "ERROR", "message": str(exc), "request_id": str(request_id)}
            yield f"data: {json.dumps(error_event, ensure_ascii=True)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/v1/rag/requests/{request_id}", response_model=RagRequestDetail)
async def get_request_status(
    request_id: uuid.UUID,
    _: dict[str, Any] = Depends(require_service_auth),
) -> RagRequestDetail:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, tenant_id, session_id, message_id, trace_id, status,
                   error_message, created_at, started_at, finished_at
            FROM ai_service.ai_rag_requests
            WHERE id = $1
            """,
            request_id,
        )

    if not row:
        raise HTTPException(status_code=404, detail="Request not found")

    return RagRequestDetail(**dict(row))
