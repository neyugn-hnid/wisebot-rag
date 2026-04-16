import httpx
import json
from collections.abc import AsyncIterator


class OllamaClient:
    def __init__(
        self,
        base_url: str,
        llm_model: str,
        embedding_model: str,
        timeout_seconds: float = 180.0,
    ):
        self._base_url = base_url.rstrip("/")
        self._llm_model = llm_model
        self._embedding_model = embedding_model
        self._timeout = timeout_seconds

    async def embed(self, text: str) -> list[float]:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self._base_url}/api/embeddings",
                json={"model": self._embedding_model, "prompt": text},
            )
            response.raise_for_status()
            payload = response.json()

        vector = payload.get("embedding")
        if vector is None and isinstance(payload.get("embeddings"), list):
            embeddings = payload["embeddings"]
            vector = embeddings[0] if embeddings else None

        if not isinstance(vector, list):
            raise ValueError("Invalid embedding response from Ollama")

        return [float(v) for v in vector]

    async def chat(self, system_prompt: str, user_prompt: str, temperature: float) -> dict:
        payload = {
            "model": self._llm_model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "options": {"temperature": temperature},
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(f"{self._base_url}/api/chat", json=payload)
            response.raise_for_status()
            return response.json()

    async def chat_stream(self, system_prompt: str, user_prompt: str, temperature: float) -> AsyncIterator[dict]:
        payload = {
            "model": self._llm_model,
            "stream": True,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "options": {"temperature": temperature},
        }

        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", f"{self._base_url}/api/chat", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    item = json.loads(line)
                    if isinstance(item, dict):
                        yield item


def ensure_dimension(vector: list[float], target_dim: int) -> list[float]:
    current_dim = len(vector)
    if current_dim == target_dim:
        return vector
    if current_dim > target_dim:
        return vector[:target_dim]
    return vector + [0.0] * (target_dim - current_dim)


def vector_to_literal(vector: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vector) + "]"
