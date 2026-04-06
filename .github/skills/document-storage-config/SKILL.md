---
name: document-storage-config
description: 'Use when: cau hinh luu tru file (filesystem/object storage). Keywords: storage config, file path, bucket.'
argument-hint: 'Kieu storage + duong dan/bucket'
---

# Document Storage Config

## When to Use
- Can luu file vao filesystem hoac object storage

## Procedure
1. Tao properties (vd: `storage.type`, `storage.base-path` hoac `storage.bucket`).
2. Tao service luu file va tra `storageKey`.
3. Dung service nay trong upload/download.

## Output Checklist
- Co cau hinh storage ro rang
- Co mapping storageKey -> file
