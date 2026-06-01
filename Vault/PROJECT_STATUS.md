# Writing Twin AI — Project Status Dashboard

> **Update this file at the end of every sprint.**
> **Last Updated:** 2026-06-01

---

## 🎯 Current Milestone

**Phase:** Sprint 6 — AI Routing Hardening Complete
**Current Sprint:** Sprint 7 — Billing
**Next Sprint:** Sprint 8 — Analytics + Observability
**Target Launch:** MVP by end of Sprint 7 (~2–4 weeks from now)

---

## 📊 Readiness Gauges

| Dimension | % | Notes |
|---|---|---|
| **MVP Readiness** | 70% | Sprint 5 complete — all 3 personalization engines live |
| **Production Readiness** | 20% | VPS + NGINX + SSL live; Sprint 5 deploy pending (SSH temporarily down) |
| **Test Coverage** | 20% | 30 tests passing (auth + humanize + dna + personalization) |
| **Documentation** | 90% | Vault complete + Phase 0 deploy docs |
| **Business Model** | 70% | Pricing defined, cost model done |
| **Marketing** | 20% | Phase 0 demo live at writingtwinai.com |

---

## ✅ Last Completed Tasks (2026-06-01)

1. **Sprint 6 — AI Routing Hardening + Quality Retry**:
   - `router_service.py` — circuit breaker (opens after N failures, auto-resets); typed exception handling; `HTTP 503` with `Retry-After` when all providers fail
   - `cost_guard_service.py` — daily spend ceiling from `rewrites.cost_usd`; degrades any plan to gemini-flash when hit
   - `quality_service.py` — `score_with_retry()`: sync scoring before return, up to 2 retries, best-scored attempt on exhaustion; thresholds tone_fit≥0.75, voice_match≥0.70, risk≤0.40
   - `feature_flags.py` — DB-override layer for dynamic flag control
   - `humanize_service.py` — cost guard check + quality retry wired in
   - `humanize schema` — `retry_count` added to response
   - 38/38 tests passing, ruff ✅, mypy ✅
   - PR #6 merged

2. **Sprint 5 gap fill — Extension UX (register + DNA onboarding)**:
   - `extension/src/lib/api.ts` — added `register()`, `submitDnaSamples()`, `getDnaProfile()`
   - `extension/src/background.ts` — added `REGISTER`, `SUBMIT_DNA`, `GET_DNA_STATUS` message handlers
   - `popup.html` — 4 views: login, register, dna-setup, logged-in
   - `popup.ts` — full view transition logic; DNA textarea splits on `---` separator; live sample count; auto-prompt after register; DNA trained badge when profile exists
   - `popup.css` — styles for register form, DNA setup view, trained badge, prompt box
   - Users can now sign up and train Writing Twin entirely from the extension popup
   - Build: 69.8 KB, no errors

---

## ✅ Previously Completed Tasks (2026-05-31)

1. **Sprint 4 — Writing DNA Engine** complete:
   - `POST /v1/dna/samples` — accepts 1–200 writing samples, fires background extraction
   - `GET /v1/dna/profile` — returns quantitative + qualitative DNA scores
   - `POST /v1/dna/profile/refine` — re-triggers extraction from existing data
   - `DELETE /v1/dna/profile` — removes DB row + Qdrant vectors (GDPR)
   - Background pipeline: embed → Qdrant (skips if no OPENAI_API_KEY), LLM extraction → JSONB columns
   - LLM routing: Claude Haiku → Gemini Flash fallback for reliable JSON output
   - 17/17 tests passing, ruff ✅, mypy ✅
   - PR #4 merged: https://github.com/ngyan/WRITING_TWIN_AI/pull/4

2. **Sprint 2 — Humanization API** complete:
   - `POST /v1/humanize` — full pipeline: exact cache → semantic cache → context/intent detection → LLM routing → persist → async quality scoring
   - `POST /v1/humanize/{id}/feedback` — accept/reject/edit signals
   - Plan-based routing: free→Gemini Flash, pro/team→Claude Haiku, enterprise/executive→Claude Sonnet
   - Fallback chains on provider errors (gemini→gpt-4o-mini→claude-haiku, etc.)
   - Exact cache: Redis SHA-256(tone:text), TTL 24h
   - Semantic cache: Qdrant + text-embedding-3-small, cosine ≥ 0.93, skips if no OPENAI_API_KEY
   - Quality scoring: fire-and-forget, gated behind FEATURE_QUALITY_RETRY flag
   - 12/12 tests passing, ruff ✅, mypy ✅
   - PR #2 merged: https://github.com/ngyan/WRITING_TWIN_AI/pull/2

2. **Sprint 1 — Backend Foundation** complete (prior session):
   - FastAPI 0.110+ with async SQLAlchemy 2.0, asyncpg, Alembic
   - Auth: JWT (15min access + 30-day refresh), bcrypt password hashing
   - Routes: `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/refresh`, `GET /v1/auth/me`, `GET /v1/health`
   - 4 DB tables: users, audit_log, usage_events, feature_flags (+ 6 feature flag seeds)
   - Docker Compose: postgres:16 + redis:7 + qdrant:latest + backend with healthchecks
   - 6/6 tests passing, ruff ✅, mypy ✅

