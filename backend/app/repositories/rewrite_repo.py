from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rewrite import Rewrite


async def create(db: AsyncSession, data: dict) -> Rewrite:
    row = Rewrite(**data)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def get_by_id(db: AsyncSession, rewrite_id: UUID) -> Rewrite | None:
    result = await db.execute(select(Rewrite).where(Rewrite.id == rewrite_id))
    return result.scalar_one_or_none()


async def update_feedback(
    db: AsyncSession,
    rewrite: Rewrite,
    action: str,
    thumb: int | None,
    edit_text: str | None,
) -> None:
    rewrite.user_action = action
    rewrite.feedback_thumb = thumb
    if edit_text is not None:
        rewrite.user_edit_text = edit_text
    await db.commit()


async def update_quality_scores(
    db: AsyncSession,
    rewrite: Rewrite,
    quality_score: float,
    score_human: float,
    score_style_match: float,
    score_readability: float,
    score_risk: float | None = None,
) -> None:
    rewrite.quality_score = quality_score
    rewrite.score_human = score_human
    rewrite.score_style_match = score_style_match
    rewrite.score_readability = score_readability
    if score_risk is not None:
        rewrite.score_risk = score_risk
    await db.commit()
