"""WritingProfile repository — all Postgres operations."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.writing_profile import WritingProfile


async def get_by_user_id(db: AsyncSession, user_id: UUID) -> WritingProfile | None:
    result = await db.execute(select(WritingProfile).where(WritingProfile.user_id == user_id))
    return result.scalar_one_or_none()


async def upsert_profile(db: AsyncSession, user_id: UUID, sample_count: int) -> WritingProfile:
    """Create or update profile row, returning it in processing state."""
    profile = await get_by_user_id(db, user_id)
    if profile is None:
        profile = WritingProfile(
            user_id=user_id,
            sample_count=sample_count,
            extraction_status="processing",
            qdrant_collection="user_writing_samples",
        )
        db.add(profile)
    else:
        profile.sample_count = profile.sample_count + sample_count
        profile.extraction_status = "processing"
    await db.commit()
    await db.refresh(profile)
    return profile


async def update_scores(db: AsyncSession, profile: WritingProfile, data: dict) -> WritingProfile:
    """Write extracted DNA scores back to the profile row."""
    from datetime import datetime, timezone

    profile.avg_sentence_length = data.get("avg_sentence_length")
    profile.avg_paragraph_length = data.get("avg_paragraph_length")
    profile.formality_score = data.get("formality_score")
    profile.warmth_score = data.get("warmth_score")
    profile.directness_score = data.get("directness_score")
    profile.common_phrases = data.get("common_phrases")
    profile.greeting_styles = data.get("greeting_styles")
    profile.signoff_styles = data.get("signoff_styles")
    profile.vocabulary_preferences = data.get("vocabulary_preferences")
    profile.punctuation_habits = data.get("punctuation_habits")
    profile.extraction_status = "complete"
    profile.last_refined_at = datetime.now(timezone.utc)
    profile.version = (profile.version or 1) + 1
    await db.commit()
    await db.refresh(profile)
    return profile


async def mark_failed(db: AsyncSession, user_id: UUID, error: str) -> None:
    profile = await get_by_user_id(db, user_id)
    if profile:
        profile.extraction_status = "failed"
        await db.commit()


async def delete_profile(db: AsyncSession, user_id: UUID) -> bool:
    profile = await get_by_user_id(db, user_id)
    if not profile:
        return False
    await db.delete(profile)
    await db.commit()
    return True
