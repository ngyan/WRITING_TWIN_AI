from typing import Annotated

import litellm
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.deps.auth import current_user
from app.deps.db import get_db
from app.deps.entitlements import require_rewrite_quota
from app.models.user import User
from app.schemas.voice import VoiceDraftResponse, VoiceFeedbackRequest
from app.services import voice_service

router = APIRouter(prefix="/v1/voice", tags=["voice"])

VALID_OUTPUT_TYPES = {
    "email", "reply", "customer_update",
    "jira_ticket", "technical_report",
    "linkedin_comment", "reddit_reply",
}


def _check_feature() -> None:
    if not settings.FEATURE_VOICE_TWIN:
        raise HTTPException(status_code=404, detail="Voice Twin is not enabled")


@router.post("/draft", response_model=VoiceDraftResponse)
async def create_draft(
    output_type: Annotated[str, Form()],
    user: User = Depends(require_rewrite_quota),
    db: AsyncSession = Depends(get_db),
    audio: UploadFile | None = File(default=None),
    transcript: Annotated[str | None, Form()] = None,
) -> VoiceDraftResponse:
    _check_feature()
    if output_type not in VALID_OUTPUT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid output_type. Must be one of: {sorted(VALID_OUTPUT_TYPES)}",
        )
    if audio is None and not transcript:
        raise HTTPException(
            status_code=422, detail="Provide either audio file or transcript text"
        )
    try:
        return await voice_service.create_draft(db, user, audio, transcript, output_type)
    except litellm.RateLimitError:
        raise HTTPException(status_code=503, detail="Transcription service is busy — please try again in a moment.")
    except litellm.exceptions.NotFoundError:
        raise HTTPException(status_code=503, detail="Transcription model unavailable — please try again shortly.")


@router.post("/draft/{session_id}/feedback", status_code=204)
async def feedback(
    session_id: str,
    req: VoiceFeedbackRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    _check_feature()
    await voice_service.record_feedback(
        db, user, session_id, req.accepted, req.edited_draft
    )
