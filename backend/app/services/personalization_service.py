"""PersonalizationService — composes Writing DNA + Communication Memory into prompt context.

Called by HumanizeService before building the LLM prompt when use_dna=True.
"""
from uuid import UUID

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import dna_repo
from app.services import memory_service

log = structlog.get_logger()


async def build_context(
    db: AsyncSession,
    user_id: UUID,
    text: str,
    tone: str,
) -> tuple[str | None, list[str], int | None]:
    """Return (dna_block, memory_examples, profile_version).

    Returns (None, [], None) when the user has no complete DNA profile.
    """
    profile = await dna_repo.get_by_user_id(db, user_id)
    if not profile or profile.extraction_status != "complete":
        return None, [], None

    from app.prompts.humanize.dna_v1 import build_dna_block

    dna_block = build_dna_block(profile)

    # Retrieve past approved phrasings in parallel (best-effort)
    try:
        memory_examples = await memory_service.retrieve_examples(user_id, text, tone)
    except Exception as exc:
        log.warning("personalization.memory_failed", user_id=str(user_id), error=str(exc))
        memory_examples = []

    log.info(
        "personalization.context_built",
        user_id=str(user_id),
        profile_version=profile.version,
        memory_count=len(memory_examples),
    )
    return dna_block, memory_examples, profile.version
