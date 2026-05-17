# Wisebot RAG

Wisebot RAG is an enterprise AI assistant built with React, Spring Boot, FastAPI, PostgreSQL, Qdrant, and Ollama.

It supports:
- user authentication and role-based access
- knowledge base and document management
- retrieval-augmented generation
- local or API-based AI providers
- local or API-based embedding providers

## Quick start

### Prerequisites

- Docker Desktop
- 8GB+ RAM recommended

### 1. Configure environment

Use the root [.env](C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/.env).

Minimum important values:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

JWT_ACCESS_KEY=...
JWT_REFRESH_KEY=...

SERVICE_JWT_SECRET=...
SERVICE_JWT_AUDIENCE=

AI_PROVIDER_MODE=ollama
OLLAMA_LLM_MODEL=llama3:latest
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

If you do not explicitly need audience validation, keep:

```env
SERVICE_JWT_AUDIENCE=
```

### 2. Start the stack

```bash
docker compose up --build -d
```

### 3. Pull Ollama models

```bash
docker exec -it wisebot-ollama ollama pull llama3:latest
docker exec -it wisebot-ollama ollama pull nomic-embed-text
```

### 4. Open the app

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:9000`

## Services

| Service | Port | Responsibility |
| --- | --- | --- |
| `frontend` | `3000` | Admin and user UI |
| `api-gateway` | `9000` | Public API gateway |
| `user-service` | `8080` | Auth, users, roles |
| `document-service` | `8081` | Knowledge bases and documents |
| `chat-service` | `8082` | Chat orchestration and RAG flow |
| `widget-service` | `8084` | Widget APIs |
| `billing-service` | `8085` | Billing |
| `embedding-service` | `8001` | Embedding generation and vector search |
| `ai-service` | `8002` | LLM answer generation |
| `postgres` | `5432` | Relational storage |
| `qdrant` | `6333` | Vector storage |
| `ollama` | `11434` | Local model runtime |

## Architecture

High-level flow:

1. `frontend` sends requests to `api-gateway`.
2. `api-gateway` validates user JWTs and forwards requests.
3. `document-service` manages files and knowledge bases.
4. `embedding-service` creates and searches vectors in Qdrant.
5. `chat-service` coordinates retrieval and answer generation.
6. `ai-service` generates the final answer.

## AI and embedding modes

### AI provider mode

`ai-service` supports:
- `ollama`
- `openai-compatible`

### Embedding provider mode

`embedding-service` supports:
- local embeddings via Ollama
- external OpenAI-compatible embeddings

If you change embedding provider or model, rebuild embeddings for affected knowledge bases.

## Running only selected services

To rebuild the AI-related part of the stack:

```bash
docker compose up -d --build document-service chat-service embedding-service ai-service
```

To stop everything:

```bash
docker compose down
```

## Local development

You can also run services outside Docker.

Recommended startup order:

1. `postgres`
2. `qdrant`
3. `ollama`
4. `user-service`
5. `embedding-service`
6. `ai-service`
7. `document-service`
8. `chat-service`
9. `api-gateway`
10. `frontend`

### Java services

Run with profile:

```env
SPRING_PROFILES_ACTIVE=dev
```

For internal service auth, at minimum set these in local run configs for:
- `chat-service`
- `document-service`

```env
SERVICE_JWT_SECRET=...
SERVICE_JWT_AUDIENCE=
```

### Python services

Example setup:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

Use:
- [embedding-service/.env](C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/embedding-service/.env)
- [ai-service/.env](C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/ai-service/.env)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Important auth note

This repo uses two different JWT categories:

- `JWT_ACCESS_KEY` and `JWT_REFRESH_KEY` for user auth
- `SERVICE_JWT_SECRET` for service-to-service auth

Internal JWT settings must match across:
- `chat-service`
- `document-service`
- `embedding-service`
- `ai-service`

## Common issues

### `401 Unauthorized` on `/v1/provider`

Usually caused by internal JWT mismatch.

Check:
- `SERVICE_JWT_SECRET` is the same in all internal services
- `SERVICE_JWT_AUDIENCE` is empty everywhere, or the same everywhere
- local IntelliJ run configs are not overriding env values
- Docker containers were rebuilt after env changes

### `Signature verification failed`

Usually means services are not using the same `SERVICE_JWT_SECRET`.

### `Token is missing the "aud" claim`

Usually means one service expects `aud` and the caller is not sending it.

If you do not need audience validation:

```env
SERVICE_JWT_AUDIENCE=
```

then restart affected services.

### Search quality dropped after changing embedding model

Rebuild embeddings for the affected knowledge base.

## Repo structure

```text
frontend/
api-gateway/
user-service/
document-service/
chat-service/
widget-service/
billing-service/
embedding-service/
ai-service/
docker/
docker-compose.yml
```

## Additional docs

- [ai-service/README.md](C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/ai-service/README.md)

---

# Wisebot RAG - Bản tiếng Việt

Wisebot RAG là hệ thống trợ lý AI doanh nghiệp được xây dựng bằng React, Spring Boot, FastAPI, PostgreSQL, Qdrant và Ollama.

Hệ thống hỗ trợ:
- xác thực người dùng và phân quyền
- quản lý knowledge base và tài liệu
- hỏi đáp theo mô hình RAG
- chuyển đổi giữa AI local và AI qua API
- chuyển đổi giữa embedding local và embedding qua API

## Bắt đầu nhanh

### Điều kiện cần

- Docker Desktop
- Khuyến nghị RAM từ 8GB trở lên

### 1. Cấu hình môi trường

Sử dụng file [.env](C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/.env) ở thư mục gốc.

Các biến quan trọng tối thiểu:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

JWT_ACCESS_KEY=...
JWT_REFRESH_KEY=...

SERVICE_JWT_SECRET=...
SERVICE_JWT_AUDIENCE=

AI_PROVIDER_MODE=ollama
OLLAMA_LLM_MODEL=llama3:latest
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Nếu bạn không cần kiểm tra audience cho JWT nội bộ, hãy giữ:

```env
SERVICE_JWT_AUDIENCE=
```

### 2. Khởi động toàn bộ hệ thống

```bash
docker compose up --build -d
```

### 3. Tải model cho Ollama

```bash
docker exec -it wisebot-ollama ollama pull llama3:latest
docker exec -it wisebot-ollama ollama pull nomic-embed-text
```

### 4. Truy cập ứng dụng

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:9000`

