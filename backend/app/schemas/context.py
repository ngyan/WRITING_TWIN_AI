from typing import Literal

from pydantic import BaseModel, Field, field_validator

VALID_CONTEXT_TWINS = Literal[
    "professional", "social", "community", "casual",
    "customer", "technical", "escalation",
]


class DetectContextRequest(BaseModel):
    platform: str | None = Field(default=None, max_length=50)
    recipient_domain: str | None = Field(default=None, max_length=255)
    thread_subject: str | None = Field(default=None, max_length=500)


class DetectContextResponse(BaseModel):
    context_twin: str
    tone_guidance: str


class CustomerDomainsResponse(BaseModel):
    domains: list[str]


class AddDomainRequest(BaseModel):
    domain: str = Field(min_length=1, max_length=255)

    @field_validator("domain")
    @classmethod
    def normalise(cls, v: str) -> str:
        # Strip scheme, path, port — keep bare domain
        v = v.lower().strip()
        v = v.removeprefix("https://").removeprefix("http://")
        v = v.split("/")[0].split(":")[0]
        return v


class RemoveDomainRequest(BaseModel):
    domain: str = Field(min_length=1, max_length=255)


class OverrideContextRequest(BaseModel):
    detected_context: str = Field(max_length=50)
    selected_context: str = Field(max_length=50)
    platform: str | None = Field(default=None, max_length=50)
    recipient_domain: str | None = Field(default=None, max_length=255)
