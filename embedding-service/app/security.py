from typing import Any

import jwt
from fastapi import Header, HTTPException, status

from app.config import settings


def _allowed_subjects() -> set[str]:
    return {
        item.strip()
        for item in settings.allowed_service_subjects.split(",")
        if item.strip()
    }


async def require_service_auth(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not settings.auth_enabled:
        return {"sub": "anonymous", "scope": "disabled"}

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization[7:].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty bearer token",
        )

    try:
        options = {"verify_aud": bool(settings.service_jwt_audience)}
        claims = jwt.decode(
            token,
            settings.service_jwt_secret,
            algorithms=[settings.service_jwt_algorithm],
            issuer=settings.service_jwt_issuer,
            audience=settings.service_jwt_audience or None,
            options=options,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        ) from exc

    subject = str(claims.get("sub", "")).strip()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token subject is required",
        )

    allowed = _allowed_subjects()
    if allowed and subject not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Service is not allowed",
        )

    return claims
