from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class WritingSampleInput(BaseModel):
    source: str = Field(default="email")
    body: str = Field(min_length=10, max_length=10_000)
    sent_at: str | None = None


class DNASamplesRequest(BaseModel):
    samples: list[WritingSampleInput] = Field(min_length=1, max_length=200)


class DNASamplesResponse(BaseModel):
    status: str
    sample_count: int
    extraction_status: str


class WritingProfileRead(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    user_id: UUID
    avg_sentence_length: float | None
    avg_paragraph_length: float | None
    formality_score: float | None
    warmth_score: float | None
    directness_score: float | None
    common_phrases: Any
    greeting_styles: Any
    signoff_styles: Any
    vocabulary_preferences: Any
    punctuation_habits: Any
    sample_count: int
    extraction_status: str
    last_refined_at: datetime | None
    version: int
