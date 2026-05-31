from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.deps.db import get_db

router = APIRouter(prefix="/v1", tags=["health"])


@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)) -> dict:
    checks: dict = {"status": "ok", "db": "ok", "redis": "ok"}

    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        checks["db"] = f"error: {e}"
        checks["status"] = "degraded"

    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        await r.ping()
        await r.aclose()
    except Exception as e:
        checks["redis"] = f"error: {e}"
        checks["status"] = "degraded"

    if checks["status"] != "ok":
        raise HTTPException(status_code=503, detail=checks)

    return checks
