---
name: service-repo-layer
description: 'Use when: tao service layer + repository + mapper + DTO. Keywords: service impl, repository, mapper, dto validation.'
argument-hint: 'Entity + use cases'
---

# Service/Repository/DTO Layer

## When to Use
- Tao CRUD hoac use-case moi theo mau user-service

## Procedure
1. Tao DTO request/response + validation `@Valid`.
2. Tao Entity (JPA) + Repository.
3. Tao Service interface + Impl, tach logic.
4. Tao Mapper (MapStruct/thu cong) neu can.
5. Dung `ApiResponse` trong controller, khong tra entity truc tiep.

## Output Checklist
- DTO co validation
- Repository dung JPA
- Service impl gom business logic
