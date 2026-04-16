---
name: auth-service-flow
description: 'Use when: tao flow login/register/logout/invite. Keywords: auth service, login, register, invite, logout.'
argument-hint: 'Quy tac dang nhap/dang ky'
---

# Auth Service Flow

## When to Use
- Can flow login, register, logout, invite tenant

## Procedure
1. Login: authenticate -> set SecurityContext -> update lastLogin -> generate access/refresh token.
2. Register: validate unique username/email -> check confirm password -> assign role -> tao tenant neu khong co invite.
3. Logout: lay token tu header, blacklist token voi TTL.
4. Invite: validate tenant + email -> tao token + expiresAt.

## Output Checklist
- Login tra TokenResponse
- Register tao user + tenant/role
- Logout dung blacklist
