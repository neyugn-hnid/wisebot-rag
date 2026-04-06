---
name: redis-rate-limit-audit
description: 'Use when: them Redis cache, rate limit, audit log. Keywords: redis config, cache ttl, rate limiting filter, audit filter.'
argument-hint: 'Thong so redis + rate limit'
---

# Redis Cache + Rate Limit + Audit

## When to Use
- Can cache/limit/audit theo mau user-service

## Procedure
1. Cau hinh Redis trong application.yml (host, port, timeout).
2. Tao `RedisConfig` + `RedisFeatureProperties`.
3. Tao `RateLimitingFilter` (prefix `rate:ip:`) va them vao filter chain.
4. Tao `AuditLoggingFilter` neu can luu log vao Redis/DB.
5. Cau hinh `app.redis.*` (limit, window, audit, cache).

## Output Checklist
- Filter duoc add vao SecurityFilterChain
- Co TTL cho cache
