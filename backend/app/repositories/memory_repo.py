"""Repository for CommunicationMemory rows."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication_memory import CommunicationMemory


async def create(
    db: AsyncSession,
    user_id: UUID,
    rewrite_id: UUID | None,
    memory_type: str,
    final_text: str,
    original_output: str | None,
    tone: str,
    context: str | None,
    edit_distance: float | None,
    qdrant_point_id: str | None = None,
) -> CommunicationMemory:
    row = CommunicationMemory(
        user_id=user_id,
        rewrite_id=rewrite_id,
        memory_type=memory_type,
        final_text=final_text,
        original_output=original_output,
        tone=tone,
        context=context,
        edit_distance=edit_distance,
        qdrant_point_id=qdrant_point_id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def get_recent_for_user(
    db: AsyncSession, user_id: UUID, tone: str, limit: int = 10
) -> list[CommunicationMemory]:
    result = await db.execute(
        select(CommunicationMemory)
        .where(
            CommunicationMemory.user_id == user_id,
            CommunicationMemory.tone == tone,
            CommunicationMemory.memory_type.in_(["approved", "edited"]),
        )
        .order_by(CommunicationMemory.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def update_qdrant_point_id(
    db: AsyncSession, memory_id: UUID, point_id: str
) -> None:
    row = await db.get(CommunicationMemory, memory_id)
    if row:
        row.qdrant_point_id = point_id
        await db.commit()