2. **Phase 0 full redesign** per pivot directive:
   - Landing page: hero ("Write Like Yourself. Not Like AI."), 3-step explainer, before/after example, dual CTA
   - Samples step: single textarea replaces 5 boxes; "Try with sample data" button for zero-friction testing
   - Comparison step: Version A/B/No Difference, confidence 1–5, comment, role field
   - Thank-you step: payment intent question (No/Maybe/$5/$10/$20/mo)
   - Success threshold updated: 30 users · 60%+ preference (was 10 users · 70%)

2. **Founder feedback loop**:
   - Email notification to `ngyan.prakash@gmail.com` on every submission (Resend)
   - `GET https://api.writingtwinai.com/responses` — all individual records
   - `GET https://api.writingtwinai.com/stats` — aggregate + payment intent breakdown
   - `POST /payment-intent` — stores thank-you screen intent in Redis

3. **Resend domain verified** — DNS records added in Hostinger, `waitlist@writingtwinai.com` sending live

4. **UX bug fixes**:
   - Validation error now shown directly below option cards (not buried at bottom)
   - Page auto-scrolls to options when Submit clicked without selection
   - Error clears immediately when user selects an option

---

## 🔜 Next Task

**Sprint 6 — AI Routing Hardening + Quality Retry:**
- Read `Vault/core/04-SPRINT-PLAN.md` Sprint 6 section
- Branch: `sprint-06-routing-hardening`
- Goal: Fallback chains, circuit breakers, quality retry loop, cost guard

**Before Sprint 6:**
- Deploy Sprint 5 to VPS: `./Vault/deploy/deploy.sh full` (VPS SSH was down; retry when available)
  - Adds `locale` column to users + `communication_memory` table (migration 0004)

---

## 🚧 Blockers

| Blocker | Owner | Since |
|---|---|---|
| No blockers | — | — |

---

## ⚠️ Technical Debt

| Item | Severity | Sprint to Fix |
|---|---|---|
| Google OAuth not wired (stub only) | Low | Sprint 7 |
| Email verification not implemented (stub only) | Low | Sprint 7 |
| No Stripe billing | Low | Sprint 7 |

---

## 🗺️ Sprint Progress

| Sprint | Name | Status | Branch | Commit |
|---|---|---|---|---|
| **S1** | Backend Foundation | 🟢 Done | `sprint-01-backend-foundation` | `05a258c` |
| **S2** | Humanization API | 🟢 Done | `sprint-02-humanization-api` | `5408f75` |
| **S3** | Chrome Extension MVP | 🟢 Done | `sprint-03-chrome-extension` | — |
| **S4** | Writing DNA Engine | 🟢 Done | `sprint-04-writing-dna` | `7a06806` |
| **S5** | Personalization (DNA + Memory + Cultural) | 🟢 Done | `sprint-05-personalization` | `4955913` |
| **S6** | AI Routing Hardening + Quality Retry | 🟢 Done | `sprint-06-routing-hardening` | `033c1ca` |
| **S7** | Billing + Auth Polish | 🔵 Next | — | — |
| **S8** | Frontend Dashboard | ⚪ Locked | — | — |
| **S9** | Polish + Launch | ⚪ Locked | — | — |

**Legend:** ⚪ Locked → 🔵 In Progress → 🟢 Done → 🔴 Blocked

---

## 🚀 Launch Checklist

### Technical
- [ ] All 9 sprints completed
- [ ] 76+ tests passing (`pytest -q`)
- [ ] Ruff + mypy clean
- [ ] Docker Compose boots clean on VPS
- [ ] Alembic migrations applied (`alembic upgrade head`)
- [ ] All API keys rotated to production values
- [ ] `.env` secrets set on VPS (never in git)
- [ ] NGINX config live (`/etc/nginx/sites-available/writingtwin`)
- [ ] SSL cert via Let's Encrypt (`certbot --nginx`)
- [ ] Health check passing: `curl https://api.writingtwinai.com/v1/health`
- [ ] Sentry error tracking live
- [ ] PostHog analytics live

### Chrome Extension
- [ ] Extension packaged (`npm run build` → `dist/`)
- [ ] Privacy policy URL in manifest
- [ ] Chrome Web Store developer account
- [ ] Extension reviewed and published
- [ ] Extension ID registered in backend CORS

### Marketing
- [ ] Landing page live at `writingtwinai.com`
- [ ] Waitlist form connected (email capture)
- [ ] SEO meta tags (`og:title`, `og:description`, `robots.txt`, `sitemap.xml`)
- [ ] Google Analytics / PostHog on landing page
- [ ] Product Hunt draft ready

### Business
- [ ] Stripe product IDs set in `.env`
- [ ] Free → Pro upgrade flow tested end-to-end
- [ ] Privacy policy + Terms of Service published
- [ ] Support email configured (`support@writingtwinai.com`)

---

## 📈 Key Business Metrics (Update Monthly)

| Metric | Target (Month 1) | Target (Month 3) | Actual |
|---|---|---|---|
| Waitlist signups | 500 | 2,000 | 0 |
| Extension installs | 200 | 1,000 | 0 |
| DAU | 50 | 300 | 0 |
| MRR | $500 | $3,000 | $0 |
| Pro conversions | 30 | 200 | 0 |

---

## 🧠 Notes / Decisions Made This Sprint

*(Append here during sprint, transfer to DECISIONS.md when done)*
