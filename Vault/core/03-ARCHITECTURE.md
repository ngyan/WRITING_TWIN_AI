# Architecture — Writing Twin AI

> **Purpose:** Single source of truth for data models, API contracts, service boundaries.
> **Rule:** When Claude Code asks "what does the X model look like?" — answer from this file.

---

## 🏛️ High-Level Topology

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Chrome Ext    │     │  Next.js Web   │     │  Future:       │
│  (MV3)         │     │  App (SSR)     │     │  Mobile, API   │
└────────┬───────┘     └────────┬───────┘     └────────┬───────┘
         │                      │                      │
         └──────────────────────┴──────────────────────┘
                                │
                          HTTPS + JWT
                                │
                    ┌───────────▼────────────┐
                    │      Nginx (TLS)       │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   FastAPI Backend      │
                    │  ┌──────────────────┐  │
                    │  │ Auth Service     │  │
                    │  │ Humanize Service │  │
                    │  │ DNA Service      │  │
                    │  │ Routing Service  │  │
                    │  │ Cache Service    │  │
                    │  │ Billing Service  │  │
                    │  └──────────────────┘  │
                    └─────┬──────────┬───────┘
                          │          │
        ┌─────────────────┼──────────┼──────────────┐
        │                 │          │              │
   ┌────▼─────┐    ┌─────▼────┐  ┌─▼───┐    ┌──────▼────┐
   │ Postgres │    │  Redis   │  │Qdrant│    │ LiteLLM  │
   │ (truth)  │    │ (cache,  │  │(DNA  │    │ → OpenAI │
   │          │    │  queue)  │  │embed)│    │ → Claude │
   └──────────┘    └──────────┘  └──────┘    │ → Gemini │
                                              │ → Ollama │
                                              └──────────┘
```

---

## 📊 Core Data Models (SQLAlchemy + Pydantic)

### User
```python
# app/models/user.py
class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str | None]      # null for OAuth users
    google_oauth_sub: Mapped[str | None] = mapped_column(unique=True, index=True)
    full_name: Mapped[str | None]
    locale: Mapped[str] = mapped_column(default="en-US")   # e.g., "ko-KR", "hi-IN"
    plan: Mapped[str] = mapped_column(default="free")      # free|pro|team|enterprise
    stripe_customer_id: Mapped[str | None] = mapped_column(unique=True)
    is_email_verified: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    last_active_at: Mapped[datetime | None]

    # Relationships
    writing_profile: Mapped["WritingProfile"] = relationship(back_populates="user", uselist=False)
    rewrites: Mapped[list["Rewrite"]] = relationship(back_populates="user")
```

### WritingProfile (The DNA)
```python
# app/models/writing_profile.py
class WritingProfile(Base):
    __tablename__ = "writing_profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), unique=True)

    # Quantitative DNA (extracted from samples)
    avg_sentence_length: Mapped[float | None]
    avg_paragraph_length: Mapped[float | None]
    formality_score: Mapped[float | None]       # 0.0 (casual) → 1.0 (executive)
    warmth_score: Mapped[float | None]          # 0.0 (cold) → 1.0 (warm)
    directness_score: Mapped[float | None]      # 0.0 (indirect) → 1.0 (blunt)

    # Qualitative DNA (JSONB)
    common_phrases: Mapped[list[str]] = mapped_column(JSONB, default=list)
    greeting_styles: Mapped[list[str]] = mapped_column(JSONB, default=list)
    signoff_styles: Mapped[list[str]] = mapped_column(JSONB, default=list)
    vocabulary_preferences: Mapped[dict] = mapped_column(JSONB, default=dict)
    punctuation_habits: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Meta
    sample_count: Mapped[int] = mapped_column(default=0)
    last_refined_at: Mapped[datetime | None]
    qdrant_collection: Mapped[str | None]       # e.g., "user_{uuid}_samples"
    version: Mapped[int] = mapped_column(default=1)   # increment on every refinement

    user: Mapped["User"] = relationship(back_populates="writing_profile")
