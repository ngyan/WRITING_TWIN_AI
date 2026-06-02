# Done Log — Writing Twin AI

> Log every completed sprint here so Claude Code has full context of what's been done.

---

## [2026-06-02] Sprint 15 — Auto Draft Engine

- Files created:
  - `backend/app/prompts/auto_draft_v1.py` — system + user prompt: generate reply from incoming email context + DNA
  - `backend/app/models/auto_draft.py` — AutoDraft ORM model
  - `backend/app/repositories/auto_draft_repo.py` — create, get_by_id, update_kept
  - `backend/app/services/auto_draft_service.py` — create_draft (context + DNA-aware), record_feedback
  - `backend/alembic/versions/0009_auto_drafts.py` — migration: auto_drafts table
- Files modified:
  - `backend/app/routers/humanize.py` — POST /v1/humanize/auto-draft + POST /v1/humanize/auto-draft/{id}/feedback
  - `backend/app/schemas/humanize.py` — AutoDraftRequest, AutoDraftResponse, AutoDraftFeedbackRequest
  - `backend/app/main.py` — registered auto_draft model
  - `backend/app/core/config.py` — added FEATURE_AUTO_DRAFT: bool = False
  - `extension/src/lib/api.ts` — AutoDraftResponse interface + autoDraft() + submitAutoDraftFeedback()
  - `extension/src/background.ts` — AUTO_DRAFT + AUTO_DRAFT_FEEDBACK message handlers
  - `extension/src/content/gmail.ts` — tryAutoDraft(), findIncomingMessageEl(), extractIncomingText(), showAutoDraftBanner()
  - `extension/writing-twin-ai-extension.zip` — rebuilt (95 KB)
- Migration: `0009_auto_drafts`
- Quality: ruff ✅  mypy ✅  pytest ✅ (48 tests)  tsc ✅  extension build ✅
- Key decisions:
  - 2s hard timeout via Promise.race — never blocks user if backend is slow
  - Only fires when compose body is EMPTY — won't clobber work in progress
  - Auto-dismiss if user starts typing; 30s auto-dismiss if no interaction
  - FEATURE_AUTO_DRAFT=False by default — flip on VPS when ready
  - kept/dismissed tracked per draft row for future learning signal
  - Incoming email read via .a3s.aiL → .ii.gt → .adn (fallback chain, first 500 words)
- Deploy steps:
  1. `alembic upgrade head` (migration 0009)
  2. Add `FEATURE_AUTO_DRAFT=True` to VPS `.env` when ready to enable
- Branch: `sprint-15-auto-draft`
- Commit: `4ed5f5d`
- PR: #15 → base `2.0`
- Status: ✅ Code Complete | 🔵 PR open against `2.0`

---

## [2026-06-02] Sprint 14 — DNA Learning Engine

- Files created:
  - `backend/app/models/dna_learning.py` — DNALearning ORM model
  - `backend/app/repositories/dna_learning_repo.py` — create, count_this_week, count_total, get_removed_phrase_counts (uses SQL unnest)
  - `backend/app/services/dna_learning_service.py` — extract_phrases (2/3-gram diff), compute_formality_delta, process_edit, get_stats, schedule_learning
  - `backend/alembic/versions/0008_dna_learning.py` — migration: dna_learnings table + cringe_phrases JSONB on writing_profiles
  - `Vault/active/SPRINT_14_DNA_LEARNING.md` — sprint spec
- Files modified:
  - `backend/app/models/writing_profile.py` — added cringe_phrases JSONB column
  - `backend/app/core/config.py` — added FEATURE_DNA_LEARNING: bool = True
  - `backend/app/services/humanize_service.py` — hook into record_feedback for edited action → schedule_learning
  - `backend/app/routers/dna.py` — added GET /v1/dna/learning-stats
  - `backend/app/schemas/dna.py` — added LearningStatsResponse
  - `backend/app/main.py` — registered dna_learning model
  - `frontend/src/lib/api.ts` — LearningStats interface + getLearningStats()
  - `frontend/src/app/dashboard/page.tsx` — "What your twin learned" card with cringe phrase tags
  - `backend/app/services/billing_service.py` — fixed pre-existing mypy str|None return type
