---
name: auth-jwt-redis
description: 'Use when: them JWT auth + Redis blacklist. Keywords: jwt filter, security config, redis blacklist, token validation.'
argument-hint: 'Cac endpoint public + thong so JWT'
---

# JWT Authentication + Redis Blacklist

## When to Use
- Can JWT auth cho service moi
- Can logout/revoke token bang Redis

## Procedure
1. Tao `JWTAuthenticationFilter` (OncePerRequestFilter) kiem tra token, blacklist, set SecurityContext.
2. Tao `SecurityConfig` de add filter, set whitelist, stateless session.
3. Dinh nghia `JwtService` (extract userId, validate token, expiry).
4. Tao `JwtBlacklistService` dung Redis (prefix `jwt:bl:`).
5. Cau hinh `jwt.*` trong application.yml.

## Output Checklist
- JWT filter bypass whitelist endpoints
- Blacklist check truoc khi set auth
- SecurityConfig dung `DaoAuthenticationProvider`
