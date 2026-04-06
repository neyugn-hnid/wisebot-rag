---
name: rest-controller-apiresponse
description: 'Use when: tao REST controller, ApiResponse, @Operation, @PreAuthorize. Keywords: controller, api response, swagger, auth.'
argument-hint: 'Danh sach endpoint + role/authority'
---

# REST Controller + ApiResponse Pattern

## When to Use
- Tao controller moi theo mau AuthController/UserController
- Can log, swagger annotations, security annotations

## Procedure
1. Dinh nghia `@RestController`, `@RequestMapping`, `@Tag`.
2. Moi endpoint co `@Operation` (summary/description).
3. Dung `@PreAuthorize` theo role/authority can thiet.
4. Dung `ApiResponse.builder()` hoac `TokenResponse` neu login.
5. Lay `UserEntity` tu `Authentication` neu can thong tin user.

## Output Checklist
- Log thong tin request quan trong
- Response theo format ApiResponse
- Swagger doc day du
