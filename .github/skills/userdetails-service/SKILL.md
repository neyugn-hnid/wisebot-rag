---
name: userdetails-service
description: 'Use when: tao UserDetailsService load user by username/id. Keywords: user details, authentication, load user.'
argument-hint: 'Repository + entity'
---

# UserDetailsService

## When to Use
- Can load user cho Spring Security

## Procedure
1. Implement `UserDetailsService`.
2. Load user via repository (fetch roles neu can).
3. Throw `UsernameNotFoundException` khi khong tim thay.
4. Co method load by id cho JWT filter.

## Output Checklist
- Load user co log
- Tra ve UserDetails
