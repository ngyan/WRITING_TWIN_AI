# Writing Twin AI — Architecture Decision Log

> Record every non-obvious architecture decision here.
> Format: Date · Decision · Reason · Alternatives Considered · Impact
> **Rule:** If a decision is already here, do NOT re-debate it unless there is a hard technical blocker.

---

## [2026-05-30] FastAPI over Django / Node.js Express

**Decision:** Backend in FastAPI (Python 3.12).
**Reason:** Async-native, Pydantic v2 for schema validation, fastest iteration for LLM-integrated APIs, native streaming support for future rewrite streaming. Python ecosystem for ML/AI (embeddings, LiteLLM, Qdrant client).
**Alternatives Considered:**
- Django: Too heavy, ORM is sync by default, poor async story
- Express/Node: Weaker typing, LiteLLM is Python-native, team has Python fluency
- FastAPI but Python 3.11: 3.12 is fastest Python release for async, no reason to downgrade
**Impact:** All backend code in Python. Frontend and extension in TypeScript.

---

## [2026-05-30] LiteLLM over Direct Provider SDKs

**Decision:** All LLM calls go through `litellm.acompletion()`. Zero direct `openai` / `anthropic` / `google-generativeai` SDK calls in business logic.
**Reason:** 
- Multi-provider fallback without code changes (`fallbacks=["claude-haiku-3", "gemini/gemini-1.5-flash"]`)
- Cost routing — cheapest model that meets quality threshold
- Provider outage resilience (OpenAI had multiple 5xx incidents in 2024–2025)
- LangFuse integration for LLM observability (single integration point)
**Alternatives Considered:**
- Direct OpenAI SDK: Vendor lock, no fallback, must rewrite on outage
- Custom router: Engineering overhead, reinventing LiteLLM
**Impact:** `app/services/router_service.py` is the single entry point for all LLM calls. No exceptions.

---

## [2026-05-30] Qdrant over Pinecone / pgvector / Weaviate

**Decision:** Qdrant for vector storage (Writing DNA embeddings + Communication Memory).
**Reason:**
- Self-hosted — user writing DNA never leaves our infra (privacy moat)
- gRPC native — faster than Pinecone REST for high-frequency embedding searches
- Payload filtering — filter by `user_id` + `memory_type` in one query
- Free to run on same VPS (no external API cost)
**Alternatives Considered:**
- Pinecone: SaaS cost adds up, data leaves infra, vendor lock
- pgvector: Works for low volume but slow at 10k+ vectors per user, no dedicated ANN index
- Weaviate: Heavier, more ops overhead
**Impact:** `docker-compose.yml` includes Qdrant service. Two collections: `user_dna` and `user_memory`.

---

## [2026-05-30] Chrome Extension as Primary Growth Engine (over Mobile App)

**Decision:** Chrome Extension MV3 ships before any iOS/Android native app.
**Reason:**
- Lives in the user's existing workflow (Gmail, Outlook, LinkedIn, Slack) — zero behavior change required
- No App Store approval friction (Chrome Web Store review is ~1–2 days)
- No $99/yr Apple Developer account required for MVP
- ParentReady (existing project) deferred iOS indefinitely due to App Store complexity — don't repeat
- SpeakFlowAI (existing project) deferred iOS until 100+ paying Android users — same lesson
- Primary Tier-1 segment (non-native English professionals) uses Gmail/LinkedIn on desktop daily
**Alternatives Considered:**
- iOS first: 2–3x engineering effort, app review delays, Apple 30% cut
- Android first: Faster than iOS but still slower than extension, less LinkedIn/Gmail use
- Web app only: Adds context-switching friction — breaks the "always there" moat
**Impact:** Sprint 3 = Chrome Extension. Mobile app is post-Series A or post-10k MAU.

---

## [2026-05-30] PostgreSQL over MongoDB

**Decision:** PostgreSQL 16 as primary database.
**Reason:**
- JSONB columns handle flexible profile data (Writing DNA metadata) without sacrificing relational integrity
- Alembic migrations keep schema in version control — critical for audit compliance (Enterprise Principle 4)
- SQLAlchemy 2.0 async gives full ORM + raw SQL flexibility
- All three existing projects (ParentReady, SpeakFlowAI backend, OnwardSafe API) use PostgreSQL successfully
**Alternatives Considered:**
- MongoDB: No migrations, schema drift risk, weaker typing with Pydantic
- SQLite: Not production-safe for multi-user concurrent writes
**Impact:** Single PostgreSQL instance, Docker-managed. Qdrant for vectors. Redis for ephemeral/cache.

