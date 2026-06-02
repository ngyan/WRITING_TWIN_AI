"""VoiceService — transcribe audio + generate DNA-aware draft via voice pipeline.

Transcription: Gemini 1.5 Flash (multimodal audio inline via LiteLLM).
Draft generation: LiteLLM router (Gemini Flash → Claude Haiku → Claude Sonnet by plan).
No OpenAI dependency.
"""
import base64
import time

import litellm
import structlog
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User
from app.prompts.voice import draft_v1
from app.repositories import voice_repo
from app.schemas.voice import VoiceDraftResponse
from app.services import personalization_service, router_service

log = structlog.get_logger()

MAX_AUDIO_BYTES = 24 * 1024 * 1024  # 24 MB
_TRANSCRIBE_MODEL = "gemini/gemini-1.5-flash"


async def create_draft(
    db: AsyncSession,
    user: User,
    audio: UploadFile | None,
    transcript_text: str | None,
    output_type: str,
) -> VoiceDraftResponse:
    """Entry point: accepts raw audio OR pre-transcribed text."""
    transcript = transcript_text
    audio_duration_sec: int | None = None

    if audio is not None:
        content = await audio.read(MAX_AUDIO_BYTES + 1)
        if len(content) > MAX_AUDIO_BYTES:
            from fastapi import HTTPException
            raise HTTPException(status_code=413, detail="Audio file exceeds 24 MB limit")
        mime = _guess_mime(audio.filename or "audio.webm")
        transcript = await _transcribe(content, mime)

    if not transcript or not transcript.strip():
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="No transcript available")

    # Build DNA context (best-effort)
    dna_block: str | None = None
    if settings.FEATURE_VOICE_TWIN and settings.FEATURE_WRITING_DNA:
        try:
            dna_block, _, _ = await personalization_service.build_context(
                db, user.id, transcript, "professional"
            )
        except Exception:
            pass

    # Select model + draft
    mc = router_service.select_model(user.plan, "professional", None)
    messages = draft_v1.build_messages(transcript, output_type, dna_block)

    t0 = time.monotonic()
    output_text, in_tok, out_tok = await router_service.complete(mc, messages)
    latency_ms = int((time.monotonic() - t0) * 1000)
    cost_usd = router_service.compute_cost(mc, in_tok, out_tok)

    row = await voice_repo.create(db, {
        "user_id": user.id,
        "transcript": transcript,
        "output_type": output_type,
        "draft": output_text,
        "audio_duration_sec": audio_duration_sec,
        "provider": mc.provider,
        "model": mc.model,
        "input_tokens": in_tok,
        "output_tokens": out_tok,
        "latency_ms": latency_ms,
        "cost_usd": cost_usd,
    })

    log.info(
        "voice.draft.complete",
        voice_session_id=str(row.id),
        output_type=output_type,
        model=mc.model,
        latency_ms=latency_ms,
    )
    return VoiceDraftResponse(
        id=row.id,
        transcript=transcript,
        draft=output_text,
        output_type=output_type,
        provider=mc.provider,
        model=mc.model,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
    )


async def record_feedback(
    db: AsyncSession,
    user: User,
    session_id: str,
    accepted: bool,
    edited_draft: str | None,
) -> None:
    from uuid import UUID
    row = await voice_repo.get_by_id(db, UUID(session_id))
    if not row or row.user_id != user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Voice session not found")
    await voice_repo.update_feedback(db, row, accepted, edited_draft)


async def _transcribe(audio_bytes: bytes, mime: str) -> str:
    """Transcribe audio via Gemini 1.5 Flash multimodal.

    Sends audio as base64 inline data. LiteLLM maps data URIs to Gemini's
    inlineData format using the mime type to distinguish audio from images.
    """
    b64 = base64.b64encode(audio_bytes).decode()
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Transcribe the following audio exactly as spoken. "
                        "Output only the raw transcript — no labels, no commentary, "
                        "no timestamps. Preserve technical terms exactly."
                    ),
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{b64}"},
                },
            ],
        }
    ]

    response = await litellm.acompletion(
        model=_TRANSCRIBE_MODEL,
        messages=messages,
        api_key=settings.GEMINI_API_KEY,
        timeout=30,
    )
    transcript = response.choices[0].message.content or ""
    transcript = transcript.strip()
    log.info("gemini.transcribed", chars=len(transcript), model=_TRANSCRIBE_MODEL)
    return transcript


def _guess_mime(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
    return {
        "webm": "audio/webm",
        "mp3":  "audio/mp3",
        "mp4":  "audio/mp4",
        "m4a":  "audio/mp4",
        "ogg":  "audio/ogg",
        "wav":  "audio/wav",
        "flac": "audio/flac",
    }.get(ext, "audio/webm")
