"""QualityService — scores rewrites; optionally retries before returning."""
import asyncio
import json
import re
from typing import Any

import structlog

from app.core.db import AsyncSessionLocal
from app.prompts import quality_v1
from app.services import router_service
from app.services.router_service import ModelChoice

log = structlog.get_logger()

_SCORE_MODEL = router_service.MODELS["gemini-flash"]

# Quality thresholds (Sprint 6 — tune after production data)
THRESHOLD_HUMAN: float = 0.75      # tone_fit must be ≥ this
THRESHOLD_STYLE: float = 0.70      # voice_match must be ≥ this (only when DNA present)
THRESHOLD_RISK: float = 0.40       # risk must be ≤ this


# ── Fire-and-forget (post-response) ──────────────────────────────────────────

def schedule_scoring(rewrite_id: str, input_text: str, output_text: str, tone: str) -> None:
    asyncio.create_task(_score_async(rewrite_id, input_text, output_text, tone))


async def _score_async(
    rewrite_id: str, input_text: str, output_text: str, tone: str
) -> None:
    try:
        scores = await _call_scorer(input_text, output_text, tone)
        if not scores:
            return
        async with AsyncSessionLocal() as db:
            from uuid import UUID

            from app.repositories import rewrite_repo
            row = await rewrite_repo.get_by_id(db, UUID(rewrite_id))
            if row:
                await rewrite_repo.update_quality_scores(
                    db, row,
                    quality_score=scores["overall"],
                    score_human=scores["tone_fit"],
                    score_style_match=scores["voice_match"],
                    score_readability=scores["preservation"],
                    score_risk=scores.get("risk"),
                )
    except Exception as exc:
        log.warning("quality.score_failed", rewrite_id=rewrite_id, error=str(exc))


# ── Synchronous scoring + retry loop (pre-response) ──────────────────────────

async def score_with_retry(
    messages: list[dict[str, Any]],
    mc: ModelChoice,
    input_text: str,
    tone: str,
    has_dna: bool,
    max_retries: int = 2,
) -> tuple[str, int, int, dict[str, Any], int]:
    """Generate + score output; retry if below threshold.

    Returns (output_text, input_tokens, output_tokens, scores, retry_count).
    Returns best-scored attempt if all retries are exhausted.
    """
    best_text: str = ""
    best_scores: dict[str, Any] = {}
    best_tokens: tuple[int, int] = (0, 0)
    retry_count = 0

    for attempt in range(max_retries + 1):
        output_text, in_tok, out_tok = await router_service.complete(mc, messages)
        scores = await _call_scorer(input_text, output_text, tone) or {}

        if not best_text or scores.get("overall", 0.0) > best_scores.get("overall", 0.0):
            best_text = output_text
            best_scores = scores
            best_tokens = (in_tok, out_tok)

        if _meets_thresholds(scores, has_dna):
            log.info(
                "quality.passed",
                attempt=attempt,
                tone_fit=scores.get("tone_fit"),
                overall=scores.get("overall"),
            )
            break

        if attempt < max_retries:
            retry_count += 1
            log.info(
                "quality.retry",
                attempt=attempt,
                tone_fit=scores.get("tone_fit"),
                overall=scores.get("overall"),
            )

    if retry_count > 0:
        log.info(
            "quality.best_returned",
            retries=retry_count,
            overall=best_scores.get("overall"),
        )

    return best_text, best_tokens[0], best_tokens[1], best_scores, retry_count


def _meets_thresholds(scores: dict[str, Any], has_dna: bool) -> bool:
    if scores.get("tone_fit", 1.0) < THRESHOLD_HUMAN:
        return False
    if has_dna and scores.get("voice_match", 1.0) < THRESHOLD_STYLE:
        return False
    if scores.get("risk", 0.0) > THRESHOLD_RISK:
        return False
    return True


async def _call_scorer(
    input_text: str, output_text: str, tone: str
) -> dict[str, Any] | None:
    try:
        messages = quality_v1.build_messages(input_text, output_text, tone)
        raw, _, _ = await router_service.complete(_SCORE_MODEL, messages, max_tokens=256)
        return _parse(raw)
    except Exception as exc:
        log.warning("quality.scorer_failed", error=str(exc))
        return None


def _parse(raw: str) -> dict[str, Any] | None:
    try:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            return json.loads(m.group())
    except Exception:
        pass
    return None
