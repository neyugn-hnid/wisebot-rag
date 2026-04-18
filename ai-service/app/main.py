import time
import uuid
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse

from app.config import settings
from app.db import close_db_pool, get_pool, init_db_pool
from app.ollama_client import OllamaClient, ensure_dimension, vector_to_literal
from app.schemas import AskRequest, AskResponse, Citation, RagRequestDetail
from app.security import require_service_auth


ollama_client = OllamaClient(
    base_url=settings.ollama_base_url,
    llm_model=settings.ollama_llm_model,
    embedding_model=settings.ollama_embedding_model,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db_pool()
    yield
    await close_db_pool()


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)


@app.get("/health")
async def healthcheck() -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("SELECT 1")
    return {"status": "ok", "service": settings.app_name}


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


async def _retrieve_context(tenant_id: uuid.UUID, vector_literal: str, top_k: int, collection_id: uuid.UUID) -> list[dict]:
    pool = await get_pool()

    sql = """
        SELECT source_document_id, source_chunk_id, chunk_index, chunk_text,
               1 - (embedding <=> $3::vector) AS score
        FROM embedding_service.embeddings
        WHERE tenant_id=$1 AND collection_id=$2
          AND 1 - (embedding <=> $3::vector) >= $4
        ORDER BY embedding <=> $3::vector
        LIMIT $5
    """
    args = [
        tenant_id,
        collection_id,
        vector_literal,
        settings.min_similarity_score,
        top_k,
    ]

    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *args)

    return [
        {
            "source_document_id": row["source_document_id"],
            "source_chunk_id": row["source_chunk_id"],
            "chunk_index": row["chunk_index"],
            "chunk_text": row["chunk_text"],
            "score": float(row["score"]),
        }
        for row in rows
    ]


@app.post("/v1/rag/ask", response_model=AskResponse)
async def rag_ask(
    payload: AskRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> AskResponse:
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
        question_vector = await ollama_client.embed(payload.question)
        question_vector = ensure_dimension(question_vector, settings.embedding_dimension)
        vector_literal = vector_to_literal(question_vector)

        retrieved = await _retrieve_context(
            tenant_id=payload.tenant_id,
            vector_literal=vector_literal,
            top_k=payload.top_k,
            collection_id=payload.collection_id,
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
                model_name=settings.ollama_llm_model,
                citations=[],
            )

        system_prompt, user_prompt = _build_prompts(payload.question, retrieved)
        llm_result = await ollama_client.chat(
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
                    VALUES ($1, 'ollama', $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
                    """,
                    request_id,
                    settings.ollama_llm_model,
                    prompt_tokens,
                    completion_tokens,
                    total_tokens,
                    latency_ms,
                    llm_result.get("done_reason", "stop"),
                    {"system": system_prompt, "user": user_prompt},
                    llm_result,
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
            model_name=settings.ollama_llm_model,
            citations=citations,
        )
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
            question_vector = await ollama_client.embed(payload.question)
            question_vector = ensure_dimension(question_vector, settings.embedding_dimension)
            vector_literal = vector_to_literal(question_vector)

            nonlocal_retrieved = await _retrieve_context(
                tenant_id=payload.tenant_id,
                vector_literal=vector_literal,
                top_k=payload.top_k,
                collection_id=payload.collection_id,
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
                    "model_name": settings.ollama_llm_model,
                    "citations": [],
                }
                yield f"data: {json.dumps(done_event, ensure_ascii=True)}\\n\\n"
                return

            system_prompt, user_prompt = _build_prompts(payload.question, retrieved)

            async for item in ollama_client.chat_stream(
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
                        VALUES ($1, 'ollama', $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
                        """,
                        request_id,
                        settings.ollama_llm_model,
                        prompt_tokens,
                        completion_tokens,
                        total_tokens,
                        latency_ms,
                        final_llm.get("done_reason", "stop") if isinstance(final_llm, dict) else "stop",
                        {"system": system_prompt, "user": user_prompt},
                        final_llm if isinstance(final_llm, dict) else {},
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
                "model_name": settings.ollama_llm_model,
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
