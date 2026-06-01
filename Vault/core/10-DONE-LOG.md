# Done Log — Writing Twin AI

> Log every completed sprint here so Claude Code has full context of what's been done.

---

## Format

```
## [YYYY-MM-DD] Sprint <N> — <Feature Name>

- Files created: [list]
- Files modified: [list]
- Packages added: [list]
- Migrations: [alembic revision IDs]
- Tests added: [count + brief description]
- Notes: [any gotchas, design decisions, follow-ups]
- Branch: [branch name]
- Commit: [SHA]
- Status: ✅ Complete | ⚠️ Partial | ❌ Reverted
```

---

## [2026-05-30] Sprint 0 — Vault & Documentation Foundation

- Files created:
  - `Vault/00-PROJECT-INDEX.md`
  - `Vault/01-VISION-AND-BUSINESS-PLAN.md`
  - `Vault/02-DESIGN-SYSTEM.md`
  - `Vault/03-ARCHITECTURE.md`
  - `Vault/04-SPRINT-PLAN.md`
  - `Vault/05-CLAUDE-CODE-INSTRUCTIONS.md`
  - `Vault/06-COST-MODEL.md`
  - `Vault/07-PROMPTS-LIBRARY.md`
  - `Vault/08-MOAT.md`
  - `Vault/09-GTM-STRATEGY.md`
  - `Vault/10-DONE-LOG.md`
  - `Vault/active/SPRINT_01_BACKEND_FOUNDATION.md`
- Files modified: none (greenfield)
- Packages added: none
- Notes: Documentation patterns adapted from OnwardSafe vault. Cost model and prompt library are net-new additions reflecting this product's LLM-heavy architecture. All pricing in `06-COST-MODEL.md` should be verified against provider websites before committing budgets — numbers are mid-2026 approximations. Default routing locked: Free → Gemini Flash, Pro → Claude Haiku, Enterprise → Claude Sonnet.
- Branch: n/a (pre-repo)
- Status: ✅ Complete

---

<!-- Add future sprint entries below this line -->

## [2026-05-30] Phase 0 — Resend Email Integration

- Files modified:
  - `phase0/backend/main.py` — added `RESEND_API_KEY` config, `_send_waitlist_email()` async function, `asyncio.create_task` in feedback route
  - `phase0/backend/pyproject.toml` — added `resend>=2.0`
  - `phase0/backend/.env.example` — added `RESEND_API_KEY` entry
- Infrastructure:
  - Resend domain verified: `writingtwinai.com` — 4 DNS records added in Hostinger (DKIM TXT, MX send, SPF TXT, DMARC TXT)
  - Sending from: `waitlist@writingtwinai.com`
- Notes: Email is best-effort (exceptions swallowed), never blocks the response. API key stored only on VPS in `.env`, never in git.
- Commits: `3e2f29d`
- Status: ✅ Complete

## [2026-05-30] Phase 0 — UX Bug Fixes (Comparison Step)

- Files modified:
  - `phase0/frontend/app/components/ComparisonStep.tsx`:
    - Validation error message moved to directly below option cards (not buried at bottom of page)
    - Page auto-scrolls to option cards when Submit clicked without selection (`useRef` + `scrollIntoView`)
    - `setValidationMsg("")` added to option card clicks and would-send button clicks so error clears on selection
    - Error text updated to "Please select Version A, Version B, or No Difference above."
- Commits: `6825b1c`, `54999b1`
- Status: ✅ Complete

## [2026-05-30] Phase 0 — Full Redesign (Pivot Directive)

Executed full product strategy pivot: from minimal A/B demo → conversion-optimised validation tool.

- Files created:
  - `phase0/frontend/app/components/LandingStep.tsx` — hero, 3-step explainer, before/after example cards, dual CTA ("Try the Demo" + "See Example"), bottom CTA
