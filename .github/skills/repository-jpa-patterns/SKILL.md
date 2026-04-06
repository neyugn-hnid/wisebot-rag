---
name: repository-jpa-patterns
description: 'Use when: tao repository JPA, custom query, existsBy, fetch join. Keywords: repository, jpa, query, fetch join.'
argument-hint: 'Entity + truy van can co'
---

# Repository JPA Patterns

## When to Use
- Tao repository moi cho entity
- Can query custom nhu search keyword, fetch roles

## Procedure
1. Tao interface extends `JpaRepository<Entity, UUID>`.
2. Dung method name query (vd: `existsByEmail`).
3. Dung `@Query` neu can fetch join hoac search keyword.
4. Dung `@Param` ro rang.

## Output Checklist
- Repository co method exists/find
- Query co join fetch neu can load quan he