- Migration: `0008_dna_learning`
- Quality: ruff ✅  mypy ✅  pytest ✅ (48 tests)  tsc ✅
- Key decisions:
  - Minimum 5-word symmetric diff gate prevents noise from trivial reformatting
  - Cringe threshold = 3 removals (configurable constant in service)
  - Uses SQL unnest() to count individual phrase occurrences across ARRAY rows efficiently
  - FEATURE_DNA_LEARNING=True by default — safe, only fires on explicit user edits
- Deploy steps:
  1. `alembic upgrade head` (migration 0008)
  2. No new env vars needed
- Branch: `sprint-14-dna-learning`
- Commit: `e706650`
- PR: #14 → base `2.0` — https://github.com/ngyan/WRITING_TWIN_AI/pull/14
- Status: ✅ Code Complete | 🔵 PR open against `2.0`

---

## [2026-06-02] Sprint 13 — Context Engine V1

- Files created:
  - `backend/alembic/versions/0007_context_engine.py` — migration: `customer_domains TEXT[]` on users + `context_overrides` table
  - `backend/app/models/context_override.py` — ContextOverride ORM model
  - `backend/app/repositories/context_repo.py` — get/set customer_domains, save_override
  - `backend/app/routers/context.py` — POST /v1/context/detect, GET/POST/DELETE /v1/context/customer-domains, POST /v1/context/override
  - `backend/app/schemas/context.py` — DetectContextRequest/Response, CustomerDomainsResponse, AddDomainRequest, RemoveDomainRequest, OverrideContextRequest
  - `backend/app/services/context_service.py` — static rules engine: 7 context twins, priority-ordered
- Files modified:
  - `backend/app/models/user.py` — added `customer_domains: Mapped[list[str]]` (ARRAY(String))
  - `backend/app/schemas/humanize.py` — added platform, recipient_domain, thread_subject, context_twin_override to HumanizeRequest
  - `backend/app/prompts/humanize_base.py` — added optional context_guidance param
  - `backend/app/prompts/humanize/dna_v1.py` — added optional context_guidance param
  - `backend/app/services/humanize_service.py` — step 4a: context detection before personalization; passes context_guidance to prompt builders
  - `backend/app/main.py` — registered context_override model + context router
  - `extension/src/lib/api.ts` — detectContext(), recordContextOverride(), HumanizeContext interface, humanize() ctx param
  - `extension/src/background.ts` — DETECT_CONTEXT + CONTEXT_OVERRIDE handlers; HUMANIZE passes ctx
  - `extension/src/content/gmail.ts` — context badge (indigo pill), buildGmailContext(), CONTEXT_CYCLE cycling, badge click override
  - `extension/src/content/outlook.ts` — same context badge + CONTEXT_CYCLE as Gmail
- Migration: `0007_context_engine`
- Quality: ruff ✅  mypy ✅  pytest ✅ (48 tests)  tsc ✅  extension build ✅ (38.6 KB prod)
- Key decisions:
  - Static rules engine (no LLM call) — deterministic, zero cost, <1 ms
  - 7 context twins: professional, customer, technical, escalation, social, community, casual
  - Escalation keywords always win (P1/P0/incident/urgent/SLA/outage/blocker/etc.)
  - Context badge cycles through CONTEXT_CYCLE array on click; override sent to backend for learning
  - FEATURE_CONTEXT_ENGINE=True by default (safe — only activates if context fields are present)
- Deploy steps:
  1. `alembic upgrade head` (migration 0007)
  2. FEATURE_CONTEXT_ENGINE=True is already the default in Settings
- Branch: `sprint-13-context-engine`
- Commit: `9720d37`
- PR: #13 → base `2.0` — https://github.com/ngyan/WRITING_TWIN_AI/pull/13
- Status: ✅ Code Complete | 🔵 PR open against `2.0`

---

## [2026-06-02] Sprint 12 — Outlook Extension

- Files created:
  - `extension/src/content/outlook.ts` — full content script for Outlook Web App
- Files modified:
  - `extension/manifest.json` — added host_permissions + content_scripts for outlook.live.com, outlook.office.com, outlook.office365.com
  - `extension/build.mjs` — added content/outlook entry point + size reporting
  - `extension/writing-twin-ai-extension.zip` — rebuilt (21 KB, now includes outlook.js)
