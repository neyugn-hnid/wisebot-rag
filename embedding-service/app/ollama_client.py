import httpx


class OllamaClient:
    def __init__(self, base_url: str, model: str, timeout_seconds: float = 120.0):
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = timeout_seconds

    async def embed(self, text: str) -> list[float]:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self._base_url}/api/embeddings",
                json={"model": self._model, "prompt": text},
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


def ensure_dimension(vector: list[float], target_dim: int) -> list[float]:
    current_dim = len(vector)
    if current_dim == target_dim:
        return vector

    if current_dim > target_dim:
        return vector[:target_dim]

    return vector + [0.0] * (target_dim - current_dim)


def vector_to_literal(vector: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vector) + "]"
