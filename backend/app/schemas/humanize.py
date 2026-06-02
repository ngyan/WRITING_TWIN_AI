from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class HumanizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=8000)
    tone: Literal["casual", "professional", "executive", "friendly", "direct", "diplomatic"]
    intent: str | None = None
    context_hint: str | None = None
    use_dna: bool = True
    target_language: str | None = None
    # Context Engine V1 — optional fields from extension
    platform: str | None = Field(default=None, max_length=50)
    recipient_domain: str | None = Field(default=None, max_length=255)
    thread_subject: str | None = Field(default=None, max_length=500)
    context_twin_override: str | None = Field(default=None, max_length=50)


class RewriteResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    output_text: str
    quality_score: float | None
    cache_hit: bool
    provider: str
    model: str
    latency_ms: int
    cost_usd: float
    context_detected: str | None
    intent_detected: str | None
    profile_version_used: int | None = None
    retry_count: int = 0


class FeedbackRequest(BaseModel):
    action: Literal["accepted", "rejected", "edited"]
    thumb: Literal[1, -1] | None = None
    edit_text: str | None = None
