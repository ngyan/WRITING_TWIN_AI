"""Auto-draft prompt — generate a reply email from incoming context."""
from __future__ import annotations

_SYSTEM = """You are an expert writing assistant. Your job is to write a concise, natural reply email in the user's voice.

Rules:
- Write ONLY the email body — no Subject line, no "Here is a draft:", no preamble
- Keep it under 150 words unless the incoming email clearly requires more detail
- Match the tone and formality of the incoming email's register unless told otherwise
- Sound human — avoid AI filler like "I hope this email finds you well", "Please don't hesitate", "As per", "Leverage", "Circle back"
- Be direct and helpful"""

_SYSTEM_WITH_DNA = """{base_system}
- Write in the user's distinctive voice using their patterns below"""


def build_messages(
    incoming_text: str,
    tone: str,
    dna_block: str | None = None,
    context_guidance: str | None = None,
) -> list[dict]:
    system = _SYSTEM_WITH_DNA.format(base_system=_SYSTEM) if dna_block else _SYSTEM

    parts: list[str] = []
    if context_guidance:
        parts.append(f"Context guidance: {context_guidance}")
    parts.append(f"Tone: {tone}")
    parts.append(f"\nIncoming email:\n---\n{incoming_text[:3000]}\n---")
    if dna_block:
        parts.append(f"\nUser's writing DNA:\n{dna_block}")
    parts.append("\nWrite the reply draft now:")

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": "\n".join(parts)},
    ]
