import json

import httpx


class OllamaClient:
    def __init__(self, base_url, llm_model, embedding_model, timeout_seconds=180.0):
        self._base_url = base_url.rstrip("/")
        self._llm_model = llm_model
        self._embedding_model = embedding_model
        self._client = httpx.AsyncClient(timeout=timeout_seconds)
        self._embed_cache = {}

    async def close(self):
        await self._client.aclose()

    async def _post(self, url, json, retries=3):
        import asyncio
        for i in range(retries):
            try:
                res = await self._client.post(url, json=json)
                res.raise_for_status()
                return res
            except Exception:
                if i == retries - 1:
                    raise
                await asyncio.sleep(0.3 * (i + 1))

    async def embed(self, text: str) -> list[float]:
        if text in self._embed_cache:
            return self._embed_cache[text]

        res = await self._post(
            f"{self._base_url}/api/embeddings",
            {"model": self._embedding_model, "prompt": text},
        )

        payload = res.json()
        vector = payload.get("embedding") or payload.get("embeddings", [None])[0]

        if not isinstance(vector, list):
            raise ValueError("Invalid embedding response")

        result = [float(v) for v in vector]
        self._embed_cache[text] = result
        return result

    async def chat(self, system_prompt, user_prompt, temperature):
        payload = {
            "model": self._llm_model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "options": {"temperature": temperature},
        }

        res = await self._post(f"{self._base_url}/api/chat", payload)
        return res.json()

    async def chat_stream(self, system_prompt, user_prompt, temperature):
        payload = {
            "model": self._llm_model,
            "stream": True,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "options": {"temperature": temperature},
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


def ensure_dimension(vector: list[float], target_dim: int) -> list[float]:
    current_dim = len(vector)
    if current_dim == target_dim:
        return vector
    if current_dim > target_dim:
        return vector[:target_dim]
    return vector + [0.0] * (target_dim - current_dim)


def vector_to_literal(vector: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vector) + "]"