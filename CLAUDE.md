# Writing Twin AI — Claude Code Instructions

## What This Project Is

AI communication assistant that learns how a user writes (Writing DNA) and rewrites text to sound exactly like them. Delivered via Chrome Extension (Gmail, LinkedIn, Slack, Outlook). Backend API + Next.js dashboard.

**North Star:** User reads output and thinks "This sounds exactly like me." — not "This sounds AI."

---

## Start Every Session With

```
Read Vault/CLAUDE_RESUME.md          ← current state + architecture + git commands
Read Vault/PROJECT_STATUS.md         ← current sprint, blockers, launch checklist
Read Vault/active/SPRINT_NN_*.md     ← the active sprint spec before touching code
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.110+ / Python 3.12 / SQLAlchemy 2.0 async / Alembic / uv |
| Database | PostgreSQL 16 (primary) + Qdrant (vector) + Redis 7 (cache/sessions) |
| AI routing | LiteLLM → Gemini Flash (Free) → Claude Haiku (Pro) → Claude Sonnet (Enterprise) |
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| Extension | Chrome MV3 (TypeScript, no framework) |
| Auth | JWT 15min access + 24h refresh (httpOnly) + Google OAuth |
| Deploy | Docker Compose → Hostinger VPS → NGINX proxy |

---

## Vault Structure

```
Vault/
├── CLAUDE_RESUME.md         ← Session context restore (READ FIRST)
├── PROJECT_STATUS.md        ← Sprint status + launch checklist
├── CLAUDE_WORKFLOW.md       ← Before/during/after coding rules
├── 00-PROJECT-INDEX.md      ← Master navigation index
│
├── core/                    ← Numbered core project docs (01–11)
│   ├── 01-VISION-AND-BUSINESS-PLAN.md
│   ├── 02-DESIGN-SYSTEM.md
│   ├── 03-ARCHITECTURE.md   ← Read for any backend work
│   ├── 04-SPRINT-PLAN.md    ← Read before starting a sprint
│   ├── 05-CLAUDE-CODE-INSTRUCTIONS.md
│   ├── 06-COST-MODEL.md
│   ├── 07-PROMPTS-LIBRARY.md
│   ├── 08-MOAT.md
│   ├── 09-GTM-STRATEGY.md
│   ├── 10-DONE-LOG.md       ← Log completion here after every sprint
│   └── 11-FOUNDING-CONSTITUTION.md  ← Read before any strategic decision
│
├── architecture/            ← Technical deep-dives
│   ├── DECISIONS.md         ← Check before any architecture choice
│   ├── LITELLM_ROUTING.md
│   └── QDRANT_SCHEMA.md
│
├── product/                 ← Product strategy
│   ├── ROADMAP.md
│   ├── USER_PERSONAS.md
│   └── COMPETITOR_ANALYSIS.md
│
├── business/                ← Business model
│   ├── MONETIZATION.md
│   └── METRICS.md
│
├── active/                  ← Paste-ready Claude Code sprint prompts
├── archive/                 ← Completed sprint specs
├── growth/                  ← Chrome extension + landing page strategy
├── ops/                     ← Bugs + SEO tracking
└── deploy/                  ← deploy.sh (SSH-based VPS deployment)
```

---

## Non-Negotiable Rules

1. **Read `Vault/CLAUDE_RESUME.md` + active sprint spec before writing any code**
2. **One sprint = one Claude Code session.** Close terminal between sprints.
3. **All LLM calls go through `litellm.acompletion()`.** Zero direct `openai`/`anthropic`/`google` SDK in business logic.
4. **All config via Pydantic `Settings` from `.env`.** No hardcoded values, ever.
5. **All routes prefixed `/v1/`.** All DB access async. All responses via Pydantic schemas.
6. **Feature flags (`settings.FEATURE_*`) gate every new engine.** Never ship unflagged dark code.
7. **Check `Vault/architecture/DECISIONS.md` before any architecture decision** — it may already be decided.
8. **Run `ruff check` + `mypy` + `pytest -q` before every commit.** All three must pass.
9. **Log completion in `Vault/core/10-DONE-LOG.md`** + update `Vault/PROJECT_STATUS.md` at session end.
10. **Never commit `.env` files.** Stage specific files, not `git add -A`.

---

## Development Commands

```bash
# Start services
docker compose up -d postgres redis qdrant

# Install + run backend
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Quality checks (must pass before commit)
uv run ruff check app/
uv run mypy app/
uv run pytest -q

# New migration
uv run alembic revision --autogenerate -m "descriptive_name"

# Deploy to VPS
./Vault/deploy/deploy.sh full
```

---

## Git Conventions

```bash
# Branch naming
git checkout -b sprint-01-backend-foundation
git checkout -b sprint-02-humanization-api

# Commit format
git commit -m "feat: [Sprint N] what was built"
# Types: feat | fix | refactor | test | chore | docs

# Never merge sprint branch to main mid-session
# Open PR, get review, then merge
```

---

## Where to Read for Common Tasks

| Task | Read |
|---|---|
| Starting a sprint | `Vault/CLAUDE_RESUME.md` → `Vault/PROJECT_STATUS.md` → `Vault/active/SPRINT_NN_*` |
| Backend / DB work | `Vault/core/03-ARCHITECTURE.md` |
| Any arch decision | `Vault/architecture/DECISIONS.md` first |
| LLM / AI routing | `Vault/core/06-COST-MODEL.md` + `Vault/architecture/LITELLM_ROUTING.md` |
| Qdrant / vectors | `Vault/architecture/QDRANT_SCHEMA.md` |
| Prompt engineering | `Vault/core/07-PROMPTS-LIBRARY.md` |
| UI / design | `Vault/core/02-DESIGN-SYSTEM.md` |
| Chrome extension | `Vault/growth/CHROME_EXTENSION_ROLLOUT.md` |
| Strategic decision | `Vault/core/11-FOUNDING-CONSTITUTION.md` + `Vault/core/12-PRODUCT-VISION-2.0.md` |
| Pricing / billing | `Vault/business/MONETIZATION.md` |

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
