import asyncio
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

import httpx
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from qdrant_client.http.models import (
    Distance,
    FieldCondition,
    Filter,
    FilterSelector,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.chunking import chunk_text
from app.config import settings
from app.db import close_db_pool, get_pool, init_db_pool, init_qdrant, get_qdrant
from app.embedding_client import RuntimeEmbeddingManager, build_embedding_client_for_mode
from app.ollama_client import ensure_dimension
from app.parsing import UnsupportedFileTypeError, parse_text_from_bytes
from app.schemas import (
    CollectionResponse,
    CreateCollectionRequest,
    DeleteDocumentEmbeddingsRequest,
    EmbedResponse,
    EmbedResultResponse,
    EmbedRequest,
    IndexTextRequest,
    ProviderConfigResponse,
    ProviderModeUpdateRequest,
    SearchRequest,
    SearchResponse,
    SearchResult,
)
from app.security import require_service_auth


embedding_manager = RuntimeEmbeddingManager(settings)
logger = logging.getLogger(__name__)


async def _warmup_embedding_model() -> None:
    for attempt in range(1, 4):
        try:
            vector = await embedding_manager.client.embed("wisebot warmup")
            ensure_dimension(vector, settings.embedding_dimension)
            logger.info(
                "Embedding warmup completed with provider=%s model=%s",
                embedding_manager.client.provider_key,
                embedding_manager.client.model_name,
            )
            return
        except Exception:
            if attempt == 3:
                logger.warning("Embedding warmup failed after %d attempts", attempt, exc_info=True)
                return
            await asyncio.sleep(2 * attempt)


async def _embed_texts_to_vectors(texts: list[str], target_dimension: int) -> list[list[float]]:
    batch_size = 10
    semaphore = asyncio.Semaphore(max(1, settings.embed_concurrency))

    async def _embed_batch_task(batch: list[str]) -> list[list[float]]:
        async with semaphore:
            vectors = await embedding_manager.client.embed_batch(batch)
        return [ensure_dimension(v, target_dimension) for v in vectors]

    tasks = []
    for i in range(0, len(texts), batch_size):
        tasks.append(_embed_batch_task(texts[i:i + batch_size]))

    results = await asyncio.gather(*tasks)
    final_vectors: list[list[float]] = []
    for batch_results in results:
        final_vectors.extend(batch_results)
    return final_vectors


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db_pool()
    await init_qdrant()
    persisted_mode = await _load_persisted_provider_mode()
    if persisted_mode and persisted_mode != embedding_manager.mode:
        try:
            await embedding_manager.switch_mode(persisted_mode)
        except Exception:
            logger.exception("Failed to restore persisted embedding mode '%s'", persisted_mode)
    warmup_task = asyncio.create_task(_warmup_embedding_model())
    yield
    if not warmup_task.done():
        warmup_task.cancel()
    await embedding_manager.close()
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
    embedding_client = embedding_manager.client
    return {
        "mode": embedding_manager.mode,
        "provider": embedding_client.provider_key,
        "provider_name": embedding_client.provider_name,
        "model_name": embedding_client.model_name,
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

    logger.warning("Failed to load persisted embedding provider mode after retries: %s", last_error)
    return None


async def _persist_provider_mode(mode: str) -> None:
    headers = {
        "X-Internal-Api-Key": settings.internal_config_api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "value": mode,
        "description": "System-wide embedding provider mode for vector generation",
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
    preview_client = build_embedding_client_for_mode(settings, next_mode)
    await preview_client.close()
    await _persist_provider_mode(next_mode)
    client = await embedding_manager.switch_mode(next_mode)
    return ProviderConfigResponse(
        mode=embedding_manager.mode,
        provider=client.provider_key,
        provider_name=client.provider_name,
        model_name=client.model_name,
    )


async def _ensure_qdrant_collection(collection_name: str, dimension: int):
    qdrant = await get_qdrant()
    from qdrant_client.http.exceptions import UnexpectedResponse

    try:
        await qdrant.get_collection(collection_name)
    except UnexpectedResponse as e:
        if e.status_code == 404:
            await qdrant.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=dimension, distance=Distance.COSINE),
            )
        else:
            raise


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
        await _ensure_qdrant_collection(str(row["id"]), payload.dimension)
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
        await _ensure_qdrant_collection(str(collection_id), target_dimension)

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

            vectors = await _embed_texts_to_vectors(chunks, target_dimension)

            points = []
            for idx, item in enumerate(chunks):
                source_chunk_id = str(uuid.uuid4())

                payload = dict(metadata)
                payload["tenant_id"] = str(tenant_id)
                payload["collection_id"] = str(collection_id)
                payload["source_document_id"] = str(source_document_id)
                payload["source_chunk_id"] = source_chunk_id
                payload["chunk_index"] = idx
                payload["chunk_text"] = item

                points.append(
                    PointStruct(
                        id=source_chunk_id,
                        vector=vectors[idx],
                        payload=payload,
                    )
                )

            qdrant = await get_qdrant()
            await qdrant.upsert(collection_name=str(collection_id), points=points)

            await conn.execute(
                """
                UPDATE embedding_service.embedding_jobs
                SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                WHERE id=$1
                """,
                job_id,
            )

    return {"job_id": str(job_id), "chunk_count": len(chunks)}


async def _resolve_collection_by_kb(tenant_id: uuid.UUID, knowledge_base_id: uuid.UUID):
    pool = await get_pool()
    async with pool.acquire() as conn:
        collection = await conn.fetchrow(
            """
            SELECT id, tenant_id, dimension, status
            FROM embedding_service.embedding_collections
            WHERE tenant_id = $1 AND knowledge_base_id = $2 AND status = 'ACTIVE'
            ORDER BY updated_at DESC, created_at DESC
            LIMIT 1
            """,
            tenant_id,
            knowledge_base_id,
        )

        if collection:
            return collection

        inserted = await conn.fetchrow(
            """
            INSERT INTO embedding_service.embedding_collections
            (tenant_id, knowledge_base_id, name, provider, model_name, dimension, metric)
            VALUES ($1, $2, $3, $4, $5, $6, 'cosine')
            RETURNING id, tenant_id, dimension, status
            """,
            tenant_id,
            knowledge_base_id,
            settings.default_collection_name,
            embedding_manager.client.provider_key,
            embedding_manager.client.model_name,
            settings.embedding_dimension,
        )
        await _ensure_qdrant_collection(str(inserted["id"]), settings.embedding_dimension)
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
        extracted = await parse_text_from_bytes(content=content, filename=file.filename or "", content_type=file.content_type)
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


@app.get("/v1/collections/resolve")
async def resolve_collection(
    tenant_id: uuid.UUID,
    knowledge_base_id: uuid.UUID,
    _: dict[str, Any] = Depends(require_service_auth),
) -> dict:
    collection = await _resolve_collection_by_kb(tenant_id, knowledge_base_id)
    if not collection:
        raise HTTPException(status_code=404, detail="No active collection found for this knowledge base")
    return {"id": str(collection["id"]), "dimension": collection["dimension"]}


@app.post("/v1/embeddings/delete-document")
async def delete_document_embeddings(
    payload: DeleteDocumentEmbeddingsRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        collection = await conn.fetchrow(
            """
            SELECT id, tenant_id, dimension, status
            FROM embedding_service.embedding_collections
            WHERE tenant_id = $1 AND knowledge_base_id = $2 AND status = 'ACTIVE'
            ORDER BY updated_at DESC, created_at DESC
            LIMIT 1
            """,
            payload.tenant_id,
            payload.knowledge_base_id,
        )

    if not collection:
        return {
            "collection_id": None,
            "document_id": str(payload.document_id),
            "deleted": 0,
        }

    collection_id = collection["id"]
    delete_filter = Filter(
        must=[
            FieldCondition(key="tenant_id", match=MatchValue(value=str(payload.tenant_id))),
            FieldCondition(key="source_document_id", match=MatchValue(value=str(payload.document_id))),
        ]
    )

    qdrant = await get_qdrant()
    deleted_count: int | None = None
    try:
        count_result = await qdrant.count(
            collection_name=str(collection_id),
            count_filter=delete_filter,
            exact=True,
        )
        deleted_count = int(count_result.count)
    except Exception:
        logger.warning("Failed to count Qdrant points before deleting document %s", payload.document_id)

    await qdrant.delete(
        collection_name=str(collection_id),
        points_selector=FilterSelector(filter=delete_filter),
        wait=True,
    )

    return {
        "collection_id": str(collection_id),
        "document_id": str(payload.document_id),
        "deleted": deleted_count,
    }


@app.post("/v1/search", response_model=SearchResponse)
async def semantic_search(
    payload: SearchRequest,
    _: dict[str, Any] = Depends(require_service_auth),
) -> SearchResponse:
    if not payload.collection_id and not payload.knowledge_base_id:
        raise HTTPException(status_code=400, detail="Either collection_id or knowledge_base_id is required")

    vector = await embedding_manager.client.embed(payload.query)
    vector = ensure_dimension(vector, settings.embedding_dimension)

    qdrant = await get_qdrant()

    if payload.collection_id:
        target_collection_id = payload.collection_id
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

        target_collection_id = latest_collection_id

    search_filter = Filter(
        must=[
            FieldCondition(
                key="tenant_id",
                match=MatchValue(value=str(payload.tenant_id)),
            )
        ]
    )

    results = await qdrant.search(
        collection_name=str(target_collection_id),
        query_vector=vector,
        query_filter=search_filter,
        limit=payload.top_k,
        score_threshold=settings.min_similarity_score,
    )

    items = []
    for point in results:
        payload_data = point.payload or {}
        chunk_text_value = payload_data.get("chunk_text", "")
        if len(chunk_text_value) > settings.search_max_chunk_chars:
            chunk_text_value = chunk_text_value[:settings.search_max_chunk_chars]

        items.append(
            SearchResult(
                id=uuid.UUID(point.id) if isinstance(point.id, str) else uuid.uuid4(),
                source_document_id=uuid.UUID(payload_data["source_document_id"]),
                source_chunk_id=uuid.UUID(payload_data["source_chunk_id"]),
                chunk_index=payload_data.get("chunk_index", 0),
                chunk_text=chunk_text_value,
                score=point.score,
                metadata={
                    k: v
                    for k, v in payload_data.items()
                    if k not in [
                        "tenant_id",
                        "collection_id",
                        "source_document_id",
                        "source_chunk_id",
                        "chunk_index",
                        "chunk_text",
                    ]
                },
            )
        )

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

    try:
        collection = await _resolve_collection_by_kb(payload.tenant_id, payload.knowledge_base_id)
        tenant_id = collection["tenant_id"]
        collection_id = collection["id"]
        target_dimension = int(collection["dimension"])
        await _ensure_qdrant_collection(str(collection_id), target_dimension)

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
                vectors = await _embed_texts_to_vectors(chunk_contents, target_dimension)

                points = []
                for idx, chunk in enumerate(payload.chunks):
                    source_chunk_id = str(uuid.uuid4())
                    row_metadata: dict[str, Any] = {
                        "knowledge_base_id": str(payload.knowledge_base_id),
                        "document_id": str(payload.document_id),
                        "tenant_id": str(tenant_id),
                        "collection_id": str(collection_id),
                        "source_document_id": str(payload.document_id),
                        "source_chunk_id": source_chunk_id,
                        "chunk_index": chunk.index,
                        "chunk_text": chunk.content,
                    }
                    if payload.document_name:
                        row_metadata["document_name"] = payload.document_name
                    if chunk.page is not None:
                        row_metadata["page"] = chunk.page

                    points.append(
                        PointStruct(
                            id=source_chunk_id,
                            vector=vectors[idx],
                            payload=row_metadata,
                        )
                    )

                    results.append(EmbedResultResponse(index=chunk.index, embedding_id=source_chunk_id))

                qdrant = await get_qdrant()
                await qdrant.upsert(collection_name=str(collection_id), points=points)

                await conn.execute(
                    """
                    UPDATE embedding_service.embedding_jobs
                    SET status='SUCCESS', finished_at=CURRENT_TIMESTAMP
                    WHERE id=$1
                    """,
                    job_id,
                )

        return EmbedResponse(results=results)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            "Failed to embed document %s for knowledge base %s",
            payload.document_id,
            payload.knowledge_base_id,
        )
        raise HTTPException(status_code=500, detail=f"Failed to embed document: {exc}") from exc
