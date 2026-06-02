"""VoiceService — transcribe audio + generate DNA-aware draft via voice pipeline."""
import io
import time

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

MAX_AUDIO_BYTES = 24 * 1024 * 1024  # 24 MB — safely under Whisper's 25 MB limit


async def create_draft(
    db: AsyncSession,
    user: User,
    audio: UploadFile | None,
    transcript_text: str | None,
    output_type: str,
) -> VoiceDraftResponse:
    """Entry point: accepts raw audio OR pre-transcribed text."""
    # 1 — Transcribe if audio provided
    transcript = transcript_text
    audio_duration_sec: int | None = None

    if audio is not None:
        content = await audio.read(MAX_AUDIO_BYTES + 1)
        if len(content) > MAX_AUDIO_BYTES:
            from fastapi import HTTPException
            raise HTTPException(status_code=413, detail="Audio file exceeds 24 MB limit")
        transcript, audio_duration_sec = await _transcribe(content, audio.filename or "audio.webm")

    if not transcript or not transcript.strip():
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="No transcript available")

    # 2 — Build DNA context (best-effort — no DNA is fine for v1)
    dna_block: str | None = None
    if settings.FEATURE_VOICE_TWIN and settings.FEATURE_WRITING_DNA:
        try:
            dna_block, _, _ = await personalization_service.build_context(
                db, user.id, transcript, "professional"
            )
        except Exception:
            pass

    # 3 — Select model + build prompt
    mc = router_service.select_model(user.plan, "professional", None)
    messages = draft_v1.build_messages(transcript, output_type, dna_block)

    # 4 — LLM call
    t0 = time.monotonic()
    output_text, in_tok, out_tok = await router_service.complete(mc, messages)
    latency_ms = int((time.monotonic() - t0) * 1000)
    cost_usd = router_service.compute_cost(mc, in_tok, out_tok)

    # 5 — Persist
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


async def _transcribe(audio_bytes: bytes, filename: str) -> tuple[str, int | None]:
    """Transcribe audio via OpenAI Whisper. Returns (transcript, duration_seconds)."""
    import openai

    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    response = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="verbose_json",
    )
    transcript = response.text.strip()
    duration_sec: int | None = None
    if hasattr(response, "duration") and response.duration:
        duration_sec = int(response.duration)

    log.info("whisper.transcribed", chars=len(transcript), duration_sec=duration_sec)
    return transcript, duration_sec
