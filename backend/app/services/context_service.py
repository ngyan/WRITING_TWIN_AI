"""ContextService — V1 static rules engine.

Inputs:  platform, recipient_domain, thread_subject
Output:  context_twin string (professional | social | community | casual |
                               customer | technical | escalation)

Rules are evaluated top-to-bottom; first match wins.
All string comparisons are case-insensitive.
"""
from __future__ import annotations

ESCALATION_KEYWORDS = frozenset({
    "incident", "p1", "p0", "urgent", "sla breach", "sla", "critical",
    "outage", "down", "escalation", "blocker", "severity 1", "sev1",
})

TECHNICAL_PLATFORMS = frozenset({"jira", "confluence", "github", "gitlab", "pagerduty"})
CASUAL_PLATFORMS    = frozenset({"whatsapp", "imessage", "sms", "telegram", "signal"})
SOCIAL_PLATFORMS    = frozenset({"linkedin"})
COMMUNITY_PLATFORMS = frozenset({"reddit"})

ContextTwin = str  # type alias for clarity


def detect(
    platform: str | None = None,
    recipient_domain: str | None = None,
    thread_subject: str | None = None,
    customer_domains: list[str] | None = None,
) -> ContextTwin:
    """Return the context twin for this message."""
    p = (platform or "").lower().strip()
    domain = (recipient_domain or "").lower().strip()
    subject = (thread_subject or "").lower()
    customer_domains = [d.lower().strip() for d in (customer_domains or [])]

    # 1 — Escalation override (always beats everything else)
    if subject and any(kw in subject for kw in ESCALATION_KEYWORDS):
        return "escalation"

    # 2 — Technical platforms
    if p in TECHNICAL_PLATFORMS:
        return "technical"

    # 3 — Social
    if p in SOCIAL_PLATFORMS:
        return "social"

    # 4 — Community
    if p in COMMUNITY_PLATFORMS:
        return "community"

    # 5 — Casual
    if p in CASUAL_PLATFORMS:
        return "casual"

    # 6 — Customer (recipient domain in user's customer list)
    if domain and customer_domains and any(
        domain == cd or domain.endswith(f".{cd}") for cd in customer_domains
    ):
        return "customer"

    # 7 — Default: professional (Gmail, Outlook, unknown)
    return "professional"


def apply_to_prompt_context(context_twin: ContextTwin) -> dict[str, str]:
    """Return a dict of extra prompt hints for the given context twin.

    These are injected into the humanize / voice prompt to steer tone.
    """
    hints: dict[str, dict[str, str]] = {
        "professional": {
            "tone_guidance": (
                "Formal, clear, respectful. Suitable for email to colleagues or managers."
            ),
        },
        "customer": {
            "tone_guidance": (
                "Professional and empathetic. Preserve the user's voice but ensure "
                "clarity and politeness appropriate for customer-facing communication."
            ),
        },
        "escalation": {
            "tone_guidance": (
                "Direct, factual, urgent but calm. Lead with status/impact. "
                "No fluff. Technical precision required."
            ),
        },
        "social": {
            "tone_guidance": (
                "Professional yet warm. Suitable for LinkedIn — insightful, "
                "not salesy. Avoid hashtag spam."
            ),
        },
        "community": {
            "tone_guidance": (
                "Conversational and on-topic. Match the community's register. "
                "Be direct and helpful."
            ),
        },
        "casual": {
            "tone_guidance": "Relaxed, natural, friendly. First-name basis is fine.",
        },
        "technical": {
            "tone_guidance": (
                "Precise, structured. Preserve all technical terms, ticket IDs, "
                "version numbers, and commands exactly."
            ),
        },
    }
    return hints.get(context_twin, hints["professional"])
