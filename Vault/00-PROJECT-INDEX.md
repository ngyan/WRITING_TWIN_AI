# Writing Twin AI — Master Index

> **Last Updated:** 2026-06-02
> **Status:** Phase 1 complete — Chrome Web Store pending review. Phase 2 planning in progress.
> **Project Path:** `/Users/gyanprakash/Gyan/Claud_Code/WRITING_TWIN_AI`
> **Vault Path:** `/Users/gyanprakash/Gyan/Claud_Code/WRITING_TWIN_AI/Vault/`

---

## 📁 Vault Structure

### Session Start Files (Read Every Time)
| File | Purpose |
|------|---------|
| `CLAUDE_RESUME.md` | One-page context restore + current state + hard rules |
| `PROJECT_STATUS.md` | Dashboard — sprint status, blockers, launch checklist |
| `CLAUDE_WORKFLOW.md` | Before/during/after coding checklist |

### Core Project Docs
| File | Purpose | Read When |
|------|---------|-----------|
| `core/11-FOUNDING-CONSTITUTION.md` | North-star philosophy, principles, six engines | **Before any strategic decision** |
| `architecture/DECISIONS.md` | Architecture decision log | Before any arch choice |
| `product/ROADMAP.md` | 6-phase product roadmap | Sprint planning |
| `business/MONETIZATION.md` | Pricing tiers, unit economics, break-even | Pricing/billing work |
| `product/COMPETITOR_ANALYSIS.md` | Grammarly, Compose AI, WordTune analysis | Positioning decisions |
| `product/USER_PERSONAS.md` | 6 user personas | Product/UX decisions |
| `business/METRICS.md` | Product, AI, business KPIs | Analytics + sprint review |
| `core/01-VISION-AND-BUSINESS-PLAN.md` | What we're building & why it wins | Strategic decisions |
| `core/02-DESIGN-SYSTEM.md` | Colors, typography, Tailwind tokens | Any UI work |
| `core/03-ARCHITECTURE.md` | Data models, API contracts, service boundaries | Any backend work |
| `core/04-SPRINT-PLAN.md` | The 9 sprints with read/create/modify lists | Picking next sprint |
| `core/05-CLAUDE-CODE-INSTRUCTIONS.md` | Rules, guardrails, session checklists | Every Claude Code session |
| `core/06-COST-MODEL.md` | LLM unit economics, routing rules, cache targets | Any AI integration work |
| `core/07-PROMPTS-LIBRARY.md` | Versioned prompts (DNA, Humanize, Context, Cultural, Quality) | Prompt engineering work |
| `core/08-MOAT.md` | Why we win vs Grammarly / ChatGPT / Wordtune | Strategic decisions |
| `core/09-GTM-STRATEGY.md` | ICP, pricing, channels, launch sequence | Marketing & growth work |
| `core/10-DONE-LOG.md` | Completed sprint history | Every session end |
| `core/12-PRODUCT-VISION-2.0.md` | **2.0 vision — voice-first, context-aware, Outlook-first** | **Before Phase 2+ product decisions** |
| `core/13-EXECUTION-PLAN.md` | **Solo founder execution plan + reality check + build/cut matrix** | **Before starting any sprint** |

### Subfolders
| Folder | Contents |
|---|---|
| `active/` | Paste-ready Claude Code prompts for upcoming sprints |
| `archive/` | Completed sprint specs (move here after sprint closes) |
| `architecture/` | `LITELLM_ROUTING.md` + `QDRANT_SCHEMA.md` — deep technical specs |
| `ops/` | `BUGS.md` + `SEO_SITE.md` — operational tracking |
| `growth/` | `CHROME_EXTENSION_ROLLOUT.md` + `LANDING_PAGE_COPY.md` |
| `deploy/` | `deploy.sh` — SSH-based VPS deployment script |
| `docs/` | Additional reference documents |

---

## 🎯 Product One-Liner

> **Writing Twin AI** learns how *you* write and helps you communicate faster across every channel — email, LinkedIn, Slack, docs — while sounding like the better version of yourself, never like generic AI.

