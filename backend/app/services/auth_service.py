import httpx
from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
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


async def google_oauth_login(db: AsyncSession, code: str, redirect_uri: str) -> TokenPair:
    """Exchange Google auth code for a token pair, creating/linking user as needed."""
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
    if token_resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Google token exchange failed"
        )
    userinfo_resp_data = await _fetch_google_userinfo(token_resp.json()["access_token"])

    google_id: str = userinfo_resp_data["sub"]
    email: str = userinfo_resp_data.get("email", "")
    full_name: str | None = userinfo_resp_data.get("name")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Google account has no email"
        )

    # 1. Existing Google user
    user = await user_repo.get_by_google_id(db, google_id)
    if user:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
        await user_repo.update_last_active(db, user)
        return _token_pair(user)

    # 2. Email exists — link Google ID
    user = await user_repo.get_by_email(db, email)
    if user:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
        user = await user_repo.link_google_id(db, user, google_id)
        await user_repo.update_last_active(db, user)
        return _token_pair(user)

    # 3. New user
    user = await user_repo.create_google_user(db, email, google_id, full_name)
    return _token_pair(user)


async def _fetch_google_userinfo(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to fetch Google user info"
        )
    return resp.json()


def _token_pair(user: User) -> TokenPair:
    uid = str(user.id)
    return TokenPair(
        access_token=create_access_token(uid),
        refresh_token=create_refresh_token(uid),
    )
