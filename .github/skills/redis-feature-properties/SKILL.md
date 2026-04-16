---
name: redis-feature-properties
description: 'Use when: tao properties cho redis features. Keywords: configurationproperties, jwt blacklist, rate limit, audit, cache.'
argument-hint: 'Danh sach feature + default'
---

# Redis Feature Properties

## When to Use
- Can bind `app.redis.*` tu application.yml

## Procedure
1. Tao class `@ConfigurationProperties(prefix = "app.redis")`.
2. Tao nested classes: JwtBlacklist, RateLimit, Audit, Cache.
3. Dat default value hop ly (enabled, prefix, ttl, limit).
4. Enable trong config voi `@EnableConfigurationProperties`.

## Output Checklist
- Properties chia nho ro rang
- Co default values
