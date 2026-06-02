from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.deps.auth import current_user
from app.deps.db import get_db
from app.models.user import User
from app.repositories import context_repo
from app.schemas.context import (
    AddDomainRequest,
    CustomerDomainsResponse,
    DetectContextRequest,
    DetectContextResponse,
    OverrideContextRequest,
    RemoveDomainRequest,
)
from app.services import context_service

router = APIRouter(prefix="/v1/context", tags=["context"])

MAX_CUSTOMER_DOMAINS = 50


def _check_feature() -> None:
    if not settings.FEATURE_CONTEXT_ENGINE:
        raise HTTPException(status_code=404, detail="Context Engine is not enabled")


@router.post("/detect", response_model=DetectContextResponse)
async def detect_context(
    req: DetectContextRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> DetectContextResponse:
    """Detect context twin for a message. Called by extension before humanize/voice."""
    _check_feature()
    domains = await context_repo.get_customer_domains(db, user.id)
    twin = context_service.detect(
        platform=req.platform,
        recipient_domain=req.recipient_domain,
        thread_subject=req.thread_subject,
        customer_domains=domains,
    )
    hints = context_service.apply_to_prompt_context(twin)
    return DetectContextResponse(context_twin=twin, tone_guidance=hints["tone_guidance"])


@router.get("/customer-domains", response_model=CustomerDomainsResponse)
async def get_domains(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> CustomerDomainsResponse:
    _check_feature()
    domains = await context_repo.get_customer_domains(db, user.id)
    return CustomerDomainsResponse(domains=domains)


@router.post("/customer-domains", response_model=CustomerDomainsResponse, status_code=201)
async def add_domain(
    req: AddDomainRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> CustomerDomainsResponse:
    _check_feature()
    domains = await context_repo.get_customer_domains(db, user.id)
    if req.domain in domains:
        return CustomerDomainsResponse(domains=domains)
    if len(domains) >= MAX_CUSTOMER_DOMAINS:
        raise HTTPException(status_code=400, detail="Maximum 50 customer domains reached")
    domains = [*domains, req.domain]
    await context_repo.set_customer_domains(db, user.id, domains)
    return CustomerDomainsResponse(domains=domains)


@router.delete("/customer-domains", response_model=CustomerDomainsResponse)
async def remove_domain(
    req: RemoveDomainRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> CustomerDomainsResponse:
    _check_feature()
    domains = await context_repo.get_customer_domains(db, user.id)
    domains = [d for d in domains if d != req.domain.lower().strip()]
    await context_repo.set_customer_domains(db, user.id, domains)
    return CustomerDomainsResponse(domains=domains)


@router.post("/override", status_code=204)
async def record_override(
    req: OverrideContextRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Store a user's manual context override as a training signal."""
    _check_feature()
    await context_repo.save_override(db, {
        "user_id": user.id,
        "detected_context": req.detected_context,
        "selected_context": req.selected_context,
        "platform": req.platform,
        "recipient_domain": req.recipient_domain,
    })
