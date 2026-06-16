"""DNAService — orchestrates Writing DNA extraction and profile management."""
import asyncio
import json
import re
from uuid import UUID

import structlog
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories import dna_repo, qdrant_repo
from app.schemas.dna import (
    DNASamplesRequest,
    DNASamplesResponse,
    SnapshotRequest,
    SnapshotResponse,
    WritingProfileRead,
)
from app.services import router_service
from app.tasks.extract_dna_task import run_extraction

log = structlog.get_logger()


async def submit_samples(
    db: AsyncSession, user: User, req: DNASamplesRequest
) -> DNASamplesResponse:
    samples = [s.model_dump() for s in req.samples]

    # Create/update profile row in processing state
    profile = await dna_repo.upsert_profile(db, user.id, len(samples))

    # Fire-and-forget extraction
    asyncio.create_task(run_extraction(user.id, samples))

    log.info("dna.samples_submitted", user_id=str(user.id), count=len(samples))
    return DNASamplesResponse(
        status="accepted",
        sample_count=profile.sample_count,
        extraction_status="processing",
    )


async def get_profile(db: AsyncSession, user: User) -> WritingProfileRead:
    profile = await dna_repo.get_by_user_id(db, user.id)
    if not profile:
        raise HTTPException(
            status_code=404, detail="No writing profile found. Submit samples first."
        )
    return WritingProfileRead.model_validate(profile)


