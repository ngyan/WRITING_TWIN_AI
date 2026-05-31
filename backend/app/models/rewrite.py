from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.user import utcnow


class Rewrite(Base):
    __tablename__ = "rewrites"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )

    # Inputs
    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    input_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    tone: Mapped[str] = mapped_column(String(50), nullable=False)
    context_detected: Mapped[str | None] = mapped_column(String(50))
    intent_detected: Mapped[str | None] = mapped_column(String(50))

    # Output
    output_text: Mapped[str] = mapped_column(Text, nullable=False)
    cache_hit: Mapped[bool] = mapped_column(default=False)

    # Cost/latency
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_usd: Mapped[float] = mapped_column(Float, nullable=False)

    # User signal
    user_action: Mapped[str | None] = mapped_column(String(20))
    user_edit_text: Mapped[str | None] = mapped_column(Text)
    feedback_thumb: Mapped[int | None] = mapped_column(Integer)

    # Quality Engine scores (nullable — populated async by QualityService)
    quality_score: Mapped[float | None] = mapped_column(Float)
    score_human: Mapped[float | None] = mapped_column(Float)
    score_style_match: Mapped[float | None] = mapped_column(Float)
    score_readability: Mapped[float | None] = mapped_column(Float)
    score_confidence: Mapped[float | None] = mapped_column(Float)
    score_risk: Mapped[float | None] = mapped_column(Float)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
