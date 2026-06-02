from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

OUTPUT_TYPES = Literal[
    "email",
    "reply",
    "customer_update",
    "jira_ticket",
    "technical_report",
    "linkedin_comment",
    "reddit_reply",
]


class VoiceDraftResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    transcript: str | None
    draft: str
    output_type: str
    provider: str
    model: str
    latency_ms: int
    cost_usd: float


class VoiceFeedbackRequest(BaseModel):
    accepted: bool
    edited_draft: str | None = Field(default=None, max_length=16000)
