"""dna.extract.v1 — extract WritingProfile JSON from a corpus of writing samples."""

_SYSTEM = "You are a writing analyst. You extract a structured writing fingerprint from a set of writing samples. Output only valid JSON."

_USER_TEMPLATE = """\
You are analyzing how one person writes, based on samples of their own outbound communication. Your output must be parseable JSON conforming to this exact schema:

{{
  "avg_sentence_length": <float, average words per sentence>,
  "avg_paragraph_length": <float, average sentences per paragraph>,
  "formality_score": <float 0.0–1.0>,
  "warmth_score": <float 0.0–1.0>,
  "directness_score": <float 0.0–1.0>,
  "common_phrases": [<up to 15 phrases the user actually uses repeatedly>],
  "greeting_styles": [<up to 5 distinct greetings observed>],
  "signoff_styles": [<up to 5 distinct signoffs observed>],
  "vocabulary_preferences": {{
    "favored_words": [<up to 20 distinctive words used more than baseline>],
    "avoided_patterns": [<up to 5 patterns the user clearly avoids>]
  }},
  "punctuation_habits": {{
    "uses_em_dash": <bool>,
    "uses_exclamation": <"rare"|"moderate"|"frequent">,
    "uses_questions_in_statements": <bool>,
    "uses_emoji": <"never"|"rare"|"frequent">,
    "uses_lists": <"never"|"rare"|"frequent">
  }}
}}

Rules:
- Base every value on evidence in the samples. Do not invent.
- Phrases must appear at least 2 times across the corpus to count as "common".
- Formality, warmth, directness: judge against a baseline of business English.
- Output ONLY the JSON. No commentary, no markdown fences.

Samples:
{samples_block}"""


def build_messages(samples_block: str) -> list[dict]:
    return [
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": _USER_TEMPLATE.format(samples_block=samples_block)},
    ]


def build_samples_block(samples: list[dict]) -> str:
    """Concatenate samples into a single block for the prompt."""
    parts = []
    for i, s in enumerate(samples, 1):
        source = s.get("source", "email")
        body = s.get("body", "").strip()
        parts.append(f"--- Sample {i} ({source}) ---\n{body}")
    return "\n\n".join(parts)
