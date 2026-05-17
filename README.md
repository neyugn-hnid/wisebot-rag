# Wisebot RAG

Enterprise AI assistant built with RAG (Retrieval-Augmented Generation) on top of React, Spring Boot, FastAPI, PostgreSQL, Qdrant, and Ollama.

The system supports:
- User authentication and role-based access
- Knowledge base and document management
- Embedding generation and vector search
- AI answer generation with switchable provider mode
- Admin settings for AI and embedding providers
- Widget/API integration paths for external usage

## Architecture

### Main services

| Service | Port | Stack | Responsibility |
| --- | --- | --- | --- |
| `frontend` | `3000` | React + Vite | Admin/user UI |
| `api-gateway` | `9000` | Spring Boot | Public API gateway and JWT validation |
| `user-service` | `8080` | Spring Boot | Auth, users, roles, internal system settings |
| `document-service` | `8081` | Spring Boot | Knowledge bases, documents, uploads |
| `chat-service` | `8082` | Spring Boot | Chat sessions, RAG orchestration, provider settings bridge |
| `widget-service` | `8084` | Spring Boot | Widget-facing APIs |
| `billing-service` | `8085` | Spring Boot | Billing and entitlement flow |
| `embedding-service` | `8001` | FastAPI | Embedding generation, indexing, vector search |
| `ai-service` | `8002` | FastAPI | LLM answer generation and provider switching |
| `postgres` | `5432` | PostgreSQL | Persistent storage |
| `qdrant` | `6333` | Qdrant | Vector database |
| `ollama` | `11434` | Ollama | Local LLM and embedding runtime |

### High-level request flow

1. User logs in through `frontend`.
2. `frontend` sends requests to `api-gateway`.
3. `api-gateway` validates user JWT and forwards requests to downstream Java services.
4. `document-service` manages uploaded files and knowledge-base metadata.
5. `embedding-service` creates vectors and stores/searches them in Qdrant.
6. `chat-service` coordinates RAG requests.
7. `ai-service` retrieves relevant context and generates the final answer.

## Repository layout

```text
frontend/             React application
api-gateway/          Spring Cloud Gateway
user-service/         User/auth service
document-service/     Knowledge base and document service
chat-service/         Chat and RAG orchestration service
widget-service/       Widget APIs
billing-service/      Billing service
embedding-service/    Python embedding service
ai-service/           Python LLM service
docker/               Docker build/init files
docker-compose.yml    Full local stack
```

## Core concepts

### AI provider mode

`ai-service` supports:
- `ollama`: local model via Ollama
- `openai-compatible`: external API such as DeepSeek/OpenAI-compatible providers

Admin users can switch the active answer-generation mode from the settings page.

### Embedding provider mode

`embedding-service` supports:
- local embeddings via Ollama
- external OpenAI-compatible embeddings

If the embedding provider or model changes, rebuild embeddings for affected knowledge bases to avoid vector-space mismatch.

## Environment variables

### Root `.env`

The root `.env` is primarily used by Docker Compose.

Important keys:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

JWT_ACCESS_KEY=...
JWT_REFRESH_KEY=...

SERVICE_JWT_SECRET=...
SERVICE_JWT_AUDIENCE=

INTERNAL_API_KEY=wisebot-internal-key
INTERNAL_CONFIG_API_KEY=change-me

AI_PROVIDER_MODE=ollama
OLLAMA_LLM_MODEL=llama3:latest
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSION=1536

THIRD_PARTY_BASE_URL=https://api.openai.com/v1
THIRD_PARTY_API_KEY=
THIRD_PARTY_LLM_MODEL=gpt-4o-mini
THIRD_PARTY_EMBEDDING_MODEL=text-embedding-3-small
```

### JWT keys used in this repo

- `JWT_ACCESS_KEY`: user-facing access token signing key
- `JWT_REFRESH_KEY`: user-facing refresh token signing key
- `SERVICE_JWT_SECRET`: internal service-to-service JWT signing key
- `SERVICE_JWT_AUDIENCE`: optional audience claim for internal JWTs; keep empty unless every internal service is configured to verify the same audience

### Important auth note

Internal Java services call Python services using service JWTs, not user JWTs.

For local development, keep these aligned:
- `chat-service`
- `document-service`
- `embedding-service`
- `ai-service`

They must share the same `SERVICE_JWT_SECRET`.

If you do not explicitly need audience validation, keep:

```env
SERVICE_JWT_AUDIENCE=
```

## Running with Docker

### Prerequisites

- Docker Desktop
- Enough RAM for Java services, Qdrant, PostgreSQL, and Ollama

### Start the full stack

```bash
docker compose up --build -d
```

### Pull local Ollama models

```bash
docker exec -it wisebot-ollama ollama pull llama3:latest
docker exec -it wisebot-ollama ollama pull nomic-embed-text
```

### Rebuild only the AI-related services

```bash
docker compose up -d --build document-service chat-service embedding-service ai-service
```

### Stop the stack

```bash
docker compose down
```

### Access

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:9000`
- User service: `http://localhost:8080`
- Document service: `http://localhost:8081`
- Chat service: `http://localhost:8082`
- Widget service: `http://localhost:8084`
- Billing service: `http://localhost:8085`
- Embedding service: `http://localhost:8001`
- AI service: `http://localhost:8002`
- PostgreSQL: `localhost:5432`
- Qdrant: `http://localhost:6333`
- Ollama: `http://localhost:11434`

