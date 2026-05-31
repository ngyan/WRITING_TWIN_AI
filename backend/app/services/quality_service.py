"""QualityService — scores rewrites async. No retry yet (Sprint 6)."""
import asyncio
import json
import re

import structlog

from app.core.db import AsyncSessionLocal
from app.prompts import quality_v1
from app.services import router_service

log = structlog.get_logger()

_FAST_MODEL = router_service.MODELS["gemini-flash"]


def schedule_scoring(rewrite_id: str, input_text: str, output_text: str, tone: str) -> None:
    """Fire-and-forget quality scoring after rewrite returns."""
    asyncio.create_task(_score(rewrite_id, input_text, output_text, tone))


async def _score(rewrite_id: str, input_text: str, output_text: str, tone: str) -> None:
    try:
        messages = quality_v1.build_messages(input_text, output_text, tone)
        raw, _, _ = await router_service.complete(_FAST_MODEL, messages, max_tokens=256)

        scores = _parse(raw)
        if not scores:
            return

        async with AsyncSessionLocal() as db:
            from uuid import UUID

            from app.repositories import rewrite_repo

            row = await rewrite_repo.get_by_id(db, UUID(rewrite_id))
            if row:
                await rewrite_repo.update_quality_scores(
                    db,
                    row,
                    quality_score=scores["overall"],
                    score_human=scores["tone_fit"],
                    score_style_match=scores["voice_match"],
                    score_readability=scores["preservation"],
                )
    except Exception as exc:
        log.warning("quality.score_failed", rewrite_id=rewrite_id, error=str(exc))


def _parse(raw: str) -> dict | None:
    try:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            return json.loads(m.group())
    except Exception:
        pass
    return None
