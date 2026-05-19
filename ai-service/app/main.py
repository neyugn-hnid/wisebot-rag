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

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import httpx

from qdrant_client.http.models import Filter, FieldCondition, MatchValue

from app.config import settings
from app.db import close_db_pool, get_pool, init_db_pool, init_qdrant, close_qdrant, get_qdrant
from app.llm_client import RuntimeLlmManager, build_llm_client_for_mode
from app.schemas import AskRequest, AskResponse, Citation, ProviderConfigResponse, ProviderModeUpdateRequest, RagRequestDetail
from app.security import require_service_auth


llm_manager = RuntimeLlmManager(settings)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db_pool()
    await init_qdrant()
    persisted_mode = await _load_persisted_provider_mode()
    if persisted_mode and persisted_mode != llm_manager.mode:
        try:
            await llm_manager.switch_mode(persisted_mode)
        except Exception:
            logger.exception("Failed to restore persisted AI mode '%s'", persisted_mode)
    yield
    await llm_manager.close()
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
    return ProviderConfigResponse(
        mode=llm_manager.mode,
        provider=client.provider_key,
        provider_name=client.provider_name,
        model_name=client.model_name,
    )


def _build_prompts(question: str, retrieved_chunks: list[dict]) -> tuple[str, str]:
    context_lines: list[str] = []
    for idx, chunk in enumerate(retrieved_chunks, start=1):
        context_lines.append(f"[{idx}] (score={chunk['score']:.4f}) {chunk['chunk_text']}")

    context_text = "\n\n".join(context_lines) if context_lines else "No relevant context found."

    system_prompt = (
        "You are WISEBOT AI assistant. "
        "STRICT RULES:"
        " - ONLY answer using the provided CONTEXT."
        " - DO NOT use outside knowledge."
        " - If the answer is not in the context, say:"
        "   \"Không tìm thấy thông tin trong tài liệu.\""
        " - DO NOT hallucinate."
        "Answer in Vietnamese."
        "Always cite sources like [1], [2]."
    )

    user_prompt = f"Question:\n{question}\n\nContext:\n{context_text}\n\nAnswer in Vietnamese with citations."
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
        retrieved = await _retrieve_context(
            tenant_id=payload.tenant_id,
            question=payload.question,
            top_k=payload.top_k,
            collection_id=payload.collection_id,
            knowledge_base_id=payload.knowledge_base_id,
        )

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

        system_prompt, user_prompt = _build_prompts(payload.question, retrieved)
        llm_result = await llm_client.chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=payload.temperature,
        )
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
                    {"system": system_prompt, "user": user_prompt},
                    llm_result.get("raw", llm_result),
                )

                await conn.execute(
                    """
                    UPDATE ai_service.ai_rag_requests
                    SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                    WHERE id=$1
                    """,
                    request_id,
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
            nonlocal_retrieved = await _retrieve_context(
                tenant_id=payload.tenant_id,
                question=payload.question,
                top_k=payload.top_k,
                collection_id=payload.collection_id,
                knowledge_base_id=payload.knowledge_base_id,
            )
            retrieved.extend(nonlocal_retrieved)

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

            system_prompt, user_prompt = _build_prompts(payload.question, retrieved)

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
                        {"system": system_prompt, "user": user_prompt},
                        (final_llm.get("raw") if isinstance(final_llm, dict) else None) or (final_llm if isinstance(final_llm, dict) else {}),
                    )

                    await conn.execute(
                        """
                        UPDATE ai_service.ai_rag_requests
                        SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                        WHERE id=$1
                        """,
                        request_id,
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
