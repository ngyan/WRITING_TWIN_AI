"""Feature flags — settings defaults overridable via DB at runtime."""
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.feature_flag import FeatureFlag

log = structlog.get_logger()


async def is_enabled(flag_name: str, db: AsyncSession | None = None) -> bool:
    """Check flag. DB row takes precedence over settings when present."""
    default = bool(getattr(settings, flag_name, False))
    if db is None:
        return default
    try:
        result = await db.execute(
            select(FeatureFlag.enabled).where(FeatureFlag.name == flag_name)
        )
        row = result.scalar_one_or_none()
        if row is not None:
            return bool(row)
    except Exception as exc:
        log.warning("feature_flag.db_lookup_failed", flag=flag_name, error=str(exc))
    return default
