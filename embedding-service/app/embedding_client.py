from typing import Any

import httpx

from app.config import Settings


class BaseEmbeddingClient:
    provider_key: str
    provider_name: str
    model_name: str

    async def close(self) -> None:
        raise NotImplementedError

    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError


class OllamaEmbeddingClient(BaseEmbeddingClient):
    def __init__(self, settings: Settings, timeout_seconds: float = 120.0):
        self.provider_key = "ollama"
        self.provider_name = settings.ai_provider_name
        self.model_name = settings.ollama_embedding_model
        self._base_url = settings.ollama_base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=timeout_seconds)
        self._cache: dict[str, list[float]] = {}

    async def close(self) -> None:
        await self._client.aclose()

    async def _post_with_retry(self, url: str, payload: dict[str, Any], retries: int = 3) -> httpx.Response:
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

    async def embed(self, text: str) -> list[float]:
        if text in self._cache:
            return self._cache[text]

        response = await self._post_with_retry(
            f"{self._base_url}/api/embeddings",
            {"model": self.model_name, "prompt": text},
        )
        payload = response.json()
        vector = payload.get("embedding") or (payload.get("embeddings", [None])[0])

        if not isinstance(vector, list):
            raise ValueError("Invalid embedding response")

        result = [float(v) for v in vector]
        self._cache[text] = result
        return result

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        response = await self._post_with_retry(
            f"{self._base_url}/api/embed",
            {"model": self.model_name, "input": texts},
        )
        payload = response.json()
        vectors = payload.get("embeddings")
        if not isinstance(vectors, list):
            raise ValueError("Invalid embedding response")
        return [[float(v) for v in vec] for vec in vectors]


class OpenAiCompatibleEmbeddingClient(BaseEmbeddingClient):
    def __init__(self, settings: Settings, timeout_seconds: float = 120.0):
        self.provider_key = "openai-compatible"
        self.provider_name = settings.ai_provider_name
        self.model_name = settings.third_party_embedding_model
        self._base_url = settings.third_party_base_url.rstrip("/")
        self._api_key = settings.third_party_api_key.strip()
        self._client = httpx.AsyncClient(timeout=timeout_seconds)
        self._cache: dict[str, list[float]] = {}

        if not self._api_key:
            raise ValueError("THIRD_PARTY_API_KEY is required when AI_PROVIDER_MODE=openai-compatible")

    async def close(self) -> None:
        await self._client.aclose()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    async def embed(self, text: str) -> list[float]:
        if text in self._cache:
            return self._cache[text]

        response = await self._client.post(
            f"{self._base_url}/embeddings",
            headers=self._headers(),
            json={"model": self.model_name, "input": text},
        )
        response.raise_for_status()
        payload = response.json()
        vector = (((payload.get("data") or [{}])[0]).get("embedding")) if isinstance(payload, dict) else None

        if not isinstance(vector, list):
            raise ValueError("Invalid embedding response")

        result = [float(v) for v in vector]
        self._cache[text] = result
        return result

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        response = await self._client.post(
            f"{self._base_url}/embeddings",
            headers=self._headers(),
            json={"model": self.model_name, "input": texts},
        )
        response.raise_for_status()
        payload = response.json()
        rows = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(rows, list):
            raise ValueError("Invalid embedding response")
        return [[float(v) for v in row.get("embedding", [])] for row in rows]


def build_embedding_client(settings: Settings) -> BaseEmbeddingClient:
    mode = settings.ai_provider_mode.strip().lower()
    if mode == "ollama":
        return OllamaEmbeddingClient(settings)
    if mode in {"openai-compatible", "third-party", "api"}:
        return OpenAiCompatibleEmbeddingClient(settings)
    raise ValueError(f"Unsupported AI_PROVIDER_MODE: {settings.ai_provider_mode}")