---

## [2026-05-30] Redis for Semantic Cache + Sessions

**Decision:** Redis 7 for: semantic rewrite cache, JWT refresh tokens, rate limiting (slowapi), session data.
**Reason:**
- Semantic cache eliminates duplicate LLM calls for near-identical inputs — cuts AI cost by 30–60%
- Redis TTL handles token expiry natively (no DB cleanup job needed)
- ParentReady pattern: Redis for Celery broker + rate limiting — proven in production
**Alternatives Considered:**
- Memcached: No persistence, no TTL per key, weaker data structures
- DB-backed sessions: Adds write load on Postgres for every request
**Impact:** `app/services/cache_service.py` is the single entry for Redis. Semantic cache checked before every LLM call.

---

## [2026-05-30] uv for Python Package Management

**Decision:** `uv` (not pip, not poetry, not conda) for dependency management.
**Reason:**
- 10–100x faster installs than pip (written in Rust)
- `uv.lock` ensures reproducible builds across dev + CI + prod
- `uv run alembic upgrade head` replaces `python -m alembic` — single tool for all Python tasks
- Sprint 05-CLAUDE-CODE-INSTRUCTIONS.md already specifies uv
**Alternatives Considered:**
- Poetry: Slower, complex virtualenv management
- pip + requirements.txt: No lock file, non-reproducible
**Impact:** `pyproject.toml` + `uv.lock` tracked in git. `uv sync` on all machines.

---

## [2026-05-30] JWT 15min Access + 24h Refresh (httpOnly cookie)

**Decision:** Access token 15min, refresh token 24h in httpOnly cookie. Extension stores JWT in `chrome.storage.sync`.
**Reason:**
- ParentReady production pattern: JWT 15min access + 24h refresh, zero auth-related security incidents across 6 months
- httpOnly prevents XSS token theft on web app
- Chrome extension must use `chrome.storage.sync` (no cookies in service worker context)
**Alternatives Considered:**
- 1hr access token: Larger window for token theft if compromised
- Session-based auth: Stateful, doesn't scale to extension + web + future mobile
**Impact:** `app/core/security.py` — `create_access_token` (15min), `create_refresh_token` (24h). Refresh token stored in Redis with user_id mapping.

---

## [2026-05-30] Docker Compose → Single VPS (Hostinger) → k8s Later

**Decision:** Docker Compose for both dev and production. Single Hostinger VPS for initial deploy. Kubernetes only post-product-market-fit.
**Reason:**
- ParentReady runs 8 services (api, gui, nginx, db, redis, worker, beat, minio) on single VPS — sufficient for 10k MAU
- k8s adds 40+ hrs of ops overhead before first user — premature
- Single VPS + NGINX + Docker Compose is the minimum viable prod setup
**Alternatives Considered:**
- AWS ECS/EKS: 3–5x cost for MVP, steep learning curve
- Render/Railway: Limited control, more expensive at scale, no Qdrant support
- Fly.io: Better than managed, but Qdrant persistent storage requires extra config
**Impact:** `docker-compose.yml` in repo root. `deploy/deploy.sh` for SSH-based deploys.

---

## [2026-05-30] Audit Log + Feature Flags + Usage Events from Sprint 1

**Decision:** Three cross-cutting tables wired in Sprint 1: `audit_log`, `usage_events`, `feature_flags`.
**Reason:**
- ParentReady added activity logging in Sprint AO (~Sprint 20) — this was costly (required backfill migration, 2 extra sprints)
- Enterprise Principle 4 (enterprise-ready from day 1) requires audit logs
- Feature flags allow shipping incomplete code safely (gated behind `FEATURE_*` env vars)
- Usage events are the product telemetry for learning user behavior patterns (feed into DNA refinement)
**Alternatives Considered:**
- Add observability later: Proven to be expensive — ParentReady's lesson
- Third-party feature flag service (LaunchDarkly): Overkill for MVP, adds cost
**Impact:** Migration `0001_initial.py` includes all three tables. `AuditService` and `UsageService` are Sprint 1 deliverables.
