"""AutoDraftService — generates a reply draft from incoming email context."""
from __future__ import annotations

import hashlib
import time
from uuid import UUID

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.prompts import auto_draft_v1
from app.repositories import auto_draft_repo
from app.services import context_service, personalization_service, router_service

log = structlog.get_logger()


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:64]


async def create_draft(
    db: AsyncSession,
    user: User,
    incoming_text: str,
    tone: str,
    platform: str | None = None,
    recipient_domain: str | None = None,
    thread_subject: str | None = None,
) -> dict:
    """Generate a reply draft from the incoming email. Returns persisted AutoDraft as dict."""
    # Context guidance (best-effort — same pipeline as humanize)
    context_guidance: str | None = None
    if platform or recipient_domain or thread_subject:
        twin = context_service.detect(
            platform=platform,
            recipient_domain=recipient_domain,
            thread_subject=thread_subject,
        )
        context_guidance = context_service.apply_to_prompt_context(twin)["tone_guidance"]

    # DNA context (best-effort)
    dna_block: str | None = None
    try:
        dna_block, _, _ = await personalization_service.build_context(
            db, user.id, incoming_text, tone
        )
    except Exception:
        pass

    # Model selection + prompt
    mc = router_service.select_model(user.plan, tone, context=None)
    messages = auto_draft_v1.build_messages(
        incoming_text=incoming_text,
        tone=tone,
        dna_block=dna_block,
        context_guidance=context_guidance,
    )

    t0 = time.monotonic()
    draft_text, in_tok, out_tok = await router_service.complete(mc, messages)
    latency_ms = int((time.monotonic() - t0) * 1000)
    cost_usd = router_service.compute_cost(mc, in_tok, out_tok)

    row = await auto_draft_repo.create(db, {
        "user_id": user.id,
        "incoming_text_hash": _hash(incoming_text),
        "draft": draft_text.strip(),
        "tone": tone,
        "provider": mc.provider,
        "model": mc.model,
        "input_tokens": in_tok,
        "output_tokens": out_tok,
        "latency_ms": latency_ms,
        "cost_usd": cost_usd,
        "kept": None,
    })

    log.info(
        "auto_draft.created",
        user_id=str(user.id),
        model=mc.model,
        latency_ms=latency_ms,
    )

    return {
        "id": str(row.id),
        "draft": row.draft,
        "model": row.model,
        "latency_ms": row.latency_ms,
        "cost_usd": row.cost_usd,
    }


async def record_feedback(
    db: AsyncSession, user: User, draft_id: str, kept: bool
) -> None:
    row = await auto_draft_repo.get_by_id(db, UUID(draft_id))
    if not row or row.user_id != user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Auto draft not found")
    await auto_draft_repo.update_kept(db, row, kept)
