import asyncio
import time
import uuid
import json
import base64
import hmac
import hashlib
import logging
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
from app.schemas import AskRequest, AskResponse, Citation, ProviderConfigResponse, ProviderModeUpdateRequest, RagRequestDetail
from app.security import require_service_auth


llm_manager = RuntimeLlmManager(settings)
logger = logging.getLogger(__name__)

# ── Khởi tạo các service nâng cao RAG ─────────────────────────────────────
query_rewriter = QueryRewriter(llm_manager.client)  # sẽ được refresh khi switch mode
hybrid_searcher = HybridSearcher()
reranker = Reranker(llm_manager.client)
judge = LlmJudge(shared_llm=llm_manager.client)  # Judge: dedicated DeepSeek hoặc shared LLM


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
    yield
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
    """Unified prompt: AI tự phân tích, trả JSON sản phẩm nếu hỏi mua sắm, text nếu hỏi FAQ."""
    context_lines: list[str] = []
    for chunk in retrieved_chunks:
        context_lines.append(chunk["chunk_text"])

    context_text = "\n\n---\n\n".join(context_lines) if context_lines else "No relevant context found."

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

    system_prompt = (
        "Bạn là trợ lý AI WISEBOT, có thể vừa tư vấn sản phẩm vừa trả lời câu hỏi thông thường.\n"
        "PHÂN TÍCH CÂU HỎI để chọn cách trả lời:\n"
        "\n"
        "🔹 Nếu hỏi VỀ SẢN PHẨM (tìm mua, so sánh, giá, gợi ý, tư vấn chọn...):\n"
        "Trả lời theo format SAU (bắt buộc):\n"
        "  1. Viết 1-2 câu giới thiệu ngắn gọn.\n"
        "  2. Sau đó là dòng: __JSON_PRODUCTS__\n"
        "  3. Tiếp theo là JSON array chứa tối đa 3 sản phẩm phù hợp nhất từ context.\n"
        "  4. Sau đó là dòng: __END_JSON__\n"
        "  5. Cuối cùng viết 1 câu kết, gợi ý thêm.\n"
        "\n"
        "Cấu trúc mỗi object trong JSON array:\n"
        "{\n"
        '  "id": <số, id sản phẩm từ CSV>,\n'
        '  "name": "<tên sản phẩm>",\n'
        '  "price": <số, giá VND, không có dấu phẩy>,\n'
        '  "imageUrl": "<url ảnh từ CSV, nếu không có thì để chuỗi rỗng>",\n'
        '  "detailUrl": "<url chi tiết từ CSV, nếu không có thì để chuỗi rỗng>",\n'
        '  "reason": "<1 câu ngắn giải thích tại sao sản phẩm này phù hợp>"\n'
        "}\n"
        "\n"
        "VÍ DỤ output đúng:\n"
        "Dạ, đây là những điện thoại phù hợp với ngân sách của bạn:\n"
        "__JSON_PRODUCTS__\n"
        '[{"id":10,"name":"Samsung Galaxy A55 5G","price":9490000,"imageUrl":"https://example.com/a55.jpg","detailUrl":"/products/10","reason":"Pin 5000mAh, camera 50MP, màn hình AMOLED 120Hz"}]\n'
        "__END_JSON__\n"
        "Bạn cần thêm thông tin gì về sản phẩm này không ạ?\n"
        "\n"
        "⚠ QUAN TRỌNG:\n"
        " - CHỈ lấy sản phẩm từ context. KHÔNG bịa đặt.\n"
        " - JSON phải hợp lệ, không có trailing comma.\n"
        " - price là số nguyên, KHÔNG có dấu phẩy hay ký tự đặc biệt.\n"
        " - Nếu imageUrl/detailUrl không có trong context → để chuỗi rỗng "".\n"
        " - Nếu KHÔNG có sản phẩm phù hợp → trả lời text bình thường, KHÔNG dùng format JSON.\n"
        "\n"
        "🔹 Nếu hỏi THÔNG TIN CHUNG (chính sách, FAQ, hướng dẫn, điều khoản...):\n"
        " - Trả lời thẳng, súc tích.\n"
        " - KHÔNG dùng format __JSON_PRODUCTS__.\n"
        "\n"
        "LUẬT CHUNG:\n"
        " - CHỈ trả lời bằng TIẾNG VIỆT.\n"
        " - CHỈ dùng thông tin trong CONTEXT.\n"
        " - KHÔNG dùng citation markers.\n"
        " - CHITCHAT: trả lời ngắn gọn, thân thiện.\n"
        ' - NO MATCH: "Xin lỗi, tôi không tìm thấy thông tin phù hợp."'
    )

    user_prompt = f"Câu hỏi:\n{question}\n"
    if page_info:
        user_prompt += f"\nNgữ cảnh trang:\n{page_info}\n"
    user_prompt += f"\nDữ liệu tham khảo:\n{context_text}\n\nTrả lời:"
    return system_prompt, user_prompt
        " - NO MATCH: \"Xin lỗi, tôi không tìm thấy thông tin phù hợp.\""
    )

    user_prompt = f"Câu hỏi:\n{question}\n"
    if page_info:
        user_prompt += f"\nNgữ cảnh trang:\n{page_info}\n"
    user_prompt += f"\nDữ liệu tham khảo:\n{context_text}\n\nTrả lời:"
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


