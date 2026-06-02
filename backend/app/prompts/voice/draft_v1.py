"""voice.draft.v1 — convert raw spoken transcript into a polished communication draft."""

OUTPUT_TYPE_INSTRUCTIONS: dict[str, str] = {
    "email": (
        "Write a complete professional email with a clear subject line (format: Subject: ...) "
        "followed by the email body. Include greeting, body paragraphs, and signoff."
    ),
    "reply": (
        "Write a concise email reply. Include a greeting, direct response, and a brief signoff. "
        "No need for a subject line."
    ),
    "customer_update": (
        "Write a professional customer-facing update. Clear status, what was done, what's next. "
        "Empathetic tone, no jargon. 2–4 sentences."
    ),
    "jira_ticket": (
        "Write a Jira ticket. Format:\n"
        "Title: [one-line summary]\n"
        "Description: [context and background]\n"
        "Acceptance Criteria:\n- [criterion 1]\n- [criterion 2]\n"
        "Priority: [High/Medium/Low]\n"
        "Labels: [relevant labels]"
    ),
    "technical_report": (
        "Write a technical report or RCA summary. Include: Background, Root Cause, Impact, "
        "Resolution, and Next Steps sections. Preserve all technical details from the transcript."
    ),
    "linkedin_comment": (
        "Write a LinkedIn comment. Professional yet personable. 2–4 sentences. "
        "Adds genuine insight or perspective. No hashtags or emojis unless the speaker used them."
    ),
    "reddit_reply": (
        "Write a Reddit reply. Conversational, on-point, concise. "
        "Match the community tone. 1–4 sentences."
    ),
}

SYSTEM = """\
You are Writing Twin, a communication assistant. Your job is to transform a raw spoken transcript \
into a polished, send-ready communication that sounds exactly like the user — natural, professional \
where appropriate, never generic AI.\
"""

USER_TEMPLATE = """\
{dna_section}Output type: {output_type}
Format instructions: {format_instructions}

Rules:
1. Preserve every concrete detail from the transcript (names, dates, numbers, ticket IDs, URLs).
2. Clean up verbal filler (um, uh, like, you know) without losing meaning.
3. Do NOT add facts the speaker did not mention.
4. Preserve technical vocabulary exactly as spoken.
5. Output ONLY the final draft — no preamble, no explanation.
6. Match the user's voice from the DNA block when provided.

Spoken transcript:
\"\"\"
{transcript}
\"\"\"

Draft:\
"""

DNA_TEMPLATE = """\
User's writing fingerprint:
- Avg sentence length: {avg_sentence_length} words
- Formality: {formality_score}/1.0
- Typical greetings: {greeting_styles}
- Typical signoffs: {signoff_styles}
- Common phrases: {common_phrases}

"""


def build_messages(
    transcript: str,
    output_type: str,
    dna_block: str | None = None,
) -> list[dict[str, str]]:
    format_instructions = OUTPUT_TYPE_INSTRUCTIONS.get(
        output_type,
        "Write a clear, professional response."
    )
    dna_section = f"{dna_block}\n\n" if dna_block else ""
    user_content = USER_TEMPLATE.format(
        dna_section=dna_section,
        output_type=output_type,
        format_instructions=format_instructions,
        transcript=transcript,
    )
    return [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": user_content},
    ]
