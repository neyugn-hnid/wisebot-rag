"""
LLM-as-a-Judge: đánh giá chất lượng câu trả lời RAG.

Hai chế độ:
1. Dedicated (mặc định): Judge dùng DeepSeek V4 Pro qua OpenAI-compatible API.
2. Shared: Judge dùng chung llm_manager.client (cùng model với generate).

Chuyển đổi qua biến môi trường:
  JUDGE_USE_SHARED_LLM=true  → dùng chung LLM sinh câu trả lời
  JUDGE_USE_SHARED_LLM=false → dùng DeepSeek riêng (cần JUDGE_LLM_API_KEY)
"""

import json
import logging
import re
from typing import Any

import httpx

from app.config import settings
from app.llm_client import BaseLlmClient

logger = logging.getLogger(__name__)

JUDGE_SYSTEM_PROMPT = """You are an impartial LLM-as-a-Judge for a Vietnamese RAG system.
Your task: evaluate the quality of a generated answer given the question and retrieved context.

Score three criteria from 0.0 (worst) to 1.0 (perfect):

1. **faithfulness**: Is the answer 100% grounded in the provided context? Penalize hallucination.
2. **answer_relevance**: Does the answer directly address the user's question? Penalize off-topic.
3. **context_relevance**: Is the retrieved context actually relevant to the question? Penalize noise.

Output ONLY valid JSON on one line. No markdown, no explanation outside JSON.

{"faithfulness": X.XX, "answer_relevance": X.XX, "context_relevance": X.XX, "brief": "1-sentence reason in Vietnamese"}"""


class _DedicatedJudgeClient:
    """OpenAI-compatible client dành riêng cho Judge (DeepSeek V4 Pro)."""

    def __init__(self) -> None:
        self._base_url = settings.judge_llm_base_url.rstrip("/")
        self._api_key = settings.judge_llm_api_key.strip()
        self._model = settings.judge_llm_model
        self._timeout = settings.judge_timeout_seconds
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._timeout)
        return self._client

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    async def chat(self, system_prompt: str, user_prompt: str, temperature: float) -> dict:
        client = await self._get_client()
        payload = {
            "model": self._model,
            "temperature": temperature,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        response = await client.post(
            f"{self._base_url}/chat/completions",
            headers=self._headers(),
            json=payload,
        )
        response.raise_for_status()
        raw = response.json()

        choice = ((raw.get("choices") or [{}])[0]) if isinstance(raw, dict) else {}
        message = choice.get("message") if isinstance(choice, dict) else {}

        return {
            "message": {"content": (message or {}).get("content", "")},
            "model": raw.get("model", self._model) if isinstance(raw, dict) else self._model,
            "raw": raw,
        }


class LlmJudge:
    """LLM-as-a-Judge: đánh giá câu trả lời RAG, hỗ trợ dedicated hoặc shared LLM."""

    def __init__(self, shared_llm: BaseLlmClient | None = None) -> None:
        self._shared_llm = shared_llm
        self._use_shared = settings.judge_use_shared_llm or not bool(settings.judge_llm_api_key)
        self._dedicated: _DedicatedJudgeClient | None = None

        if self._use_shared:
            if shared_llm is None:
                logger.warning("Judge shared mode but no llm_client provided → disabled")
                self._enabled = False
            else:
                self._enabled = settings.judge_enabled
                logger.info("Judge using shared LLM | model=%s", shared_llm.model_name)
        else:
            self._enabled = settings.judge_enabled and bool(settings.judge_llm_api_key)
            if self._enabled:
                self._dedicated = _DedicatedJudgeClient()
                logger.info("Judge using dedicated LLM | model=%s", settings.judge_llm_model)
            else:
                logger.warning("Judge disabled: set JUDGE_ENABLED=true and JUDGE_LLM_API_KEY")

    @property
    def enabled(self) -> bool:
        return self._enabled

    def set_shared_llm(self, shared_llm: BaseLlmClient) -> None:
        """Cập nhật shared LLM client (gọi khi switch provider mode)."""
        self._shared_llm = shared_llm
        if self._use_shared:
            self._enabled = settings.judge_enabled
            logger.info("Judge shared LLM updated | model=%s", shared_llm.model_name)

    async def close(self) -> None:
        if self._dedicated is not None:
            await self._dedicated.close()
            self._dedicated = None

    async def evaluate(
        self,
        question: str,
        answer: str,
        retrieved_chunks: list[dict],
    ) -> dict:
        """Đánh giá câu trả lời RAG."""
        if not self._enabled:
            return self._empty_result()

        # Xây dựng context text
        context_parts: list[str] = []
        total_chars = 0
        for idx, chunk in enumerate(retrieved_chunks[:8], start=1):
            snippet = chunk["chunk_text"][:400].replace("\n", " ").strip()
            context_parts.append(f"[{idx}] {snippet}")
            total_chars += len(snippet)
            if total_chars > 2500:
                break
        context_text = "\n".join(context_parts)

        user_prompt = (
            f"Question: {question}\n\n"
            f"Retrieved Context:\n{context_text}\n\n"
            f"Generated Answer: {answer}"
        )

        try:
            # Gọi dedicated hoặc shared client
            if self._use_shared and self._shared_llm is not None:
                result = await self._shared_llm.chat(
                    system_prompt=JUDGE_SYSTEM_PROMPT,
                    user_prompt=user_prompt,
                    temperature=0.0,
                )
                model_name = self._shared_llm.model_name
            elif self._dedicated is not None:
                result = await self._dedicated.chat(
                    system_prompt=JUDGE_SYSTEM_PROMPT,
                    user_prompt=user_prompt,
                    temperature=0.0,
                )
                model_name = result.get("model", "?")
            else:
                return self._empty_result()

            content = (
                (result.get("message") or {}).get("content")
                or result.get("response")
                or ""
            ).strip()

            scores = self._parse_json_output(content)

            logger.info(
                "Judge scores | faithfulness=%.2f answer_relevance=%.2f context_relevance=%.2f | model=%s",
                scores["faithfulness"], scores["answer_relevance"], scores["context_relevance"],
                model_name,
            )
            return scores

        except Exception as exc:
            logger.error("Judge evaluation failed: %s", exc)
            return self._empty_result()

    @staticmethod
    def _parse_json_output(content: str) -> dict:
        try:
            parsed = json.loads(content)
            return {
                "faithfulness": float(parsed.get("faithfulness", 0)),
                "answer_relevance": float(parsed.get("answer_relevance", 0)),
                "context_relevance": float(parsed.get("context_relevance", 0)),
                "brief": str(parsed.get("brief", ""))[:200],
            }
        except (json.JSONDecodeError, ValueError, TypeError):
            pass

        scores = {"faithfulness": 0.0, "answer_relevance": 0.0, "context_relevance": 0.0, "brief": ""}
        patterns = {
            "faithfulness": r'"faithfulness"\s*:\s*([\d.]+)',
            "answer_relevance": r'"answer_relevance"\s*:\s*([\d.]+)',
            "context_relevance": r'"context_relevance"\s*:\s*([\d.]+)',
        }
        for key, pat in patterns.items():
            match = re.search(pat, content)
            if match:
                try:
                    scores[key] = max(0.0, min(1.0, float(match.group(1))))
                except ValueError:
                    pass

        brief_match = re.search(r'"brief"\s*:\s*"([^"]+)"', content)
        if brief_match:
            scores["brief"] = brief_match.group(1)[:200]

        return scores

    @staticmethod
    def _empty_result() -> dict:
        return {"faithfulness": 0.0, "answer_relevance": 0.0, "context_relevance": 0.0, "brief": ""}
