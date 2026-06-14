"""
Query Rewriting service: viết lại câu hỏi trước khi embedding để cải thiện chất lượng truy xuất.

Sử dụng LLM (llama3) để:
- Mở rộng câu hỏi ngắn thành câu đầy đủ ngữ cảnh.
- Tạo thêm các biến thể tìm kiếm (multi-query).
- Chuẩn hóa chính tả, ngữ pháp tiếng Việt.
"""

import logging
import re

from app.llm_client import BaseLlmClient, build_llm_client_for_mode
from app.config import settings

logger = logging.getLogger(__name__)

REWRITE_SYSTEM_PROMPT = """You are a query rewriting assistant for a Vietnamese RAG system.
Your task is to rewrite the user's question to improve retrieval quality.

Rules:
1. Preserve the exact user intent. Never change the topic or answer the question.
2. Fix spelling and grammar, especially for Vietnamese text.
3. Add only directly relevant keywords and synonyms that might appear in documents.
4. If the question is already clear and detailed, keep it unchanged.
5. Output ONLY the rewritten question, no explanations, no prefixes, no markdown.
6. Keep the rewritten question in the same language as the original (Vietnamese or English).
7. Do NOT answer the question, just rewrite it for better search retrieval.
8. For out-of-domain questions, do not make them fit the knowledge base; keep the original intent."""


def _build_query_rewriter_client(shared_client: BaseLlmClient) -> BaseLlmClient:
    mode = settings.query_rewriter_provider_mode.strip().lower()
    if mode in {"", "shared"}:
        return shared_client

    try:
        overrides = {}
        if settings.query_rewriter_base_url.strip():
            overrides["third_party_base_url"] = settings.query_rewriter_base_url.strip()
        if settings.query_rewriter_api_key.strip():
            overrides["third_party_api_key"] = settings.query_rewriter_api_key.strip()
        if settings.query_rewriter_model.strip():
            overrides["third_party_llm_model"] = settings.query_rewriter_model.strip()
        if settings.query_rewriter_provider_name.strip():
            overrides["third_party_provider_name"] = settings.query_rewriter_provider_name.strip()

        dedicated_settings = settings.model_copy(update=overrides)
        return build_llm_client_for_mode(dedicated_settings, mode)
    except Exception as exc:
        logger.warning("Query rewriter dedicated LLM unavailable (%s), using shared client", exc)
        return shared_client


def _clean_rewrite_output(value: str) -> str:
    cleaned = (value or "").strip()
    cleaned = re.sub(r"^```(?:text)?|```$", "", cleaned, flags=re.IGNORECASE).strip()
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
    if not lines:
        return ""
    first = lines[0]
    first = re.sub(r"^\s*(?:[-*]|\d+[\).\:-])\s*", "", first).strip()
    first = re.sub(r"^(?:rewritten question|query|question)\s*:\s*", "", first, flags=re.IGNORECASE).strip()
    return first.strip("\"' ")


def _clean_query_variants(content: str, original: str) -> list[str]:
    variants: list[str] = []
    seen = {original.strip().lower()}
    for line in (content or "").splitlines():
        cleaned = _clean_rewrite_output(line)
        if len(cleaned) < 3:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        variants.append(cleaned)
    return variants


class QueryRewriter:
    """Viết lại câu hỏi người dùng trước khi tạo embedding."""

    def __init__(self, llm_client: BaseLlmClient) -> None:
        self._fallback_client = llm_client
        self._client = _build_query_rewriter_client(llm_client)
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
        if word_count >= 5 and question.strip().endswith("?"):
            logger.debug("Query rewriting skipped: question looks explicit (%d words)", word_count)
            return question
        if word_count >= 30 or len(question) >= 100:
            logger.debug("Query rewriting skipped: question already detailed (%d words)", word_count)
            return question

        try:
            result = await self._chat(
                system_prompt=REWRITE_SYSTEM_PROMPT,
                user_prompt=f"Rewrite this question for better document retrieval:\n\n{question}",
                temperature=0.1,  # low temperature for consistent rewrites
            )

            rewritten = (
                (result.get("message") or {}).get("content")
                or result.get("response")
                or ""
            ).strip()
            rewritten = _clean_rewrite_output(rewritten)

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

    async def _chat(self, system_prompt: str, user_prompt: str, temperature: float) -> dict:
        try:
            return await self._client.chat(system_prompt, user_prompt, temperature)
        except Exception:
            if self._client is self._fallback_client:
                raise
            logger.warning("Dedicated query rewriter failed, retrying with shared LLM")
            return await self._fallback_client.chat(system_prompt, user_prompt, temperature)

    async def rewrite_multi_query(self, question: str, num_queries: int = 3) -> list[str]:
        """
        Tạo nhiều biến thể của câu hỏi để tìm kiếm đa hướng (multi-query retrieval).
        Trả về danh sách gồm câu gốc + các biến thể.
        """
        if not self._enabled:
            return [question]

        multi_prompt = f"""Generate {num_queries} different search-friendly versions of this question.
Each version must preserve the same intent and must not add unrelated topics.
Prefer variants that keep important nouns, product names, policy names, numbers, places, and constraints.
Output one version per line, no numbering, no prefixes.

Question: {question}"""

        try:
            result = await self._chat(
                system_prompt=REWRITE_SYSTEM_PROMPT,
                user_prompt=multi_prompt,
                temperature=0.3,
            )

            content = (
                (result.get("message") or {}).get("content")
                or result.get("response")
                or ""
            ).strip()

            variants = _clean_query_variants(content, question)

            if not variants:
                return [question]

            # Đảm bảo câu gốc luôn có mặt
            all_queries = [question] + [v for v in variants if v != question]
            logger.info("Generated %d query variants for multi-query search", len(all_queries))

            return all_queries[: num_queries + 1]

        except Exception as exc:
            logger.error("Multi-query rewriting failed: %s", exc)
            return [question]
