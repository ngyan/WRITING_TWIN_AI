"""DNALearningService — extracts style patterns from user-edited rewrites.

Triggered when a user edits an AI output before sending (action="edited").
Requires a minimum edit distance of 5 words to avoid noise from trivial reformatting.
"""
from __future__ import annotations

import asyncio
import re
from uuid import UUID

import structlog

from app.repositories import dna_learning_repo, dna_repo

log = structlog.get_logger()

# Phrases consistently removed this many times → promoted to cringe list
CRINGE_THRESHOLD = 3
# Require at least this many words changed to treat as a meaningful learning signal
MIN_WORD_DIFF = 5

_FORMAL_MARKERS = frozenset({
    "therefore", "furthermore", "consequently", "henceforth", "herein",
    "pursuant", "notwithstanding", "accordingly", "thus", "hence",
    "please find", "kindly", "as per", "per our", "in regards to",
})
_INFORMAL_MARKERS = frozenset({
    "gonna", "wanna", "gotta", "kinda", "sorta", "yeah", "nope",
    "thanks", "hey", "hi", "sup", "lol", "btw", "fyi",
})


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\b\w[\w''-]*\b", text.lower())


def _ngrams(tokens: list[str], n: int) -> set[str]:
    return {" ".join(tokens[i : i + n]) for i in range(len(tokens) - n + 1)}


def extract_phrases(original: str, final: str) -> tuple[list[str], list[str]]:
    """Return (phrases_added, phrases_removed) as 2-gram + 3-gram sets."""
    orig_tok = _tokenize(original)
    final_tok = _tokenize(final)

    orig_ng = _ngrams(orig_tok, 2) | _ngrams(orig_tok, 3)
    final_ng = _ngrams(final_tok, 2) | _ngrams(final_tok, 3)

    added = sorted(final_ng - orig_ng)
    removed = sorted(orig_ng - final_ng)
    return added, removed


def compute_formality_delta(original: str, final: str) -> float:
    """Positive = became more formal, negative = less formal. Range approx ±1."""
    orig_tok = set(_tokenize(original))
    final_tok = set(_tokenize(final))

    def _score(tokens: set[str]) -> float:
        formal = sum(1 for m in _FORMAL_MARKERS if m in " ".join(tokens))
        informal = sum(1 for m in _INFORMAL_MARKERS if m in " ".join(tokens))
        return formal - informal

    return _score(final_tok) - _score(orig_tok)


def _word_diff_count(original: str, final: str) -> int:
    orig_words = set(_tokenize(original))
    final_words = set(_tokenize(final))
    return len(orig_words.symmetric_difference(final_words))


async def process_edit(
    user_id: UUID,
    rewrite_id: UUID,
    original_output: str,
    final_text: str,
    tone: str,
) -> None:
    """Extract learning signals from an edited rewrite and persist them.

    Runs inside asyncio.create_task — opens its own DB session.
    """
    if _word_diff_count(original_output, final_text) < MIN_WORD_DIFF:
        log.debug("dna_learning.skip_trivial", user_id=str(user_id))
        return

    phrases_added, phrases_removed = extract_phrases(original_output, final_text)
    formality_delta = compute_formality_delta(original_output, final_text)

    if not phrases_added and not phrases_removed:
        return

    from app.core.db import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        await dna_learning_repo.create(
            db,
            user_id=user_id,
            rewrite_id=rewrite_id,
            tone=tone,
            phrases_added=phrases_added[:50],
            phrases_removed=phrases_removed[:50],
            formality_delta=formality_delta,
        )
        await _maybe_update_cringe(db, user_id)

    log.info(
        "dna_learning.stored",
        user_id=str(user_id),
        added=len(phrases_added),
        removed=len(phrases_removed),
        formality_delta=formality_delta,
    )


async def _maybe_update_cringe(db, user_id: UUID) -> None:
    """Promote consistently-removed phrases to the cringe list in WritingProfile."""
    phrase_counts = await dna_learning_repo.get_removed_phrase_counts(db, user_id)
    new_cringe = sorted(
        phrase for phrase, cnt in phrase_counts.items() if cnt >= CRINGE_THRESHOLD
    )
    if not new_cringe:
        return

    profile = await dna_repo.get_by_user_id(db, user_id)
    if profile is None:
        return

    existing = set(profile.cringe_phrases or [])
    if set(new_cringe) == existing:
        return

    profile.cringe_phrases = new_cringe
    profile.version = (profile.version or 1) + 1
    await db.commit()
    log.info(
        "dna_learning.cringe_updated",
        user_id=str(user_id),
        cringe_count=len(new_cringe),
        version=profile.version,
    )


async def get_stats(db, user_id: UUID):
    """Return learning stats for the dashboard."""
    from app.schemas.dna import LearningStatsResponse

    this_week = await dna_learning_repo.count_this_week(db, user_id)
    total = await dna_learning_repo.count_total(db, user_id)
    profile = await dna_repo.get_by_user_id(db, user_id)
    cringe = list(profile.cringe_phrases or []) if profile else []
    version = profile.version if profile else 1
    return LearningStatsResponse(
        patterns_learned_this_week=this_week,
        total_learnings=total,
        cringe_phrases=cringe,
        profile_version=version,
    )


def schedule_learning(
    user_id: UUID,
    rewrite_id: UUID,
    original_output: str,
    final_text: str,
    tone: str,
) -> None:
    """Fire-and-forget: schedule learning extraction as a background task."""
    asyncio.create_task(
        process_edit(user_id, rewrite_id, original_output, final_text, tone)
    )
