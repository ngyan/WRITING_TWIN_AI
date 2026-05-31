"""RouterService — LiteLLM wrapper with plan-based model selection."""
from dataclasses import dataclass

import litellm
import structlog

from app.core.config import settings

log = structlog.get_logger()

litellm.drop_params = True  # ignore unknown params silently


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
}


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


async def complete(
    model_choice: ModelChoice,
    messages: list[dict],
    max_tokens: int = 1024,
) -> tuple[str, int, int]:
    """
    Returns (output_text, input_tokens, output_tokens).
    Tries primary model then fallback chain on transient errors.
    """
    candidates = [model_choice.key] + FALLBACKS.get(model_choice.key, [])

    last_error: Exception | None = None
    for key in candidates:
        mc = MODELS[key]
        try:
            resp = await litellm.acompletion(
                model=mc.model,
                messages=messages,
                max_tokens=max_tokens,
                timeout=20,
            )
            text = resp.choices[0].message.content or ""
            usage = resp.usage
            in_tok = usage.prompt_tokens if usage else 0
            out_tok = usage.completion_tokens if usage else 0
            return text.strip(), in_tok, out_tok
        except Exception as exc:
            log.warning("router.fallback", model=mc.model, error=str(exc))
            last_error = exc

    raise RuntimeError(f"All LLM providers failed. Last: {last_error}") from last_error


def compute_cost(mc: ModelChoice, input_tokens: int, output_tokens: int) -> float:
    return round(mc.input_cost * input_tokens + mc.output_cost * output_tokens, 8)
