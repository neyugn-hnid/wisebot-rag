import asyncio
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile

from app.chunking import chunk_text
from app.config import settings
from app.db import close_db_pool, get_pool, init_db_pool
from app.ollama_client import OllamaClient, ensure_dimension, vector_to_literal
from app.parsing import UnsupportedFileTypeError, parse_text_from_bytes
from app.schemas import (
    CollectionResponse,
    CreateCollectionRequest,
    EmbedResponse,
    EmbedResultResponse,
    EmbedRequest,
    IndexTextRequest,
    SearchRequest,
    SearchResponse,
    SearchResult,
)
from app.security import require_service_auth


ollama_client = OllamaClient(settings.ollama_base_url, settings.ollama_embedding_model)


async def _embed_texts_to_literals(texts: list[str], target_dimension: int) -> list[str]:
    semaphore = asyncio.Semaphore(max(1, settings.embed_concurrency))

    async def _embed_one(text: str) -> str:
        async with semaphore:
            vector = await ollama_client.embed(text)
        vector = ensure_dimension(vector, target_dimension)
        return vector_to_literal(vector)

    return await asyncio.gather(*[_embed_one(text) for text in texts])


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


@app.post("/v1/collections", response_model=CollectionResponse)
async def create_collection(
    payload: CreateCollectionRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> CollectionResponse:
    pool = await get_pool()
    query = """
        INSERT INTO embedding_service.embedding_collections
        (tenant_id, knowledge_base_id, name, provider, model_name, dimension, metric)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, tenant_id, knowledge_base_id, name, provider, model_name,
                  dimension, metric, status, created_at
    """

    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                payload.tenant_id,
                payload.knowledge_base_id,
                payload.name,
                payload.provider,
                payload.model_name,
                payload.dimension,
                payload.metric,
            )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return CollectionResponse(**dict(row))


async def _index_chunks(
    tenant_id,
    collection_id,
    source_document_id,
    chunks: list[str],
    metadata: dict,
) -> dict:
    pool = await get_pool()
    job_id = uuid.uuid4()

    async with pool.acquire() as conn:
        collection = await conn.fetchrow(
            """
            SELECT id, dimension, status
            FROM embedding_service.embedding_collections
            WHERE id = $1 AND tenant_id = $2
            """,
            collection_id,
            tenant_id,
        )
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        if collection["status"] != "ACTIVE":
            raise HTTPException(status_code=400, detail="Collection is not active")

        target_dimension = int(collection["dimension"])

        async with conn.transaction():
            await conn.execute(
                """
                INSERT INTO embedding_service.embedding_jobs
                (id, tenant_id, collection_id, source_document_id, source_chunk_count, status, started_at)
                VALUES ($1, $2, $3, $4, $5, 'RUNNING', CURRENT_TIMESTAMP)
                """,
                job_id,
                tenant_id,
                collection_id,
                source_document_id,
                len(chunks),
            )

            literal_vectors = await _embed_texts_to_literals(chunks, target_dimension)

            for idx, item in enumerate(chunks):
                source_chunk_id = uuid.uuid4()
                literal_vector = literal_vectors[idx]

                payload = dict(metadata)
                payload["chunk_index"] = idx

                await conn.execute(
                    """
                    INSERT INTO embedding_service.embeddings
                    (tenant_id, collection_id, source_document_id, source_chunk_id, chunk_index, chunk_text, embedding, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8::jsonb)
                    """,
                    tenant_id,
                    collection_id,
                    source_document_id,
                    source_chunk_id,
                    idx,
                    item,
                    literal_vector,
                    payload,
                )

            await conn.execute(
                """
                UPDATE embedding_service.embedding_jobs
                SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                WHERE id=$1
                """,
                job_id,
            )

    return {"job_id": str(job_id), "chunk_count": len(chunks)}