- Files modified:
  - `phase0/frontend/app/page.tsx` — added `"landing"` step as default; header logo now navigates back to landing; step indicator only visible in demo steps
  - `phase0/frontend/app/components/SamplesStep.tsx` — single large textarea replaces 5 separate boxes; "Try with sample data" amber pill button; character progress hint
  - `phase0/frontend/app/components/ComparisonStep.tsx` — renamed Option 1/2 → Version A/B; added "No difference" dashed button; added confidence 1–5 row; added optional comment textarea; added role field to waitlist section; chosen_option now accepts `"nodiff"`
  - `phase0/frontend/app/components/ThankYouStep.tsx` — added payment intent question (No/Maybe/$5/$10/$20/mo) shown before thank-you message; success criteria updated to 30 users / 60%
  - `phase0/frontend/app/lib/api.ts` — FeedbackRequest updated with `confidence`, `comment`, `role`, `payment_intent` fields; chosen_option type includes `"nodiff"`
  - `phase0/backend/main.py` — FeedbackRequest model expanded; `_log_feedback` stores all new fields; `preferred_version` = `"none"` for nodiff; Phase 0 threshold updated to 30 users / 60%
- Commits: `28824b6`
- Status: ✅ Complete

## [2026-05-30] Phase 0 — Founder Feedback Loop + Payment Intent Backend

- Files created:
  - `phase0/frontend/app/api/payment-intent/route.ts` — Next.js proxy route → backend `/payment-intent`
- Files modified:
  - `phase0/backend/main.py`:
    - `_notify_founder()` — sends email to `ngyan.prakash@gmail.com` on every feedback submission via Resend; includes preferred version, would-send, confidence, comment, email, role, payment intent
    - `_log_feedback()` — now calls `_notify_founder()` as background task after saving to Redis
    - `GET /responses` — returns all individual feedback records (newest first, session_id truncated)
    - `POST /payment-intent` — stores payment intent from thank-you screen; patches matching feedback record in Redis
    - `GET /stats` — now includes `payment_interest` count and `payment_intent_breakdown` dict; threshold updated to 30/60%
  - `phase0/frontend/app/components/ThankYouStep.tsx` — imports `getSessionId`, POSTs to `/api/payment-intent` instead of sessionStorage
- How to access responses:
  - Per-submission email → `ngyan.prakash@gmail.com`
  - All responses: `https://api.writingtwinai.com/responses`
  - Aggregate stats: `https://api.writingtwinai.com/stats`
- Commits: `02ecc61`
- Status: ✅ Complete

## [2026-05-30] Phase 0 — Demo Deployment (Hostinger VPS)

- Files created:
  - `phase0/backend/main.py` — FastAPI app (rewrite, feedback, stats, health endpoints)
  - `phase0/backend/Dockerfile` — Python 3.12-slim + uv
  - `phase0/backend/pyproject.toml` — FastAPI, LiteLLM, Upstash Redis, Uvicorn
  - `phase0/frontend/` — Next.js 14 App Router with A/B writing style comparison UI
  - `phase0/frontend/Dockerfile` — multi-stage Node 20 standalone build
  - `docker-compose.phase0.yml` — wt_backend (8011) + wt_frontend (3010)
  - `Vault/deploy/nginx-writingtwinai.conf` — NGINX config (www→root 301, SSL blocks)
  - `Vault/deploy/deploy-phase0.sh` — rsync + docker compose redeploy script
  - `DNS_SETUP.md` — VPS deployment reference (replaces Render/Vercel approach)
- Files modified:
  - `phase0/frontend/next.config.ts` — added `output: "standalone"`
- Infrastructure:
  - VPS: Hostinger `72.61.236.80` (shares server with onwardsafe.com, zero conflict)
  - Ports: backend 8011, frontend 3010 (onwardsafe uses 8020, 3000, 5173)
  - SSL: Let's Encrypt via Certbot, auto-renews, expires 2026-08-28
  - DNS: 3 A records in Hostinger → VPS IP
- LLM: LiteLLM → `gemini/gemini-1.5-flash` (Phase 0 only)
- Storage: Upstash Redis (feedback + waitlist logging)
- Notes:
  - Switched from Render (backend) + Vercel (frontend) to VPS mid-session — eliminates cold starts, keep-warm cron, and credential sprawl across 3 platforms
  - `BACKEND_URL` is server-side only; frontend containers reach backend via Docker internal network (`http://wt-backend:8000`)
  - Phase 0 has no DB — all state in Upstash Redis
