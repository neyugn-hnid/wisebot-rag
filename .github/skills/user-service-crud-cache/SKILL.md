---
name: user-service-crud-cache
description: 'Use when: tao user service CRUD + cache. Keywords: service, cache, pagination, sorting.'
argument-hint: 'Use cases CRUD + cache key'
---

# User Service CRUD + Cache

## When to Use
- Can logic user CRUD, pagination, sort, cache

## Procedure
1. Dung `PageRequest` + `Sort.Order` tu `AppUtils.getSortOrder`.
2. Search keyword voi repository query, fallback findAll.
3. Dung `@Cacheable` cho getById/profile.
4. Dung `@CacheEvict` cho update/change.
5. Throw `ResourceNotFoundException`/`InvalidDataException` khi sai du lieu.

## Output Checklist
- Co cache key ro rang
- Update evict cache
- Response map qua mapper
