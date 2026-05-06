# Docker Setup Guide - WiseBot

## Overview

WiseBot là một monorepo chứa nhiều services:
- **API Gateway** (Java 17, Spring Boot) - Port 8080
- **User Service** (Java 17, Spring Boot) - Port 8082
- **Document Service** (Java 17, Spring Boot) - Port 8081
- **Billing Service** (Java 17, Spring Boot) - Port 8083
- **Chat Service** (Java 17, Spring Boot) - Port 8084
- **Widget Service** (Java 17, Spring Boot) - Port 8085
- **AI Service** (Python 3.11, FastAPI) - Port 8001
- **Frontend** (React, Vite) - Port 3000

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 10GB+ disk space

## Quick Start

### 1. Build tất cả images

```bash
docker-compose build
```

### 2. Start tất cả services

```bash
docker-compose up -d
```

### 3. Check status

```bash
docker-compose ps
```

### 4. Stop services

```bash
docker-compose down
```

## Build Individual Services

### Build một service cụ thể

```bash
# API Gateway
docker build -t wisebot-api-gateway ./api-gateway

# User Service
docker build -t wisebot-user-service ./user-service

# AI Service
docker build -t wisebot-ai-service ./ai-service
```

### Run một service cụ thể

```bash
docker run -p 8080:8080 --network host wisebot-api-gateway
```

## Environment Variables

Tạo file `.env` tại root directory:

```env
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=wisebot_database
JWT_ACCESS_KEY=VYW20sDO+am1aOTsq/4Tn48CZ6oEV13ooo51rDrz7AI=
SPRING_PROFILES_ACTIVE=prod
```

## Accessing Services

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **User Service**: http://localhost:8082
- **Document Service**: http://localhost:8081
- **Billing Service**: http://localhost:8083
- **Chat Service**: http://localhost:8084
- **Widget Service**: http://localhost:8085
- **AI Service**: http://localhost:8001
- **PostgreSQL**: localhost:5432

## Docker Image Specifications

### Java Services

- **Base Image**: `eclipse-temurin:17-jre-alpine` (runtime)
- **Builder Image**: `eclipse-temurin:17-jdk-alpine` (build stage)
- **Size**: ~150MB per service
- **Security**: Non-root user (uid 1001)
- **Healthcheck**: Enabled on all Java services

### Python Service (AI)

- **Base Image**: `python:3.11-slim`
- **Size**: ~100MB
- **Security**: Non-root user (appuser)
- **Healthcheck**: Enabled

### Frontend

- **Base Image**: `node:18-alpine`
- **Build Tool**: Vite
- **Development Mode**: Hot reload enabled

## Database Setup

PostgreSQL service tự động khởi tạo database với environment variables:

```yaml
POSTGRES_USER: postgres
POSTGRES_PASSWORD: password
POSTGRES_DB: wisebot_database
```

Flyway migrations chạy tự động khi services khởi động.

## Redis Configuration

Redis service khả dụng tại:

```
Host: redis
Port: 6379
```

Được sử dụng cho:
- JWT Token Blacklist
- Rate Limiting
- Cache
- Audit Logging

## Volume Management

### Persistence

- `postgres_data`: PostgreSQL database
- `uploads_data`: Document service uploads
- `qdrant_data`: AI service embeddings

### Backup volumes

```bash
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Logs

### View logs cho một service

```bash
docker-compose logs user-service
```

### View logs real-time

```bash
docker-compose logs -f api-gateway
```

### View all logs

```bash
docker-compose logs
```

## Debugging

### Access container shell

```bash
docker exec -it wisebot-api-gateway /bin/sh
```

### Check container logs

```bash
docker logs wisebot-user-service
```

### Inspect Docker network

```bash
docker network inspect wisebot_wisebot-network
```

## Performance Tuning

### Optimize Docker build

```bash
# Use buildx for multi-platform builds
docker buildx build --platform linux/amd64 -t wisebot-api-gateway ./api-gateway
```

### Resource Limits

Set resource limits in docker-compose.yml:

```yaml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M
```

## Security Best Practices

1. **Non-root user**: Tất cả containers chạy với non-root user
2. **Health checks**: Đảm bảo services sẵn sàng trước khi receive traffic
3. **.dockerignore**: Minimize build context
4. **Secret management**: Sử dụng environment variables, không hardcode secrets
5. **Image scanning**: Scan images để detect vulnerabilities

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image wisebot-api-gateway
```

## Clean Up

### Remove all containers and volumes

```bash
docker-compose down -v
```

### Remove unused images

```bash
docker image prune -a
```

### Remove all stopped containers

```bash
docker container prune
```

## Troubleshooting

### "No space left on device"

```bash
docker system prune -a
```

### Port conflict

```bash
# Change port mapping in docker-compose.yml
# Or kill process using the port:
lsof -i :8080
kill -9 <PID>
```

### Service connection refused

```bash
# Check if service is running
docker ps

# Check logs
docker logs wisebot-api-gateway

# Check network connectivity
docker exec wisebot-api-gateway ping redis
```

## Advanced Usage

### Multi-stage deployment

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

### CI/CD Integration

Sử dụng GitHub Actions:

```yaml
- name: Build Docker images
  run: docker-compose build

- name: Push to registry
  run: docker push your-registry/wisebot-*:latest
```

## Support

Xem thêm documentation:
- `README.md` - Project overview
- `./api-gateway/README.md` - API Gateway details
- `./user-service/README.md` - User Service details
