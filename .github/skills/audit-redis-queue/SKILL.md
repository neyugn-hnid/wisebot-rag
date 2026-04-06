---
name: audit-redis-queue
description: 'Use when: audit log qua Redis queue + consumer. Keywords: audit log, redis list, scheduled consumer.'
argument-hint: 'Cau hinh audit + batch size'
---

# Audit Redis Queue + Consumer

## When to Use
- Can audit HTTP request va luu vao Redis/DB

## Procedure
1. Filter ghi `AuditLogEntry` sau khi response.
2. `RedisAuditLogService` push JSON vao Redis list.
3. Consumer `@Scheduled` drain queue -> map -> save DB.
4. Enable/disable qua `app.redis.audit.*`.

## Output Checklist
- Audit khong lam crash request
- Consumer batch size ro rang
