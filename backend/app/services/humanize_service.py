"""HumanizeService — orchestrates the full rewrite pipeline."""
import asyncio
import time

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User
from app.prompts import context_intent, humanize_base
from app.repositories import rewrite_repo
from app.schemas.humanize import FeedbackRequest, HumanizeRequest, RewriteResponse
from app.services import cache_service, quality_service, router_service

log = structlog.get_logger()


async def humanize(db: AsyncSession, user: User, req: HumanizeRequest) -> RewriteResponse:
    input_hash = cache_service.compute_input_hash(req.tone, req.text)

    # 1 — Exact cache
    cached = await cache_service.lookup_exact(input_hash)
    if cached:
        log.info("cache.exact.hit", user_id=str(user.id))
        return RewriteResponse.model_validate({**cached, "cache_hit": True})

    # 2 — Context + intent detection (parallel, graceful)
    context_detected, intent_detected = await _detect_context_intent(req.text)

    # 3 — Semantic cache
    semantic = await cache_service.lookup_semantic(req.text, req.tone)
    if semantic:
        log.info("cache.semantic.hit", user_id=str(user.id))
        return RewriteResponse.model_validate({**semantic, "cache_hit": True})

    # 4 — Select model and build prompt
    mc = router_service.select_model(user.plan, req.tone, context_detected)
    messages = humanize_base.build_messages(req.tone, req.text)

    # 5 — Call LLM
    t0 = time.monotonic()
    output_text, in_tok, out_tok = await router_service.complete(mc, messages)
    latency_ms = int((time.monotonic() - t0) * 1000)
    cost_usd = router_service.compute_cost(mc, in_tok, out_tok)

    # 6 — Persist
    row = await rewrite_repo.create(db, {
        "user_id": user.id,
        "input_text": req.text,
        "input_hash": input_hash,
        "tone": req.tone,
        "context_detected": context_detected,
        "intent_detected": intent_detected,
        "output_text": output_text,
        "cache_hit": False,
        "provider": mc.provider,
        "model": mc.model,
        "input_tokens": in_tok,
        "output_tokens": out_tok,
        "latency_ms": latency_ms,
        "cost_usd": cost_usd,
    })

    # 7 — Store in cache (fire-and-forget)
    response_payload = {
        "id": str(row.id),
        "output_text": output_text,
        "quality_score": None,
        "cache_hit": False,
        "provider": mc.provider,
        "model": mc.model,
        "latency_ms": latency_ms,
        "cost_usd": cost_usd,
        "context_detected": context_detected,
        "intent_detected": intent_detected,
    }
    asyncio.create_task(cache_service.store_exact(input_hash, response_payload))
    asyncio.create_task(
        cache_service.store_semantic(req.text, req.tone, row.id, output_text)
    )

    # 8 — Quality scoring (async, gated behind feature flag)
    if settings.FEATURE_QUALITY_RETRY:
        quality_service.schedule_scoring(str(row.id), req.text, output_text, req.tone)

    log.info(
        "rewrite.complete",
        rewrite_id=str(row.id),
        model=mc.model,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
    )
    return RewriteResponse.model_validate(response_payload)


async def record_feedback(
    db: AsyncSession, user: User, rewrite_id: str, req: FeedbackRequest
) -> None:
    from uuid import UUID

    row = await rewrite_repo.get_by_id(db, UUID(rewrite_id))
    if not row or row.user_id != user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Rewrite not found")
    await rewrite_repo.update_feedback(db, row, req.action, req.thumb, req.edit_text)


async def _detect_context_intent(text: str) -> tuple[str, str]:
    """Run context + intent classification concurrently. Falls back to 'other' on error."""
    mc = router_service.MODELS["gemini-flash"]

    async def _ctx() -> str:
        try:
            msgs = context_intent.build_context_messages(text)
            raw, _, _ = await router_service.complete(mc, msgs, max_tokens=10)
            return context_intent.parse_context(raw)
        except Exception:
            return "other"

    async def _intent() -> str:
        try:
            msgs = context_intent.build_intent_messages(text)
            raw, _, _ = await router_service.complete(mc, msgs, max_tokens=10)
            return context_intent.parse_intent(raw)
        except Exception:
            return "other"

    ctx, intent = await asyncio.gather(_ctx(), _intent())
    return ctx, intent
