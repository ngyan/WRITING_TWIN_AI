# LiteLLM Routing Architecture

> Operational rules for the AI Orchestration Layer.
> See `core/11-FOUNDING-CONSTITUTION.md` → Engine 5 (AI Orchestration Layer) for the WHY.
> See `core/06-COST-MODEL.md` for the full unit economics.
> **Last Updated:** 2026-05-30

---

## Core Rule

**ALL LLM calls go through `app/services/router_service.py` using `litellm.acompletion()`.**

No exceptions. No `from openai import OpenAI` in business logic. No direct Anthropic SDK. No direct Google SDK.

---

## Model Inventory

| Alias | LiteLLM Model ID | Use Case | Cost Tier |
|---|---|---|---|
| `fast` | `gemini/gemini-1.5-flash` | Free tier rewrites, high-volume | $0.075/$0.30 per 1M |
| `balanced` | `gpt-4o-mini` | Pro fallback, cost-quality balance | $0.15/$0.60 per 1M |
| `quality` | `claude-haiku-3-5` | Pro tier primary, DNA rewrites | $0.25/$1.25 per 1M |
| `premium` | `claude-sonnet-3-5` | Enterprise, complex rewrites | $3.00/$15.00 per 1M |
| `embed` | `text-embedding-3-small` | DNA + Memory embeddings | $0.02 per 1M |

---

## Routing Logic (Plan-Based)

```python
# app/services/router_service.py

from litellm import acompletion
from app.core.config import settings

PLAN_MODEL_MAP = {
    "free": "fast",
    "pro": "quality",
    "team": "quality",
    "enterprise": "premium",
}

FALLBACK_CHAIN = {
    "fast":    ["balanced", "quality"],
    "balanced": ["fast", "quality"],
    "quality": ["balanced", "fast"],
    "premium": ["quality", "balanced"],
}

async def route_completion(
    messages: list[dict],
    user_plan: str,
    force_model: str | None = None,
    temperature: float = 0.7,
) -> str:
    model_alias = force_model or PLAN_MODEL_MAP.get(user_plan, "fast")
    model_id = MODEL_IDS[model_alias]
    fallbacks = [MODEL_IDS[f] for f in FALLBACK_CHAIN[model_alias]]

    response = await acompletion(
        model=model_id,
        messages=messages,
        temperature=temperature,
        timeout=settings.LLM_TIMEOUT_SECONDS,  # default: 30
        fallbacks=fallbacks,
        num_retries=2,
    )
    return response.choices[0].message.content
```

---

## Usage Event Logging (Every LLM Call)

Every call to `route_completion` MUST log to `usage_events` table:

```python
# Called automatically by router_service.py wrapper
await usage_service.log(
    user_id=user_id,
    event_type="rewrite",
    model=model_id,
    input_tokens=response.usage.prompt_tokens,
    output_tokens=response.usage.completion_tokens,
    latency_ms=elapsed_ms,
    cost_usd=litellm.completion_cost(response),
    cache_hit=cache_hit,
    quality_retries=retry_count,
)
```

---

## Semantic Cache (Redis)

Before every LLM call, check the semantic cache:

```python
# app/services/cache_service.py

async def get_cached_rewrite(
    text: str,
    tone: str,
    user_id: UUID | None,
    similarity_threshold: float = 0.92,
) -> str | None:
    query_embedding = await embed(text)
    
    # Check Redis semantic cache (cosine similarity > threshold)
    cached = await redis.semantic_search(
        embedding=query_embedding,
        collection=f"rewrite_cache:{tone}",
        threshold=similarity_threshold,
    )
    return cached.result if cached else None
```

**Cache TTL:** 1 hour for non-DNA rewrites. DNA rewrites are NOT cached (personalized = must be fresh).

**Target cache hit rate:** > 35% on free tier (same/similar inputs from many users).

---

## Feature Flags for Engine Gating

```python
# Settings (app/core/config.py)
class Settings(BaseSettings):
    FEATURE_WRITING_DNA: bool = False        # Sprint 4
    FEATURE_CONTEXT_ENGINE: bool = True      # Sprint 2 (basic context detection)
    FEATURE_CULTURAL_ENGINE: bool = False    # Sprint 5
    FEATURE_QUALITY_RETRY: bool = False      # Sprint 6
    FEATURE_EXTENSION_BETA: bool = False     # Sprint 3 (extension beta users only)
    FEATURE_COMMUNICATION_MEMORY: bool = False  # Sprint 5
```

**Rule:** All engine features start as `False`. Set to `True` in `.env` when the sprint that implements them ships.

---

## LangFuse Integration (Observability)

```python
# app/core/config.py
LANGFUSE_PUBLIC_KEY: str = ""
LANGFUSE_SECRET_KEY: str = ""
LANGFUSE_HOST: str = "https://cloud.langfuse.com"

# app/services/router_service.py
from litellm.integrations.langfuse import LangfuseLogger

# LiteLLM auto-integrates with LangFuse when env vars are set
os.environ["LANGFUSE_PUBLIC_KEY"] = settings.LANGFUSE_PUBLIC_KEY
os.environ["LANGFUSE_SECRET_KEY"] = settings.LANGFUSE_SECRET_KEY
```

LangFuse captures: model, tokens, latency, cost, trace per user, error details.

---

## Provider Outage Handling

LiteLLM handles fallbacks automatically. The fallback chain ensures:
1. If Gemini is down → GPT-4o mini serves Free tier rewrites
2. If Claude is down → GPT-4o mini serves Pro rewrites
3. If ALL providers fail → Return `503 Service Temporarily Unavailable` with retry-after header

**Never return an LLM error as a 500.** Always catch `litellm.exceptions.*` in `router_service.py`:

```python
from litellm.exceptions import AuthenticationError, RateLimitError, ServiceUnavailableError

try:
    result = await acompletion(...)
except RateLimitError:
    raise HTTPException(429, "Rate limit exceeded — retry in 60 seconds")
except ServiceUnavailableError:
    raise HTTPException(503, "AI service temporarily unavailable", headers={"Retry-After": "60"})
except Exception:
    logger.exception("Unexpected LLM error")
    raise HTTPException(503, "Rewrite service temporarily unavailable")
```

---

## Prompt Construction (Separation of Concerns)

**Rule:** Prompts live in `app/prompts/` — never inline in services.

```
app/prompts/
├── humanize_base.py       → humanize.base.v1
├── dna_extract.py         → dna.extract.v1
├── dna_humanize.py        → humanize.dna.v1  (DNA-aware rewrite)
├── context_intent.py      → context.detect.v1 + intent.classify.v1
├── quality_score.py       → quality.score.v1
└── cultural.py            → cultural.adapt.v1
```

Each prompt module exports:
```python
def build_messages(text: str, **kwargs) -> list[dict]:
    # Returns OpenAI-compatible messages list
    ...
```
