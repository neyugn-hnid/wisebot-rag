"""
Re-ranking service: xếp hạng lại các chunk sau khi retrieval trước khi đưa vào prompt.

Sử dụng LLM (llama3) để:
- Đánh giá mức độ liên quan của từng chunk với câu hỏi.
- Sắp xếp lại theo relevance score.
- Loại bỏ chunk không liên quan.

Hai chiến lược:
1. Listwise: Đưa toàn bộ chunk vào prompt, yêu cầu LLM sắp xếp.
2. Pointwise: LLM chấm điểm từng chunk riêng lẻ, rồi sắp xếp theo điểm.
"""

import asyncio
import logging
import re

from app.llm_client import BaseLlmClient, build_llm_client_for_mode
from app.config import settings

logger = logging.getLogger(__name__)

RERANK_SYSTEM_PROMPT = """You are a relevance scoring assistant for a RAG system.
Your task: score how relevant each document chunk is to the user's question.

Rules:
1. Score each chunk from 0.0 (completely irrelevant) to 1.0 (perfectly relevant).
2. Consider: does the chunk contain information that helps answer the question?
3. Output format: one score per chunk, exactly like this:
   [0] 0.85
   [1] 0.32
   [2] 0.91
4. No explanations, no additional text, ONLY the scores in the exact format above.
5. You MUST output a score for EVERY chunk provided."""


def _build_reranker_client(shared_client: BaseLlmClient) -> BaseLlmClient:
    mode = settings.reranker_provider_mode.strip().lower()
    if mode in {"", "shared"}:
        return shared_client

    try:
        overrides = {}
        if settings.reranker_base_url.strip():
            overrides["third_party_base_url"] = settings.reranker_base_url.strip()
        if settings.reranker_api_key.strip():
            overrides["third_party_api_key"] = settings.reranker_api_key.strip()
        if settings.reranker_model.strip():
            overrides["third_party_llm_model"] = settings.reranker_model.strip()
        if settings.reranker_provider_name.strip():
            overrides["third_party_provider_name"] = settings.reranker_provider_name.strip()

        dedicated_settings = settings.model_copy(update=overrides)
        return build_llm_client_for_mode(dedicated_settings, mode)
    except Exception as exc:
        logger.warning("Reranker dedicated LLM unavailable (%s), using shared client", exc)
        return shared_client


class Reranker:
    """
    Xếp hạng lại danh sách chunk dựa trên độ liên quan với câu hỏi.
    """

    def __init__(self, llm_client: BaseLlmClient) -> None:
        self._fallback_client = llm_client
        self._client = _build_reranker_client(llm_client)
        self._enabled = settings.reranking_enabled
        self._top_k_multiplier = settings.rerank_top_k_multiplier

    @property
    def enabled(self) -> bool:
        return self._enabled

    async def rerank(
        self,
        question: str,
        chunks: list[dict],
        final_top_k: int,
    ) -> list[dict]:
        """
        Xếp hạng lại các chunk theo độ liên quan với câu hỏi.

        Args:
            question: câu hỏi người dùng (có thể đã được rewrite)
            chunks: danh sách chunk từ hybrid search
            final_top_k: số lượng chunk cuối cùng sau khi rerank

        Returns:
            Danh sách chunk đã rerank, giới hạn final_top_k
        """
        if not self._enabled or len(chunks) <= final_top_k:
            return chunks[:final_top_k]

        # Tối ưu: nếu số chunk ít hơn 2x final_top_k, dùng score gốc
        try:
            # Batch chunks để tránh prompt quá dài (max 15 chunks mỗi batch)
            BATCH_SIZE = 15
            if len(chunks) <= BATCH_SIZE:
                reranked = await self._rerank_batch(question, chunks)
            else:
                # Xử lý theo batch, rồi merge
                all_reranked: list[dict] = []
                for i in range(0, len(chunks), BATCH_SIZE):
                    batch = chunks[i : i + BATCH_SIZE]
                    batch_reranked = await self._rerank_batch(question, batch)
                    all_reranked.extend(batch_reranked)

                # Sắp xếp toàn bộ sau khi merge
                all_reranked.sort(key=lambda c: c.get("_rerank_score", c.get("score", 0)), reverse=True)
                reranked = all_reranked

            logger.info(
                "Reranking: %d chunks → %d after rerank",
                len(chunks),
                min(len(reranked), final_top_k),
            )
            return reranked[:final_top_k]

        except Exception as exc:
            logger.error("Reranking failed: %s, falling back to original order", exc)
            return chunks[:final_top_k]

    async def _rerank_batch(self, question: str, chunks: list[dict]) -> list[dict]:
        """Rerank một batch chunk bằng LLM pointwise scoring."""
        # Xây dựng prompt
        chunks_text = ""
        for idx, chunk in enumerate(chunks):
            snippet = chunk["chunk_text"][:400].replace("\n", " ").strip()
            chunks_text += f"[{idx}] {snippet}\n\n"

        user_prompt = (
            f"Question: {question}\n\n"
            f"Score each chunk's relevance to the question:\n\n"
            f"{chunks_text}"
        )

        result = await self._chat(
            system_prompt=RERANK_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.0,  # deterministic scoring
        )

        content = (
            (result.get("message") or {}).get("content")
            or result.get("response")
            or ""
        )

        # Parse scores từ output LLM
        scores = self._parse_scores(content, len(chunks))

        # Gán rerank score
        for idx, chunk in enumerate(chunks):
            chunk["_rerank_score"] = scores.get(idx, chunk.get("score", 0.0))

        # Sắp xếp theo rerank score giảm dần
        chunks.sort(key=lambda c: c.get("_rerank_score", 0), reverse=True)
        return chunks

    async def _chat(self, system_prompt: str, user_prompt: str, temperature: float) -> dict:
        try:
            return await self._client.chat(system_prompt, user_prompt, temperature)
        except Exception:
            if self._client is self._fallback_client:
                raise
            logger.warning("Dedicated reranker failed, retrying with shared LLM")
            return await self._fallback_client.chat(system_prompt, user_prompt, temperature)

    @staticmethod
    def _parse_scores(content: str, expected_count: int) -> dict[int, float]:
        """Parse scores từ output LLM dạng '[0] 0.85'."""
        scores: dict[int, float] = {}

        # Pattern: [số] số_thập_phân
        pattern = re.compile(r"\[(\d+)\]\s*([\d.]+)")
        matches = pattern.findall(content)

        for match in matches:
            idx = int(match[0])
            try:
                score = float(match[1])
                score = max(0.0, min(1.0, score))  # clamp 0-1
                scores[idx] = score
            except ValueError:
                continue

        # Nếu parse được quá ít, fallback: giữ nguyên thứ tự
        if len(scores) < expected_count / 2:
            logger.warning(
                "Reranker parsed only %d/%d scores, keeping original order",
                len(scores),
                expected_count,
            )
            # Giữ score gốc cho những chunk không parse được
            for i in range(expected_count):
                if i not in scores:
                    scores[i] = 0.0

        return scores


