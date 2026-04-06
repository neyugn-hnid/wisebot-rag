---
name: document-entity-metadata
description: 'Use when: tao entity luu metadata document. Keywords: document entity, metadata, storage key.'
argument-hint: 'Truong metadata can luu'
---

# Document Entity Metadata

## When to Use
- Can luu metadata file vao DB

## Procedure
1. Tao entity `Document` voi UUID id.
2. Field goi y: filename, contentType, size, storageKey, createdAt.
3. Dung `@CreationTimestamp` cho createdAt.

## Output Checklist
- Entity co cac truong metadata can thiet
