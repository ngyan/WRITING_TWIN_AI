"""Repository for DNALearning rows."""
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dna_learning import DNALearning


async def create(
    db: AsyncSession,
    user_id: UUID,
    rewrite_id: UUID | None,
    tone: str,
    phrases_added: list[str],
    phrases_removed: list[str],
    formality_delta: float | None,
) -> DNALearning:
    row = DNALearning(
        user_id=user_id,
        rewrite_id=rewrite_id,
        tone=tone,
        phrases_added=phrases_added,
        phrases_removed=phrases_removed,
        formality_delta=formality_delta,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def count_this_week(db: AsyncSession, user_id: UUID) -> int:
    since = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(func.count()).where(
            DNALearning.user_id == user_id,
            DNALearning.created_at >= since,
        )
    )
    return result.scalar_one()


async def count_total(db: AsyncSession, user_id: UUID) -> int:
    result = await db.execute(
        select(func.count()).where(DNALearning.user_id == user_id)
    )
    return result.scalar_one()


async def get_removed_phrase_counts(
    db: AsyncSession, user_id: UUID, limit: int = 100
) -> dict[str, int]:
    """Return {phrase: removal_count} across all learnings for this user.

    Uses unnest to count individual phrase occurrences across ARRAY rows.
    """
    result = await db.execute(
        text(
            """
            SELECT phrase, COUNT(*) AS cnt
            FROM dna_learnings,
                 unnest(phrases_removed) AS phrase
            WHERE user_id = :user_id
              AND phrase <> ''
            GROUP BY phrase
            ORDER BY cnt DESC
            LIMIT :limit
            """
        ),
        {"user_id": str(user_id), "limit": limit},
    )
    return {row.phrase: row.cnt for row in result}
