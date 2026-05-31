import asyncio
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usage_event import UsageEvent


def log(
    db: AsyncSession,
    user_id: UUID,
    event_type: str,
    model: str | None = None,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    latency_ms: int | None = None,
    cost_usd: float | None = None,
    cache_hit: bool = False,
    quality_retries: int = 0,
    source: str | None = None,
) -> None:
    asyncio.create_task(
        _write(
            db, user_id, event_type, model, input_tokens, output_tokens,
            latency_ms, cost_usd, cache_hit, quality_retries, source,
        )
    )


async def _write(
    db: AsyncSession,
    user_id: UUID,
    event_type: str,
    model: str | None,
    input_tokens: int | None,
    output_tokens: int | None,
    latency_ms: int | None,
    cost_usd: float | None,
    cache_hit: bool,
    quality_retries: int,
    source: str | None,
) -> None:
    try:
        event = UsageEvent(
            user_id=user_id,
            event_type=event_type,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            cost_usd=cost_usd,
            cache_hit=cache_hit,
            quality_retries=quality_retries,
            source=source,
        )
        db.add(event)
        await db.commit()
    except Exception:
        pass
