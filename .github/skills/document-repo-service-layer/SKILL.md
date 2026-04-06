---
name: document-repo-service-layer
description: 'Use when: tao repository + service cho document. Keywords: document repository, service layer, metadata.'
argument-hint: 'Use cases CRUD document'
---

# Document Repository + Service Layer

## When to Use
- Can CRUD document metadata va tra response

## Procedure
1. Tao `DocumentRepository` extends `JpaRepository`.
2. Tao `DocumentService` + `DocumentServiceImpl`.
3. Method goi y: upload, getById, delete.
4. Throw `ResourceNotFoundException` neu khong tim thay.

## Output Checklist
- Service tach khoi controller
- Repository query co ban