```

### Rewrite (Audit log + feedback substrate)
```python
# app/models/rewrite.py
class Rewrite(Base):
    __tablename__ = "rewrites"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)

    # Inputs
    input_text: Mapped[str]
    input_hash: Mapped[str] = mapped_column(index=True)   # for cache key
    tone: Mapped[str]                                     # casual|professional|executive|...
    context_detected: Mapped[str | None]                  # sales|support|apology|...
    intent_detected: Mapped[str | None]                   # negotiate|inform|persuade|...

    # Output
    output_text: Mapped[str]
    quality_score: Mapped[float | None]
    cache_hit: Mapped[bool] = mapped_column(default=False)

    # Cost/latency
    provider: Mapped[str]                                 # gemini|claude|openai|ollama
    model: Mapped[str]                                    # exact model string
    input_tokens: Mapped[int]
    output_tokens: Mapped[int]
    latency_ms: Mapped[int]
    cost_usd: Mapped[float]

    # User signal
    user_action: Mapped[str | None]                       # accepted|rejected|edited|copied
    user_edit_text: Mapped[str | None]                    # if edited, the final text user kept
    feedback_thumb: Mapped[int | None]                    # 1 = up, -1 = down

    created_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)
```

### Subscription (Stripe mirror)
```python
class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), unique=True)
    stripe_subscription_id: Mapped[str] = mapped_column(unique=True)
    stripe_price_id: Mapped[str]
    plan: Mapped[str]                                     # pro|team|enterprise
    status: Mapped[str]                                   # active|trialing|past_due|canceled
    current_period_end: Mapped[datetime]
    cancel_at_period_end: Mapped[bool] = mapped_column(default=False)
    seats: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
```

### CommunicationMemory (Communication Memory Engine)
```python
# app/models/communication_memory.py
class CommunicationMemory(Base):
    __tablename__ = "communication_memory"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    rewrite_id: Mapped[UUID | None] = mapped_column(ForeignKey("rewrites.id"))

    # What happened
    memory_type: Mapped[str]                 # approved|edited|accepted|rejected|preference
    final_text: Mapped[str]                  # the version the user actually kept
    original_output: Mapped[str | None]      # what the model produced before user edits
    tone: Mapped[str]
    context: Mapped[str | None]

    # Learning signal
    edit_distance: Mapped[float | None]      # how far user moved from model output (0 = accepted as-is)
    qdrant_point_id: Mapped[str | None]      # vector in `user_memory` collection

    created_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)
```
> The Memory Engine feeds DNA refinement. High edit-distance memories are strong negative signals; zero-edit acceptances are strong positive signals. See `FeedbackService`.

### QualityScore (embedded in Rewrite, not a separate table)
Quality Engine scores are stored as columns on the `rewrite` row to avoid a join on the hot path. Add these fields to the `Rewrite` model when implementing S2:
```python
    # Quality Engine (nullable until scored)
    score_human: Mapped[float | None]        # 0–1, "sounds human not AI"
    score_style_match: Mapped[float | None]  # 0–1, matches user DNA
    score_readability: Mapped[float | None]  # 0–1
    score_confidence: Mapped[float | None]   # 0–1, model's confidence
    score_risk: Mapped[float | None]         # 0–1, higher = riskier (legal/tone landmines)
    retry_count: Mapped[int] = mapped_column(default=0)  # how many retries before threshold met
```

### TeamWorkspace (Phase 3+)
Stub now, expand in Sprint 9. Reserve table name `team_workspaces`.

---

## 🔌 API Contracts (FastAPI Routers)

### Base URL
`POST https://api.writingtwin.ai/v1/...`

### Auth Endpoints
```
POST   /auth/register              → 201 + JWT pair
POST   /auth/login                 → 200 + JWT pair
POST   /auth/refresh               → 200 + new access token (refresh in httpOnly cookie)
POST   /auth/logout                → 204
POST   /auth/google                → 200 + JWT pair
POST   /auth/forgot-password       → 204
POST   /auth/reset-password        → 204
GET    /auth/me                    → 200 + UserRead
```

