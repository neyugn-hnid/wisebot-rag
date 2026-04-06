---
name: security-filter-chain
description: 'Use when: cau hinh SecurityFilterChain, whitelist, filter order. Keywords: security config, filter chain, stateless.'
argument-hint: 'Danh sach endpoint public'
---

# Security Filter Chain

## When to Use
- Can SecurityConfig cho service moi

## Procedure
1. Disable csrf/cors neu can (stateless).
2. Config whitelist endpoints.
3. Set session policy `STATELESS`.
4. Set `authenticationEntryPoint` custom.
5. Add filters: rate limit before, jwt after, audit after.

## Output Checklist
- Stateless auth
- Filter order dung
- Whitelist ro rang
