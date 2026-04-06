---
name: dto-validation-patterns
description: 'Use when: tao DTO request/response + validation. Keywords: dto, request, response, validation, @Valid.'
argument-hint: 'Danh sach request/response can tao'
---

# DTO + Validation Patterns

## When to Use
- Tao request/response theo mau Register/Login/ChangePassword/UserUpdate

## Procedure
1. Request DTO co `@NotBlank`, `@Email`, `@Pattern`, `@Size` theo yeu cau.
2. Dung `@JsonAlias` neu 1 field nhan nhieu ten.
3. Response DTO dung `@Builder` neu can.
4. Controller dung `@Valid` de kich hoat validation.

## Output Checklist
- DTO co message ro rang
- Response chi chua data can thiet
