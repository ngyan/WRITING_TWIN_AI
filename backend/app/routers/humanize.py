from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import current_user
from app.deps.db import get_db
from app.deps.entitlements import require_rewrite_quota
from app.models.user import User
from app.schemas.humanize import (
    AutoDraftFeedbackRequest,
    AutoDraftRequest,
    AutoDraftResponse,
    FeedbackRequest,
    HumanizeRequest,
    RewriteResponse,
)
from app.services import auto_draft_service, humanize_service

router = APIRouter(prefix="/v1/humanize", tags=["humanize"])


@router.post("", response_model=RewriteResponse)
async def humanize(
    req: HumanizeRequest,
    user: User = Depends(require_rewrite_quota),
    db: AsyncSession = Depends(get_db),
) -> RewriteResponse:
    return await humanize_service.humanize(db, user, req)


@router.post("/{rewrite_id}/feedback", status_code=204)
async def feedback(
    rewrite_id: str,
    req: FeedbackRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await humanize_service.record_feedback(db, user, rewrite_id, req)


@router.post("/auto-draft", response_model=AutoDraftResponse)
async def auto_draft(
    req: AutoDraftRequest,
    user: User = Depends(require_rewrite_quota),
    db: AsyncSession = Depends(get_db),
) -> AutoDraftResponse:
    from app.core.config import settings

    if not settings.FEATURE_AUTO_DRAFT:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Feature not enabled")
    result = await auto_draft_service.create_draft(
        db, user,
        incoming_text=req.incoming_text,
        tone=req.tone,
        platform=req.platform,
        recipient_domain=req.recipient_domain,
        thread_subject=req.thread_subject,
    )
    return AutoDraftResponse(**result)


@router.post("/auto-draft/{draft_id}/feedback", status_code=204)
async def auto_draft_feedback(
    draft_id: str,
    req: AutoDraftFeedbackRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await auto_draft_service.record_feedback(db, user, draft_id, req.kept)
