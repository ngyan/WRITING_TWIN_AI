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


class SnapshotRequest(BaseModel):
    text: str = Field(min_length=80, max_length=5_000)


class SnapshotResponse(BaseModel):
    # Quantitative (computed locally)
    avg_sentence_length: float       # words per sentence
    vocabulary_diversity: float      # TTR 0-1
    avg_word_length: float           # chars per word

    # Qualitative (LLM)
    formality_score: int             # 1-10
    writing_archetype: str           # e.g. "The Efficient Communicator"
    signature_patterns: list[str]    # 3 bullets
    famous_author_match: str         # e.g. "Hemingway"
    famous_author_reason: str        # one sentence


class ConsistencyResponse(BaseModel):
    total_with_feedback: int
    accepted: int
    accuracy_pct: int | None  # None = no feedback yet


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