## Các service

| Service | Port | Chức năng |
| --- | --- | --- |
| `frontend` | `3000` | Giao diện quản trị và người dùng |
| `api-gateway` | `9000` | Cổng API public |
| `user-service` | `8080` | Xác thực, người dùng, phân quyền |
| `document-service` | `8081` | Knowledge base và tài liệu |
| `chat-service` | `8082` | Điều phối chat và luồng RAG |
| `widget-service` | `8084` | API cho widget |
| `billing-service` | `8085` | Thanh toán và gói dịch vụ |
| `embedding-service` | `8001` | Sinh embedding và vector search |
| `ai-service` | `8002` | Sinh câu trả lời từ LLM |
| `postgres` | `5432` | Cơ sở dữ liệu quan hệ |
| `qdrant` | `6333` | Cơ sở dữ liệu vector |
| `ollama` | `11434` | Runtime model local |

## Kiến trúc

Luồng tổng quát:

1. `frontend` gửi request đến `api-gateway`.
2. `api-gateway` kiểm tra user JWT rồi chuyển tiếp request.
3. `document-service` quản lý file và knowledge base.
4. `embedding-service` tạo vector và tìm kiếm trong Qdrant.
5. `chat-service` điều phối truy xuất dữ liệu và sinh câu trả lời.
6. `ai-service` tạo câu trả lời cuối cùng.

## Chế độ AI và embedding

### AI provider mode

`ai-service` hỗ trợ:
- `ollama`
- `openai-compatible`

### Embedding provider mode

`embedding-service` hỗ trợ:
- embedding local qua Ollama
- embedding qua API OpenAI-compatible

Nếu đổi provider hoặc model embedding, cần rebuild embedding cho knowledge base liên quan.

## Chạy riêng một phần hệ thống

Để build lại nhóm service liên quan đến AI:

```bash
docker compose up -d --build document-service chat-service embedding-service ai-service
```

Để dừng toàn bộ:

```bash
docker compose down
```

## Phát triển local

Bạn có thể chạy từng service ngoài Docker.

Thứ tự khởi động khuyến nghị:

1. `postgres`
2. `qdrant`
3. `ollama`
4. `user-service`
5. `embedding-service`
6. `ai-service`
7. `document-service`
8. `chat-service`
9. `api-gateway`
10. `frontend`

### Java services

Chạy với profile:

```env
SPRING_PROFILES_ACTIVE=dev
```

Với các service gọi API nội bộ, tối thiểu cần set trong run config:
- `chat-service`
- `document-service`

```env
SERVICE_JWT_SECRET=...
SERVICE_JWT_AUDIENCE=
```

### Python services

Ví dụ thiết lập:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

Sử dụng:
- [embedding-service/.env](C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/embedding-service/.env)
- [ai-service/.env](C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/ai-service/.env)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Lưu ý quan trọng về auth

Repo này dùng 2 loại JWT khác nhau:

- `JWT_ACCESS_KEY` và `JWT_REFRESH_KEY` cho xác thực người dùng
- `SERVICE_JWT_SECRET` cho xác thực giữa các service

Cấu hình JWT nội bộ phải đồng bộ giữa:
- `chat-service`
- `document-service`
- `embedding-service`
- `ai-service`

## Các lỗi thường gặp

### `401 Unauthorized` tại `/v1/provider`

Thường do JWT nội bộ bị lệch.

Cần kiểm tra:
- `SERVICE_JWT_SECRET` có giống nhau ở tất cả internal service không
- `SERVICE_JWT_AUDIENCE` có đang để rỗng ở mọi nơi, hoặc cùng một giá trị ở mọi nơi không
- run config trong IntelliJ có đang ghi đè env không
- container Docker đã được build lại sau khi đổi env chưa

### `Signature verification failed`

Thường là service gọi và service nhận không dùng cùng `SERVICE_JWT_SECRET`.

### `Token is missing the "aud" claim`

Thường là một service đang yêu cầu `aud`, nhưng service gọi không gửi claim này.

Nếu không cần verify audience:

```env
SERVICE_JWT_AUDIENCE=
```

sau đó restart các service liên quan.

### Chất lượng search giảm sau khi đổi embedding model

Cần rebuild embedding cho knowledge base tương ứng.

## Cấu trúc repo

```text
frontend/
api-gateway/
user-service/
document-service/
chat-service/
widget-service/
billing-service/
embedding-service/
ai-service/
docker/
docker-compose.yml
```

## Tài liệu thêm

- [ai-service/README.md](C:/Users/VanDinh/OneDrive/Máy tính/ĐATN/ai-service/README.md)