- Branch: `main`
- Commit: `c5e8304`
- Status: ✅ Complete — live at `https://writingtwinai.com`

---

## [2026-05-31] Sprint 1 — Backend Foundation

- Files created:
  - `backend/pyproject.toml` — FastAPI + SQLAlchemy + asyncpg + alembic + redis + qdrant-client + structlog + httpx; bcrypt direct (passlib dropped for bcrypt 5.x compat)
  - `backend/Dockerfile` — python:3.12-slim + uv
  - `backend/.env.example` — all env vars (app, DB, LLM providers, Stripe, observability, feature flags)
  - `backend/alembic.ini` — standard alembic config
  - `backend/alembic/env.py` — async-aware alembic env; imports all 4 models
  - `backend/alembic/script.py.mako` — standard template
  - `backend/alembic/versions/0001_initial.py` — creates users, audit_log, usage_events, feature_flags; seeds 6 feature flags
  - `backend/app/__init__.py`
  - `backend/app/main.py` — FastAPI app factory with structlog lifespan
  - `backend/app/core/__init__.py`
  - `backend/app/core/config.py` — Pydantic Settings (all env vars + feature flags)
  - `backend/app/core/security.py` — hash_password, verify_password, create_access_token, create_refresh_token, decode_token
  - `backend/app/core/db.py` — async engine, AsyncSessionLocal, Base
  - `backend/app/models/__init__.py`
  - `backend/app/models/user.py` — User model (id, email, hashed_password, full_name, is_active, is_verified, plan, google_id, created_at, updated_at, last_active_at); all datetime columns tz-aware
  - `backend/app/models/audit_log.py` — AuditLog model per spec
  - `backend/app/models/usage_event.py` — UsageEvent model per spec
  - `backend/app/models/feature_flag.py` — FeatureFlag model per spec
  - `backend/app/schemas/__init__.py`
  - `backend/app/schemas/auth.py` — RegisterRequest (8-char min), LoginRequest, TokenPair, RefreshRequest
  - `backend/app/schemas/user.py` — UserRead (from_attributes=True), UserCreate
  - `backend/app/repositories/__init__.py`
  - `backend/app/repositories/user_repo.py` — get_by_email, get_by_id, create, update_last_active
  - `backend/app/services/__init__.py`
  - `backend/app/services/auth_service.py` — register, login, refresh, get_current_user_by_token
  - `backend/app/services/audit_service.py` — fire-and-forget asyncio.create_task audit logging
  - `backend/app/services/usage_service.py` — fire-and-forget usage event logging
  - `backend/app/routers/__init__.py`
  - `backend/app/routers/health.py` — GET /v1/health with DB+Redis check
  - `backend/app/routers/auth.py` — register, login, refresh, logout, me; google/forgot-password/reset-password stubbed (Sprint 7 TODOs)
  - `backend/app/deps/__init__.py`
  - `backend/app/deps/db.py` — get_db async generator
  - `backend/app/deps/auth.py` — current_user dependency (HTTPBearer → decode → DB lookup)
  - `backend/tests/__init__.py`
  - `backend/tests/conftest.py` — session-scoped event loop, test DB create/drop, client fixture per test
  - `backend/tests/test_auth.py` — 6 tests (register, login success, login wrong password, refresh, me with token, me without token)
  - `docker-compose.yml` — postgres:16 + redis:7 + qdrant:latest + backend with healthchecks
  - `.gitignore` — Python, Node, env, IDE, logs
- Packages added: fastapi[standard], uvicorn[standard], sqlalchemy[asyncio], asyncpg, alembic, pydantic, pydantic-settings, python-jose[cryptography], bcrypt>=4, redis, qdrant-client, structlog, httpx; dev: pytest, pytest-asyncio, ruff, mypy
- Migration: `0001_initial` — creates 4 tables + 6 feature flag seeds
- Tests: 6/6 passing (`pytest -q`)
- Quality: ruff ✅  mypy ✅  pytest ✅
- Key decisions:
  - Dropped passlib in favour of bcrypt direct — passlib 1.7.4 incompatible with bcrypt 5.x
  - All datetime columns use `DateTime(timezone=True)` for asyncpg tz-aware compatibility
  - pytest-asyncio `asyncio_default_fixture_loop_scope = session` + `asyncio_default_test_loop_scope = session` required for shared event loop across session-scope fixtures
