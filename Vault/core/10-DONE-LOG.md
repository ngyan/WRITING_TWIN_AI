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
- Commit: TBD
- Status: ✅ Complete

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