async def _resolve_collection_by_kb(knowledge_base_id: uuid.UUID):
    pool = await get_pool()
    async with pool.acquire() as conn:
        collection = await conn.fetchrow(
            """
            SELECT id, tenant_id, dimension, status
            FROM embedding_service.embedding_collections
            WHERE knowledge_base_id = $1 AND status = 'ACTIVE'
            ORDER BY updated_at DESC, created_at DESC
            LIMIT 1
            """,
            knowledge_base_id,
        )

        if collection:
            return collection

        tenant_id = await conn.fetchval(
            """
            SELECT tenant_id
            FROM document_service.knowledge_bases
            WHERE id = $1
            """,
            knowledge_base_id,
        )
        if tenant_id is None:
            tenant_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        inserted = await conn.fetchrow(
            """
            INSERT INTO embedding_service.embedding_collections
            (tenant_id, knowledge_base_id, name, provider, model_name, dimension, metric)
            VALUES ($1, $2, $3, 'ollama', $4, $5, 'cosine')
            RETURNING id, tenant_id, dimension, status
            """,
            tenant_id,
            knowledge_base_id,
            settings.default_collection_name,
            settings.ollama_embedding_model,
            settings.embedding_dimension,
        )
        return inserted


@app.post("/v1/index/text")
async def index_text(
    payload: IndexTextRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> dict:
    chunk_size = payload.chunk_size or settings.default_chunk_size
    chunk_overlap = payload.chunk_overlap if payload.chunk_overlap is not None else settings.default_chunk_overlap
    chunks = chunk_text(payload.text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    if not chunks:
        raise HTTPException(status_code=400, detail="No content available after chunking")

    try:
        return await _index_chunks(
            tenant_id=payload.tenant_id,
            collection_id=payload.collection_id,
            source_document_id=payload.source_document_id,
            chunks=chunks,
            metadata=payload.metadata,
        )
    except Exception as exc:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE embedding_service.embedding_jobs
                SET status='FAILED', error_message=$1, finished_at=CURRENT_TIMESTAMP
                WHERE id=(
                    SELECT id FROM embedding_service.embedding_jobs
                    WHERE tenant_id=$2 AND collection_id=$3 AND source_document_id=$4
                    ORDER BY created_at DESC LIMIT 1
                )
                """,
                str(exc),
                payload.tenant_id,
                payload.collection_id,
                payload.source_document_id,
            )
        raise HTTPException(status_code=500, detail=f"Failed to index text: {exc}") from exc


@app.post("/v1/index/file")
async def index_file(
    tenant_id: uuid.UUID,
    collection_id: uuid.UUID,
    source_document_id: uuid.UUID,
    file: UploadFile = File(...),
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
    _: dict[str, Any] = Depends(require_service_auth),
) -> dict:
    content = await file.read()

    try:
        extracted = parse_text_from_bytes(content=content, filename=file.filename or "", content_type=file.content_type)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    chunks = chunk_text(
        extracted,
        chunk_size=chunk_size or settings.default_chunk_size,
        chunk_overlap=chunk_overlap if chunk_overlap is not None else settings.default_chunk_overlap,
    )

    if not chunks:
        raise HTTPException(status_code=400, detail="No content extracted from file")

    try:
        return await _index_chunks(
            tenant_id=tenant_id,
            collection_id=collection_id,
            source_document_id=source_document_id,
            chunks=chunks,
            metadata={
                "filename": file.filename,
                "document_name": file.filename,
                "content_type": file.content_type,
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to index file: {exc}") from exc


@app.post("/v1/search", response_model=SearchResponse)
async def semantic_search(
    payload: SearchRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> SearchResponse:
    if not payload.collection_id and not payload.knowledge_base_id:
        raise HTTPException(status_code=400, detail="Either collection_id or knowledge_base_id is required")

    vector = await ollama_client.embed(payload.query)
    vector = ensure_dimension(vector, settings.embedding_dimension)
    literal_vector = vector_to_literal(vector)

    if payload.collection_id:
        query = """
            SELECT e.id, e.source_document_id, e.source_chunk_id, e.chunk_index,
                   LEFT(e.chunk_text, $5) AS chunk_text, e.metadata,
                   1 - (embedding <=> $3::vector) AS score
            FROM embedding_service.embeddings e
            WHERE e.tenant_id = $1
              AND e.collection_id = $2
              AND 1 - (e.embedding <=> $3::vector) >= $4
            ORDER BY e.embedding <=> $3::vector
            LIMIT $6
        """
        args = [
            payload.tenant_id,
            payload.collection_id,
            literal_vector,
            settings.min_similarity_score,
            settings.search_max_chunk_chars,
            payload.top_k,
        ]
    else:
        pool = await get_pool()
        async with pool.acquire() as conn:
            latest_collection_id = await conn.fetchval(
                """
                SELECT id
                FROM embedding_service.embedding_collections
                WHERE tenant_id = $1
                  AND knowledge_base_id = $2
                  AND status = 'ACTIVE'
                ORDER BY updated_at DESC, created_at DESC
                LIMIT 1
                """,
                payload.tenant_id,
                payload.knowledge_base_id,
            )

        if latest_collection_id is None:
            raise HTTPException(status_code=404, detail="No active collection found for knowledge_base_id")

        query = """
            SELECT e.id, e.source_document_id, e.source_chunk_id, e.chunk_index,
                   LEFT(e.chunk_text, $5) AS chunk_text, e.metadata,
                   1 - (e.embedding <=> $3::vector) AS score
            FROM embedding_service.embeddings e
            WHERE e.tenant_id = $1
              AND e.collection_id = $2
              AND 1 - (e.embedding <=> $3::vector) >= $4
            ORDER BY e.embedding <=> $3::vector
            LIMIT $6
        """
        args = [
            payload.tenant_id,
            latest_collection_id,
            literal_vector,
            settings.min_similarity_score,
            settings.search_max_chunk_chars,
            payload.top_k,
        ]

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)

    items = [
        SearchResult(
            id=row["id"],
            source_document_id=row["source_document_id"],
            source_chunk_id=row["source_chunk_id"],
            chunk_index=row["chunk_index"],
            chunk_text=row["chunk_text"],
            score=float(row["score"]),
            metadata=row["metadata"] or {},
        )
        for row in rows
    ]

    return SearchResponse(items=items)


@app.get("/v1/jobs/{job_id}")
async def get_job(
    job_id: uuid.UUID,
    _: dict[str, Any] = Depends(require_service_auth),
) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, tenant_id, collection_id, source_document_id, source_chunk_count,
                   status, error_message, started_at, finished_at, created_at
            FROM embedding_service.embedding_jobs
            WHERE id = $1
            """,
            job_id,
        )

    if not row:
        raise HTTPException(status_code=404, detail="Job not found")

    result = dict(row)
    for key, value in list(result.items()):
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result


@app.post("/embed", response_model=EmbedResponse)
async def embed_from_document_service(
    payload: EmbedRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> EmbedResponse:
    if not payload.chunks:
        raise HTTPException(status_code=400, detail="Chunks are required")

    collection = await _resolve_collection_by_kb(payload.knowledge_base_id)
    tenant_id = collection["tenant_id"]
    collection_id = collection["id"]
    target_dimension = int(collection["dimension"])

    pool = await get_pool()
    job_id = uuid.uuid4()
    results: list[EmbedResultResponse] = []

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                """
                INSERT INTO embedding_service.embedding_jobs
                (id, tenant_id, collection_id, source_document_id, source_chunk_count, status, started_at)
                VALUES ($1, $2, $3, $4, $5, 'RUNNING', CURRENT_TIMESTAMP)
                """,
                job_id,
                tenant_id,
                collection_id,
                payload.document_id,
                len(payload.chunks),
            )

            chunk_contents = [chunk.content for chunk in payload.chunks]
            literal_vectors = await _embed_texts_to_literals(chunk_contents, target_dimension)

            for idx, chunk in enumerate(payload.chunks):
                source_chunk_id = uuid.uuid4()
                literal_vector = literal_vectors[idx]
                row_metadata: dict[str, Any] = {
                    "knowledge_base_id": str(payload.knowledge_base_id),
                    "document_id": str(payload.document_id),
                }
                if payload.document_name:
                    row_metadata["document_name"] = payload.document_name
                if chunk.page is not None:
                    row_metadata["page"] = chunk.page

                await conn.execute(
                    """
                    INSERT INTO embedding_service.embeddings
                    (tenant_id, collection_id, source_document_id, source_chunk_id, chunk_index, chunk_text, embedding, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8::jsonb)
                    """,
                    tenant_id,
                    collection_id,
                    payload.document_id,
                    source_chunk_id,
                    chunk.index,
                    chunk.content,
                    literal_vector,
                    row_metadata,
                )

                results.append(
                    EmbedResultResponse(index=chunk.index, embedding_id=str(source_chunk_id))
                )

            await conn.execute(
                """
                UPDATE embedding_service.embedding_jobs
                SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                WHERE id=$1
                """,
                job_id,
            )

    return EmbedResponse(results=results)
