# Writing Twin AI — Project Status Dashboard

> **Update this file at the end of every sprint.**
> **Last Updated:** 2026-05-31

---

## 🎯 Current Milestone

**Phase:** Sprint 2 — Humanization API Complete
**Current Sprint:** Sprint 3 — Chrome Extension MVP
**Next Sprint:** Sprint 4 — Writing DNA Engine
**Target Launch:** MVP by end of Sprint 5 (~3–7 weeks from now)

---

## 📊 Readiness Gauges

| Dimension | % | Notes |
|---|---|---|
| **MVP Readiness** | 25% | Sprint 2 complete, humanization pipeline live |
| **Production Readiness** | 20% | VPS + NGINX + SSL live, Postgres + Redis + Qdrant in Docker |
| **Test Coverage** | 10% | 12 tests passing (auth + humanize) |
| **Documentation** | 90% | Vault complete + Phase 0 deploy docs |
| **Business Model** | 70% | Pricing defined, cost model done |
| **Marketing** | 20% | Phase 0 demo live at writingtwinai.com |

---

## ✅ Last Completed Tasks (2026-05-31)

1. **Sprint 2 — Humanization API** complete:
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

**Sprint 3 — Chrome Extension MVP:**
- Read `Vault/active/SPRINT_03_CHROME_EXTENSION.md` (create if not exists)
- Branch: `sprint-03-chrome-extension`
- Goal: Gmail compose hook that injects "Humanize" button → calls `/v1/humanize` → replaces selected text

**Before Sprint 3:**
- Deploy Sprint 1 + 2 backend to VPS (Postgres + Redis + Qdrant need setup on `72.61.236.80`)
- Set `.env` on VPS with all API keys (never in git)

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
| **S3** | Chrome Extension MVP | 🔵 Next | — | — |
| **S4** | Writing DNA Engine | ⚪ Locked | — | — |
| **S5** | Personalization (DNA + Memory + Cultural) | ⚪ Locked | — | — |
| **S6** | AI Routing Hardening + Quality Retry | ⚪ Locked | — | — |
| **S7** | Billing + Auth Polish | ⚪ Locked | — | — |
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
