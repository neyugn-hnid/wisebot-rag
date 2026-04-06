---
name: exception-auth-entrypoint
description: 'Use when: tao ErrorResponse, custom exception, AuthEntryPoint. Keywords: error response, exception handling, unauthorized.'
argument-hint: 'Danh sach exception can tao'
---

# Exception Handling + Auth Entry Point

## When to Use
- Can response loi thong nhat
- Can custom auth entry point

## Procedure
1. Tao `ErrorResponse` (timestamp, status, path, error, message).
2. Tao custom exceptions (vd: ForBiddenException).
3. Tao `CustomAuthEntryPoint` de tra JSON loi 401.
4. Dung trong `SecurityConfig.exceptionHandling`.

## Output Checklist
- Loi auth tra JSON theo mau
- Exceptions co thong diep ro rang