### Humanize Endpoints (Core)
```
POST   /humanize                   → 200 + RewriteResponse
  body: { text, tone, intent?, context?, profile_version? }

POST   /humanize/batch             → 200 + [RewriteResponse]  (Pro+)
GET    /humanize/{rewrite_id}      → 200 + Rewrite (audit)
POST   /humanize/{rewrite_id}/feedback → 204
  body: { action: "accepted"|"rejected"|"edited", thumb?, edit_text? }
```

### Writing DNA Endpoints
```
POST   /dna/samples                → 202 (async extraction)
  body: { samples: [{ source: "email"|"linkedin"|...|text", body, sent_at? }] }

GET    /dna/profile                → 200 + WritingProfileRead
POST   /dna/profile/refine         → 202 (re-train from accumulated samples)
DELETE /dna/profile                → 204 (GDPR)
```

### Billing Endpoints
```
POST   /billing/checkout           → 200 + { checkout_url }
POST   /billing/portal             → 200 + { portal_url }
POST   /billing/webhook            → 200 (Stripe signature verified)
GET    /billing/usage              → 200 + { rewrites_used, plan_limit, period_end }
```

---

## 📦 Pydantic Schemas (selected)

```python
# app/schemas/humanize.py
class HumanizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=8000)
    tone: Literal["casual", "professional", "executive", "friendly", "direct", "diplomatic"]
    intent: str | None = None
    context_hint: str | None = None      # e.g., "client follow-up"
    use_dna: bool = True
    target_language: str | None = None   # ISO 639-1, defaults to detected

class RewriteResponse(BaseModel):
    id: UUID
    output_text: str
    quality_score: float | None
    cache_hit: bool
    provider: str
    model: str
    latency_ms: int
    cost_usd: float
    context_detected: str | None
    intent_detected: str | None
    profile_version_used: int | None
```

---

## 🗂️ Redis Key Patterns

```
session:{user_id}                       → JSON session payload
rate_limit:{user_id}:{window}           → counter
cache:humanize:{tone}:{input_hash}      → JSON cached RewriteResponse  (TTL 24h)
cache:semantic:embedding:{vec_hash}     → bucketed semantic cache pointer
job:dna_extract:{user_id}               → progress 0–100
ws:user:{user_id}                       → WebSocket session id (for streaming)
```

---

## 🧠 Qdrant Collections

```
collection: user_writing_samples
  vectors:
    text-embedding-3-small  (1536-d, OpenAI) — primary
  payload:
    user_id (UUID)
    sample_id (UUID)
    text (str)
    source (str)               // email|linkedin|chat|doc
    sent_at (ISO datetime)
    formality (float)
    warmth (float)
    is_outbound (bool)

collection: semantic_cache
  vectors:
    text-embedding-3-small  (1536-d)
  payload:
    rewrite_id (UUID)
    tone (str)
    output_text (str)
    quality_score (float)
    hit_count (int)
    created_at (ISO)

collection: user_memory
  vectors:
    text-embedding-3-small  (1536-d)
  payload:
    user_id (UUID)
    memory_id (UUID)
    memory_type (str)          // approved|edited|accepted|rejected|preference
    final_text (str)
    tone (str)
    context (str)
    edit_distance (float)
    created_at (ISO)
```

Similarity threshold for cache hit: cosine ≥ 0.93 (tune empirically). See `06-COST-MODEL.md`.
The `user_memory` collection is queried during personalized rewrites (S5) to retrieve the user's closest past-approved phrasings for in-context examples.

---

## 🧩 Service Boundaries (Inside Backend)

