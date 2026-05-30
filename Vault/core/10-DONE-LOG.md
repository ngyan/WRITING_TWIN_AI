# Done Log — Writing Twin AI

> Log every completed sprint here so Claude Code has full context of what's been done.

---

## Format

```
## [YYYY-MM-DD] Sprint <N> — <Feature Name>

- Files created: [list]
- Files modified: [list]
- Packages added: [list]
- Migrations: [alembic revision IDs]
- Tests added: [count + brief description]
- Notes: [any gotchas, design decisions, follow-ups]
- Branch: [branch name]
- Commit: [SHA]
- Status: ✅ Complete | ⚠️ Partial | ❌ Reverted
```

---

## [2026-05-30] Sprint 0 — Vault & Documentation Foundation

- Files created:
  - `Vault/00-PROJECT-INDEX.md`
  - `Vault/01-VISION-AND-BUSINESS-PLAN.md`
  - `Vault/02-DESIGN-SYSTEM.md`
  - `Vault/03-ARCHITECTURE.md`
  - `Vault/04-SPRINT-PLAN.md`
  - `Vault/05-CLAUDE-CODE-INSTRUCTIONS.md`
  - `Vault/06-COST-MODEL.md`
  - `Vault/07-PROMPTS-LIBRARY.md`
  - `Vault/08-MOAT.md`
  - `Vault/09-GTM-STRATEGY.md`
  - `Vault/10-DONE-LOG.md`
  - `Vault/active/SPRINT_01_BACKEND_FOUNDATION.md`
- Files modified: none (greenfield)
- Packages added: none
- Notes: Documentation patterns adapted from OnwardSafe vault. Cost model and prompt library are net-new additions reflecting this product's LLM-heavy architecture. All pricing in `06-COST-MODEL.md` should be verified against provider websites before committing budgets — numbers are mid-2026 approximations. Default routing locked: Free → Gemini Flash, Pro → Claude Haiku, Enterprise → Claude Sonnet.
- Branch: n/a (pre-repo)
- Status: ✅ Complete

---

<!-- Add future sprint entries below this line -->

## [2026-05-30] Phase 0 — Demo Deployment (Hostinger VPS)

- Files created:
  - `phase0/backend/main.py` — FastAPI app (rewrite, feedback, stats, health endpoints)
  - `phase0/backend/Dockerfile` — Python 3.12-slim + uv
  - `phase0/backend/pyproject.toml` — FastAPI, LiteLLM, Upstash Redis, Uvicorn
  - `phase0/frontend/` — Next.js 14 App Router with A/B writing style comparison UI
  - `phase0/frontend/Dockerfile` — multi-stage Node 20 standalone build
  - `docker-compose.phase0.yml` — wt_backend (8011) + wt_frontend (3010)
  - `Vault/deploy/nginx-writingtwinai.conf` — NGINX config (www→root 301, SSL blocks)
  - `Vault/deploy/deploy-phase0.sh` — rsync + docker compose redeploy script
  - `DNS_SETUP.md` — VPS deployment reference (replaces Render/Vercel approach)
- Files modified:
  - `phase0/frontend/next.config.ts` — added `output: "standalone"`
- Infrastructure:
  - VPS: Hostinger `72.61.236.80` (shares server with onwardsafe.com, zero conflict)
  - Ports: backend 8011, frontend 3010 (onwardsafe uses 8020, 3000, 5173)
  - SSL: Let's Encrypt via Certbot, auto-renews, expires 2026-08-28
  - DNS: 3 A records in Hostinger → VPS IP
- LLM: LiteLLM → `gemini/gemini-1.5-flash` (Phase 0 only)
- Storage: Upstash Redis (feedback + waitlist logging)
- Notes:
  - Switched from Render (backend) + Vercel (frontend) to VPS mid-session — eliminates cold starts, keep-warm cron, and credential sprawl across 3 platforms
  - `BACKEND_URL` is server-side only; frontend containers reach backend via Docker internal network (`http://wt-backend:8000`)
  - Phase 0 has no DB — all state in Upstash Redis
- Branch: `main`
- Commit: `c5e8304`
- Status: ✅ Complete — live at `https://writingtwinai.com`

## [2026-05-30] Doc Update — Founding Constitution Integration

- Files created:
  - `Vault/11-FOUNDING-CONSTITUTION.md` (north-star philosophy, four principles, product pyramid, six engines)
- Files modified:
  - `Vault/00-PROJECT-INDEX.md` — registered `11`, made it the first strategic read
  - `Vault/03-ARCHITECTURE.md` — added `MemoryService`, `CulturalService`, `QualityService`; added `CommunicationMemory` model + Quality score columns on `Rewrite`; added Qdrant `user_memory` collection; added engine→service mapping
  - `Vault/04-SPRINT-PLAN.md` — S2 now includes context detection + quality scoring; S5 expanded to deliver DNA + Memory + Cultural engines; S6 adds Quality retry loop; overview table + budgets updated (MVP now ~40k)
  - `Vault/07-PROMPTS-LIBRARY.md` — added `cultural.adapt.v1` (locale ruleset table + block template) and Quality retry behavior spec; updated inventory
- Notes: The Constitution introduced three engines not in the original master doc — Communication Memory, Cultural Intelligence, Quality. All three are now mapped to concrete services, models, and sprints. No code yet; pure documentation. Sprint 1 is unaffected and still ready to execute as-is.
- Status: ✅ Complete
