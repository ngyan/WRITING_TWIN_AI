# Writing Twin AI — Claude Code Resume

> **Read this first, every session.** One-page context restore.
> **Last Updated:** 2026-05-30 (evening)

---

## 🎯 What We're Building

AI communication assistant that learns how YOU write (Writing DNA) and rewrites any text to sound exactly like you — delivered primarily via Chrome extension (Gmail, Outlook, LinkedIn, Slack, Teams).

**North Star:** User reads output and thinks: *"This sounds exactly like me."*

---

## 📍 Current State

| Item | Status |
|---|---|
| **Sprint** | Phase 0 validation — fully live, collecting real user data |
| **Branch** | `main` |
| **Phase 0 Demo** | ✅ Live at `https://writingtwinai.com` |
| **Backend (Phase 0)** | ✅ FastAPI on VPS — `https://api.writingtwinai.com/health` |
| **Frontend (Phase 0)** | ✅ Next.js on VPS — redesigned with landing page + enhanced feedback |
| **VPS** | Hostinger `72.61.236.80` — Docker + NGINX + Let's Encrypt |
| **Email** | ✅ Resend live — waitlist confirmation + founder notification on every submission |
| **Feedback storage** | ✅ Upstash Redis — view at `https://api.writingtwinai.com/responses` |
| **Database** | Not initialized (Sprint 1) |
| **Chrome Extension** | Not started |
| **Phase 0 Threshold** | 30 users · 60%+ prefer personalized → unlocks Sprint 1 |

### Phase 0 — What's Live

| Feature | Status |
|---|---|
| Landing page — hero, 3-step explainer, before/after example | ✅ |
| Single textarea + "Try with sample data" button | ✅ |
| Blind comparison: Version A / Version B / No Difference | ✅ |
| Confidence rating 1–5 | ✅ |
| Optional comment field | ✅ |
| Waitlist: email + role | ✅ |
| Payment intent question (No/Maybe/$5/$10/$20/mo) | ✅ |
| Founder email notification on every submission | ✅ |
| `GET /responses` — all individual feedback records | ✅ |
| `GET /stats` — aggregate validation metrics | ✅ |
| `POST /payment-intent` — stores intent from thank-you screen | ✅ |

---

## 🏗️ Architecture (TL;DR)

```
Chrome Extension (content.js + background.js)
         ↓ JWT Bearer
FastAPI Backend (app/)
    ├── /v1/auth/*          → JWT + Google OAuth
    ├── /v1/rewrite         → Humanize + DNA injection
    ├── /v1/dna/*           → Writing DNA samples
    ├── /v1/memory/*        → Communication Memory
    └── /v1/profile         → User settings
         ↓                           ↓
   PostgreSQL 16             Qdrant (vector DB)
   Redis 7 (cache)           LiteLLM (AI routing)
```

**Stack at a glance:**
- Backend: FastAPI 0.110+ / Python 3.12 / SQLAlchemy 2.0 async / Alembic / uv
- Vector: Qdrant — user writing DNA embeddings (`user_dna` + `user_memory` collections)
- Cache: Redis 7 — semantic cache, rate limiting, refresh tokens
- LLM: LiteLLM → Gemini Flash (Free) → Claude Haiku (Pro) → Claude Sonnet (Enterprise)
- Frontend: Next.js 14 App Router + TypeScript + Tailwind
- Extension: Chrome MV3 (TypeScript, no framework)
- Auth: JWT (15min access + 24h refresh httpOnly) + Google OAuth
- Deploy: Docker Compose on Hostinger VPS → NGINX public proxy

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
git checkout -b sprint-01-backend-foundation

# Commit pattern (always use Sprint N prefix)
git commit -m "feat: [Sprint 1] backend foundation — FastAPI + auth + DB"

# After sprint: push + open PR (do NOT merge to main until reviewed)
git push -u origin sprint-01-backend-foundation
```

---

## 🚦 Hard Rules (Every Session)

1. Read this file + `PROJECT_STATUS.md` + active sprint spec before writing any code
2. One sprint = one Claude Code session — close terminal between sprints
3. All LLM calls go through LiteLLM — **NEVER** direct provider SDK in business logic
4. All config via Pydantic `Settings` from `.env` — **NEVER** hardcoded values
5. All routes prefixed `/v1/`. All ORM access async. All responses via Pydantic schemas.
6. Feature flags (`settings.FEATURE_*`) gate every engine — never ship dark code without a flag
7. Log `audit_log` and `usage_events` from Sprint 1 — do not defer observability
8. Update `PROJECT_STATUS.md` + `architecture/DECISIONS.md` after any architecture choice
9. Log completion in `core/10-DONE-LOG.md` before closing the session
10. See `CLAUDE_WORKFLOW.md` for the full before/during/after checklist
