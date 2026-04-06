---
name: redis-cache-config
description: 'Use when: cau hinh RedisTemplate + CacheManager. Keywords: redis, cache, ttl, serializer.'
argument-hint: 'Danh sach cache + ttl'
---

# Redis Cache Config

## When to Use
- Can RedisTemplate va CacheManager voi TTL

## Procedure
1. Tao `RedisTemplate<String, Object>` voi StringRedisSerializer + Jackson serializer.
2. Tao `CacheManager` tu `RedisCacheManager`.
3. Default TTL tu properties, override theo cacheName.
4. Disable cache neu properties cache.enabled = false.

## Output Checklist
- Serializer dung JSON
- TTL theo tung cache
