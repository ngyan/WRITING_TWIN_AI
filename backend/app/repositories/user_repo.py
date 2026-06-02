from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, data: UserCreate) -> User:
    user = User(
        email=data.email,
        hashed_password=data.hashed_password,
        full_name=data.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_by_google_id(db: AsyncSession, google_id: str) -> User | None:
    result = await db.execute(select(User).where(User.google_id == google_id))
    return result.scalar_one_or_none()


async def create_google_user(
    db: AsyncSession, email: str, google_id: str, full_name: str | None
) -> User:
    user = User(
        email=email,
        google_id=google_id,
        full_name=full_name,
        hashed_password=None,
        is_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def link_google_id(db: AsyncSession, user: User, google_id: str) -> User:
    user.google_id = google_id
    user.is_verified = True
    await db.commit()
    await db.refresh(user)
    return user


async def update_last_active(db: AsyncSession, user: User) -> None:
    user.last_active_at = datetime.now(timezone.utc)
    await db.commit()
