"""Repository for AutoDraft rows."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auto_draft import AutoDraft


async def create(db: AsyncSession, data: dict) -> AutoDraft:
    row = AutoDraft(**data)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def get_by_id(db: AsyncSession, draft_id: UUID) -> AutoDraft | None:
    return await db.get(AutoDraft, draft_id)


async def update_kept(db: AsyncSession, row: AutoDraft, kept: bool) -> None:
    row.kept = kept
    await db.commit()