- Branch: `sprint-01-backend-foundation`
- Commit: `05a258c`
- Status: ✅ Complete

## [2026-05-31] Sprint 2 — Humanization API

- Files created:
  - `backend/alembic/versions/0002_rewrites.py` — creates `rewrites` table (all columns + indexes)
  - `backend/app/models/rewrite.py` — Rewrite ORM model with quality score columns
  - `backend/app/prompts/__init__.py`
  - `backend/app/prompts/humanize_base.py` — humanize.base.v1 prompt (`build_messages`)
  - `backend/app/prompts/context_intent.py` — context.detect.v1 + intent.classify.v1 prompts + parsers
  - `backend/app/prompts/quality_v1.py` — quality.score.v1 prompt
  - `backend/app/repositories/rewrite_repo.py` — create, get_by_id, update_feedback, update_quality_score
  - `backend/app/routers/humanize.py` — POST /v1/humanize, POST /v1/humanize/{id}/feedback
  - `backend/app/schemas/humanize.py` — HumanizeRequest, RewriteResponse, FeedbackRequest
  - `backend/app/services/cache_service.py` — exact Redis cache + semantic Qdrant cache
  - `backend/app/services/humanize_service.py` — full pipeline orchestrator
  - `backend/app/services/quality_service.py` — fire-and-forget async quality scoring
  - `backend/app/services/router_service.py` — plan-based LLM routing + fallback chains
  - `backend/tests/test_humanize.py` — 6 tests
- Files modified:
  - `backend/app/main.py` — import all models; register humanize router; call configure_keys() in lifespan
  - `backend/pyproject.toml` — `asyncio_default_test_loop_scope = session`; ruff E501 ignore for prompts/
- Packages added: none (all already in Sprint 1 dependencies)
- Migration: `0002_rewrites` — creates rewrites table
- Tests: 6/6 humanize + 6/6 auth = 12/12 passing
- Quality: ruff ✅  mypy ✅  pytest ✅
- Key decisions:
  - Exact cache key: SHA-256 of `tone:normalized_text`, TTL 24h
  - Semantic cache via Qdrant + text-embedding-3-small, skips gracefully if OPENAI_API_KEY unset
  - Context + intent detection run concurrently via asyncio.gather, fallback to "other"
  - Plan routing: free→Gemini Flash, pro/team→Claude Haiku, enterprise/executive→Claude Sonnet
  - Quality scoring gated behind FEATURE_QUALITY_RETRY flag (default False)
  - Test strings use module-level `_RUN_ID = str(uuid4())[:8]` to avoid Redis cache pollution between runs
- Branch: `sprint-02-humanization-api`
- Commit: `5408f75`
- PR: https://github.com/ngyan/WRITING_TWIN_AI/pull/2
- Status: ✅ Complete

## [2026-06-01] Sprint 5 — Personalization (DNA + Memory + Cultural)

- Files created:
  - `backend/alembic/versions/0004_communication_memory.py` — adds `locale` to users + creates `communication_memory` table
  - `backend/app/models/communication_memory.py` — CommunicationMemory ORM model
  - `backend/app/prompts/cultural.py` — locale ruleset table + `get_cultural_block()` renderer
  - `backend/app/prompts/humanize/__init__.py`
  - `backend/app/prompts/humanize/dna_v1.py` — `humanize.dna.v1` prompt with DNA block + memory examples + cultural block placeholders
  - `backend/app/repositories/memory_repo.py` — create, get_recent_for_user, update_qdrant_point_id
  - `backend/app/services/cultural_service.py` — Cultural Intelligence Engine (locale → cultural_block string)
  - `backend/app/services/memory_service.py` — Communication Memory Engine (store/retrieve approved rewrites)
  - `backend/app/services/personalization_service.py` — composes DNA + memory into prompt context
  - `backend/tests/test_personalization.py` — 13 tests
