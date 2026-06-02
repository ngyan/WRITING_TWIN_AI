"""humanize.dna.v1 — personalized rewrite using Writing DNA + memory + cultural block."""

SYSTEM = """\
You are Writing Twin, a communication assistant that sounds exactly like the user — not like generic AI.\
"""

USER_TEMPLATE = """\
The user's writing fingerprint:
{dna_block}
{memory_section}
Tone requested: {tone}
{cultural_section}
Rules:
1. Mirror the user's sentence-length distribution and vocabulary preferences from the DNA block.
2. Adopt their greeting and signoff styles when natural.
3. Use their common phrases when they fit organically — never force them.
4. Preserve every concrete detail (names, dates, numbers, links).
5. Do not add facts the user did not provide.
6. Length within ±30% of the input.
7. Output ONLY the rewritten text. No preamble.
8. Match input language.

Input:
\"\"\"
{text}
\"\"\"

Rewritten (in the user's voice):\
"""

_DNA_TEMPLATE = """\
- Avg sentence length: {avg_sentence_length} words
- Formality: {formality_score}/1.0
- Warmth: {warmth_score}/1.0
- Directness: {directness_score}/1.0
- Typical greetings: {greeting_styles}
- Typical signoffs: {signoff_styles}
- Common phrases: {common_phrases}
- Vocabulary preferences: {vocabulary_preferences}
- Punctuation habits: {punctuation_habits}\
"""


def build_dna_block(profile: object) -> str:
    def _fmt_list(val: object, limit: int) -> str:
        if not val:
            return "none observed"
        items = list(val) if isinstance(val, (list, tuple)) else []  # type: ignore[arg-type]
        return ", ".join(f'"{x}"' for x in items[:limit])

    def _fmt_score(val: object) -> str:
        return f"{val:.2f}" if val is not None else "n/a"

    vocab = getattr(profile, "vocabulary_preferences", None) or {}
    favored = vocab.get("favored_words", [])
    avoided = vocab.get("avoided_patterns", [])
    vocab_summary = (
        f"favors [{', '.join(favored[:10])}]; avoids [{', '.join(avoided[:5])}]"
        if favored or avoided
        else "none observed"
    )

    punct = getattr(profile, "punctuation_habits", None) or {}
    punct_summary = (
        f"em-dash={punct.get('uses_em_dash', '?')}, "
        f"exclamation={punct.get('uses_exclamation', '?')}, "
        f"emoji={punct.get('uses_emoji', '?')}, "
        f"lists={punct.get('uses_lists', '?')}"
    )

    return _DNA_TEMPLATE.format(
        avg_sentence_length=_fmt_score(getattr(profile, "avg_sentence_length", None)),
        formality_score=_fmt_score(getattr(profile, "formality_score", None)),
        warmth_score=_fmt_score(getattr(profile, "warmth_score", None)),
        directness_score=_fmt_score(getattr(profile, "directness_score", None)),
        greeting_styles=_fmt_list(getattr(profile, "greeting_styles", []), 3),
        signoff_styles=_fmt_list(getattr(profile, "signoff_styles", []), 3),
        common_phrases=_fmt_list(getattr(profile, "common_phrases", []), 10),
        vocabulary_preferences=vocab_summary,
        punctuation_habits=punct_summary,
    )


def build_messages(
    tone: str,
    text: str,
    dna_block: str,
    memory_examples: list[str],
    cultural_block: str | None,
    context_guidance: str | None = None,
) -> list[dict]:
    memory_section = ""
    if memory_examples:
        examples_str = "\n".join(f"  - {e}" for e in memory_examples)
        memory_section = f"\nPast approved phrasings from this user (use as style reference):\n{examples_str}\n"

    cultural_section = ""
    if cultural_block:
        cultural_section = f"\n{cultural_block}\n"

    user_content = USER_TEMPLATE.format(
        dna_block=dna_block,
        memory_section=memory_section,
        tone=tone,
        cultural_section=cultural_section,
        text=text,
    )
    if context_guidance:
        user_content = f"Context guidance: {context_guidance}\n\n{user_content}"

    return [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": user_content},
    ]
