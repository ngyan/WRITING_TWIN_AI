from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.user import utcnow


class ContextOverride(Base):
    __tablename__ = "context_overrides"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    detected_context: Mapped[str] = mapped_column(String(50), nullable=False)
    selected_context: Mapped[str] = mapped_column(String(50), nullable=False)
    platform: Mapped[str | None] = mapped_column(String(50))
    recipient_domain: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