@app.post("/v1/rag/ask", response_model=AskResponse)
async def rag_ask(
    payload: AskRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> AskResponse:
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

    llm_start = time.perf_counter()
    try:
        # ── Bước 1: Query Rewriting ────────────────────────────────────────
        rewritten_question = await query_rewriter.rewrite(payload.question)

        # ── Bước 2: Vector Search (giữ nguyên pipeline hiện tại) ───────────
        # Lấy nhiều hơn top_k để có dư địa cho hybrid search + rerank
        retrieval_top_k = payload.top_k * settings.rerank_top_k_multiplier
        retrieved = await _retrieve_context(
            tenant_id=payload.tenant_id,
            question=rewritten_question,  # dùng câu đã rewrite
            top_k=retrieval_top_k,
            collection_id=payload.collection_id,
            knowledge_base_id=payload.knowledge_base_id,
        )

        # ── Bước 3: Hybrid Search (fusion vector + keyword) ────────────────
        if hybrid_searcher.enabled and retrieved:
            qdrant = await get_qdrant()
            retrieved = await hybrid_searcher.search(
                qdrant_client=qdrant,
                vector_results=retrieved,
                tenant_id=payload.tenant_id,
                query_text=rewritten_question,
                top_k=retrieval_top_k,
                collection_id=payload.collection_id,
            )

        # ── Bước 4: Re-ranking ─────────────────────────────────────────────
        if reranker.enabled and len(retrieved) > payload.top_k:
            retrieved = await reranker.rerank(
                question=payload.question,  # câu gốc để rerank chính xác hơn
                chunks=retrieved,
                final_top_k=payload.top_k,
            )

        # ── Lọc chunk có score quá thấp (không liên quan) ──────────────────
        if retrieved:
            avg_score = sum(c["score"] for c in retrieved) / len(retrieved)
            best_score = retrieved[0]["score"]
            # Nếu chunk tốt nhất < 0.5 hoặc trung bình < 0.4 → coi như không liên quan
            if best_score < 0.5 or avg_score < 0.4:
                logger.info("Low relevance chunks (best=%.3f avg=%.3f), returning not-found", best_score, avg_score)
                retrieved = []

        if not retrieved:
            answer_text = "Không tìm thấy thông tin trong tài liệu."
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE ai_service.ai_rag_requests
                    SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                    WHERE id=$1
                    """,
                    request_id,
                )

            return AskResponse(
                request_id=request_id,
                trace_id=trace_id,
                answer=answer_text,
                model_name=llm_client.model_name,
                citations=[],
            )

        # ── Unified prompt (AI tự phân biệt hỏi sản phẩm / hỏi FAQ) ──────
        system_prompt, user_prompt = _build_prompts(payload.question, retrieved, payload.page_context)
        try:
            llm_result = await llm_client.chat(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=payload.temperature,
            )
        except httpx.HTTPError as exc:
            _raise_llm_http_exception(exc)
        latency_ms = int((time.perf_counter() - llm_start) * 1000)

        answer_text = (
            (llm_result.get("message") or {}).get("content")
            or llm_result.get("response")
            or ""
        ).strip()

        if not answer_text:
            raise ValueError("LLM returned empty response")

        async with pool.acquire() as conn:
            async with conn.transaction():
                for rank_no, item in enumerate(retrieved, start=1):
                    await conn.execute(
                        """
                        INSERT INTO ai_service.ai_rag_retrieval_results
                        (request_id, source_document_id, source_chunk_id, score, rank_no, snippet)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        """,
                        request_id,
                        item["source_document_id"],
                        item["source_chunk_id"],
                        item["score"],
                        rank_no,
                        item["chunk_text"][:500],
                    )

                prompt_tokens = llm_result.get("prompt_eval_count")
                completion_tokens = llm_result.get("eval_count")
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
                    llm_result.get("model") or llm_client.model_name,
                    prompt_tokens,
                    completion_tokens,
                    total_tokens,
                    latency_ms,
                    llm_result.get("done_reason", "stop"),
                    _to_jsonb_param({"system": system_prompt, "user": user_prompt}),
                    _to_jsonb_param(llm_result.get("raw", llm_result)),
                )

                await conn.execute(
                    """
                    UPDATE ai_service.ai_rag_requests
                    SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                    WHERE id=$1
                    """,
                    request_id,
                )

        # ── Bước 5: LLM-as-a-Judge (chạy ngầm, không block response) ───────
        asyncio.create_task(
            _judge_and_persist(
                judge, pool, request_id, payload.question, answer_text, retrieved
            )
        )

        citations = [
            Citation(
                source_document_id=item["source_document_id"],
                source_chunk_id=item["source_chunk_id"],
                chunk_index=item["chunk_index"],
                score=item["score"],
                snippet=item["chunk_text"][:300],
            )
            for item in retrieved
        ]

        return AskResponse(
            request_id=request_id,
            trace_id=trace_id,
            answer=answer_text,
            model_name=str(llm_result.get("model") or llm_client.model_name),
            citations=citations,
        )
    except HTTPException as exc:
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE ai_service.ai_rag_requests
                SET status='FAILED', error_message=$2, finished_at=CURRENT_TIMESTAMP
                WHERE id=$1
                """,
                request_id,
                str(exc.detail),
            )
        raise

    except Exception as exc:
        logger.exception("RAG ask failed for request %s", request_id)
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
        raise HTTPException(status_code=500, detail=f"RAG pipeline failed: {exc}") from exc


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

            # ── Bước 2: Vector Search ───────────────────────────────────────
            retrieval_top_k = payload.top_k * settings.rerank_top_k_multiplier
            nonlocal_retrieved = await _retrieve_context(
                tenant_id=payload.tenant_id,
                question=rewritten_question,
                top_k=retrieval_top_k,
                collection_id=payload.collection_id,
                knowledge_base_id=payload.knowledge_base_id,
            )
            retrieved.extend(nonlocal_retrieved)

            # ── Bước 3: Hybrid Search ───────────────────────────────────────
            if hybrid_searcher.enabled and retrieved:
                qdrant = await get_qdrant()
                retrieved = await hybrid_searcher.search(
                    qdrant_client=qdrant,
                    vector_results=retrieved,
                    tenant_id=payload.tenant_id,
                    query_text=rewritten_question,
                    top_k=retrieval_top_k,
                    collection_id=payload.collection_id,
                )

            # ── Bước 4: Re-ranking ─────────────────────────────────────────
            if reranker.enabled and len(retrieved) > payload.top_k:
                retrieved = await reranker.rerank(
                    question=payload.question,
                    chunks=retrieved,
                    final_top_k=payload.top_k,
                )

            # ── Lọc chunk score thấp ───────────────────────────────────────
            if retrieved:
                avg_score = sum(c["score"] for c in retrieved) / len(retrieved)
                if retrieved[0]["score"] < 0.5 or avg_score < 0.4:
                    logger.info("Stream: low relevance, returning not-found")
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
                    "answer": "Không tìm thấy thông tin trong tài liệu.",
                    "model_name": llm_client.model_name,
                    "citations": [],
                }
                yield f"data: {json.dumps(done_event, ensure_ascii=True)}\\n\\n"
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
                        yield f"data: {json.dumps({'type': 'TOKEN', 'token': token}, ensure_ascii=True)}\n\n"

                    if item.get("done") is True:
                        final_llm = item
            except httpx.HTTPError as exc:
                _raise_llm_http_exception(exc)

            latency_ms = int((time.perf_counter() - llm_start) * 1000)
            answer_text = "".join(answer_parts).strip()
            if not answer_text:
                raise ValueError("LLM returned empty response")

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
