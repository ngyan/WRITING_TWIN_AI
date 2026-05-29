# Sprint Plan — Writing Twin AI

> **Token-Efficiency Principle:** Each sprint = one Claude Code session = one self-contained feature slice.
> Claude Code reads ONLY the files listed for that sprint. No full-codebase dumps.

---

## 🗓️ Sprint Overview

| Sprint | Feature | Sessions | Token Budget | Status |
|---|---|---|---|---|
| **S1** | Backend Foundation (FastAPI + DB + Auth) | 1–2 | ~6k | 🔵 Ready |
| **S2** | Humanization API (router + cache + context + quality scoring) | 1–2 | ~8k | ⚪ Locked |
| **S3** | Chrome Extension MV3 (Gmail compose hook) | 2 | ~8k | ⚪ Locked |
| **S4** | Writing DNA Engine (extract + embed + store) | 2 | ~8k | ⚪ Locked |
| **S5** | Personalization (DNA + Memory + Cultural engines) | 2–3 | ~10k | ⚪ Locked |
| **S6** | AI Routing Hardening + Quality retry loop | 1–2 | ~6k | ⚪ Locked |
| **S7** | Billing (Stripe + entitlements + plan gates) | 1–2 | ~6k | ⚪ Locked |
| **S8** | Analytics + Observability (LangFuse + dashboards) | 1 | ~4k | ⚪ Locked |
| **S9** | Enterprise (SSO + audit log + team workspace) | 2 | ~10k | ⚪ Locked |

**Total budget for MVP (S1–S5):** ~40k tokens across 8–11 sessions.

**Constitutional engine coverage:** Writing DNA (S4) · Communication Memory (S5) · Context (S2) · Cultural Intelligence (S5) · AI Orchestration (S2+S6) · Quality (S2+S6). See `11-FOUNDING-CONSTITUTION.md` → The Six Engines.

---

## Sprint 1 — Backend Foundation

**Paste-ready prompt:** `active/SPRINT_01_BACKEND_FOUNDATION.md`

**Goal:** Stand up FastAPI + Postgres + Redis + Qdrant + auth + Alembic. No LLM logic yet.

**Read:**
- `Vault/core/03-ARCHITECTURE.md`
- `Vault/core/05-CLAUDE-CODE-INSTRUCTIONS.md`

**Create:**
- `backend/pyproject.toml`, `backend/.env.example`, `backend/Dockerfile`, `docker-compose.yml`
- `backend/app/main.py`, `backend/app/core/{config,security,db}.py`
- `backend/app/models/user.py`
- `backend/app/schemas/user.py`, `backend/app/schemas/auth.py`
- `backend/app/routers/auth.py`, `backend/app/routers/health.py`
- `backend/app/services/auth_service.py`, `backend/app/repositories/user_repo.py`
- `backend/app/deps/auth.py`, `backend/app/deps/db.py`
- `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/versions/0001_initial.py`
- `backend/tests/test_auth.py`

**Modify:** None (greenfield).

**Acceptance:**
- `docker compose up` boots Postgres, Redis, Qdrant, FastAPI cleanly
- `POST /v1/auth/register` returns a JWT pair
- `POST /v1/auth/login` works
- `GET /v1/auth/me` with Bearer token returns the user
- All tests pass

---

## Sprint 2 — Humanization API

**Goal:** End-to-end `/v1/humanize` endpoint with cache → router → LLM → response.

**Read:**
- `Vault/core/03-ARCHITECTURE.md`
- `Vault/core/06-COST-MODEL.md`
- `Vault/core/07-PROMPTS-LIBRARY.md`
- `backend/app/routers/auth.py` (pattern reference)

