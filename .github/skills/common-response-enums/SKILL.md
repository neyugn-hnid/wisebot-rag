---
name: common-response-enums
description: 'Use when: tao common response + enums. Keywords: ApiResponse, ErrorResponse, TokenResponse, enums.'
argument-hint: 'Danh sach response/enums'
---

# Common Response + Enums

## When to Use
- Can response chung va enum dung xuyen service

## Procedure
1. Tao `ApiResponse` (status, message, data) voi `@Builder`.
2. Tao `ErrorResponse` cho loi HTTP.
3. Tao `TokenResponse` cho login.
4. Tao enums cho RoleName, UserStatus, InviteStatus, TenantPlan.

## Output Checklist
- Response Serializable
- Enum dung `EnumType.STRING`
