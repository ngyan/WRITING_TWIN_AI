# Writing Twin AI — Claude Code Resume

> **Read this first, every session.** One-page context restore.
> **Last Updated:** 2026-06-07

---

## 🎯 What We're Building

AI communication assistant that learns how YOU write (Writing DNA) and rewrites any text to sound exactly like you — delivered via Chrome extension (Gmail first; LinkedIn, Slack, Outlook coming).

**North Star:** User reads output and thinks: *"This sounds exactly like me."*

---

## 📍 Current State

| Item | Status |
|---|---|
| **Last Sprint** | CRO Homepage Redesign (2026-06-06) — deployed to production |
| **Branch** | `main` (cro-homepage-redesign merged) |
| **VPS** | Hostinger `72.61.236.80` — Docker + NGINX + Let's Encrypt (SSL exp 2026-08-28) |
| **Backend API** | ✅ Live — `https://api.writingtwinai.com/v1/health` |
| **Frontend** | ✅ Live — `https://writingtwinai.com` · Next.js 14 · PM2 port 3002 · HTTP 200 |
| **Homepage CRO** | ✅ 12-section redesign live — AnimatedDemo, WaitlistModal, WaitlistCounter, TrustPills, SocialProof, FounderStory, FAQ all filled and deployed |
| **Waitlist backend** | ✅ `/api/waitlist` → Supabase `waitlist` table · `/api/waitlist-count` live · Supabase project: `ynzawxgthzhkrnrehvrk` |
| **CTA mode** | ✅ `NEXT_PUBLIC_CTA_MODE=install` — "Add to Chrome — Free" CTA live |
| **Extension ZIP** | ✅ Built — `extension/writing-twin-ai-extension.zip` (31 KB, 10 files) |
| **Chrome Web Store** | ✅ Published — ID `pjagoopeamgadpgmlnjmdbplhfejeecb` · [store listing](https://chromewebstore.google.com/detail/writing-twin-ai/pjagoopeamgadpgmlnjmdbplhfejeecb) |
| **Billing** | ✅ Stripe Checkout + Customer Portal live |
| **Writing DNA** | ✅ Training API live + extension popup onboarding |
| **PostHog Analytics** | ✅ Live — pageview + funnel events tracking |
| **Privacy / Terms** | ✅ `/privacy` + `/terms` pages live |
| **SEO** | ✅ robots.txt + sitemap.xml + /vs-grammarly + /for/non-native-english live |

### VPS Frontend Deploy State (2026-06-07)
- **Deploy mode:** Docker Compose (switched from PM2) — frontend on port 3011, api on port 8010
- **Nginx:** `/etc/nginx/sites-available/writingtwinai` — proxy_pass to containers, SSL live
- **CTA vars:** `NEXT_PUBLIC_CTA_MODE=install` + `NEXT_PUBLIC_CHROME_STORE_URL` baked into Docker image via `docker-compose.prod.yml` (no `.env.local` needed)
- **Extension ID:** `pjagoopeamgadpgmlnjmdbplhfejeecb` — hardcoded in CORS + docker-compose.prod.yml
- **Supabase migration:** ⚠️ Confirm `supabase/migrations/20260606000001_create_waitlist_table.sql` has been run in Supabase SQL editor — waitlist signups will 500 until the table exists

---

## 🏗️ Architecture (TL;DR)

```
Chrome Extension (gmail.js + background.js + popup)
         ↓ JWT Bearer (auto-refresh on 401)
FastAPI Backend (api.writingtwinai.com)
    ├── /v1/auth/*          → JWT + refresh rotation
    ├── /v1/humanize        → DNA injection + LiteLLM routing + monthly limit gate
    ├── /v1/dna/*           → Writing DNA samples + background extraction
    ├── /v1/billing/*       → Stripe Checkout / Portal / Webhook
    └── /v1/health          → DB + Redis liveness check
         ↓                           ↓
   PostgreSQL 16             Qdrant (vector DB)
   Redis 7 (cache)           LiteLLM → Gemini Flash / Claude Haiku / Sonnet
         ↓
Next.js 14 Frontend (writingtwinai.com)
    ├── /                   → Landing page
    ├── /dashboard          → Usage widget + plan badge + DNA status
    ├── /onboarding/dna     → DNA training textarea
    ├── /pricing            → Free vs Pro comparison + Stripe Checkout
    ├── /privacy + /terms   → Legal pages
    └── /billing/success|cancel
```

**Deploy:** rsync → VPS → docker compose build + up (never git pull on VPS)

---

## 🔑 Plan Limits

| Plan | Rewrites/month | Price |
|---|---|---|
| Free | 20 | $0 |
| Pro | 300 | $5/mo (founding member) |

Monthly counter in `users.monthly_rewrite_count`, resets via `monthly_reset_at`.
On 429: backend returns `{"detail": "LIMIT_REACHED:..."}` — extension shows amber upgrade card.

---

## 🔜 What To Do Next Session

### ✅ DONE — Extension Is Live (2026-06-07)

- Extension ID: `pjagoopeamgadpgmlnjmdbplhfejeecb`
- Store URL: `https://chromewebstore.google.com/detail/writing-twin-ai/pjagoopeamgadpgmlnjmdbplhfejeecb`
- CTA flipped to `install` mode — "Add to Chrome — Free" live on homepage
- Backend CORS locked to specific extension ID (no more wildcard)
- Full deploy completed via `./Vault/deploy/deploy.sh full`

---

### ⚠️ PENDING — Confirm Before Anything Else
- **Supabase migration:** Paste `supabase/migrations/20260606000001_create_waitlist_table.sql` into Supabase SQL editor for project `ynzawxgthzhkrnrehvrk`. Waitlist signups fail until the `waitlist` table exists.

---

### If starting Phase 2 (Sprint 11+):
- Read `Vault/core/12-PRODUCT-VISION-2.0.md` → voice-first, context-aware, Outlook-first vision
- Read `Vault/core/13-EXECUTION-PLAN.md` → solo founder execution plan + reality check + build/cut matrix
- Read `Vault/product/ROADMAP.md` → full sprint specs (goal, DB, API, UI, success metric per sprint)
- **Revised sprint order (founder-validated):**
  - Sprint 11: Voice Twin MVP (speak → send-ready email in your voice)
  - Sprint 12: Outlook Extension (founder's primary platform)
  - Sprint 13: Context Engine V1 (auto-infer platform/audience, no manual setup)
  - Sprint 14: DNA Learning Engine (every edit sharpens the twin)
  - Sprint 15: Auto Draft Engine (draft ready before you start typing)
  - Sprint 16: LinkedIn + Reddit extension
  - Sprint 17: Communication Graph (behavior-inferred, not manually tagged)
  - Sprint 18: Meeting Intelligence (transcript → 5 deliverables)

---

## 📁 Key Files — Read Order Per Task

| Task | Files to Read |
|---|---|
| Session start | `CLAUDE_RESUME.md` → `PROJECT_STATUS.md` → active sprint spec |
| Any backend work | `core/03-ARCHITECTURE.md` + active sprint spec |
| Architecture decision | `architecture/DECISIONS.md` (check if already decided) |
| Sprint selection | `core/04-SPRINT-PLAN.md` + `PROJECT_STATUS.md` |
| Strategic / product question | `core/11-FOUNDING-CONSTITUTION.md` first |
| UI work | `core/02-DESIGN-SYSTEM.md` |
| LLM / AI work | `core/06-COST-MODEL.md` + `architecture/LITELLM_ROUTING.md` |
| Vector DB work | `architecture/QDRANT_SCHEMA.md` |
| Extension work | `growth/CHROME_EXTENSION_ROLLOUT.md` |
| Session end | Update `core/10-DONE-LOG.md` + `PROJECT_STATUS.md` |

---

## ⚡ Git Commands

```bash
# Check state
git branch --show-current
git log --oneline -5
git status

# Start a sprint
git checkout main && git pull
git checkout -b sprint-11-<name>

# Commit pattern
git commit -m "feat: [Sprint N] description"

# Push + PR
git push -u origin sprint-11-<name>
gh pr create --title "Sprint N — Name"
```

---

## 🚦 Hard Rules (Every Session)

1. Read this file + `PROJECT_STATUS.md` before writing any code
2. One sprint = one Claude Code session — close terminal between sprints
3. All LLM calls go through LiteLLM — **NEVER** direct provider SDK in business logic
4. All config via Pydantic `Settings` from `.env` — **NEVER** hardcoded values
5. All routes prefixed `/v1/`. All ORM access async. All responses via Pydantic schemas.
6. Feature flags (`settings.FEATURE_*`) gate every engine — never ship dark code
7. **NEVER** commit `.env`. Stage specific files, not `git add -A`
8. **NEVER** `git pull` on VPS — deploy via `./Vault/deploy/deploy.sh full` (rsync only)
9. Log completion in `core/10-DONE-LOG.md` + update `PROJECT_STATUS.md` at session end
