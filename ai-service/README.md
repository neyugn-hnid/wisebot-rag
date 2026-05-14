# AI Service (FastAPI)

Port: `8002`

## Features

- RAG pipeline for Q&A
- Works with `ollama` local mode or `openai-compatible` third-party API mode
- Vector retrieval from `embedding_service.embeddings`
- Request tracing and logs in `ai_service` schema
- Service-to-service JWT authentication

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

To persist system-wide AI mode changes made by admins, configure the internal settings bridge:

```env
USER_SERVICE_BASE_URL=http://localhost:8080
SYSTEM_SETTING_MODE_PATH=/internal/system-settings/ai.provider_mode
INTERNAL_CONFIG_API_KEY=change-me
```

## Database migration (Alembic)

```bash
copy .env.example .env
alembic upgrade head
```

- Alembic reads `DATABASE_URL` from environment.
- The initial migration creates schema `ai_service` and required tables/indexes.

## Provider modes

### 1. Local Ollama mode

```env
AI_PROVIDER_MODE=ollama
AI_PROVIDER_NAME=Ollama Local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_LLM_MODEL=llama3:latest
```

Required models:

```bash
ollama pull gemma4
ollama pull nomic-embed-text
```

### 2. Third-party API mode

This mode uses an OpenAI-compatible API. The recommended setup here is DeepSeek.

```env
AI_PROVIDER_MODE=openai-compatible
AI_PROVIDER_NAME=DeepSeek API
THIRD_PARTY_BASE_URL=https://api.deepseek.com
THIRD_PARTY_API_KEY=your_api_key
THIRD_PARTY_LLM_MODEL=deepseek-v4-flash
```

Notes:

- DeepSeek exposes an OpenAI-compatible base URL at `https://api.deepseek.com`.
- Use `deepseek-v4-flash` as the default fast/general model.
- As of 2026-05-14, DeepSeek documents that `deepseek-chat` and `deepseek-reasoner` are legacy names and will be deprecated on 2026-07-24.

## Key endpoints

- `GET /health`
- `GET /v1/provider`
- `POST /v1/rag/ask`
- `POST /v1/rag/stream`
- `GET /v1/rag/requests/{request_id}`

## Auth

- All endpoints except `/health` require `Authorization: Bearer <service-jwt>` when `AUTH_ENABLED=true`.
