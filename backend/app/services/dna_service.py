"""DNAService — orchestrates Writing DNA extraction and profile management."""
import asyncio
from uuid import UUID

import structlog
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories import dna_repo, qdrant_repo
from app.schemas.dna import DNASamplesRequest, DNASamplesResponse, WritingProfileRead
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
