# Writing Twin AI — Project Status Dashboard

> **Update this file at the end of every sprint.**
> **Last Updated:** 2026-06-02

---

## 🎯 Current Milestone

**Phase:** Phase 2 — Voice Twin + Platform Expansion
**Current Sprint:** Sprint 16 ✅ Code complete, PR #16 open → base `2.0` branch
**Next Sprint:** Sprint 17 — Slack Extension
**Branch strategy:** All Phase 2 work branches from `2.0` and PRs target `2.0`

---

## 📊 Readiness Gauges

| Dimension | % | Notes |
|---|---|---|
| **MVP Readiness** | 95% | All core features live — billing, DNA, extension, dashboard |
| **Production Readiness** | 85% | VPS fully live; extension awaiting Web Store approval |
| **Test Coverage** | 30% | 48 tests passing (auth + humanize + dna + personalization + routing + billing) |
| **Documentation** | 95% | Vault complete, WEBSTORE_LISTING.md ready |
| **Business Model** | 80% | Free (20/mo) + Pro ($5/mo, 300/mo) live via Stripe |
| **Marketing** | 40% | Landing + SEO + PostHog + privacy/terms live |

---

## ✅ Completed Sprints

| Sprint | Name | Branch | PR | Status |
|---|---|---|---|---|
| **S1** | Backend Foundation | `sprint-01-backend-foundation` | #1 | 🟢 Done |
| **S2** | Humanization API | `sprint-02-humanization-api` | #2 | 🟢 Done |
| **S3** | Chrome Extension MVP | `sprint-03-chrome-extension` | #3 | 🟢 Done |
| **S4** | Writing DNA Engine | `sprint-04-writing-dna` | #4 | 🟢 Done |
| **S5** | Personalization (DNA + Memory + Cultural) | `sprint-05-personalization` | #5 | 🟢 Done |
| **S6** | AI Routing Hardening + Quality Retry | `sprint-06-routing-hardening` | #6 | 🟢 Done |
| **S7** | Billing (Stripe + Entitlements) | `sprint-07-billing` | #7 | 🟢 Done |
| **S8** | Frontend Dashboard (Next.js 14) | `sprint-08-frontend-dashboard` | #8 | 🟢 Done |
| **S9** | Polish + Launch Readiness | `sprint-09-polish-launch` | #9 | 🟢 Done |
| **S10** | Chrome Web Store Packaging | `sprint-10-webstore` | #10 ✅ Merged | 🟢 Done |
| **S11** | Voice Twin MVP | `sprint-11-voice-twin` | #11 🔵 Open | 🔵 Pending merge → `2.0` |
| **S12** | Outlook Extension | `sprint-12-outlook-extension` | #12 ✅ Merged | 🟢 Done |
| **S13** | Context Engine V1 | `sprint-13-context-engine` | #13 ✅ Merged | 🟢 Done |
| **S14** | DNA Learning Engine | `sprint-14-dna-learning` | #14 ✅ Merged | 🟢 Done |
| **S15** | Auto Draft Engine | `sprint-15-auto-draft` | #15 🔵 Open | 🔵 Pending merge → `2.0` |
| **S16** | LinkedIn + Reddit Extension | `sprint-16-linkedin-reddit` | #16 🔵 Open | 🔵 Pending merge → `2.0` |

---

## 🔜 Next Actions

### Immediate (user actions required)

1. **Upload new ZIP to Web Store** — `extension/writing-twin-ai-extension.zip` (32 KB) — now includes LinkedIn + Reddit
2. **After approval**: add `EXTENSION_ORIGIN=chrome-extension://YOUR_ID` to VPS `backend/.env` → update CORS
3. **No backend deploy needed for Sprint 16** — extension-only sprint

### Next Sprint candidates

- **Sprint 17 — Slack Extension**: inject into `div[data-lexical-editor]` or `div.ql-editor` in Slack compose
- **Sprint 17a — Google OAuth**: wire up `/v1/auth/google` (stub already exists in `auth.py`)
- **Sprint 17b — Email verification**: wire up `/v1/auth/verify-email` (stub exists)
- **Sprint 17c — Referral + growth**: referral code system, viral hooks

---

## 🚧 Blockers

| Blocker | Owner | Since |
|---|---|---|
| Chrome Web Store review pending (1–7 days) | Google | 2026-06-01 |
| Extension CORS not yet updated (waiting for Web Store assigned ID) | Backend | 2026-06-01 |

---

## ⚠️ Technical Debt

| Item | Severity | Sprint to Fix |
|---|---|---|
| Google OAuth not wired (stub only at `/v1/auth/google`) | Low | Sprint 11a |
| Email verification not implemented (stub only) | Low | Sprint 11b |
| No Sentry error tracking | Medium | Sprint 11 |
| Slack extension support | Medium | Sprint 17 |
| Rate limiting at NGINX layer (currently only app-layer) | Low | Sprint 12 |

---

## 🚀 Launch Checklist

### Technical
- [x] All 10 sprints completed
- [x] 48 tests passing (`pytest -q`)
- [x] Ruff + mypy clean
- [x] Docker Compose boots clean on VPS
- [x] Alembic migrations applied (`alembic upgrade head`)
- [x] All API keys rotated to production values
- [x] `.env` secrets set on VPS (never in git)
- [x] NGINX config live
- [x] SSL cert via Let's Encrypt (expires 2026-08-28)
- [x] Health check passing: `curl https://api.writingtwinai.com/v1/health`
- [ ] Sentry error tracking live
- [x] PostHog analytics live

### Chrome Extension
- [x] Extension packaged (`writing-twin-ai-extension.zip`)
- [x] Privacy policy URL in manifest (`https://writingtwinai.com/privacy`)
- [ ] Chrome Web Store developer account created
- [ ] Extension uploaded and submitted for review
- [ ] Extension reviewed and published
- [ ] Extension ID registered in backend CORS

### Marketing
- [x] Landing page live at `writingtwinai.com`
- [x] SEO: `robots.txt` + `sitemap.xml` live
- [x] Privacy policy + Terms of Service published
- [ ] Product Hunt draft ready
- [ ] Waitlist/social campaign for launch day

### Business
- [x] Stripe Checkout + Customer Portal live
- [x] Free → Pro upgrade flow live
- [x] Free plan: 20 rewrites/month
- [x] Pro plan: 300 rewrites/month at $5/mo (founding member pricing)
- [ ] Support email configured (`support@writingtwinai.com`)

---

## 📈 Key Business Metrics (Update Monthly)

| Metric | Target (Month 1) | Target (Month 3) | Actual |
|---|---|---|---|
| Waitlist signups | 500 | 2,000 | — |
| Extension installs | 200 | 1,000 | 0 (pre-launch) |
| DAU | 50 | 300 | — |
| MRR | $500 | $3,000 | $0 |
| Pro conversions | 30 | 200 | 0 |

---

## 🧠 Architecture Notes

- VPS: Hostinger `72.61.236.80` — Docker Compose + NGINX + Let's Encrypt
- Deploy via rsync only (`Vault/deploy/deploy.sh full`) — VPS has no git repo
- API keys live only in VPS `backend/.env` — never in git
- NEXT_PUBLIC_* vars baked at Docker build time (deploy.sh reads from backend/.env)
- Backend `/auth/refresh` rotates both tokens (access + refresh) on every call