async def refine_profile(db: AsyncSession, user: User) -> DNASamplesResponse:
    """Re-trigger extraction from existing Qdrant samples."""
    profile = await dna_repo.get_by_user_id(db, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No profile to refine. Submit samples first.")
    if profile.sample_count == 0:
        raise HTTPException(status_code=400, detail="No samples stored.")

    profile.extraction_status = "processing"
    await db.commit()

    # Re-run extraction using existing samples (fetched from Qdrant)
    asyncio.create_task(_refine_from_qdrant(user.id, profile.sample_count))

    return DNASamplesResponse(
        status="accepted",
        sample_count=profile.sample_count,
        extraction_status="processing",
    )


async def delete_profile(db: AsyncSession, user: User) -> None:
    deleted = await dna_repo.delete_profile(db, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="No profile found.")
    # GDPR: remove vectors
    asyncio.create_task(qdrant_repo.delete_user_vectors(user.id))
    log.info("dna.profile_deleted", user_id=str(user.id))


async def _refine_from_qdrant(user_id: UUID, _sample_count: int) -> None:
    """Placeholder for re-extraction from Qdrant vectors. Full impl in Sprint 5."""
    log.info("dna.refine_skipped", user_id=str(user_id), reason="Sprint 5 implementation")


# ── Public snapshot (no auth) ─────────────────────────────────────────────────

def _compute_local_metrics(text: str) -> dict:
    """Pure-Python stylometric metrics — no LLM needed."""
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    words = text.split()
    unique_words = set(w.lower().strip(".,!?;:\"'") for w in words)

    avg_sentence_length = round(len(words) / max(len(sentences), 1), 1)
    vocabulary_diversity = round(len(unique_words) / max(len(words), 1), 3)
    avg_word_length = round(sum(len(w) for w in words) / max(len(words), 1), 1)

    return {
        "avg_sentence_length": avg_sentence_length,
        "vocabulary_diversity": vocabulary_diversity,
        "avg_word_length": avg_word_length,
    }


_SNAPSHOT_PROMPT = """\
Analyse this writing sample and return ONLY valid JSON — no markdown, no explanation.

Sample:
\"\"\"
{text}
\"\"\"

Return exactly this JSON shape:
{{
  "formality_score": <integer 1-10, where 1=very casual, 10=very formal>,
  "writing_archetype": <one of: "The Efficient Communicator" | "The Warm Connector" |
    "The Precise Analyst" | "The Visionary Storyteller" | "The Diplomatic Navigator" |
    "The Bold Challenger">,
  "signature_patterns": [<string>, <string>, <string>],
  "famous_author_match": <one of: "Hemingway" | "Orwell" | "Austen" | "Woolf" | "Twain" | "Obama">,
  "famous_author_reason": <one concise sentence explaining the match>
}}
"""


def _heuristic_qualitative(text: str, local: dict) -> dict:
    """Derive a believable qualitative profile from local metrics alone.

    Used as a graceful fallback when the LLM is unavailable or returns
    unparseable output — this is a public, no-auth funnel feature and must
    never hard-fail.
    """
    avg_sl = local["avg_sentence_length"]
    avg_wl = local["avg_word_length"]
    div = local["vocabulary_diversity"]
    lower = text.lower()
    contractions = len(re.findall(r"\b\w+'\w+\b", text))
    warm = sum(lower.count(w) for w in (
        "thank", "hope", "great", "appreciate", "support",
        "please", "glad", "happy", "love", "wonderful",
    ))

    formality = 5 + (2 if avg_wl >= 5 else 0) + (1 if avg_sl >= 18 else 0)
    formality -= 2 if contractions >= 2 else 0
    formality -= 1 if avg_sl <= 10 else 0
    formality = max(1, min(10, formality))

    if warm >= 2:
        archetype, author = "The Warm Connector", "Austen"
        reason = "Warm, personable phrasing that builds rapport before getting to the point."
    elif avg_sl <= 12 and avg_wl <= 4.6:
        archetype, author = "The Efficient Communicator", "Hemingway"
        reason = "Short, direct sentences that get straight to the point."
    elif div >= 0.7 and avg_sl >= 16:
        archetype, author = "The Precise Analyst", "Orwell"
        reason = "Clear, varied vocabulary arranged in carefully structured sentences."
    elif avg_sl >= 20:
        archetype, author = "The Visionary Storyteller", "Woolf"
        reason = "Flowing, expansive sentences that carry a narrative rhythm."
    else:
        archetype, author = "The Efficient Communicator", "Twain"
        reason = "Plain-spoken and approachable with an easy conversational flow."

    patterns: list[str] = []
    if contractions:
        patterns.append("Uses contractions for a conversational tone")
    patterns.append(f"Averages {avg_sl} words per sentence")
    patterns.append("Opens with warmth before the ask" if warm else "Leads with the main point")
    patterns.append(f"Vocabulary diversity around {int(div * 100)}%")

    return {
        "formality_score": formality,
        "writing_archetype": archetype,
        "signature_patterns": patterns[:3],
        "famous_author_match": author,
        "famous_author_reason": reason,
    }


def _parse_snapshot_json(raw: str) -> dict | None:
    """Extract the first JSON object from raw LLM output, tolerant of fences/prose."""
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


async def snapshot(req: SnapshotRequest) -> SnapshotResponse:
    local = _compute_local_metrics(req.text)
    qualitative = _heuristic_qualitative(req.text, local)

    # Best-effort LLM enrichment over the heuristic baseline. Any failure
    # (auth, transient, timeout, bad JSON) leaves the heuristic in place.
    try:
        prompt = _SNAPSHOT_PROMPT.format(text=req.text[:2000])
        raw, _, _ = await router_service.complete(
            router_service.MODELS["gemini-flash"],
            [{"role": "user", "content": prompt}],
            max_tokens=300,
        )
        data = _parse_snapshot_json(raw)
        if data:
            # Override the heuristic only where the LLM gave a usable value.
            for key in qualitative:
                value = data.get(key)
                if value not in (None, "", []):
                    qualitative[key] = value
            qualitative["formality_score"] = int(qualitative["formality_score"])
    except Exception as exc:  # noqa: BLE001 — funnel feature must always return
        log.warning("dna.snapshot_llm_failed", error=str(exc))

    return SnapshotResponse(
        avg_sentence_length=local["avg_sentence_length"],
        vocabulary_diversity=local["vocabulary_diversity"],
        avg_word_length=local["avg_word_length"],
        formality_score=qualitative["formality_score"],
        writing_archetype=qualitative["writing_archetype"],
        signature_patterns=qualitative["signature_patterns"],
        famous_author_match=qualitative["famous_author_match"],
        famous_author_reason=qualitative["famous_author_reason"],
    )
