"""DNAService — orchestrates Writing DNA extraction and profile management."""
import asyncio
import json
import re
from uuid import UUID

import litellm
import structlog
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User
from app.repositories import dna_repo, qdrant_repo
from app.schemas.dna import DNASamplesRequest, DNASamplesResponse, SnapshotRequest, SnapshotResponse, WritingProfileRead
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
  "writing_archetype": <one of: "The Efficient Communicator" | "The Warm Connector" | "The Precise Analyst" | "The Visionary Storyteller" | "The Diplomatic Navigator" | "The Bold Challenger">,
  "signature_patterns": [<string>, <string>, <string>],
  "famous_author_match": <one of: "Hemingway" | "Orwell" | "Austen" | "Woolf" | "Twain" | "Obama">,
  "famous_author_reason": <one concise sentence explaining the match>
}}
"""


async def snapshot(req: SnapshotRequest) -> SnapshotResponse:
    local = _compute_local_metrics(req.text)

    prompt = _SNAPSHOT_PROMPT.format(text=req.text[:2000])
    resp = await litellm.acompletion(
        model="gemini/gemini-2.0-flash",
        api_key=settings.GEMINI_API_KEY,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=300,
    )
    raw = resp.choices[0].message.content or "{}"
    # Strip any accidental markdown fences
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
    data = json.loads(raw)

    return SnapshotResponse(
        avg_sentence_length=local["avg_sentence_length"],
        vocabulary_diversity=local["vocabulary_diversity"],
        avg_word_length=local["avg_word_length"],
        formality_score=int(data.get("formality_score", 5)),
        writing_archetype=data.get("writing_archetype", "The Efficient Communicator"),
        signature_patterns=data.get("signature_patterns", []),
        famous_author_match=data.get("famous_author_match", "Hemingway"),
        famous_author_reason=data.get("famous_author_reason", ""),
    )
