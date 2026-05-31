"""context.detect.v1 and intent.classify.v1 prompts."""

CONTEXT_SYSTEM = """\
Classify the following message into ONE primary context. Output a single lowercase word from this list:

[sales, support, apology, executive, negotiation, social, creator, internal, recruiting, fundraising, casual, other]

Rules:
- One word. No punctuation. No explanation.
- If multiple apply, choose the dominant one.
- If unsure, output: other\
"""

INTENT_SYSTEM = """\
Classify the writer's primary intent into ONE word from this list:

[inform, persuade, negotiate, request, apologize, decline, thank, follow_up, introduce, complain, escalate, celebrate, other]

Output a single lowercase word. No punctuation. No explanation.\
"""

VALID_CONTEXTS = frozenset([
    "sales", "support", "apology", "executive", "negotiation", "social",
    "creator", "internal", "recruiting", "fundraising", "casual", "other",
])

VALID_INTENTS = frozenset([
    "inform", "persuade", "negotiate", "request", "apologize", "decline",
    "thank", "follow_up", "introduce", "complain", "escalate", "celebrate", "other",
])


def build_context_messages(text: str) -> list[dict]:
    return [
        {"role": "system", "content": CONTEXT_SYSTEM},
        {"role": "user", "content": f'Message:\n"""\n{text}\n"""\n\nContext:'},
    ]


def build_intent_messages(text: str) -> list[dict]:
    return [
        {"role": "system", "content": INTENT_SYSTEM},
        {"role": "user", "content": f'Message:\n"""\n{text}\n"""\n\nIntent:'},
    ]


def parse_context(raw: str) -> str:
    word = raw.strip().lower().split()[0] if raw.strip() else "other"
    return word if word in VALID_CONTEXTS else "other"


def parse_intent(raw: str) -> str:
    word = raw.strip().lower().split()[0] if raw.strip() else "other"
    return word if word in VALID_INTENTS else "other"
