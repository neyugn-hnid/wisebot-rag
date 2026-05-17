import asyncpg
from qdrant_client import AsyncQdrantClient

from app.config import settings


_pool: asyncpg.Pool | None = None
_qdrant: AsyncQdrantClient | None = None


async def init_db_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(dsn=settings.database_url, min_size=1, max_size=10)
    return _pool


async def init_qdrant() -> AsyncQdrantClient:
    global _qdrant
    if _qdrant is None:
        _qdrant = AsyncQdrantClient(url=settings.qdrant_url)
    return _qdrant


async def close_db_pool() -> None:
    global _pool, _qdrant
    if _pool is not None:
        await _pool.close()
        _pool = None
    if _qdrant is not None:
        await _qdrant.close()
        _qdrant = None


async def get_pool() -> asyncpg.Pool:
    if _pool is None:
        return await init_db_pool()
    return _pool


async def get_qdrant() -> AsyncQdrantClient:
    if _qdrant is None:
        return await init_qdrant()
    return _qdrant

