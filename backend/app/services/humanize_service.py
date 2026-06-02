"""HumanizeService — orchestrates the full rewrite pipeline."""
import asyncio
import time

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User
from app.prompts import context_intent, humanize_base
from app.prompts.humanize import dna_v1
from app.repositories import context_repo, rewrite_repo
from app.schemas.humanize import FeedbackRequest, HumanizeRequest, RewriteResponse
from app.services import (
    cache_service,
    context_service,
    cost_guard_service,
    cultural_service,
    memory_service,
    personalization_service,
    quality_service,
    router_service,
)

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

    # 4a — Context Engine V1 (if fields provided by extension)
    context_twin: str = "professional"
    context_guidance: str | None = None
    context_fields = (
        req.platform or req.recipient_domain or req.thread_subject or req.context_twin_override
    )
    if settings.FEATURE_CONTEXT_ENGINE and context_fields:
        if req.context_twin_override:
            context_twin = req.context_twin_override
        else:
            customer_domains = await context_repo.get_customer_domains(db, user.id)
            context_twin = context_service.detect(
                platform=req.platform,
                recipient_domain=req.recipient_domain,
                thread_subject=req.thread_subject,
                customer_domains=customer_domains,
            )
        context_guidance = context_service.apply_to_prompt_context(context_twin)["tone_guidance"]

    # 4b — Personalization context (DNA + memory + cultural) — best-effort
    dna_block: str | None = None
    memory_examples: list[str] = []
    profile_version_used: int | None = None
    if req.use_dna:
        dna_block, memory_examples, profile_version_used = (
            await personalization_service.build_context(db, user.id, req.text, req.tone)
        )
    locale = getattr(user, "locale", "en-US") or "en-US"
    cultural_block = cultural_service.get_block(locale, req.tone)

    # 5 — Select model and build prompt (degrade if daily cost ceiling hit)
    mc = router_service.select_model(user.plan, req.tone, context_detected)
    if await cost_guard_service.is_degraded(db):
        log.warning("cost_guard.degraded", user_id=str(user.id), original_model=mc.key)
        mc = router_service.MODELS["gemini-flash"]
    if dna_block:
        messages = dna_v1.build_messages(
            req.tone, req.text, dna_block, memory_examples, cultural_block,
            context_guidance=context_guidance,
        )
    else:
        messages = humanize_base.build_messages(
            req.tone, req.text, context_guidance=context_guidance
        )

    # 6 — Call LLM (with quality retry when flag enabled)
    t0 = time.monotonic()
    retry_count = 0
    quality_scores: dict = {}
    if settings.FEATURE_QUALITY_RETRY:
        output_text, in_tok, out_tok, quality_scores, retry_count = (
            await quality_service.score_with_retry(
                messages=messages,
                mc=mc,
                input_text=req.text,
                tone=req.tone,
                has_dna=bool(dna_block),
            )
        )
    else:
        output_text, in_tok, out_tok = await router_service.complete(mc, messages)
    latency_ms = int((time.monotonic() - t0) * 1000)
    cost_usd = router_service.compute_cost(mc, in_tok, out_tok)

    # 7 — Persist
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

    # 8 — Store in cache (fire-and-forget)
    response_payload = {
        "id": str(row.id),
        "output_text": output_text,
        "quality_score": quality_scores.get("overall"),
        "cache_hit": False,
        "provider": mc.provider,
        "model": mc.model,
        "latency_ms": latency_ms,
        "cost_usd": cost_usd,
        "context_detected": context_detected,
        "intent_detected": intent_detected,
        "profile_version_used": profile_version_used,
        "retry_count": retry_count,
    }
    asyncio.create_task(cache_service.store_exact(input_hash, response_payload))
    asyncio.create_task(
        cache_service.store_semantic(req.text, req.tone, row.id, output_text)
    )

    # 9 — Async quality scoring when retry loop not active
    if not settings.FEATURE_QUALITY_RETRY:
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

    # Communication Memory Engine — store accepted/edited rewrites as learning signal
    if req.action in ("accepted", "edited"):
        final_text = req.edit_text if req.action == "edited" and req.edit_text else row.output_text
        asyncio.create_task(
            memory_service.store_memory(
                user_id=user.id,
                rewrite_id=row.id,
                action=req.action,
                final_text=final_text,
                original_output=row.output_text,
                tone=row.tone,
                context=row.context_detected,
            )
        )


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
