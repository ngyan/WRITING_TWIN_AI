# Writing Twin AI — Claude Code Workflow

> Mandatory workflow for every Claude Code session.
> Following this ensures continuity, prevents regressions, and keeps token usage optimized.

---

## BEFORE Coding (Session Start)

**Step 1 — Context Restore (every session)**
```
Read Vault/CLAUDE_RESUME.md
Read Vault/PROJECT_STATUS.md
Read Vault/active/SPRINT_NN_*.md  ← the current sprint spec
```

**Step 2 — Git State Check**
```bash
git branch --show-current
git status
git log --oneline -5
```
If on `main` or wrong branch: create/switch to the correct sprint branch before touching any file.

**Step 3 — Architecture Check (if backend work)**
```
Read Vault/core/03-ARCHITECTURE.md     ← data models, API contracts
Read Vault/architecture/DECISIONS.md           ← check if this decision was already made
```

**Step 4 — Constitution Check (if product/feature decision)**
```
Read Vault/core/11-FOUNDING-CONSTITUTION.md
```
If the proposed feature contradicts the Constitution, the feature is wrong — not the Constitution.

---

## DURING Coding

**File changes**
- Edit the minimum number of files. Prefer surgical edits over rewrites.
- Never rewrite a file that doesn't need changes.
- Keep each file under 500 lines where possible — split services, not files.
- Add `# TODO: Sprint N — [description]` comments for deferred work. Never leave unexplained TODOs.

**Database changes**
- Any schema change → new Alembic migration in the same sprint.
- Name migrations: `NNNN_descriptive_name.py` (e.g., `0002_add_rewrites_table.py`).
- Never edit a previous migration. Always create a new one.

**LLM calls**
- Always route through LiteLLM (`from litellm import acompletion`).
- Always log: model used, duration, token count, error if any → `usage_events` table.
- Always wrap in try/except with fallback — never let an LLM failure return a 500.

**Feature flags**
- New engine or risky feature → wrap in `if settings.FEATURE_*: ...`
- Never ship dark code (code that runs but isn't flagged off). Flag first, wire later.

**Tests**
- Every new endpoint → at least one test.
- Every new service method → unit test.
- Critical paths (auth, rewrite, DNA extraction) → 100% coverage.

**Decisions**
- If you make an architecture choice during coding (DB schema, service boundary, caching strategy), immediately note it in `PROJECT_STATUS.md → Notes` section.
- Transfer to `architecture/DECISIONS.md` at session end.

---

## AFTER Coding (Session End)

**Step 1 — Run verification suite**
```bash
cd backend
uv run ruff check app/
uv run mypy app/
uv run pytest -q
```
All three must pass before committing. Fix issues in the same session — do not defer.

**Step 2 — Git commit**
```bash
git add <specific files>   # never git add -A blindly
git commit -m "feat: [Sprint N] description of what was built"
```
Commit message format: `type: [Sprint N] what was done`
Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`

**Step 3 — Update vault**
```
Update Vault/core/10-DONE-LOG.md     ← files created, packages added, tests added, migration name
Update Vault/PROJECT_STATUS.md  ← update sprint status, next task, any new debt
Update Vault/architecture/DECISIONS.md       ← any arch decisions made this session
Update Vault/CLAUDE_RESUME.md   ← update "Current State" section if milestone changed
```

**Step 4 — Push + PR**
```bash
git push -u origin sprint-NN-name
# Open PR on GitHub. Do NOT merge to main until manually reviewed.
```

---

## TOKEN EFFICIENCY RULES

These rules come from analyzing 3 production projects (ParentReady, SpeakFlowAI, OnwardSafe Mobile). Apply them to stay within budget.

| Rule | Why |
|---|---|
| Read files by path, never paste entire files | Cuts input tokens 60–80% |
| Reference vault docs by path, not by content | LLM can read them on demand |
| One sprint = one session, close terminal between | Prevents context bleed and hallucinations |
| Give Claude the sprint spec file path, not the full text | ~3k token save per sprint |
| Write tests after services, not before | Prevents wasted tokens on re-writes |
| Never ask Claude to "review everything" | Targeted questions only |
| Use `# TODO: Sprint N` instead of implementing | Defers scope, saves tokens |

---

## ANTI-PATTERNS (Never Do These)

| Anti-pattern | Why | Alternative |
|---|---|---|
| `from openai import OpenAI` in business logic | Vendor lock, no fallback | `from litellm import acompletion` |
| `settings.API_KEY = "sk-..."` | Security vulnerability | Always from `.env` |
| Direct `db.query(Model).all()` | Sync DB, blocks event loop | `await session.execute(select(Model))` |
| `git add -A && git commit` | May commit `.env`, secrets | Stage specific files |
| Implementing Sprint N+1 features in Sprint N | Token waste, scope creep | Log as TODO, defer |
| Merging sprint branch to main mid-session | Breaks rollback | PR only, after manual review |
| Skipping `ruff` / `mypy` | Debt compounds fast | Run both before every commit |
