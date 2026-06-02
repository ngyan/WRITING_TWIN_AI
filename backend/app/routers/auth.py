import secrets
import urllib.parse

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.deps.auth import current_user
from app.deps.db import get_db
from app.models.user import User
from app.schemas.auth import (
    GoogleExchangeRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenPair:
    return await auth_service.register(db, req)


@router.post("/login", response_model=TokenPair)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenPair:
    return await auth_service.login(db, req)


@router.post("/refresh", response_model=TokenPair)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenPair:
    return await auth_service.refresh(db, req.refresh_token)


@router.post("/logout", status_code=204)
async def logout() -> None:
    # Stateless JWT — client discards tokens. Token blocklist deferred to Sprint 7.
    return None


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(current_user)) -> User:
    return user


@router.get("/google")
async def google_auth_redirect() -> RedirectResponse:
    """Redirect browser to Google's OAuth consent screen."""
    state = secrets.token_urlsafe(16)
    params = urllib.parse.urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_auth_callback(
    code: str = Query(...),
    state: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Handle Google redirect, issue tokens, send user to frontend."""
    tokens = await auth_service.google_oauth_login(db, code, settings.GOOGLE_REDIRECT_URI)
    params = urllib.parse.urlencode({
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
    })
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?{params}")


@router.post("/google/exchange", response_model=TokenPair)
async def google_exchange(
    req: GoogleExchangeRequest, db: AsyncSession = Depends(get_db)
) -> TokenPair:
    """Exchange a Google auth code for a JWT pair (used by the Chrome extension)."""
    return await auth_service.google_oauth_login(db, req.code, req.redirect_uri)


@router.post("/forgot-password", status_code=501)
async def forgot_password() -> dict:
    return {"detail": "Not implemented"}


@router.post("/reset-password", status_code=501)
async def reset_password() -> dict:
    return {"detail": "Not implemented"}
