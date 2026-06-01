# Writing Twin AI — Claude Code Resume

> **Read this first, every session.** One-page context restore.
> **Last Updated:** 2026-06-01

---

## 🎯 What We're Building

AI communication assistant that learns how YOU write (Writing DNA) and rewrites any text to sound exactly like you — delivered via Chrome extension (Gmail first; LinkedIn, Slack, Outlook coming).

**North Star:** User reads output and thinks: *"This sounds exactly like me."*

---

## 📍 Current State

| Item | Status |
|---|---|
| **Last Sprint** | Sprint 10 — Chrome Web Store Packaging |
| **Branch** | `sprint-10-webstore` (PR #10 open — merge it) |
| **VPS** | Hostinger `72.61.236.80` — Docker + NGINX + Let's Encrypt (SSL exp 2026-08-28) |
| **Backend API** | ✅ Live — `https://api.writingtwinai.com/v1/health` |
| **Frontend Dashboard** | ✅ Live — `https://writingtwinai.com` (Next.js 14 on VPS) |
| **Extension ZIP** | ✅ Built — `extension/writing-twin-ai-extension.zip` (31 KB, 10 files) |
| **Chrome Web Store** | 🔴 Not yet submitted — user action required |
| **Billing** | ✅ Stripe Checkout + Customer Portal live |
| **Writing DNA** | ✅ Training API live + extension popup onboarding |
| **PostHog Analytics** | ✅ Live — pageview + funnel events tracking |
| **Privacy / Terms** | ✅ `/privacy` + `/terms` pages live |
| **SEO** | ✅ robots.txt + sitemap.xml live |

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

### If continuing Web Store launch:
1. Merge PR #10 on GitHub
2. Create Chrome Web Store developer account ($5 fee)
3. Upload `extension/writing-twin-ai-extension.zip`
4. Fill listing from `extension/WEBSTORE_LISTING.md`
5. Take 3 screenshots (1280×800) of the extension in Gmail
6. Submit for review
7. After approval: add `EXTENSION_ORIGIN=chrome-extension://ID` to VPS `backend/.env` + update CORS in `backend/app/main.py`

### If starting Sprint 11:
- Read `Vault/PROJECT_STATUS.md` → candidates: Google OAuth, email verification, LinkedIn extension, referral system
- Branch: `sprint-11-<name>`

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
