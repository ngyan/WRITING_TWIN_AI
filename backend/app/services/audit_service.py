import asyncio
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


def log(
    db: AsyncSession,
    action: str,
    status: str,
    user_id: UUID | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    detail: dict | None = None,
) -> None:
    asyncio.create_task(
        _write(
            db, action, status, user_id, resource_type, resource_id, ip_address, user_agent, detail
        )
    )


async def _write(
    db: AsyncSession,
    action: str,
    status: str,
    user_id: UUID | None,
    resource_type: str | None,
    resource_id: str | None,
    ip_address: str | None,
    user_agent: str | None,
    detail: dict | None,
) -> None:
    try:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            detail=detail,
        )
        db.add(entry)
        await db.commit()
    except Exception:
        pass