**Create:**
- `backend/app/models/rewrite.py` (include Quality Engine score columns — see `03-ARCHITECTURE.md`)
- `backend/app/schemas/humanize.py`
- `backend/app/services/humanize_service.py` (orchestrator — also runs context.detect + intent.classify)
- `backend/app/services/router_service.py` (LiteLLM wrapper)
- `backend/app/services/cache_service.py` (exact + semantic)
- `backend/app/services/quality_service.py` (score human/style/readability/confidence/risk; no retry yet — that's S6)
- `backend/app/routers/humanize.py`
- `backend/app/prompts/humanize_base.py` (load templates from `07-PROMPTS-LIBRARY.md`)
- `backend/app/prompts/context_intent.py` (context.detect.v1 + intent.classify.v1)
- `backend/alembic/versions/0002_rewrites.py`
- `backend/tests/test_humanize.py`

**Modify:**
- `backend/app/main.py` → register humanize router
- `backend/.env.example` → add LLM provider keys

**Prompt Template (paste into Claude Code):**
```
Read CLAUDE.md if it exists.
Read Vault/core/03-ARCHITECTURE.md (sections: Service Boundaries, API Contracts)
Read Vault/core/06-COST-MODEL.md (sections: Routing Rules, Semantic Cache)
Read Vault/core/07-PROMPTS-LIBRARY.md (section: Humanize templates)
Read Vault/core/05-CLAUDE-CODE-INSTRUCTIONS.md

Sprint 2: Humanization API.

Build the /v1/humanize endpoint per 03-ARCHITECTURE.md.

Pipeline:
1. Authenticate request (existing deps/auth.py)
2. CacheService.lookup_exact(input_hash) → if hit, return
3. CacheService.lookup_semantic(input_text) → if hit ≥ 0.93 cosine, return
4. RouterService.select_provider(user.plan, complexity) → LiteLLM
5. Call LLM with prompt from app/prompts/humanize_base.py
6. Persist Rewrite row with cost, latency, tokens
7. CacheService.store(input_hash, output, embedding)
8. Return RewriteResponse

Constraints:
- Use LiteLLM in proxy mode (assume LITELLM_BASE_URL in env)
- Default routing: free=gemini-flash, pro=claude-haiku, enterprise=claude-sonnet
- Embeddings: text-embedding-3-small via OpenAI
- No streaming yet — JSON response only
- All providers must be swappable via config, not hardcoded

Tests: mock LiteLLM. Test cache hit, cache miss, provider fallback, plan-based routing.
```

**Acceptance:**
- `POST /v1/humanize` returns valid `RewriteResponse` for all 6 tones
- Cache hit rate > 0 on repeated identical requests
- Tests cover: cache hit, semantic hit, fresh LLM call, provider fallback

---

## Sprint 3 — Chrome Extension MV3

**Goal:** Working extension on Gmail with Humanize button injected into compose window.

**Read:**
- `Vault/core/02-DESIGN-SYSTEM.md` (extension constraints section)
- `Vault/core/03-ARCHITECTURE.md` (Humanize endpoint section)

**Create:**
- `extension/manifest.json`
- `extension/src/background.ts` (service worker)
- `extension/src/content/gmail.ts` (DOM injection)
- `extension/src/popup/popup.html`, `popup.ts`, `popup.css`
- `extension/src/lib/api.ts` (typed fetch client)
- `extension/src/lib/auth.ts` (token storage in chrome.storage.local)
- `extension/src/styles/tokens.css`
- `extension/build.config.ts` (Vite or esbuild)
- `extension/README.md`

**Acceptance:**
- Load unpacked → "Humanize ✨" button appears in Gmail compose
- Click → captures draft → POSTs to `/v1/humanize` → replaces text in draft
- Token persisted; user can log in via popup
- < 150 KB final bundle

---

## Sprint 4 — Writing DNA Engine

**Goal:** Accept writing samples, extract DNA, store profile + embeddings.

**Read:**
- `Vault/core/03-ARCHITECTURE.md` (WritingProfile model, Qdrant collections)
- `Vault/core/07-PROMPTS-LIBRARY.md` (DNA extraction prompts)

**Create:**
- `backend/app/models/writing_profile.py`
- `backend/app/schemas/dna.py`
- `backend/app/services/dna_service.py`
- `backend/app/repositories/qdrant_repo.py`
- `backend/app/routers/dna.py`
- `backend/app/tasks/extract_dna_task.py` (Celery)
- `backend/alembic/versions/0003_writing_profiles.py`
- `backend/tests/test_dna.py`

**Acceptance:**
- `POST /v1/dna/samples` accepts 50+ samples, queues extraction
- `GET /v1/dna/profile` returns extracted scores within 60s
- Qdrant collection populated with sample embeddings

---

## Sprint 5 — Personalization (DNA + Memory + Cultural)

**Goal:** Humanize endpoint uses DNA profile + communication memory + cultural intelligence to personalize output. This sprint delivers three Constitutional engines.

**Read:**
- `Vault/core/07-PROMPTS-LIBRARY.md` (personalized humanize + cultural prompts)
- `Vault/core/11-FOUNDING-CONSTITUTION.md` (Cultural Intelligence + Communication Memory sections)
- `Vault/core/03-ARCHITECTURE.md` (CommunicationMemory model, user_memory collection)
- `backend/app/services/humanize_service.py`, `backend/app/services/dna_service.py`

**Create:**
- `backend/app/services/personalization_service.py` (composes DNA + memory + cultural into the prompt)
- `backend/app/services/memory_service.py` (Communication Memory Engine — store/retrieve approved outputs & edits)
- `backend/app/services/cultural_service.py` (Cultural Intelligence Engine — locale-aware adaptation)
- `backend/app/models/communication_memory.py`
- `backend/app/repositories/memory_repo.py`
- `backend/app/prompts/cultural.py` (cultural adaptation suffixes per locale)
- `backend/alembic/versions/0004_communication_memory.py`
- `frontend/src/app/onboarding/dna/page.tsx` (Next.js DNA upload flow)
- `backend/tests/test_personalization.py`

**Modify:**
- `backend/app/services/humanize_service.py` → inject DNA + memory examples + cultural block when `use_dna=true`
- `backend/app/prompts/humanize_base.py` → add `{dna_block}`, `{memory_examples}`, `{cultural_block}` placeholders
- `backend/app/services/feedback_service.py` → on user accept/edit/reject, write a `CommunicationMemory` row + embed into `user_memory`

**Acceptance:**
- Pro user rewrites carry personalization (measurable via A/B prompt eval)
- Korean/Indian locale users get culturally-adapted output without setting any preference (test with `user.locale="ko-KR"` and `"hi-IN"`)
- Accepting/editing a rewrite creates a `CommunicationMemory` row and a `user_memory` vector
- A subsequent similar rewrite retrieves the past-approved phrasing as an in-context example
- Onboarding page lets user paste 50 emails and shows DNA extraction progress

> **Note:** This is the heaviest MVP sprint (3 engines). Consider splitting into S5a (DNA personalization + memory) and S5b (cultural) if the session runs long. Token budget bumped accordingly.

---

## Sprint 6 — AI Routing Hardening + Quality Retry Loop

**Goal:** Make routing production-grade: fallback chains, cost guardrails, kill switch. Activate the Quality Engine retry loop so sub-threshold outputs are auto-regenerated before the user ever sees them.

**Read:**
- `Vault/core/06-COST-MODEL.md` (entire file)
- `Vault/core/11-FOUNDING-CONSTITUTION.md` (Quality Engine section)
- `Vault/core/07-PROMPTS-LIBRARY.md` (quality.score.v1)
- `backend/app/services/router_service.py`, `backend/app/services/quality_service.py`

**Create:**
- `backend/app/services/cost_guard_service.py`
- `backend/app/core/feature_flags.py`

**Modify:**
- `backend/app/services/router_service.py` → add fallback chain, circuit breaker
- `backend/app/services/quality_service.py` → add retry loop: if any score < threshold, regenerate (max 2 retries, then return best-scored attempt + flag)
- `backend/app/services/humanize_service.py` → wire quality retry into the pipeline before caching/returning
- LiteLLM `config.yaml` → add retry, timeout, fallback model declarations

**Quality thresholds (start here, tune later):**
- `score_human` ≥ 0.75 (hard — the North Star metric)
- `score_style_match` ≥ 0.70 (only when DNA present)
- `score_risk` ≤ 0.40 (reject high-risk outputs)
- On retry exhaustion: return best attempt, set `retry_count`, log to LangFuse for review

**Acceptance:**
- Killing one provider in env → service still responds via fallback within 5s
- Daily cost ceiling triggers degradation to Gemini Flash regardless of plan

---

## Sprint 7 — Billing

**Goal:** Stripe subscriptions, entitlements, plan gates on `/humanize`.

**Read:**
- `Vault/core/03-ARCHITECTURE.md` (Subscription model, billing endpoints)

**Create:**
- `backend/app/models/subscription.py`
- `backend/app/services/billing_service.py`
- `backend/app/routers/billing.py`
- `backend/app/deps/entitlements.py`
- `backend/alembic/versions/0004_subscriptions.py`
- `frontend/src/app/pricing/page.tsx`
- `frontend/src/app/billing/portal/route.ts`

**Acceptance:**
- Free user blocked at 31st rewrite/day; Pro user uncapped
- Stripe webhook updates `subscriptions` table; idempotent
- Pricing page → checkout → return → entitlement granted

---

## Sprint 8 — Analytics + Observability

**Goal:** LangFuse traces every rewrite. Prometheus exports latency/cost. Grafana dashboards.

**Read:**
- `Vault/core/06-COST-MODEL.md`

**Create:**
- `backend/app/core/telemetry.py` (Sentry + LangFuse init)
- `backend/app/core/metrics.py` (Prometheus counters/histograms)
- `infra/grafana/dashboards/*.json` (4 dashboards: latency, cost, cache hit, conversion)
- `infra/prometheus/prometheus.yml`

**Modify:**
- `backend/app/services/router_service.py` → wrap with LangFuse `@observe`
- `docker-compose.yml` → add Prometheus, Grafana, LangFuse (or external)

**Acceptance:**
- Every rewrite shows up in LangFuse with prompt + completion + cost
- Grafana shows p95 latency, cost/day, cache hit %, error rate

---

## Sprint 9 — Enterprise

**Goal:** SSO (SAML via WorkOS or Auth0), audit log, team workspaces, on-prem prep.

**Read:**
- `Vault/core/01-VISION-AND-BUSINESS-PLAN.md` (Enterprise tier definition)

**Create:**
- `backend/app/models/team_workspace.py`, `team_member.py`, `audit_log.py`
- `backend/app/services/sso_service.py` (WorkOS integration)
- `backend/app/routers/teams.py`, `backend/app/routers/admin.py`
- `frontend/src/app/admin/*`

**Acceptance:**
- Workspace admin can invite up to N seats
- SAML login works against an IdP test instance (Okta dev)
- Every state-changing action writes an `audit_log` row

---

## ⚡ Cross-Sprint Rules

1. **Never paste entire files into prompts** — reference by path only.
2. **One sprint = one Claude Code session.** Close terminal between sprints.
3. **Always read the listed files before writing.** No guessing.
4. **Use `# TODO: Sprint N` comments** to mark integration points.
5. **Feature flag every Phase 2+ feature** until validated.
6. **Mock external services in tests** — never call real LLMs in CI.
7. **Run `pytest -q` and `mypy app/` before committing.**
8. **Log completion in `10-DONE-LOG.md` and commit with `feat: [Sprint N] [Name]`.**
