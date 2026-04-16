---
name: tenant-invite-flow
description: 'Use when: tao flow tenant invite. Keywords: tenant, invite, token, expires.'
argument-hint: 'Thoi gian het han + status'
---

# Tenant Invite Flow

## When to Use
- Can moi user vao tenant bang token

## Procedure
1. Tao entity `TenantInvite` voi token, status, expiresAt.
2. Repository query `findByTokenAndStatus`.
3. Khi register, validate invite, check expiry, update status.
4. Tao invite moi trong AuthService neu can.

## Output Checklist
- Token unique
- Status update khi accepted/expired
