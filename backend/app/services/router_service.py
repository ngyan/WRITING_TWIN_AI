"""RouterService — LiteLLM wrapper with plan-based model selection + circuit breaker."""
import time
from dataclasses import dataclass
from typing import Any

import litellm
import structlog
from fastapi import HTTPException

from app.core.config import settings

log = structlog.get_logger()

litellm.drop_params = True


@dataclass(frozen=True)
class ModelChoice:
    key: str
    model: str
    provider: str
    input_cost: float   # per token
    output_cost: float  # per token


MODELS: dict[str, ModelChoice] = {
    "gemini-flash": ModelChoice(
        "gemini-flash", "gemini/gemini-2.0-flash", "gemini",
        0.075 / 1_000_000, 0.30 / 1_000_000,
    ),
    "claude-haiku": ModelChoice(
        "claude-haiku", "claude-haiku-4-5-20251001", "anthropic",
        1.0 / 1_000_000, 5.0 / 1_000_000,
    ),
    "claude-sonnet": ModelChoice(
        "claude-sonnet", "claude-sonnet-4-6", "anthropic",
        3.0 / 1_000_000, 15.0 / 1_000_000,
    ),
    "gpt-4o-mini": ModelChoice(
        "gpt-4o-mini", "gpt-4.1-mini", "openai",
        0.40 / 1_000_000, 1.60 / 1_000_000,
    ),
}

FALLBACKS: dict[str, list[str]] = {
    "gemini-flash": ["gpt-4o-mini", "claude-haiku"],
    "claude-haiku": ["gpt-4o-mini", "gemini-flash"],
    "claude-sonnet": ["gpt-4o-mini", "claude-haiku"],
    "gpt-4o-mini":  ["gemini-flash", "claude-haiku"],
}

# ── Circuit breaker (in-process; resets on restart) ──────────────────────────
_failures: dict[str, int] = {}
_opened_at: dict[str, float] = {}


def _is_open(key: str) -> bool:
    if key not in _opened_at:
        return False
    if time.monotonic() - _opened_at[key] > settings.CIRCUIT_RESET_SECONDS:
        _opened_at.pop(key, None)
        _failures[key] = 0
        return False
    return True


def _record_success(key: str) -> None:
    _failures[key] = 0
    _opened_at.pop(key, None)


def _record_failure(key: str) -> None:
    _failures[key] = _failures.get(key, 0) + 1
    if _failures[key] >= settings.CIRCUIT_BREAK_THRESHOLD:
        if key not in _opened_at:
            log.warning("circuit_breaker.opened", provider=key, failures=_failures[key])
        _opened_at[key] = time.monotonic()


# ── Model selection ───────────────────────────────────────────────────────────

def select_model(user_plan: str, tone: str, context: str | None = None) -> ModelChoice:
    """Select model by plan. Executive tone always escalates to Sonnet."""
    if tone == "executive" or context == "executive":
        return MODELS["claude-sonnet"]
    match user_plan:
        case "pro" | "team":
            return MODELS["claude-haiku"]
        case "enterprise":
            return MODELS["claude-sonnet"]
        case _:
            return MODELS["gemini-flash"]


def configure_keys() -> None:
    """Inject API keys from settings into litellm (called once at startup)."""
    if settings.ANTHROPIC_API_KEY:
        litellm.anthropic_key = settings.ANTHROPIC_API_KEY
    if settings.OPENAI_API_KEY:
        litellm.openai_key = settings.OPENAI_API_KEY
    if settings.GEMINI_API_KEY:
        litellm.gemini_key = settings.GEMINI_API_KEY


# ── LLM completion with fallback chain ───────────────────────────────────────

async def complete(
    model_choice: ModelChoice,
    messages: list[dict[str, Any]],
    max_tokens: int = 1024,
) -> tuple[str, int, int]:
    """Call LLM. Tries primary model then fallback chain on transient errors.

    Returns (output_text, input_tokens, output_tokens).
    Raises HTTPException(503) if all providers fail.
    """
    candidates = [model_choice.key] + FALLBACKS.get(model_choice.key, [])
    available = [k for k in candidates if not _is_open(k)]
    if not available:
        # All circuits open — reset the primary and try anyway
        log.warning("circuit_breaker.all_open", candidates=candidates)
        available = [model_choice.key]

    last_error: Exception | None = None
    for key in available:
        mc = MODELS[key]
        try:
            resp = await litellm.acompletion(
                model=mc.model,
                messages=messages,
                max_tokens=max_tokens,
                timeout=settings.LLM_TIMEOUT_SECONDS,
            )
            text = resp.choices[0].message.content or ""
            usage = resp.usage
            in_tok = usage.prompt_tokens if usage else 0
            out_tok = usage.completion_tokens if usage else 0
            _record_success(key)
            log.info("router.complete", model=mc.model, in_tok=in_tok, out_tok=out_tok)
            return text.strip(), in_tok, out_tok

        except litellm.exceptions.AuthenticationError as exc:
            # Bad API key — skip this provider, do not count as transient failure
            log.error("router.auth_error", model=mc.model, error=str(exc))
            last_error = exc

        except (
            litellm.exceptions.RateLimitError,
            litellm.exceptions.ServiceUnavailableError,
            litellm.exceptions.APIConnectionError,
            litellm.exceptions.Timeout,
        ) as exc:
            log.warning("router.transient_error", model=mc.model, error=str(exc))
            _record_failure(key)
            last_error = exc

        except Exception as exc:
            log.warning("router.unexpected_error", model=mc.model, error=str(exc))
            _record_failure(key)
            last_error = exc

    log.error("router.all_failed", tried=available, last_error=str(last_error))
    raise HTTPException(
        status_code=503,
        detail="AI service temporarily unavailable. Please try again.",
        headers={"Retry-After": "60"},
    )


def compute_cost(mc: ModelChoice, input_tokens: int, output_tokens: int) -> float:
    return round(mc.input_cost * input_tokens + mc.output_cost * output_tokens, 8)
