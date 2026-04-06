---
name: jwt-service-claims
description: 'Use when: tao JwtService generate/verify token. Keywords: jwt, claims, access token, refresh token.'
argument-hint: 'Claim can nhung vao token'
---

# JWT Service Claims

## When to Use
- Can generate access/refresh token, extract claim

## Procedure
1. Inject `jwt.expiryMinutes`, `jwt.expiryDay`, `jwt.accessKey`, `jwt.refreshKey`.
2. Generate token voi claims: role, userId, email.
3. Extract claim qua `Claims` va validate expiry.
4. Dung key theo token type (access/refresh).

## Output Checklist
- Access token co TTL phut, refresh co TTL ngay
- Token valid theo userId + expiry
