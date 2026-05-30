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

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL", "")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

CORS_ORIGINS = [
    ALLOWED_ORIGIN,
    "https://writingtwinai.com",
    "https://www.writingtwinai.com",
    "http://localhost:3000",
]

# LiteLLM reads ANTHROPIC_API_KEY from the environment automatically
os.environ["ANTHROPIC_API_KEY"] = ANTHROPIC_API_KEY

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
    chosen_option: str  # "option1" | "option2" | "nodiff"
    option_order: list[str]  # echoed from RewriteResponse
    would_send: bool
    confidence: int | None = None  # 1-5
    comment: str | None = None
    email: str | None = None
    role: str | None = None
    payment_intent: str | None = None  # "no" | "maybe" | "$5/mo" | "$10/mo" | "$20/mo"


class FeedbackResponse(BaseModel):
    ok: bool


# --- Helpers ---

def _extract_text(content) -> str:
    """LiteLLM with Claude can return content as a list of blocks or a plain string."""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        return " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        ).strip()
    return str(content).strip()


def _build_samples_block(samples: list[str]) -> str:
    """Truncate each sample to 500 tokens (~400 words), combine."""
    MAX_CHARS = 1800  # ~500 tokens at 3.6 chars/token
    trimmed = [s[:MAX_CHARS] for s in samples]
    return "\n\n---\n\n".join(trimmed)


async def _rewrite_generic(draft: str) -> str:
    response = await litellm.acompletion(
        model="claude-haiku-4-5-20251001",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional writing assistant. "
                    "Rewrite the following text to be clearer, more professional, and easier to read. "
                    "Keep it concise. Output only the rewritten text — no explanations, "
                    "no bullet points, no markdown formatting, no headers."
                ),
            },
            {"role": "user", "content": draft},
        ],
        max_tokens=600,
        temperature=0.4,
    )
    return _extract_text(response.choices[0].message.content)