- Files modified:
  - `backend/app/main.py` — import communication_memory model
  - `backend/app/models/user.py` — added `locale` column (default "en-US")
  - `backend/app/schemas/humanize.py` — added `profile_version_used: int | None` to RewriteResponse
  - `backend/app/services/humanize_service.py` — inject DNA + memory + cultural when use_dna=True; write memory on accepted/edited feedback
  - `backend/tests/conftest.py` — drop_all before create_all to ensure clean schema on every test session
- Migration: `0004_communication_memory`
- Tests: 13 new + 17 existing = 30/30 passing
- Quality: ruff ✅  mypy ✅  pytest ✅
- Key decisions:
  - en-US returns None from cultural service (it's the baseline — no adaptation needed)
  - Memory service opens its own AsyncSessionLocal (not request-scoped session) — safe for asyncio.create_task
  - DNA prompt used only when profile.extraction_status == "complete"
  - Cultural block suppressed for en-US + direct tone (already-direct locales)
  - `drop_all` + `create_all` in conftest prevents stale schema between test sessions
- Branch: `sprint-05-personalization`
- PR: https://github.com/ngyan/WRITING_TWIN_AI/pull/5
- Deploy: Pending (VPS SSH temporarily unreachable — run `./Vault/deploy/deploy.sh full` when available)
- Status: ✅ Code Complete | 🔄 Deploy Pending

---

## [2026-05-31] Sprint 4 — Writing DNA Engine

- Files created:
  - `backend/alembic/versions/0003_writing_profiles.py` — writing_profiles table (quantitative + JSONB qualitative columns)
  - `backend/app/models/writing_profile.py` — WritingProfile ORM model
  - `backend/app/prompts/dna/__init__.py`
  - `backend/app/prompts/dna/extract_v1.py` — `dna.extract.v1` prompt (builds samples block + LLM messages)
  - `backend/app/repositories/dna_repo.py` — get_by_user_id, upsert_profile, update_scores, mark_failed, delete_profile
  - `backend/app/repositories/qdrant_repo.py` — ensure_dna_collection, upsert_sample_vectors, delete_user_vectors, embed_texts
  - `backend/app/routers/dna.py` — POST /v1/dna/samples (202), GET /v1/dna/profile, POST /v1/dna/profile/refine (202), DELETE /v1/dna/profile (204)
  - `backend/app/schemas/dna.py` — WritingSampleInput, DNASamplesRequest, DNASamplesResponse, WritingProfileRead
  - `backend/app/services/dna_service.py` — submit_samples, get_profile, refine_profile, delete_profile
  - `backend/app/tasks/__init__.py`
  - `backend/app/tasks/extract_dna_task.py` — run_extraction pipeline (embed → Qdrant, LLM → JSONB update)
  - `backend/tests/test_dna.py` — 5 tests
- Files modified:
  - `backend/app/main.py` — import writing_profile model; register dna_router
- Migration: `0003_writing_profiles`
- Tests: 5 DNA + 12 existing = 17/17 passing
- Quality: ruff ✅  mypy ✅  pytest ✅
- Key decisions:
  - Shared Qdrant collection `user_writing_samples` (not per-user) — filtered by `user_id` payload; better scaling per Qdrant docs
  - Qdrant + OpenAI embedding gracefully skipped when OPENAI_API_KEY is absent
  - `asyncio.create_task` (not Celery) for background extraction — consistent with quality_service.py
  - LLM: Claude Haiku → Gemini Flash fallback for reliable JSON output
  - extraction_status: "pending" | "processing" | "complete" | "failed"
- Branch: `sprint-04-writing-dna`
- PR: https://github.com/ngyan/WRITING_TWIN_AI/pull/4
- Status: ✅ Complete

---

## [2026-06-01] Sprint 6 — AI Routing Hardening + Quality Retry

- Files created:
  - `backend/app/core/feature_flags.py` — DB-override layer for dynamic flag control
  - `backend/app/services/cost_guard_service.py` — daily USD ceiling from rewrites table
  - `backend/tests/test_routing.py` — 8 new tests: circuit breaker, fallback, 503, cost guard, quality retry
- Files modified:
  - `backend/app/core/config.py` — added `LLM_TIMEOUT_SECONDS`, `CIRCUIT_BREAK_THRESHOLD`, `CIRCUIT_RESET_SECONDS`, `COST_GUARD_DAILY_LIMIT_USD`
  - `backend/app/services/router_service.py` — circuit breaker (in-process dict), typed exception handling, 503 on full failure
  - `backend/app/services/quality_service.py` — `score_with_retry()` sync loop; thresholds tone_fit≥0.75/voice_match≥0.70/risk≤0.40; best-attempt return on exhaustion
  - `backend/app/services/humanize_service.py` — cost guard check before LLM call; quality retry path when FEATURE_QUALITY_RETRY=True
  - `backend/app/prompts/quality_v1.py` — added `risk` score dimension
  - `backend/app/repositories/rewrite_repo.py` — `score_risk` param on update_quality_scores
  - `backend/app/schemas/humanize.py` — `retry_count: int = 0` on RewriteResponse
- Tests: 38/38 passing, ruff ✅, mypy ✅
- Branch: `sprint-06-routing-hardening`
- PR: https://github.com/ngyan/WRITING_TWIN_AI/pull/6
- Status: ✅ Complete

---

## [2026-06-01] Sprint 5b — Extension UX: Register + DNA Onboarding

- Files modified:
  - `extension/src/lib/api.ts` — added `register()`, `submitDnaSamples()`, `getDnaProfile()`, `DnaProfileResponse` type
  - `extension/src/background.ts` — added `REGISTER`, `SUBMIT_DNA`, `GET_DNA_STATUS` message handlers + `DnaProfileResponse` import
  - `extension/src/popup/popup.html` — 4 views: login, register, dna-setup, logged-in (DNA prompt + trained badge)
  - `extension/src/popup/popup.ts` — full view transition machine; `parseSamples()` splits textarea on `---`; live sample count; auto-prompt DNA setup after register; `GET_DNA_STATUS` called on popup open
  - `extension/src/popup/popup.css` — register button, switch links, textarea, sample-count label, DNA prompt box (amber), trained badge (green)
- Notes:
  - Users can now sign up entirely inside the popup — no web browser required
  - After registration, DNA setup is auto-prompted; existing users see DNA trained badge if profile exists
  - Samples textarea splits on `---` separator (one per blank line); min 1 sample of 10+ chars required
  - Build output: 69.8 KB, zero errors
- Branch: `main` (gap fill, no dedicated branch needed)
- Status: ✅ Complete

---

## [2026-05-30] Doc Update — Founding Constitution Integration

- Files created:
  - `Vault/11-FOUNDING-CONSTITUTION.md` (north-star philosophy, four principles, product pyramid, six engines)
- Files modified:
  - `Vault/00-PROJECT-INDEX.md` — registered `11`, made it the first strategic read
  - `Vault/03-ARCHITECTURE.md` — added `MemoryService`, `CulturalService`, `QualityService`; added `CommunicationMemory` model + Quality score columns on `Rewrite`; added Qdrant `user_memory` collection; added engine→service mapping
  - `Vault/04-SPRINT-PLAN.md` — S2 now includes context detection + quality scoring; S5 expanded to deliver DNA + Memory + Cultural engines; S6 adds Quality retry loop; overview table + budgets updated (MVP now ~40k)
  - `Vault/07-PROMPTS-LIBRARY.md` — added `cultural.adapt.v1` (locale ruleset table + block template) and Quality retry behavior spec; updated inventory
- Notes: The Constitution introduced three engines not in the original master doc — Communication Memory, Cultural Intelligence, Quality. All three are now mapped to concrete services, models, and sprints. No code yet; pure documentation. Sprint 1 is unaffected and still ready to execute as-is.
- Status: ✅ Complete
