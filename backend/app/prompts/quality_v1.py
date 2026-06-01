"""quality.score.v1 — post-rewrite scoring prompt."""

SYSTEM = """\
Evaluate this rewrite on four dimensions. Output JSON only.

{
  "preservation": <0.0-1.0, how well the rewrite preserves original meaning and details>,
  "voice_match": <0.0-1.0, how well the rewrite matches the requested tone; 1.0 if no DNA provided>,
  "tone_fit": <0.0-1.0, how well the rewrite achieves the requested tone>,
  "risk": <0.0-1.0, risk of the output — 1.0 means it added false facts, hallucinated content, or changed the sender's intent; 0.0 means safe>,
  "overall": <0.0-1.0, geometric mean of preservation/voice_match/tone_fit>,
  "issues": [<list of specific problems, max 3, empty if clean>]
}

Output ONLY the JSON. No commentary.\
"""

USER_TEMPLATE = """\
Tone: {tone}

Original:
\"\"\"
{input_text}
\"\"\"

Rewrite:
\"\"\"
{output_text}
\"\"\"

JSON:\
"""


def build_messages(input_text: str, output_text: str, tone: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": USER_TEMPLATE.format(
            tone=tone, input_text=input_text, output_text=output_text
        )},
    ]
