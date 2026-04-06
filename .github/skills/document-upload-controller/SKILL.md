---
name: document-upload-controller
description: 'Use when: tao REST controller upload/download file. Keywords: document, upload, download, multipart.'
argument-hint: 'Danh sach endpoint upload/download'
---

# Document Upload/Download Controller

## When to Use
- Can endpoint upload file va download file

## Procedure
1. Dinh nghia `@RestController` + `@RequestMapping`.
2. Dung `@PostMapping` voi `MultipartFile` cho upload.
3. Dung `@GetMapping` voi id hoac key cho download.
4. Tra `ApiResponse` hoac `ResponseEntity<Resource>`.

## Output Checklist
- Upload validate file size/type neu can
- Download set content-type
