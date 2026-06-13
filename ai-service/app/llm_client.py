import json
import asyncio
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.config import Settings


class BaseLlmClient:
    provider_key: str
    provider_name: str
    model_name: str

    async def close(self) -> None:
        raise NotImplementedError

    async def chat(self, system_prompt: str, user_prompt: str, temperature: float) -> dict[str, Any]:
        raise NotImplementedError

    async def chat_stream(self, system_prompt: str, user_prompt: str, temperature: float) -> AsyncIterator[dict[str, Any]]:
        raise NotImplementedError


class OllamaLlmClient(BaseLlmClient):
    def __init__(self, settings: Settings, timeout_seconds: float = 180.0):
        self.provider_key = "ollama"
        self.provider_name = settings.ollama_provider_name
        self.model_name = settings.ollama_llm_model
        self._base_url = settings.ollama_base_url.rstrip("/")
        self._keep_alive = settings.ollama_keep_alive
        self._client = httpx.AsyncClient(timeout=timeout_seconds)

    async def close(self) -> None:
        await self._client.aclose()

    async def _post(self, url: str, payload: dict[str, Any], retries: int = 3) -> httpx.Response:
        import asyncio

        for i in range(retries):
            try:
                response = await self._client.post(url, json=payload)
                response.raise_for_status()
                return response
            except Exception:
                if i == retries - 1:
                    raise
                await asyncio.sleep(0.3 * (i + 1))

    async def chat(self, system_prompt: str, user_prompt: str, temperature: float) -> dict[str, Any]:
        payload = {
            "model": self.model_name,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "options": {"temperature": temperature},
            "keep_alive": self._keep_alive,
        }
        response = await self._post(f"{self._base_url}/api/chat", payload)
        return response.json()

    async def chat_stream(self, system_prompt: str, user_prompt: str, temperature: float) -> AsyncIterator[dict[str, Any]]:
        payload = {
            "model": self.model_name,
            "stream": True,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "options": {"temperature": temperature},
            "keep_alive": self._keep_alive,
        }

        async with self._client.stream(
            "POST",
            f"{self._base_url}/api/chat",
            json=payload,
            timeout=httpx.Timeout(None, read=300),
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    item = json.loads(line)
                except Exception:
                    continue

                yield item
                if item.get("done"):
                    break


class OpenAiCompatibleLlmClient(BaseLlmClient):
    def __init__(self, settings: Settings, timeout_seconds: float = 180.0):
        self.provider_key = "openai-compatible"
        self.provider_name = settings.third_party_provider_name
        self.model_name = settings.third_party_llm_model
        self._base_url = settings.third_party_base_url.rstrip("/")
        self._api_key = settings.third_party_api_key.strip()
        self._client = httpx.AsyncClient(timeout=timeout_seconds)

        if not self._api_key:
            raise ValueError("THIRD_PARTY_API_KEY is required when AI_PROVIDER_MODE=openai-compatible")

    async def close(self) -> None:
        await self._client.aclose()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    async def chat(self, system_prompt: str, user_prompt: str, temperature: float) -> dict[str, Any]:
        payload = {
            "model": self.model_name,
            "temperature": temperature,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        response = await self._client.post(
            f"{self._base_url}/chat/completions",
            headers=self._headers(),
            json=payload,
        )
        response.raise_for_status()
        raw = response.json()

        choice = ((raw.get("choices") or [{}])[0]) if isinstance(raw, dict) else {}
        message = choice.get("message") if isinstance(choice, dict) else {}
        usage = raw.get("usage") if isinstance(raw, dict) else {}

        return {
            "message": {"content": (message or {}).get("content", "")},
            "prompt_eval_count": usage.get("prompt_tokens"),
            "eval_count": usage.get("completion_tokens"),
            "done_reason": choice.get("finish_reason", "stop") if isinstance(choice, dict) else "stop",
            "model": raw.get("model", self.model_name) if isinstance(raw, dict) else self.model_name,
            "raw": raw,
        }

    async def chat_stream(self, system_prompt: str, user_prompt: str, temperature: float) -> AsyncIterator[dict[str, Any]]:
        payload = {
            "model": self.model_name,
            "temperature": temperature,
            "stream": True,
            "stream_options": {"include_usage": True},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        prompt_tokens = None
        completion_tokens = None

        async with self._client.stream(
            "POST",
            f"{self._base_url}/chat/completions",
            headers=self._headers(),
            json=payload,
            timeout=httpx.Timeout(None, read=300),
        ) as response:
            response.raise_for_status()

            async for raw_line in response.aiter_lines():
                line = raw_line.strip()
                if not line or not line.startswith("data:"):
                    continue

                data = line[5:].strip()
                if data == "[DONE]":
                    yield {
                        "done": True,
                        "prompt_eval_count": prompt_tokens,
                        "eval_count": completion_tokens,
                        "done_reason": "stop",
                        "model": self.model_name,
                    }
                    break

                try:
                    item = json.loads(data)
                except Exception:
                    continue

                usage = item.get("usage") if isinstance(item, dict) else None
                if isinstance(usage, dict):
                    prompt_tokens = usage.get("prompt_tokens", prompt_tokens)
                    completion_tokens = usage.get("completion_tokens", completion_tokens)

                choice = ((item.get("choices") or [{}])[0]) if isinstance(item, dict) else {}
                delta = choice.get("delta") if isinstance(choice, dict) else {}
                token = (delta or {}).get("content", "")
                finish_reason = choice.get("finish_reason") if isinstance(choice, dict) else None

                if token:
                    yield {"message": {"content": token}, "done": False}

                if finish_reason:
                    yield {
                        "done": True,
                        "prompt_eval_count": prompt_tokens,
                        "eval_count": completion_tokens,
                        "done_reason": finish_reason,
                        "model": item.get("model", self.model_name),
                    }
                    break


def build_llm_client(settings: Settings) -> BaseLlmClient:
    mode = settings.ai_provider_mode.strip().lower()
    return build_llm_client_for_mode(settings, mode)


def build_llm_client_for_mode(settings: Settings, mode: str) -> BaseLlmClient:
    if mode == "ollama":
        return OllamaLlmClient(settings)
    if mode in {"openai-compatible", "third-party", "api"}:
        return OpenAiCompatibleLlmClient(settings)
    raise ValueError(f"Unsupported AI_PROVIDER_MODE: {mode}")


class RuntimeLlmManager:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._lock = asyncio.Lock()
        self._mode = settings.ai_provider_mode.strip().lower()
        self._client = build_llm_client_for_mode(settings, self._mode)

    @property
    def client(self) -> BaseLlmClient:
        return self._client

    @property
    def mode(self) -> str:
        return self._mode

    async def close(self) -> None:
        await self._client.close()

    async def switch_mode(self, mode: str) -> BaseLlmClient:
        normalized = mode.strip().lower()
        async with self._lock:
            if normalized == self._mode:
                return self._client

            next_client = build_llm_client_for_mode(self._settings, normalized)
            previous_client = self._client
            self._client = next_client
            self._mode = normalized
            await previous_client.close()
            return self._client
