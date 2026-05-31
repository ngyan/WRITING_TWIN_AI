"""CulturalService — Cultural Intelligence Engine.

Produces the cultural_block string injected into personalized prompts.
No LLM call, no DB — pure locale-to-prompt-text transformation.
"""
from app.prompts.cultural import get_cultural_block


def get_block(locale: str | None, tone: str) -> str | None:
    """Return cultural adaptation block for the given locale and tone, or None."""
    return get_cultural_block(locale or "en-US", tone)
