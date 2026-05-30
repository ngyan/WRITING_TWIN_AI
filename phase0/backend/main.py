import os
import json
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Annotated

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import litellm

load_dotenv()

# --- Config ---

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL", "")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")

CORS_ORIGINS = [
    ALLOWED_ORIGIN,
    "https://writingtwinai.com",
    "https://www.writingtwinai.com",
    "http://localhost:3000",
]

litellm.api_key = GEMINI_API_KEY

# Lazy Upstash client
_redis = None

def get_redis():
    global _redis
    if _redis is None and UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN:
        from upstash_redis import Redis
        _redis = Redis(url=UPSTASH_REDIS_REST_URL, token=UPSTASH_REDIS_REST_TOKEN)
    return _redis

# --- App ---

app = FastAPI(title="Writing Twin Phase 0", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---

class RewriteRequest(BaseModel):
    samples: list[str] = Field(..., min_length=1, max_length=5, description="1-5 writing samples")
    draft: str = Field(..., min_length=10, max_length=2000, description="Text to rewrite")
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class RewriteResponse(BaseModel):
    session_id: str
    generic: str
    personalized: str
    option_order: list[str]  # ["generic","personalized"] or ["personalized","generic"]


class FeedbackRequest(BaseModel):
    session_id: str
    chosen_option: str  # "option1" or "option2"
    option_order: list[str]  # echoed from RewriteResponse
    would_send: bool
    email: str | None = None  # waitlist signup


class FeedbackResponse(BaseModel):
    ok: bool


# --- Helpers ---

def _build_samples_block(samples: list[str]) -> str:
    """Truncate each sample to 500 tokens (~400 words), combine."""
    MAX_CHARS = 1800  # ~500 tokens at 3.6 chars/token
    trimmed = [s[:MAX_CHARS] for s in samples]
    return "\n\n---\n\n".join(trimmed)


async def _rewrite_generic(draft: str) -> str:
    response = await litellm.acompletion(
        model="gemini/gemini-2.0-flash",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional writing assistant. "
                    "Rewrite the following text to be clearer, more professional, "
                    "and easier to read. Keep it concise."
                ),
            },
            {"role": "user", "content": draft},
        ],
        max_tokens=600,
        temperature=0.4,
    )
    return response.choices[0].message.content.strip()


async def _rewrite_personalized(samples: list[str], draft: str) -> str:
    samples_block = _build_samples_block(samples)
    response = await litellm.acompletion(
        model="gemini/gemini-2.0-flash",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a writing assistant trained on exactly this person's writing style. "
                    "Here are examples of how they write:\n\n"
                    f"{samples_block}\n\n"
                    "Rewrite the following text to match their exact vocabulary, sentence rhythm, "
                    "tone, and phrasing. Do not make it more formal. Do not add corporate language. "
                    "Do not make it longer. Make it sound exactly like them."
                ),
            },
            {"role": "user", "content": draft},
        ],
        max_tokens=600,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def _random_option_order(session_id: str) -> list[str]:
    """Deterministic shuffle per session_id so both API and frontend agree."""
    import hashlib
    h = int(hashlib.md5(session_id.encode()).hexdigest(), 16)
    return ["generic", "personalized"] if h % 2 == 0 else ["personalized", "generic"]


async def _log_rewrite(session_id: str, has_samples: int):
    try:
        r = get_redis()
        if r:
            r.lpush(
                "phase0:rewrites",
                json.dumps({
                    "session_id": session_id,
                    "samples_count": has_samples,
                    "ts": datetime.now(timezone.utc).isoformat(),
                }),
            )
    except Exception:
        pass  # logging is best-effort


async def _log_feedback(
    session_id: str,
    chosen_option: str,
    option_order: list[str],
    would_send: bool,
    email: str | None,
):
    # Determine which version was preferred
    idx = 0 if chosen_option == "option1" else 1
    preferred_version = option_order[idx]  # "generic" or "personalized"

    record = {
        "session_id": session_id,
        "chosen_option": chosen_option,
        "preferred_version": preferred_version,
        "would_send": would_send,
        "email": email,
        "ts": datetime.now(timezone.utc).isoformat(),
    }

    try:
        r = get_redis()
        if r:
            r.lpush("phase0:feedback", json.dumps(record))
            if email:
                r.lpush("phase0:waitlist", json.dumps({"email": email, "ts": record["ts"]}))
    except Exception:
        pass


# --- Routes ---

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/rewrite", response_model=RewriteResponse)
async def rewrite(req: RewriteRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="API key not configured")

    try:
        generic, personalized = await asyncio.gather(
            _rewrite_generic(req.draft),
            _rewrite_personalized(req.samples, req.draft),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)[:200]}")

    order = _random_option_order(req.session_id)
    asyncio.create_task(_log_rewrite(req.session_id, len(req.samples)))

    return RewriteResponse(
        session_id=req.session_id,
        generic=generic,
        personalized=personalized,
        option_order=order,
    )


@app.post("/feedback", response_model=FeedbackResponse)
async def feedback(req: FeedbackRequest):
    asyncio.create_task(
        _log_feedback(
            req.session_id,
            req.chosen_option,
            req.option_order,
            req.would_send,
            req.email,
        )
    )
    return FeedbackResponse(ok=True)


@app.get("/stats")
async def stats():
    """Simple result summary — for the founder to check validation progress."""
    r = get_redis()
    if not r:
        return {"error": "Redis not configured"}

    try:
        raw_feedback = r.lrange("phase0:feedback", 0, -1)
        records = [json.loads(f) for f in raw_feedback]

        total = len(records)
        preferred_personalized = sum(1 for r in records if r.get("preferred_version") == "personalized")
        would_send = sum(1 for r in records if r.get("would_send"))
        waitlist = r.llen("phase0:waitlist")

        return {
            "total_comparisons": total,
            "preferred_personalized": preferred_personalized,
            "preferred_personalized_pct": round(preferred_personalized / total * 100) if total else 0,
            "would_send": would_send,
            "would_send_pct": round(would_send / total * 100) if total else 0,
            "waitlist_signups": waitlist,
            "phase0_threshold_met": (
                total >= 10
                and (preferred_personalized / total >= 0.70 if total else False)
            ),
        }
    except Exception as e:
        return {"error": str(e)}
