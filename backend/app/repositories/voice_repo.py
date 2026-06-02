from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.voice_session import VoiceSession


async def create(db: AsyncSession, data: dict) -> VoiceSession:
    row = VoiceSession(**data)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def get_by_id(db: AsyncSession, session_id: UUID) -> VoiceSession | None:
    result = await db.execute(select(VoiceSession).where(VoiceSession.id == session_id))
    return result.scalar_one_or_none()


async def update_feedback(
    db: AsyncSession,
    session: VoiceSession,
    accepted: bool,
    edited_draft: str | None,
) -> None:
    session.accepted = accepted
    session.edited_draft = edited_draft
    await db.commit()
