# Embedding Service (FastAPI)

Port: `8001`

## Features

- Parse document files (`.txt`, `.pdf`, `.docx`)
- Chunk text with overlap
- Generate embeddings via local Ollama
- Index vectors into PostgreSQL `pgvector`
- Semantic search API
- Backward-compatible `/embed` endpoint for `document-service`
- Service-to-service JWT authentication

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Database migration (Alembic)

```bash
copy .env.example .env
alembic upgrade head
```

- Alembic reads `DATABASE_URL` from environment.
- The initial migration creates schema `embedding_service`, tables, and indexes.
- It also ensures extension `vector` is enabled.

## Required models in Ollama

```bash
ollama pull gemma4
ollama pull nomic-embed-text
```

## Key endpoints

- `GET /health`
- `POST /embed` (for `document-service` callback contract)
- `POST /v1/collections`
- `POST /v1/index/text`
- `POST /v1/index/file` (multipart)
- `POST /v1/search`
- `GET /v1/jobs/{job_id}`

## Auth

- All endpoints except `/health` require `Authorization: Bearer <service-jwt>` when `AUTH_ENABLED=true`.
