# Writing Twin AI — Project Status Dashboard

> **Update this file at the end of every sprint.**
> **Last Updated:** 2026-06-13

---

## 🎯 Current Milestone

**Phase:** Phase 2 — Voice Twin + Platform Expansion
**Current Sprint:** Competitor-parity features ✅ — committed 2026-06-13, deploy pending
**Next Sprint:** Deploy features + rebuild extension v1.0.4 (context tone detection)
**Branch strategy:** All Phase 2 work branches from `main`; cro-homepage-redesign merged to `main`

---

## 📊 Readiness Gauges

| Dimension | % | Notes |
|---|---|---|
| **MVP Readiness** | 98% | All core features live + 6 competitor-parity features committed |
| **Production Readiness** | 85% | VPS fully live; extension awaiting Web Store approval |
| **Test Coverage** | 30% | 48 tests passing (auth + humanize + dna + personalization + routing + billing) |
| **Documentation** | 95% | Vault complete, WEBSTORE_LISTING.md ready |
| **Business Model** | 80% | Free (20/mo) + Pro ($5/mo, 300/mo) live via Stripe |
| **Marketing** | 65% | CRO homepage live; waitlist capturing; SEO pages /vs-grammarly + /for/non-native-english live |

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
| **S12** | Outlook Extension | `sprint-12-outlook-extension` | #12 🔵 Open | 🔵 Pending merge → `2.0` |
| **S17** | HiWorks Email + Compose Detection Engine | `sprint-17-hiworks` | — | 🟢 Done |
| **S17a** | Google OAuth (web + extension) | `sprint-17a-google-oauth` | #18 ✅ Merged | 🟢 Done |
| **CRO** | Homepage Redesign + Waitlist | `cro-homepage-redesign` | ✅ Merged | 🟢 Done + Deployed |
| **S18** | 6 Competitor-Parity Features | `main` | `ee994e8` | 🟡 Committed, deploy pending |

---

## 🔜 Next Actions

### 🟡 NEXT — Deploy 6 Features + Extension v1.0.4

1. `./Vault/deploy/deploy.sh full` — deploys frontend (DnaSnapshot, dashboard DNA, author match, consistency card) + backend (snapshot endpoint, consistency endpoint)
2. Rebuild extension: `cd extension && npm run build` → bump version to `1.0.4` in `manifest.json` → zip → upload to Chrome Web Store
3. Extension v1.0.4 brings context tone auto-detection (reads subject line + recipient domains)

---

### ✅ DONE — Extension Published + CTA Flipped (2026-06-07)

- Extension ID: `pjagoopeamgadpgmlnjmdbplhfejeecb`
- CTA mode: `install` — "Add to Chrome — Free" live
- Backend CORS: specific extension ID (no wildcard)
- Full deploy: `./Vault/deploy/deploy.sh full` — health check ✅

### ⚠️ PENDING — Supabase migration (waitlist broken until done)
- Paste `supabase/migrations/20260606000001_create_waitlist_table.sql` into Supabase SQL editor
- Project: `ynzawxgthzhkrnrehvrk` at supabase.co

### Next Sprint candidates (post-launch)
- **Sprint 11a — Google OAuth**: wire up `/v1/auth/google` (stub already exists in `auth.py`)
- **Sprint 11b — Email verification**: wire up `/v1/auth/verify-email` (stub exists)
- **Sprint 11c — LinkedIn/Slack extension**: new content scripts for additional platforms
- **Sprint 11d — Referral + growth**: referral code system, viral hooks

---

## 🚧 Blockers

| Blocker | Owner | Since |
|---|---|---|
| Supabase `waitlist` table migration not confirmed run | Gyan | 2026-06-07 |
| Waitlist signups return 500 until migration is run | Backend | 2026-06-07 |

---

## ⚠️ Technical Debt

| Item | Severity | Sprint to Fix |
|---|---|---|
| Google OAuth not wired (stub only at `/v1/auth/google`) | Low | Sprint 11a |
| Email verification not implemented (stub only) | Low | Sprint 11b |
| No Sentry error tracking | Medium | Sprint 11 |
| LinkedIn / Slack extension support | Medium | Sprint 11c |
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
- [x] Chrome Web Store developer account created
- [x] Extension uploaded and submitted for review
- [x] Extension reviewed and published (`pjagoopeamgadpgmlnjmdbplhfejeecb`)
- [x] Extension ID registered in backend CORS

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
