from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import current_user
from app.deps.db import get_db
from app.models.user import User
from app.schemas.billing import (
    CheckoutRequest,
    CheckoutResponse,
    PortalRequest,
    PortalResponse,
    UsageResponse,
)
from app.services import billing_service

router = APIRouter(prefix="/v1/billing", tags=["billing"])


@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(
    req: CheckoutRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    url = await billing_service.create_checkout_session(
        db, user, req.price_id, req.success_url, req.cancel_url
    )
    return CheckoutResponse(checkout_url=url)


@router.post("/portal", response_model=PortalResponse)
async def portal(
    req: PortalRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> PortalResponse:
    url = await billing_service.create_portal_session(db, user, req.return_url)
    return PortalResponse(portal_url=url)


@router.post("/webhook", status_code=200)
async def webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")
    try:
        await billing_service.handle_webhook(db, payload, sig_header)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    return {"status": "ok"}


@router.get("/usage", response_model=UsageResponse)
async def usage(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> UsageResponse:
    data = await billing_service.get_usage(db, user)
    return UsageResponse(**data)