async def _rewrite_personalized(samples: list[str], draft: str) -> str:
    samples_block = _build_samples_block(samples)
    response = await litellm.acompletion(
        model="claude-haiku-4-5-20251001",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a writing assistant trained on exactly this person's writing style. "
                    "Here are examples of how they write:\n\n"
                    f"{samples_block}\n\n"
                    "Rewrite the following text to match their exact vocabulary, sentence rhythm, "
                    "tone, and phrasing. Do not make it more formal. Do not add corporate language. "
                    "Do not make it longer. Make it sound exactly like them. "
                    "Output only the rewritten text — no explanations, no markdown, no headers."
                ),
            },
            {"role": "user", "content": draft},
        ],
        max_tokens=600,
        temperature=0.3,
    )
    return _extract_text(response.choices[0].message.content)


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
    confidence: int | None,
    comment: str | None,
    email: str | None,
    role: str | None,
    payment_intent: str | None,
):
    if chosen_option == "nodiff":
        preferred_version = "none"
    else:
        idx = 0 if chosen_option == "option1" else 1
        preferred_version = option_order[idx]  # "generic" or "personalized"

    record = {
        "session_id": session_id,
        "chosen_option": chosen_option,
        "preferred_version": preferred_version,
        "would_send": would_send,
        "confidence": confidence,
        "comment": comment,
        "email": email,
        "role": role,
        "payment_intent": payment_intent,
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

    asyncio.create_task(_notify_founder(record))


async def _notify_founder(record: dict):
    """Email Gyan every time someone submits feedback."""
    if not RESEND_API_KEY:
        return
    try:
        import resend
        resend.api_key = RESEND_API_KEY

        preferred = record.get("preferred_version", "?")
        would_send = "Yes" if record.get("would_send") else "No"
        confidence = record.get("confidence") or "—"
        comment = record.get("comment") or "—"
        email = record.get("email") or "—"
        role = record.get("role") or "—"
        payment = record.get("payment_intent") or "—"
        ts = record.get("ts", "")[:19].replace("T", " ")

        rows = [
            ("Preferred version", preferred.upper()),
            ("Would send as-is", would_send),
            ("Confidence (1–5)", str(confidence)),
            ("Comment", comment),
            ("Email", email),
            ("Role", role),
            ("Payment intent", payment),
            ("Time", ts + " UTC"),
        ]
        table_rows = "".join(
            f'<tr><td style="padding:6px 12px;color:#666;white-space:nowrap">{k}</td>'
            f'<td style="padding:6px 12px;color:#111;font-weight:500">{v}</td></tr>'
            for k, v in rows
        )

        resend.Emails.send({
            "from": "Writing Twin <waitlist@writingtwinai.com>",
            "to": ["ngyan.prakash@gmail.com"],
            "subject": f"[Writing Twin] New response — preferred: {preferred}",
            "html": f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
  <p style="font-size:16px;font-weight:600;margin:0 0 16px">New demo response</p>
  <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:8px;overflow:hidden">
    {table_rows}
  </table>
  <p style="color:#888;font-size:12px;margin:20px 0 0">
    Session: {record.get('session_id','')[:8]}... ·
    <a href="https://api.writingtwinai.com/responses" style="color:#888">View all responses</a>
  </p>
</div>
""",
        })
    except Exception:
        pass


async def _send_waitlist_email(email: str):
    if not RESEND_API_KEY:
        return
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from": "Writing Twin <waitlist@writingtwinai.com>",
            "to": [email],
            "reply_to": "ngyan.prakash@gmail.com",
            "subject": "You're on the Writing Twin waitlist ✓",
            "html": """
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
  <p style="font-size:20px;font-weight:600;margin:0 0 16px">You're on the list.</p>
  <p style="color:#444;line-height:1.6;margin:0 0 16px">
    Thanks for testing Writing Twin. Your feedback helps us validate whether
    AI can genuinely learn someone's writing voice — not just polish their prose.
  </p>
  <p style="color:#444;line-height:1.6;margin:0 0 24px">
    We're running this demo with ~20 professionals. If 70%+ prefer the personalized
    version, we'll build the Chrome Extension next (Gmail + LinkedIn).
    Early access users get a <strong>60-day free Pro trial</strong> when it launches.
  </p>
  <p style="color:#444;line-height:1.6;margin:0 0 8px">
    We'll email you as soon as it's ready. One email, no spam.
  </p>
  <p style="color:#888;font-size:13px;margin:32px 0 0">— Gyan, founder of Writing Twin</p>
</div>
""",
        })
    except Exception:
        pass  # email is best-effort, never block the response


# --- Routes ---

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/rewrite", response_model=RewriteResponse)
async def rewrite(req: RewriteRequest):
    if not ANTHROPIC_API_KEY:
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
            req.confidence,
            req.comment,
            req.email,
            req.role,
            req.payment_intent,
        )
    )
    if req.email:
        asyncio.create_task(_send_waitlist_email(req.email))
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

        would_pay = [r.get("payment_intent") for r in records if r.get("payment_intent") and r.get("payment_intent") != "no"]
        return {
            "total_comparisons": total,
            "preferred_personalized": preferred_personalized,
            "preferred_personalized_pct": round(preferred_personalized / total * 100) if total else 0,
            "would_send": would_send,
            "would_send_pct": round(would_send / total * 100) if total else 0,
            "waitlist_signups": waitlist,
            "payment_interest": len(would_pay),
            "payment_intent_breakdown": {v: would_pay.count(v) for v in set(would_pay)},
            "phase0_threshold_met": (
                total >= 30
                and (preferred_personalized / total >= 0.60 if total else False)
            ),
        }
    except Exception as e:
        return {"error": str(e)}


class PaymentIntentRequest(BaseModel):
    session_id: str
    payment_intent: str


@app.post("/payment-intent")
async def payment_intent(req: PaymentIntentRequest):
    """Store payment intent submitted from the thank-you screen."""
    try:
        r = get_redis()
        if r:
            r.lpush("phase0:payment-intent", json.dumps({
                "session_id": req.session_id,
                "payment_intent": req.payment_intent,
                "ts": datetime.now(timezone.utc).isoformat(),
            }))
            # Patch into existing feedback record if it exists
            raw = r.lrange("phase0:feedback", 0, -1)
            for i, item in enumerate(raw):
                rec = json.loads(item)
                if rec.get("session_id") == req.session_id:
                    rec["payment_intent"] = req.payment_intent
                    r.lset("phase0:feedback", i, json.dumps(rec))
                    break
    except Exception:
        pass
    return {"ok": True}


@app.get("/responses")
async def responses():
    """All individual feedback records — for founder review."""
    r = get_redis()
    if not r:
        return {"error": "Redis not configured"}
    try:
        raw = r.lrange("phase0:feedback", 0, -1)
        records = [json.loads(f) for f in raw]
        # newest first, hide full session_id
        for rec in records:
            rec["session_id"] = rec.get("session_id", "")[:8] + "..."
        return {"count": len(records), "responses": records}
    except Exception as e:
        return {"error": str(e)}