- No backend changes — same /v1/humanize and /v1/voice/draft endpoints
- Quality: tsc ✅  build ✅ (34.6 KB prod total)
- Key decisions:
  - Detect compose body via `role="textbox" + aria-multiline="true"` (locale-safe, not aria-label text)
  - Walk UP 30 levels from compose body to find ancestor containing Send button (handles Outlook's React tree structure where toolbar is in sibling subtree)
  - Inject into `closest('[role="toolbar"]') || closest('[role="group"]') || sendBtn.parentElement`
  - MutationObserver + 1 s polling fallback — Outlook's React re-renders are aggressive
  - `data-wt-ol-injected` attribute guards against double-injection
  - office365.com added to host_permissions (same OWA, different domain for some orgs)
- Branch: `sprint-12-outlook-extension`
- Commit: `1e8407f`
- PR: #12 → base `2.0` — https://github.com/ngyan/WRITING_TWIN_AI/pull/12
- Status: ✅ Code Complete | 🔵 PR open against `2.0`

---

## [2026-06-02] Sprint 11 — Voice Twin MVP

- Files created:
  - `backend/alembic/versions/0006_voice_sessions.py` — migration: `voice_sessions` table
  - `backend/app/models/voice_session.py` — VoiceSession ORM model
  - `backend/app/prompts/voice/__init__.py` + `draft_v1.py` — voice prompt with 7 output type formats
  - `backend/app/repositories/voice_repo.py` — create / get_by_id / update_feedback
  - `backend/app/routers/voice.py` — `POST /v1/voice/draft` + `POST /v1/voice/draft/{id}/feedback`
  - `backend/app/schemas/voice.py` — VoiceDraftResponse + VoiceFeedbackRequest
  - `backend/app/services/voice_service.py` — Whisper transcription → DNA-aware humanize → persist
- Files modified:
  - `backend/app/core/config.py` — added `FEATURE_VOICE_TWIN: bool = False`
  - `backend/app/main.py` — registered voice_session model + voice router
  - `backend/pyproject.toml` — added `openai>=1.14` (for Whisper API)
  - `extension/src/lib/api.ts` — added VoiceOutputType, VoiceDraftResponse types; voiceDraft() (FormData multipart); submitVoiceFeedback(); rawFetchMultipart() helper
  - `extension/src/background.ts` — VOICE_DRAFT + VOICE_FEEDBACK message types and handlers
  - `extension/src/content/gmail.ts` — mic button shadow DOM host in Gmail toolbar: MediaRecorder capture, 60s auto-stop, base64 encode, output type selector, Keep/Undo feedback; Cmd+Shift+V shortcut
- Packages added: `openai>=1.14` (backend)
- Migration: `0006_voice_sessions`
- Quality: ruff ✅  tsc ✅  extension build ✅ (21.5 KB prod, 16 KB ZIP)
- Key decisions:
  - Audio sent as base64 in JSON via chrome.runtime.sendMessage (MV3 doesn't allow Blob transfer between content script and SW)
  - Voice drafts count against monthly rewrite quota (same `require_rewrite_quota` dep)
  - `FEATURE_VOICE_TWIN=False` by default — flip on VPS once tested
  - openai SDK used directly for Whisper (not LiteLLM — Whisper is transcription, not completion)
- Deploy steps:
  1. `uv sync` on VPS (installs openai)
  2. `alembic upgrade head` (migration 0006)
  3. Add `FEATURE_VOICE_TWIN=True` + `OPENAI_API_KEY=...` to VPS `.env`
- Branch: `sprint-11-voice-twin`
- Commit: `9304e21`
- PR: #11 → base `2.0` — https://github.com/ngyan/WRITING_TWIN_AI/pull/11
- Status: ✅ Code Complete | 🔵 PR open against `2.0`

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

## [2026-05-31] Sprint 3 — Chrome Extension MVP

- Files created:
  - `extension/manifest.json` — MV3, Gmail host permissions, storage permission
  - `extension/src/background.ts` — service worker; message bridge between popup and content script
  - `extension/src/content/gmail.ts` — Shadow DOM injection into Gmail compose toolbar; ✨ Humanize button + tone picker panel + status/error display; keyboard shortcut Cmd+Shift+H
  - `extension/src/popup/popup.html` + `popup.ts` + `popup.css` — login/logout UI, token storage
  - `extension/src/lib/api.ts` — typed wrapper around backend API (login, humanize)
  - `extension/src/lib/auth.ts` — chrome.storage.local token get/set helpers
  - `extension/build.mjs` — esbuild bundler script (background, content/gmail, popup)
  - `extension/package.json`
  - `extension/tsconfig.json`
- Files modified: none (greenfield)
- Notes:
  - Injects into Gmail compose via Shadow DOM — no page CSS leakage
  - 6 tones: Professional, Casual, Friendly, Direct, Diplomatic, Executive
  - JWT stored in `chrome.storage.local` (not cookies)
  - Build output: ~70 KB
- Branch: `sprint-03-chrome-extension`
- Status: ✅ Complete

---

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

## [2026-06-01] Sprint 7 — Billing (Stripe + Entitlements + Plan Gates)

- Files created:
  - `backend/alembic/versions/0005_billing.py` — adds `stripe_customer_id`, `stripe_subscription_id`, `plan_expires_at`, `monthly_rewrite_count`, `monthly_reset_at` to users table
  - `backend/app/routers/billing.py` — `POST /v1/billing/checkout` (Stripe Checkout session), `POST /v1/billing/portal` (customer portal), `POST /v1/billing/webhook` (Stripe webhook handler: checkout.completed, subscription.deleted/updated), `GET /v1/billing/status`
  - `backend/app/services/billing_service.py` — create_checkout_session, create_portal_session, handle_webhook, get_billing_status
  - `backend/app/schemas/billing.py` — CheckoutRequest, PortalRequest, BillingStatusResponse
  - `backend/tests/test_billing.py` — 10 tests
- Files modified:
  - `backend/app/main.py` — register billing router
  - `backend/app/services/humanize_service.py` — monthly rewrite counter check; raises 429 with `LIMIT_REACHED` detail when free (20/mo) or pro (300/mo) limit hit
  - `backend/app/core/config.py` — `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `FREE_MONTHLY_LIMIT=20`, `PRO_MONTHLY_LIMIT=300`
- Migration: `0005_billing`
- Tests: 10 billing + 38 existing = 48/48 passing
- Quality: ruff ✅  mypy ✅  pytest ✅
- Key decisions:
  - Stripe Checkout only (PCI compliance — never store card details)
  - Webhook atomically upgrades user.plan to "pro" on checkout.session.completed
  - Monthly counter resets via `monthly_reset_at` timestamp checked on each rewrite
- Branch: `sprint-07-billing`
- PR: #7 merged
- Status: ✅ Complete

---

## [2026-06-01] Sprint 8 — Frontend Dashboard (Next.js 14)

- Files created:
  - `frontend/` — full Next.js 14 App Router project (TypeScript + Tailwind CSS)
  - `frontend/src/app/page.tsx` — landing page (hero, 3-step, before/after example, pricing CTA, footer with privacy/terms links)
  - `frontend/src/app/login/page.tsx` — email/password login form → POST /v1/auth/login → store JWT → redirect /dashboard
  - `frontend/src/app/register/page.tsx` — registration form → POST /v1/auth/register
  - `frontend/src/app/dashboard/page.tsx` — usage widget (rewrites used/limit), plan badge, DNA status, upgrade CTA
  - `frontend/src/app/onboarding/dna/page.tsx` — DNA training textarea (splits on `---`), progress polling, completion badge
  - `frontend/src/app/pricing/page.tsx` — Free vs Pro comparison table, Stripe Checkout button
  - `frontend/src/app/billing/success/page.tsx` — post-checkout success page
  - `frontend/src/app/billing/cancel/page.tsx` — post-checkout cancel page
  - `frontend/src/lib/api.ts` — typed fetch wrapper with JWT auth header
  - `frontend/src/lib/auth.ts` — localStorage token helpers
  - `frontend/Dockerfile` — multi-stage Node 20 standalone build; NEXT_PUBLIC_* ARGs baked at build time
  - `frontend/next.config.ts` — `output: standalone`
  - `docker-compose.yml` — added `frontend` service (port 3001)
- Files modified:
  - `Vault/deploy/deploy.sh` — added frontend rsync + docker build for frontend (reads Stripe price ID + PostHog key from backend/.env at build time)
- Notes:
  - NEXT_PUBLIC_* vars baked at Docker build time — deploy.sh exports them before `docker compose build frontend`
  - DNA sample separator bug fixed: `/\s*---\s*/` instead of `/\n---\n/`
- Branch: `sprint-08-frontend-dashboard`
- PR: #8 merged
- Status: ✅ Complete

---

## [2026-06-01] Sprint 9 — Polish + Launch Readiness

- Files created:
  - `frontend/src/app/privacy/page.tsx` — full privacy policy (required for Chrome Web Store); covers data collection, LLM providers, Stripe, PostHog, Resend, retention, rights, Chrome extension specifics
  - `frontend/src/app/terms/page.tsx` — terms of service covering acceptance, service description, plans/billing, IP, AI disclaimer, liability, termination
  - `frontend/src/app/robots.ts` — Next.js metadata API robots.txt (allows /, disallows /dashboard, /onboarding, /billing; sitemap pointer)
  - `frontend/src/app/sitemap.ts` — Next.js metadata API sitemap.xml (6 URLs: /, /pricing, /login, /register, /privacy, /terms)
  - `frontend/src/components/PostHogProvider.tsx` — PostHog client init + `PageviewTracker` (auto-tracks all route changes via `usePathname`)
- Files modified:
  - `frontend/src/app/layout.tsx` — wrapped in PostHogProvider
  - `frontend/src/app/register/page.tsx` — PostHog `identify` + `user_registered` event
  - `frontend/src/app/login/page.tsx` — PostHog `identify` + `user_logged_in` event
  - `frontend/src/app/onboarding/dna/page.tsx` — `dna_samples_submitted` + `dna_training_complete` events
  - `frontend/src/app/pricing/page.tsx` — `upgrade_clicked` event (plan name + price)
  - `frontend/src/app/billing/success/page.tsx` — `billing_success` event; converted to `"use client"`
  - `frontend/src/app/billing/cancel/page.tsx` — copy fix: "30 rewrites a day" → "20 rewrites/month"
  - `frontend/src/app/page.tsx` — added Terms link to footer
  - `extension/src/content/gmail.ts` — 429 limit-reached shows amber upgrade card (`#wt-limit`) with link to `/pricing` instead of plain error text
  - `extension/src/lib/api.ts` — auto-refresh JWT on 401 (`tryRefresh()`), retry request with new token; 429 throws `LIMIT_REACHED:<detail>` sentinel
- Packages added: `posthog-js`
- Notes:
  - PostHog `api_host` set to `"https://us.i.posthog.com"` (no custom proxy needed)
  - Extension keyboard shortcut (Cmd+Shift+H) moved to global document listener — was broken inside `inject()` when button wasn't found
  - Gmail `[data-tooltip^="Send"]` prefix match fixes "Send ⌘Enter" tooltip mismatch; walk-up depth 12→25
- Branch: `sprint-09-polish-launch` → squash merged as PR #9
- Status: ✅ Complete

---

## [2026-06-01] Sprint 10 — Chrome Web Store Packaging

- Files created:
  - `extension/icons/icon.svg` — brand logo recreation: indigo (#4F46E5) rounded-rect background, open book (two bezier page paths meeting at spine), left page = circuit board traces (lines + endpoint dots), right page = organic AI curves (bezier paths + dots)
  - `extension/icons/generate.mjs` — Node.js script using `sharp` to render SVG→PNG at 16/32/48/128px
  - `extension/icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` — generated PNGs
  - `extension/package-ext.mjs` — pure Node.js ZIP packager (implements CRC32 + ZIP binary format, no external deps); outputs `writing-twin-ai-extension.zip`
  - `extension/WEBSTORE_LISTING.md` — complete store listing copy (name, 132-char summary, full description, features, privacy statement) + submission checklist + post-approval CORS update steps
  - `extension/writing-twin-ai-extension.zip` — 31 KB, 10 files, ready for Web Store upload
- Files modified:
  - `extension/manifest.json` — added `homepage_url`, `minimum_chrome_version: 116`, all 4 icon sizes in `action.default_icon`
  - `extension/build.mjs` — added `mkdirSync dist/icons` + `copyFileSync` for all 4 PNG sizes
- Notes:
  - ZIP contains: manifest.json, background.js, content/gmail.js, popup/popup.{html,css,js}, icons/icon{16,32,48,128}.png
  - After Web Store approval: add `EXTENSION_ORIGIN=chrome-extension://ID` to VPS `backend/.env` and update CORS origins in `backend/app/main.py`
  - No VPS deploy needed — extension-only changes
- Branch: `sprint-10-webstore`
- PR: #10 open — https://github.com/ngyan/WRITING_TWIN_AI/pull/10
- Status: ✅ Code Complete | 🔄 Web Store Review Pending

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
