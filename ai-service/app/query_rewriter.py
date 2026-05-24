"""
Query Rewriting service: viết lại câu hỏi trước khi embedding để cải thiện chất lượng truy xuất.

Sử dụng LLM (llama3) để:
- Mở rộng câu hỏi ngắn thành câu đầy đủ ngữ cảnh.
- Tạo thêm các biến thể tìm kiếm (multi-query).
- Chuẩn hóa chính tả, ngữ pháp tiếng Việt.
"""

import logging

from app.llm_client import BaseLlmClient
from app.config import settings

logger = logging.getLogger(__name__)

REWRITE_SYSTEM_PROMPT = """You are a query rewriting assistant for a Vietnamese RAG system.
Your task is to rewrite the user's question to improve retrieval quality.

Rules:
1. Expand short or ambiguous questions with more context and detail.
2. Fix spelling and grammar, especially for Vietnamese text.
3. Add relevant keywords and synonyms that might appear in documents.
4. If the question is already clear and detailed, keep it unchanged.
5. Output ONLY the rewritten question, no explanations, no prefixes, no markdown.
6. Keep the rewritten question in the same language as the original (Vietnamese or English).
7. Do NOT answer the question, just rewrite it for better search retrieval."""


class QueryRewriter:
    """Viết lại câu hỏi người dùng trước khi tạo embedding."""

    def __init__(self, llm_client: BaseLlmClient) -> None:
        self._client = llm_client
        self._enabled = settings.query_rewriting_enabled

    @property
    def enabled(self) -> bool:
        return self._enabled

    async def rewrite(self, question: str) -> str:
        """
        Viết lại câu hỏi để tối ưu cho vector search.
        Skip nếu câu đã >= 30 từ hoặc >= 100 ký tự (đủ chi tiết).
        """
        if not self._enabled:
            return question

        # Tối ưu: skip rewrite nếu câu hỏi đã đủ dài và chi tiết
        word_count = len(question.split())
        if word_count >= 30 or len(question) >= 100:
            logger.debug("Query rewriting skipped: question already detailed (%d words)", word_count)
            return question

        try:
            result = await self._client.chat(
                system_prompt=REWRITE_SYSTEM_PROMPT,
                user_prompt=f"Rewrite this question for better document retrieval:\n\n{question}",
                temperature=0.1,  # low temperature for consistent rewrites
            )

            rewritten = (
                (result.get("message") or {}).get("content")
                or result.get("response")
                or ""
            ).strip()

            if rewritten and len(rewritten) >= 3:
                logger.info(
                    "Query rewritten | original=%r | rewritten=%r",
                    question[:120],
                    rewritten[:120],
                )
                return rewritten

            logger.warning("Query rewriting returned empty, using original question")
            return question

        except Exception as exc:
            logger.error("Query rewriting failed: %s, falling back to original", exc)
            return question

    async def rewrite_multi_query(self, question: str, num_queries: int = 3) -> list[str]:
        """
        Tạo nhiều biến thể của câu hỏi để tìm kiếm đa hướng (multi-query retrieval).
        Trả về danh sách gồm câu gốc + các biến thể.
        """
        if not self._enabled:
            return [question]

        multi_prompt = f"""Generate {num_queries} different search-friendly versions of this question.
Each version should focus on a different aspect or angle.
Output one version per line, no numbering, no prefixes.

Question: {question}"""

        try:
            result = await self._client.chat(
                system_prompt=REWRITE_SYSTEM_PROMPT,
                user_prompt=multi_prompt,
                temperature=0.3,
            )

            content = (
                (result.get("message") or {}).get("content")
                or result.get("response")
                or ""
            ).strip()

            variants = [line.strip() for line in content.split("\n") if line.strip()]
            variants = [v for v in variants if len(v) >= 3]

            if not variants:
                return [question]

            # Đảm bảo câu gốc luôn có mặt
            all_queries = [question] + [v for v in variants if v != question]
            logger.info("Generated %d query variants for multi-query search", len(all_queries))

            return all_queries[: num_queries + 1]

        except Exception as exc:
            logger.error("Multi-query rewriting failed: %s", exc)
            return [question]
