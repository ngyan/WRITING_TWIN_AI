from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth import LoginRequest, RegisterRequest, TokenPair
from app.schemas.user import UserCreate


async def register(db: AsyncSession, req: RegisterRequest) -> TokenPair:
    existing = await user_repo.get_by_email(db, req.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = await user_repo.create(
        db,
        UserCreate(
            email=req.email,
            hashed_password=hash_password(req.password),
            full_name=req.full_name,
        ),
    )
    return _token_pair(user)


async def login(db: AsyncSession, req: LoginRequest) -> TokenPair:
    user = await user_repo.get_by_email(db, req.email)
    if not user or not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    await user_repo.update_last_active(db, user)
    return _token_pair(user)


async def refresh(db: AsyncSession, refresh_token: str) -> TokenPair:
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    if payload.get("kind") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not a refresh token"
        )
    user = await user_repo.get_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return _token_pair(user)


async def get_current_user_by_token(db: AsyncSession, token: str) -> User:
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if payload.get("kind") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not an access token")
    user = await user_repo.get_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def _token_pair(user: User) -> TokenPair:
    uid = str(user.id)
    return TokenPair(
        access_token=create_access_token(uid),
        refresh_token=create_refresh_token(uid),
    )
