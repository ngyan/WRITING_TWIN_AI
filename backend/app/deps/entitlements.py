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
    """Enforce free-tier monthly rewrite limit. Pro+ plans bypass the check."""
    if user.plan != "free":
        return user
    month_start = datetime.combine(
        date.today().replace(day=1), datetime.min.time()
    ).replace(tzinfo=timezone.utc)
    result = await db.execute(
        select(func.count(Rewrite.id)).where(
            Rewrite.user_id == user.id,
            Rewrite.created_at >= month_start,
        )
    )
    count: int = result.scalar() or 0
    if count >= settings.FREE_MONTHLY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=(
                f"You've used all {settings.FREE_MONTHLY_LIMIT} rewrites for this month. "
                "Upgrade to Pro for 300 rewrites/month."
            ),
        )
    return user