class LLMReranker:
    """
    Phiên bản nâng cao: rerank bằng cách yêu cầu LLM sắp xếp trực tiếp thứ tự chunk.
    Phù hợp khi số lượng chunk nhỏ (≤ 10).
    """

    LISTWISE_PROMPT = """You are a relevance ranking assistant.
Given a question and a list of document chunks, rank them by relevance.

Output the chunk indices in order of relevance (most relevant first), like:
Ranked: [3, 0, 5, 1, 2, 4]

Only output the "Ranked: [...]" line, nothing else."""

    def __init__(self, llm_client: BaseLlmClient) -> None:
        self._fallback_client = llm_client
        self._client = _build_reranker_client(llm_client)
        self._enabled = settings.reranking_enabled

    async def rerank_listwise(
        self,
        question: str,
        chunks: list[dict],
        final_top_k: int,
    ) -> list[dict]:
        """Listwise rerank: LLM sắp xếp lại toàn bộ danh sách."""
        if not self._enabled or len(chunks) <= final_top_k:
            return chunks[:final_top_k]

        if len(chunks) > 10:
            # Fallback: chỉ rerank top-10, giữ nguyên phần còn lại
            head = chunks[:10]
            tail = chunks[10:]
            reranked_head = await self._rerank_listwise_core(question, head)
            return (reranked_head + tail)[:final_top_k]

        reranked = await self._rerank_listwise_core(question, chunks)
        return reranked[:final_top_k]

    async def _rerank_listwise_core(self, question: str, chunks: list[dict]) -> list[dict]:
        chunks_text = ""
        for idx, chunk in enumerate(chunks):
            snippet = chunk["chunk_text"][:300].replace("\n", " ").strip()
            chunks_text += f"[{idx}] {snippet}\n"

        user_prompt = f"Question: {question}\n\nChunks:\n{chunks_text}"

        try:
            result = await self._chat(
                system_prompt=self.LISTWISE_PROMPT,
                user_prompt=user_prompt,
                temperature=0.0,
            )

            content = (
                (result.get("message") or {}).get("content")
                or result.get("response")
                or ""
            )

            # Parse: "Ranked: [3, 0, 5, 1, 2, 4]"
            match = re.search(r"\[([0-9,\s]+)\]", content)
            if match:
                order = [int(x.strip()) for x in match.group(1).split(",") if x.strip().isdigit()]
                reranked = [chunks[i] for i in order if 0 <= i < len(chunks)]
                # Thêm chunk chưa được xếp
                ranked_ids = set(order)
                for i, chunk in enumerate(chunks):
                    if i not in ranked_ids:
                        reranked.append(chunk)
                for rank, chunk in enumerate(reranked):
                    chunk["_rerank_rank"] = rank
                return reranked

            logger.warning("Listwise reranker could not parse ranking, keeping original order")
            return chunks

        except Exception as exc:
            logger.error("Listwise reranking failed: %s", exc)
            return chunks

    async def _chat(self, system_prompt: str, user_prompt: str, temperature: float) -> dict:
        try:
            return await self._client.chat(system_prompt, user_prompt, temperature)
        except Exception:
            if self._client is self._fallback_client:
                raise
            logger.warning("Dedicated listwise reranker failed, retrying with shared LLM")
            return await self._fallback_client.chat(system_prompt, user_prompt, temperature)
