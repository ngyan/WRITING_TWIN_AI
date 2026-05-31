from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import current_user
from app.deps.db import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenPair
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


# TODO: Sprint 7 — Billing & Auth Polish
@router.post("/google", status_code=501)
async def google_oauth() -> dict:
    return {"detail": "Not implemented"}


@router.post("/forgot-password", status_code=501)
async def forgot_password() -> dict:
    return {"detail": "Not implemented"}


@router.post("/reset-password", status_code=501)
async def reset_password() -> dict:
    return {"detail": "Not implemented"}
