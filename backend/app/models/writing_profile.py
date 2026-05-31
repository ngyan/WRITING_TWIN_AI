from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.user import utcnow


class WritingProfile(Base):
    __tablename__ = "writing_profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )

    # Quantitative DNA (extracted by LLM)
    avg_sentence_length: Mapped[float | None]
    avg_paragraph_length: Mapped[float | None]
    formality_score: Mapped[float | None]
    warmth_score: Mapped[float | None]
    directness_score: Mapped[float | None]

    # Qualitative DNA (JSONB — flexible lists/dicts)
    common_phrases: Mapped[Any] = mapped_column(JSONB, nullable=True)
    greeting_styles: Mapped[Any] = mapped_column(JSONB, nullable=True)
    signoff_styles: Mapped[Any] = mapped_column(JSONB, nullable=True)
    vocabulary_preferences: Mapped[Any] = mapped_column(JSONB, nullable=True)
    punctuation_habits: Mapped[Any] = mapped_column(JSONB, nullable=True)

    # Job tracking
    sample_count: Mapped[int] = mapped_column(Integer, default=0)
    extraction_status: Mapped[str] = mapped_column(String(20), default="pending")
    # pending | processing | complete | failed

    # Meta
    last_refined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    qdrant_collection: Mapped[str | None] = mapped_column(String(255), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=func.now()
    )
