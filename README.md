# wisebot-rag
Enterprise AI Assistant using RAG (Retrieval-Augmented Generation) with React, Spring Boot, and Python. Supports document-based question answering with local LLM deployment.

## Docker

The repo now includes a full `docker-compose.yml` for:

- `frontend`
- `api-gateway`
- `user-service`
- `document-service`
- `chat-service`
- `widget-service`
- `billing-service`
- `embedding-service`
- `ai-service`
- `postgres`
- `qdrant`
- `ollama`

### Start

1. Copy `.env.docker.example` to `.env` if you want to override defaults.
2. Build and start:

```bash
docker compose up --build -d
```

3. Pull the Ollama models used by the stack:

```bash
docker exec -it wisebot-ollama ollama pull llama3:latest
docker exec -it wisebot-ollama ollama pull nomic-embed-text
```

### Access

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:9000`
- Qdrant: `http://localhost:6333`
- Ollama: `http://localhost:11434`

### Notes

- Postgres is initialized with separate databases for each service.
- Uploaded documents are stored in the `uploads_data` Docker volume.
- `frontend` runs the Vite dev server inside Docker and proxies `/api` to `api-gateway`.
- If you want to use a third-party LLM instead of Ollama, set `AI_PROVIDER_MODE=openai-compatible` in `.env`.
