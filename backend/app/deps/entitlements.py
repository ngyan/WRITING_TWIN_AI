from datetime import date, datetime, timezone

from fastapi import Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.deps.auth import current_user
from app.deps.db import get_db
from app.models.rewrite import Rewrite
from app.models.user import User


async def require_rewrite_quota(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Enforce free-tier daily rewrite limit. Pro+ plans bypass the check."""
    if user.plan != "free":
        return user
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(
        tzinfo=timezone.utc
    )
    result = await db.execute(
        select(func.count(Rewrite.id)).where(
            Rewrite.user_id == user.id,
            Rewrite.created_at >= today_start,
        )
    )
    count: int = result.scalar() or 0
    if count >= settings.FREE_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=(
                f"Daily limit of {settings.FREE_DAILY_LIMIT} rewrites reached. "
                "Upgrade to Pro for unlimited rewrites."
            ),
        )
    return user
