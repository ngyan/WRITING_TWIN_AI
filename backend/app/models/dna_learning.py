from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.user import utcnow


class DNALearning(Base):
    __tablename__ = "dna_learnings"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rewrite_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("rewrites.id", ondelete="SET NULL"),
        nullable=True,
    )
    tone: Mapped[str] = mapped_column(String(50), nullable=False)
    phrases_added: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    phrases_removed: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    formality_delta: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
