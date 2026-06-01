"""CostGuardService — enforces a daily spend ceiling across all users.

When the ceiling is hit, every subsequent rewrite degrades to Gemini Flash
regardless of the user's plan. Resets at UTC midnight.
"""
from datetime import date, datetime, timezone

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.rewrite import Rewrite

log = structlog.get_logger()


async def is_degraded(db: AsyncSession) -> bool:
    """Return True if today's total spend has reached the daily ceiling."""
    limit = settings.COST_GUARD_DAILY_LIMIT_USD
    if limit <= 0:
        return False
    try:
        today_start = datetime.combine(date.today(), datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        result = await db.execute(
            select(func.sum(Rewrite.cost_usd)).where(
                Rewrite.created_at >= today_start,
                Rewrite.cache_hit.is_(False),
            )
        )
        total: float = result.scalar() or 0.0
        if total >= limit:
            log.warning("cost_guard.ceiling_hit", total_usd=total, limit=limit)
            return True
    except Exception as exc:
        log.warning("cost_guard.check_failed", error=str(exc))
    return False
