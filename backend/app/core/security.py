from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.core.config import settings


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _make_token(sub: str, kind: str, ttl: timedelta) -> str:
    payload = {
        "sub": sub,
        "kind": kind,
        "exp": datetime.now(timezone.utc) + ttl,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def create_access_token(user_id: str) -> str:
    return _make_token(user_id, "access", timedelta(minutes=settings.ACCESS_TOKEN_TTL_MIN))


def create_refresh_token(user_id: str) -> str:
    return _make_token(user_id, "refresh", timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS))


def decode_token(token: str) -> dict:
    """Raises JWTError if token is invalid or expired."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