---

## 🏗️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend (web app) | Next.js 14 (App Router) + TypeScript + Tailwind | SEO + SSR + DX |
| Browser extension | Chrome MV3 (vanilla TS) | Smallest surface, fastest reviews |
| Backend | FastAPI + Python 3.12 | Async, Pydantic, fastest LLM iteration |
| Primary DB | PostgreSQL 16 | Reliable, JSONB for flexible profile data |
| Cache + queue | Redis 7 | Sessions, rate limit, semantic cache layer |
| Vector DB | Qdrant | Self-host, gRPC fast, simpler than Pinecone |
| LLM router | LiteLLM | One proxy, multi-provider, retry & fallback |
| LLM providers | Gemini Flash (free), Claude Haiku (Pro), Claude Sonnet (Enterprise) | See `core/06-COST-MODEL.md` |
| Auth | JWT access + httpOnly refresh + Google OAuth | Standard, no surprises |
| Payments | Stripe (subs + usage-based add-on) | Industry default |
| Infra | Docker Compose (dev) → single VPS (prod) → k8s later | Don't pre-scale |
| Observability | Sentry + Prometheus + Grafana + LangFuse | LLM-specific tracing matters |

---

## 🚀 Tonight's Quickstart

```bash
# 1. Drop the downloaded files into your existing Vault folder
cp -R ~/Downloads/Vault/* /Users/gyanprakash/Gyan/Claud_Code/WRITING_TWIN_AI/Vault/

# 2. Vault is already added to Obsidian — just refresh the file tree (Cmd+R)

# 3. Initialize the project repo at the project root
cd /Users/gyanprakash/Gyan/Claud_Code/WRITING_TWIN_AI
git init && git checkout -b main
echo "Vault/" >> .gitignore   # OPTIONAL: keep vault out of code repo. Skip if you want it tracked.
git add -A && git commit -m "chore: initial commit with vault"

# 4. Open Claude Code in /Users/gyanprakash/Gyan/Claud_Code/WRITING_TWIN_AI
#    and paste the prompt block from:
#    Vault/active/SPRINT_01_BACKEND_FOUNDATION.md
```

> **About `.gitignore`:** If you want your docs version-controlled alongside the code, remove the `Vault/` line. The OnwardSafe project tracked the vault inside the code repo — your call.

---

## ⚠️ Hard Rules (Apply To Every Sprint)

1. **One sprint = one Claude Code session.** Close terminal between sprints.
2. **Always read `core/05-CLAUDE-CODE-INSTRUCTIONS.md` at session start.**
3. **Token budget per sprint is in `core/04-SPRINT-PLAN.md`.** Stay under it.
4. **Never hardcode API keys.** Use `.env` + Pydantic `Settings`.
5. **Every LLM call goes through the router.** No direct provider SDK calls in business logic.
6. **Every rewrite passes through the semantic cache lookup.** No exceptions — cache is the moat.
7. **Log completion in `core/10-DONE-LOG.md` before closing the session.**

---

## 🧭 Where to Start Reading

- **Every session:** `CLAUDE_RESUME.md` → `PROJECT_STATUS.md` → active sprint spec
- **New to the project?** `11` → `01` → `08` → `04` → `05`
- **Ready to build?** `CLAUDE_WORKFLOW.md` → `05` → `04` → `active/SPRINT_01_*`
- **Architecture question?** `architecture/DECISIONS.md` first → `03`
- **Cost / LLM routing?** `06` + `architecture/LITELLM_ROUTING.md`
- **Vector DB question?** `architecture/QDRANT_SCHEMA.md`
- **Marketing / SEO?** `ops/SEO_SITE.md` + `growth/LANDING_PAGE_COPY.md`
- **Extension question?** `growth/CHROME_EXTENSION_ROLLOUT.md`
- **Pricing decision?** `business/MONETIZATION.md`
- **Strategic / product decision?** `11` (Constitution) first, always
