# Writing Twin AI — Project Status Dashboard

> **Update this file at the end of every sprint.**
> **Last Updated:** 2026-05-30 (evening)

---

## 🎯 Current Milestone

**Phase:** Phase 0 — Validation Demo Live & Collecting Data
**Current Sprint:** Phase 0 validation in progress — waiting for 30 users, 60%+ personalized preference
**Next Sprint:** Sprint 1 — Backend Foundation (unlocks when Phase 0 threshold met)
**Target Launch:** MVP by end of Sprint 5 (~6–10 weeks after Sprint 1 start)

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

## ✅ Last Completed Tasks (2026-05-30)

1. **Phase 0 full redesign** per pivot directive:
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

**Immediate** — Drive 30 users to `writingtwinai.com`:
- Share with target users: non-native English professionals (engineers, PMs, founders, consultants)
- Monitor: `https://api.writingtwinai.com/stats` + email inbox for per-submission notifications
- Track: total comparisons, % preferring personalized, waitlist sign-ups, payment intent

**When Phase 0 threshold met (30 users, 60%+):**
- Start Sprint 1 — Backend Foundation
- Paste prompt from `active/SPRINT_01_BACKEND_FOUNDATION.md` into Claude Code
- Branch: `sprint-01-backend-foundation`

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
