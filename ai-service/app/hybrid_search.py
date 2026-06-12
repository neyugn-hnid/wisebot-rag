"""
Hybrid Search: kết hợp vector search (Qdrant) và keyword search sử dụng
Reciprocal Rank Fusion (RRF).

Flow:
1. Nhận kết quả vector search từ embedding-service (giữ nguyên pipeline).
2. Keyword search: dùng Qdrant scroll với MatchText filter trên chunk_text.
3. Gộp kết quả bằng RRF.
4. Trả về top_k kết quả sau fusion.
"""

import logging
import uuid

from qdrant_client import AsyncQdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchText

from app.config import settings

logger = logging.getLogger(__name__)

RRF_K = 60


class HybridSearcher:
    """Tìm kiếm hybrid: vector similarity + keyword search trên Qdrant."""

    def __init__(self) -> None:
        self._enabled = settings.hybrid_search_enabled

    @property
    def enabled(self) -> bool:
        return self._enabled

    async def search(
        self,
        qdrant_client: AsyncQdrantClient,
        vector_results: list[dict],
        tenant_id: uuid.UUID,
        query_text: str,
        top_k: int,
        collection_id: uuid.UUID | None = None,
    ) -> list[dict]:
        """
        Nhận kết quả vector search, chạy keyword search, fusion bằng RRF.

        Args:
            qdrant_client: AsyncQdrantClient đã khởi tạo
            vector_results: kết quả từ embedding-service /v1/search
            tenant_id: tenant UUID
            query_text: câu hỏi gốc cho keyword search
            top_k: số lượng kết quả trả về
            collection_id: Qdrant collection name (UUID string)

        Returns:
            Danh sách chunk đã fusion
        """
        if not self._enabled:
            return vector_results[:top_k]

        target_collection = str(collection_id) if collection_id else None
        if not target_collection:
            logger.warning("Hybrid search skipped: no collection_id")
            return vector_results[:top_k]

        try:
            keyword_results = await self._keyword_search_qdrant(
                qdrant_client, target_collection, tenant_id, query_text, top_k * 3
            )

            if not keyword_results:
                logger.info("Keyword search returned no results, using vector-only")
                return vector_results[:top_k]

            fused = self._reciprocal_rank_fusion(vector_results, keyword_results, top_k)
            logger.info("Hybrid: vector=%d + keyword=%d → fused=%d", len(vector_results), len(keyword_results), len(fused))
            return fused

        except Exception as exc:
            logger.error("Hybrid search failed: %s, falling back to vector-only", exc)
            return vector_results[:top_k]

    # ── Keyword search qua Qdrant ──────────────────────────────────────────

    async def _keyword_search_qdrant(
        self,
        qdrant_client: AsyncQdrantClient,
        collection_name: str,
        tenant_id: uuid.UUID,
        query_text: str,
        top_k: int,
    ) -> list[dict]:
        """Keyword search trong Qdrant payload sử dụng MatchText filter."""
        import re

        cleaned = re.sub(r"[^\w\s]", " ", query_text)
        keywords = [w.strip().lower() for w in cleaned.split() if len(w.strip()) >= 2]

        if not keywords:
            return []

        all_results: dict[str, dict] = {}

        for keyword in keywords[:10]:
            try:
                scroll_filter = Filter(
                    must=[
                        FieldCondition(key="tenant_id", match={"value": str(tenant_id)}),
                        FieldCondition(key="chunk_text", match=MatchText(text=keyword)),
                    ]
                )
                points, _ = await qdrant_client.scroll(
                    collection_name=collection_name,
                    scroll_filter=scroll_filter,
                    limit=top_k,
                    with_payload=True,
                    with_vectors=False,
                )

                for point in points:
                    payload = point.payload or {}
                    chunk_id = payload.get("source_chunk_id", str(point.id))

                    if chunk_id in all_results:
                        all_results[chunk_id]["score"] = min(1.0, all_results[chunk_id]["score"] + 0.15)
                    else:
                        all_results[chunk_id] = {
                            "source_document_id": uuid.UUID(payload.get("source_document_id", str(uuid.uuid4()))),
                            "source_chunk_id": uuid.UUID(chunk_id),
                            "chunk_index": int(payload.get("chunk_index", 0)),
                            "chunk_text": str(payload.get("chunk_text", "")),
                            "score": 0.6,
                        }
            except Exception as exc:
                logger.warning("Keyword search for '%s' failed: %s", keyword, exc)
                continue

        results = sorted(all_results.values(), key=lambda c: c["score"], reverse=True)
        return results[:top_k]

    # ── Reciprocal Rank Fusion ─────────────────────────────────────────────

    @staticmethod
    def _reciprocal_rank_fusion(
        vector_results: list[dict],
        keyword_results: list[dict],
        top_k: int,
    ) -> list[dict]:
        """Gộp kết quả bằng Reciprocal Rank Fusion: score(d) = Σ 1/(k + rank_i(d))"""
        rrf_scores: dict[str, float] = {}
        chunk_map: dict[str, dict] = {}

        for rank, chunk in enumerate(vector_results, start=1):
            key = str(chunk["source_chunk_id"])
            rrf_scores[key] = rrf_scores.get(key, 0.0) + 1.0 / (RRF_K + rank)
            if key not in chunk_map:
                chunk_map[key] = dict(chunk)

        for rank, chunk in enumerate(keyword_results, start=1):
            key = str(chunk["source_chunk_id"])
            rrf_scores[key] = rrf_scores.get(key, 0.0) + 1.0 / (RRF_K + rank)
            if key not in chunk_map:
                chunk_map[key] = dict(chunk)

        sorted_keys = sorted(rrf_scores, key=rrf_scores.get, reverse=True)

        fused: list[dict] = []
        for key in sorted_keys[:top_k]:
            chunk = dict(chunk_map[key])
            # Giữ nguyên score gốc từ Qdrant (cosine similarity) cho threshold check,
            # lưu RRF score riêng để minh bạch trong ranking
            chunk["rrf_score"] = round(rrf_scores[key], 6)
            fused.append(chunk)

        return fused
