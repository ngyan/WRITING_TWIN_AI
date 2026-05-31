from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import current_user
from app.deps.db import get_db
from app.models.user import User
from app.schemas.humanize import FeedbackRequest, HumanizeRequest, RewriteResponse
from app.services import humanize_service

router = APIRouter(prefix="/v1/humanize", tags=["humanize"])


@router.post("", response_model=RewriteResponse)
async def humanize(
    req: HumanizeRequest,
    user: User = Depends(current_user),
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