| Service | Responsibility | Owns |
|---|---|---|
| `AuthService` | Login, JWT issue/refresh, OAuth | `users` table, password hashing |
| `HumanizeService` | Orchestrates rewrite pipeline | `rewrites` table |
| `DNAService` | Extract + maintain WritingProfile | `writing_profiles` table + Qdrant `user_writing_samples` |
| `RouterService` | LLM provider selection + LiteLLM proxy | No DB; calls external |
| `CacheService` | Exact + semantic cache | Redis + Qdrant `semantic_cache` |
| `BillingService` | Stripe subscriptions + entitlements | `subscriptions` table |
| `FeedbackService` | Ingest user actions, feed back to DNA | Writes to `rewrites`, triggers DNA refinement |
| `MemoryService` | Store/retrieve approved outputs, edits, accept/reject history | `communication_memory` table + Qdrant `user_memory` |
| `CulturalService` | Inject locale-aware politeness/directness/hierarchy into prompts | No DB; reads `user.locale` + cultural ruleset |
| `QualityService` | Score every output (human/style/readability/confidence/risk); trigger retry | No DB; writes scores to `rewrites` |

**Rule:** Services don't import each other's DB models. They expose async methods. Routes call services. Services call repositories. Repositories own SQLAlchemy queries.

### Engine → Service Mapping (Constitutional Engines)

The six engines named in `11-FOUNDING-CONSTITUTION.md` map to services as follows:

| Constitutional Engine | Implemented By | Sprint |
|---|---|---|
| Writing DNA Engine | `DNAService` | S4 |
| Communication Memory Engine | `MemoryService` + `FeedbackService` | S5 (memory), S8 (refinement loop) |
| Context Engine | inside `HumanizeService` (context.detect prompt) | S2 |
| Cultural Intelligence Engine | `CulturalService` | S5 |
| AI Orchestration Layer | `RouterService` + `CostGuardService` | S2, hardened S6 |
| Quality Engine | `QualityService` | S2 (scoring), S6 (retry loop) |

---

## 📂 Backend Folder Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py             # Pydantic Settings (env-driven)
│   │   ├── security.py           # JWT, password hashing
│   │   └── db.py                 # SQLAlchemy engine + session
│   ├── models/                   # SQLAlchemy ORM models (1 file per table)
│   ├── schemas/                  # Pydantic request/response (1 file per domain)
│   ├── repositories/             # DB queries (1 per model)
│   ├── services/                 # Business logic (1 per service above)
│   ├── routers/                  # FastAPI routers (1 per domain)
│   ├── deps/                     # FastAPI dependencies (auth, db, etc.)
│   ├── tasks/                    # Celery / async tasks
│   ├── prompts/                  # Prompt templates (see 07-PROMPTS-LIBRARY.md)
│   └── main.py                   # FastAPI app factory
├── alembic/                      # Migrations
├── tests/
├── docker/
├── pyproject.toml
└── .env.example
```

---

## 🐳 Environment Variables (`.env.example`)

```bash
# === App ===
APP_ENV=development
SECRET_KEY=change-me-in-prod
ACCESS_TOKEN_TTL_MIN=15
REFRESH_TOKEN_TTL_DAYS=30

# === Database ===
DATABASE_URL=postgresql+asyncpg://wt:wt@localhost:5432/writing_twin
REDIS_URL=redis://localhost:6379/0
QDRANT_URL=http://localhost:6333

# === LLM Providers ===
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
LITELLM_BASE_URL=http://localhost:4000

# === Stripe ===
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_TEAM_MONTHLY=

# === Observability ===
SENTRY_DSN=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

# === Feature Flags ===
FEATURE_SEMANTIC_CACHE=true
FEATURE_DNA_AUTO_REFINE=false
FEATURE_OLLAMA_FALLBACK=false
```

---

## ⚠️ Architectural Non-Negotiables

1. **All LLM calls go through `RouterService`.** No SDK calls in business logic.
2. **All rewrites hit `CacheService` first.** Exact hash → semantic similarity → LLM.
3. **Writing DNA never returns raw embeddings to clients.** Only derived scores + the rewrite output.
4. **All async operations have idempotency keys** (especially Stripe webhooks).
5. **Feature flags wrap every Phase 2+ feature** until validated in production.
6. **All sensitive logs use structured logging with PII redaction.** Never log full email bodies.
