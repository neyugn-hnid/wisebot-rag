import httpx


class OllamaClient:
    def __init__(self, base_url: str, model: str, timeout_seconds: float = 120.0):
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._client = httpx.AsyncClient(timeout=timeout_seconds)
        self._cache: dict[str, list[float]] = {}

    async def close(self):
        await self._client.aclose()

    async def _post_with_retry(self, url, json, retries=3):
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
        if text in self._cache:
            return self._cache[text]

        res = await self._post_with_retry(
            f"{self._base_url}/api/embeddings",
            {"model": self._model, "prompt": text},
        )
        payload = res.json()

        vector = payload.get("embedding") or (
            payload.get("embeddings", [None])[0]
        )

        if not isinstance(vector, list):
            raise ValueError("Invalid embedding response")

        result = [float(v) for v in vector]
        self._cache[text] = result
        return result

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        res = await self._post_with_retry(
            f"{self._base_url}/api/embed",
            {"model": self._model, "input": texts},
        )
        payload = res.json()

        vectors = payload.get("embeddings")
        if not isinstance(vectors, list):
            raise ValueError("Invalid embedding response")

        return [[float(v) for v in vec] for vec in vectors]


def ensure_dimension(vector: list[float], target_dim: int) -> list[float]:
    current_dim = len(vector)
    if current_dim == target_dim:
        return vector
    if current_dim > target_dim:
        return vector[:target_dim]
    return vector + [0.0] * (target_dim - current_dim)


def vector_to_literal(vector: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vector) + "]"