# AI Service (FastAPI)

Port: `8002`

## Features

- RAG pipeline for Q&A
- Query embedding via Ollama embedding model
- Vector retrieval from `embedding_service.embeddings`
- Answer generation via local Ollama `gemma4`
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

## Database migration (Alembic)

```bash
copy .env.example .env
alembic upgrade head
```

- Alembic reads `DATABASE_URL` from environment.
- The initial migration creates schema `ai_service` and required tables/indexes.

## Required models in Ollama

```bash
ollama pull gemma4
ollama pull nomic-embed-text
```

## Key endpoints

- `GET /health`
- `POST /v1/rag/ask`
- `POST /v1/rag/stream`
- `GET /v1/rag/requests/{request_id}`

## Auth

- All endpoints except `/health` require `Authorization: Bearer <service-jwt>` when `AUTH_ENABLED=true`.
