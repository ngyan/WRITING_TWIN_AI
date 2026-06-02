from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.context_override import ContextOverride
from app.models.user import User


async def get_customer_domains(db: AsyncSession, user_id: UUID) -> list[str]:
    result = await db.execute(select(User.customer_domains).where(User.id == user_id))
    row = result.scalar_one_or_none()
    return row or []


async def set_customer_domains(db: AsyncSession, user_id: UUID, domains: list[str]) -> None:
    await db.execute(
        update(User).where(User.id == user_id).values(customer_domains=domains)
    )
    await db.commit()


async def save_override(db: AsyncSession, data: dict) -> ContextOverride:
    row = ContextOverride(**data)
    db.add(row)
    await db.commit()
    return row