### Docker notes

- Docker Compose reads the root `.env`.
- `frontend` runs through Vite and targets `api-gateway`.
- PostgreSQL is initialized with multiple logical databases for the services.
- Uploaded files are stored in the `uploads_data` volume.
- Qdrant data is stored in the `qdrant_data` volume.

## Running locally without Docker

This repo can also be run service-by-service from IntelliJ and Python shells.

### Recommended order

1. Start `postgres`
2. Start `qdrant`
3. Start `ollama`
4. Start `user-service`
5. Start `embedding-service`
6. Start `ai-service`
7. Start `document-service`
8. Start `chat-service`
9. Start `api-gateway`
10. Start `frontend`

### Java services

Most Java services are Spring Boot applications and can be run from IntelliJ.

Recommended profile:

```env
SPRING_PROFILES_ACTIVE=dev
```

For services that call Python/internal endpoints, set:

```env
SERVICE_JWT_SECRET=...
SERVICE_JWT_AUDIENCE=
```

At minimum this applies to:
- `chat-service`
- `document-service`

### Python services

For both Python services:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Run:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

Use the service-local `.env` files:
- `embedding-service/.env`
- `ai-service/.env`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

By default Vite proxies API calls to `http://localhost:9000`.

## Database and vector storage

### PostgreSQL

The project uses PostgreSQL for:
- users and auth
- chat sessions and messages
- documents and knowledge bases
- billing
- AI request logging and metadata

### Qdrant

Qdrant stores vector embeddings used by the RAG flow.

If embedding mode/model changes:
- rebuild affected embeddings
- reprocess relevant documents

## Admin settings

The settings page in the frontend includes:
- AI provider mode switching
- embedding provider mode switching
- rebuild/reprocess actions for knowledge bases

These actions depend on successful internal service JWT validation between:
- `chat-service` and `ai-service`
- `chat-service` and `embedding-service`
- `document-service` and `embedding-service`

## Common issues

### `401 Unauthorized` on `/v1/provider`

Usually caused by internal service JWT mismatch.

Check:
- `SERVICE_JWT_SECRET` is identical in all relevant services
- `SERVICE_JWT_AUDIENCE` is either empty everywhere or the same everywhere
- local IntelliJ run configs are not overriding values unexpectedly
- Docker containers were rebuilt after env changes

### `Signature verification failed`

Usually means the calling service and called service do not share the same `SERVICE_JWT_SECRET`.

### `Token is missing the "aud" claim`

Usually means one service is verifying audience while the caller is not sending `aud`.

If you do not need audience validation, set:

```env
SERVICE_JWT_AUDIENCE=
```

for all internal services and restart them.

### Low search quality after changing embedding model

Rebuild embeddings for the affected knowledge base. Old vectors and new query vectors may no longer live in the same vector space.

### Ollama model not found

Pull the required models:

```bash
ollama pull llama3:latest
ollama pull nomic-embed-text
```

## Development notes

- Prefer Docker when bringing up the full stack quickly.
- Prefer IntelliJ + local Python when debugging individual services.
- `chat-service` and `document-service` now generate internal JWTs using `SERVICE_JWT_SECRET` and optional `SERVICE_JWT_AUDIENCE`.
- The API gateway validates user JWTs separately from internal service JWTs.

## Service-specific docs

Additional details exist in service-local READMEs where present:
- [ai-service/README.md](C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/ai-service/README.md)
- `embedding-service/README.md`

## Current status

The repository includes both local-model and external-provider paths, plus admin-facing runtime switching. For stable local development, the safest baseline is:

```env
AI_PROVIDER_MODE=ollama
SERVICE_JWT_AUDIENCE=
```
