"""cultural.adapt.v1 — renders a locale-aware cultural block for injection into DNA prompts."""

_RULESETS: dict[str, dict] = {
    "en-US": {
        "label": "American English",
        "politeness": "Neutral-friendly",
        "directness": "High — lead with the point, contractions fine",
        "hierarchy": "Low — first-name basis is standard",
        "notes": "",
    },
    "en-GB": {
        "label": "British English",
        "politeness": "Polite-understated",
        "directness": "Medium — avoid overstatement, hedge slightly",
        "hierarchy": "Low-medium",
        "notes": "Prefer understatement over enthusiasm.",
    },
    "ko-KR": {
        "label": "Korean",
        "politeness": "Formal-respectful",
        "directness": "Low-medium — soften direct requests",
        "hierarchy": "High — respect seniority, avoid blunt 'no'",
        "notes": "Indirect refusals are preferred. Cushion disagreements.",
    },
    "ja-JP": {
        "label": "Japanese",
        "politeness": "Formal-deferential",
        "directness": "Low — indirect refusals, cushion all requests",
        "hierarchy": "High — keigo awareness, defer to seniority",
        "notes": "Indirect disagreement. Avoid imposing. Leave room for face-saving.",
    },
    "hi-IN": {
        "label": "Indian English",
        "politeness": "Warm-respectful",
        "directness": "Medium",
        "hierarchy": "Medium-high — relationship-first openings acceptable",
        "notes": (
            "Retain local idioms (e.g., 'do the needful', 'revert back') "
            "unless tone is executive."
        ),
    },
    "de-DE": {
        "label": "German",
        "politeness": "Direct-precise",
        "directness": "High — get to the point, precision over warmth",
        "hierarchy": "Low — titles only in formal contexts",
        "notes": "",
    },
    "ar": {
        "label": "Arabic (MENA)",
        "politeness": "Warm-formal",
        "directness": "Low-medium — relationship-first, gracious openings",
        "hierarchy": "High — honor titles, relationship-first",
        "notes": "",
    },
}

# Locales where the cultural block should be suppressed when tone is 'direct'
# (to avoid double-direct redundancy)
_SUPPRESS_DIRECT_TONES = {"en-US", "de-DE"}

_TEMPLATE = """\
Cultural adaptation for {label}:
- Politeness: {politeness}
- Directness: {directness}
- Hierarchy sensitivity: {hierarchy}
- Apply these WITHOUT making the text sound translated or stiff. The user still sounds like themselves; this only tunes social register.{notes_line}"""


def get_cultural_block(locale: str, tone: str) -> str | None:
    """Return the cultural block string, or None if no adaptation is needed.

    en-US is the baseline language of all prompts — no block needed.
    """
    # en-US is the baseline — base prompts already use US conventions
    if locale == "en-US":
        return None

    # Normalise — strip region variants we don't have an exact match for
    ruleset = _RULESETS.get(locale)
    if not ruleset:
        # Try language-only prefix
        lang = locale.split("-")[0]
        ruleset = _RULESETS.get(lang)
    if not ruleset:
        return None

    # Suppress for direct tone on already-direct locales
    if tone == "direct" and locale in _SUPPRESS_DIRECT_TONES:
        return None

    notes_line = f"\n- {ruleset['notes']}" if ruleset["notes"] else ""
    return _TEMPLATE.format(
        label=ruleset["label"],
        politeness=ruleset["politeness"],
        directness=ruleset["directness"],
        hierarchy=ruleset["hierarchy"],
        notes_line=notes_line,
    )
