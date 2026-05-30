# Writing Twin AI — Project Status Dashboard

> **Update this file at the end of every sprint.**
> **Last Updated:** 2026-05-30

---

## 🎯 Current Milestone

**Phase:** Phase 0 ✅ Complete — Live at `https://writingtwinai.com`
**Current Sprint:** Sprint 1 — Backend Foundation (NOT STARTED)
**Target Launch:** MVP by end of Sprint 5 (~6–10 weeks from Sprint 1 start)

---

## 📊 Readiness Gauges

| Dimension | % | Notes |
|---|---|---|
| **MVP Readiness** | 5% | Phase 0 live, Sprint 1 not started |
| **Production Readiness** | 15% | VPS + NGINX + SSL live, no DB yet |
| **Test Coverage** | 0% | No tests |
| **Documentation** | 90% | Vault complete + Phase 0 deploy docs |
| **Business Model** | 70% | Pricing defined, cost model done |
| **Marketing** | 20% | Phase 0 demo live at writingtwinai.com |

---

## ✅ Last Completed Task

- [2026-05-30] **Phase 0 demo deployed** — FastAPI backend + Next.js frontend live on Hostinger VPS (`72.61.236.80`). NGINX + Let's Encrypt SSL. All endpoints verified:
  - `https://writingtwinai.com` → 200 OK
  - `https://www.writingtwinai.com` → 301 → root
  - `https://api.writingtwinai.com/health` → `{"status":"ok"}`
  - Containers: `wt_backend` (port 8011), `wt_frontend` (port 3010)
  - Redeploy: `./Vault/deploy/deploy-phase0.sh`

---

## 🔜 Next Task

**Sprint 1** — Backend Foundation
- Paste prompt from `active/SPRINT_01_BACKEND_FOUNDATION.md` into Claude Code
- Branch: `sprint-01-backend-foundation`
- Deliverables: FastAPI scaffold, JWT auth, PostgreSQL + Redis + Qdrant in docker-compose, Alembic migration 0001, audit_log + usage_events + feature_flags tables, 12+ tests passing

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
| **S1** | Backend Foundation | ⚪ Not Started | — | — |
| **S2** | Humanization API | ⚪ Locked | — | — |
| **S3** | Chrome Extension MVP | ⚪ Locked | — | — |
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
