# Sprint 1 — Backend Foundation

**Claude Code Execution Prompt**
**Created:** 2026-05-30
**Branch:** `sprint-01-backend-foundation`
**Depends On:** Nothing (first session)
**Token Budget:** ~6k

---

## PASTE INTO CLAUDE CODE:

```
Read Vault/00-PROJECT-INDEX.md
Read Vault/core/03-ARCHITECTURE.md
Read Vault/core/05-CLAUDE-CODE-INSTRUCTIONS.md
Read Vault/core/04-SPRINT-PLAN.md (only the "Sprint 1" section)

## Sprint 1: Backend Foundation — FastAPI + Postgres + Redis + Qdrant + Auth

### BRANCH RULES (CRITICAL)
1. Check current branch: `git branch --show-current`
2. If no git repo yet: `git init && git checkout -b main`
3. Create and switch to branch:
   - `git checkout -b sprint-01-backend-foundation`
4. ALL Sprint 1 work stays on this branch. NEVER commit to `main` until reviewed.

### RULES (non-negotiable)
- Python 3.12. FastAPI 0.110+. SQLAlchemy 2.0 (async). Pydantic v2.
- No LLM logic in this sprint. None. Even stubs are not allowed.
- All config via Pydantic `Settings` reading from `.env`. No hardcoded values.
- All routes prefixed `/v1/`.
- All ORM access goes through async sessions. No sync DB calls.
- All routes return Pydantic schemas, never ORM models directly.
- All endpoints have at least one test. Use `httpx.AsyncClient` + `pytest-asyncio`.
- Use `uv` for dependency management (pyproject.toml + uv.lock).

### STEP 0 — Discovery (skip if directory is empty)
```bash
pwd
ls -la
```
If a `backend/` directory exists with files: STOP and ask the human before proceeding.

### STEP 1 — Project Skeleton
Create at the project root:

```
WRITING_TWIN_AI/
├── .gitignore
├── docker-compose.yml
├── README.md
└── backend/
    ├── pyproject.toml
    ├── Dockerfile
    ├── .env.example
    ├── alembic.ini
    ├── alembic/
    │   ├── env.py
    │   ├── script.py.mako
    │   └── versions/
    │       └── 0001_initial.py
    ├── app/
    │   ├── __init__.py
    │   ├── main.py
    │   ├── core/
    │   │   ├── __init__.py
    │   │   ├── config.py
    │   │   ├── security.py
    │   │   └── db.py
    │   ├── models/
    │   │   ├── __init__.py
    │   │   └── user.py
    │   ├── schemas/
    │   │   ├── __init__.py
    │   │   ├── user.py
    │   │   └── auth.py
    │   ├── repositories/
    │   │   ├── __init__.py
    │   │   └── user_repo.py
    │   ├── services/
    │   │   ├── __init__.py
    │   │   └── auth_service.py
    │   ├── routers/
    │   │   ├── __init__.py
    │   │   ├── health.py
    │   │   └── auth.py
    │   └── deps/
    │       ├── __init__.py
    │       ├── db.py
    │       └── auth.py
    └── tests/
        ├── __init__.py
        ├── conftest.py
        └── test_auth.py
```

### STEP 2 — pyproject.toml

Minimum dependencies:
- fastapi[standard] ^0.110
- uvicorn[standard]
- sqlalchemy[asyncio] ^2.0
- asyncpg
- alembic ^1.13
- pydantic ^2.5
- pydantic-settings ^2.1
- python-jose[cryptography]
- passlib[bcrypt]
- redis ^5
- qdrant-client ^1.7
- structlog
- httpx (test)

Dev deps: pytest, pytest-asyncio, ruff, mypy.

### STEP 3 — docker-compose.yml

Services: `postgres` (16), `redis` (7), `qdrant` (latest), `backend` (build local Dockerfile).
Use named volumes. Healthchecks on each. Backend depends_on postgres+redis+qdrant healthy.

### STEP 4 — Core Modules

`app/core/config.py` — Pydantic `Settings` reading all env vars from `Vault/core/03-ARCHITECTURE.md` Environment Variables section.

`app/core/security.py` — `hash_password`, `verify_password`, `create_access_token`, `create_refresh_token`, `decode_token`.

`app/core/db.py` — async engine, async sessionmaker, `Base = declarative_base()`.

### STEP 5 — User Model + Auth Flow

Implement per `Vault/core/03-ARCHITECTURE.md`:
- `app/models/user.py` — exactly the User model in the architecture doc
- `app/schemas/auth.py` — `RegisterRequest`, `LoginRequest`, `TokenPair`, `RefreshRequest`
- `app/schemas/user.py` — `UserRead`, `UserCreate`
- `app/repositories/user_repo.py` — `get_by_email`, `get_by_id`, `create`, `update_last_active`
- `app/services/auth_service.py` — `register`, `login`, `refresh`, `get_current_user_by_token`
- `app/routers/auth.py` — endpoints per architecture doc (register, login, refresh, logout, me)
- `app/routers/health.py` — `GET /health` returns `{"status":"ok"}` + verifies DB+Redis connectivity
- `app/deps/db.py` — yields async session
- `app/deps/auth.py` — `current_user` dependency that parses Bearer token

OAuth (Google), email verification, password reset: stub the endpoints but mark with `# TODO: Sprint 7 — Billing & Auth Polish`. Do NOT implement now.

### STEP 5B — Observability Tables (MANDATORY — Do NOT defer)

These three tables must be in the Sprint 1 migration. Lesson from production: ParentReady added activity logging at Sprint ~20 and required 2 extra sprints + a backfill migration. Never again.

**`app/models/audit_log.py`**
```python
class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str]           # e.g., "auth.register", "rewrite.request", "dna.extract"
    resource_type: Mapped[str | None]   # e.g., "user", "rewrite", "dna_sample"
    resource_id: Mapped[str | None]
    ip_address: Mapped[str | None]
    user_agent: Mapped[str | None]
    status: Mapped[str]           # "success" | "failure" | "error"
    detail: Mapped[dict | None] = mapped_column(JSONB)   # extra context, no PII
    created_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)
```

**`app/models/usage_event.py`**
```python
class UsageEvent(Base):
    __tablename__ = "usage_events"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    event_type: Mapped[str]       # "rewrite" | "dna_extract" | "memory_store"
    model: Mapped[str | None]     # e.g., "gemini/gemini-1.5-flash"
    input_tokens: Mapped[int | None]
    output_tokens: Mapped[int | None]
    latency_ms: Mapped[int | None]
    cost_usd: Mapped[float | None]
    cache_hit: Mapped[bool] = mapped_column(default=False)
    quality_retries: Mapped[int] = mapped_column(default=0)
    source: Mapped[str | None]    # "chrome_extension" | "web_app" | "api"
    created_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)
```

**`app/models/feature_flag.py`**
```python
class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(unique=True, index=True)
    enabled: Mapped[bool] = mapped_column(default=False)
    description: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
```

Seed these feature flags in the initial migration:
```python
# In 0001_initial.py data migration section
flags = [
    ("FEATURE_WRITING_DNA",           False, "Sprint 4 — Writing DNA extraction engine"),
    ("FEATURE_CONTEXT_ENGINE",        True,  "Sprint 2 — Basic context detection (9 contexts)"),
    ("FEATURE_CULTURAL_ENGINE",       False, "Sprint 5 — Cultural Intelligence (locale-aware adaptation)"),
    ("FEATURE_QUALITY_RETRY",         False, "Sprint 6 — Quality score + auto-retry loop"),
    ("FEATURE_EXTENSION_BETA",        False, "Sprint 3 — Chrome Extension beta users only"),
    ("FEATURE_COMMUNICATION_MEMORY",  False, "Sprint 5 — Communication Memory engine"),
]
```

Also add these to `app/core/config.py` as Pydantic Settings fields (env-var overrides for local dev):
```python
FEATURE_WRITING_DNA: bool = False
FEATURE_CONTEXT_ENGINE: bool = True
FEATURE_CULTURAL_ENGINE: bool = False
FEATURE_QUALITY_RETRY: bool = False
FEATURE_EXTENSION_BETA: bool = False
FEATURE_COMMUNICATION_MEMORY: bool = False
```

Add `app/services/audit_service.py` — `log(user_id, action, resource_type, resource_id, status, detail)` — write to DB async (non-blocking, fire-and-forget via `asyncio.create_task`).

Add `app/services/usage_service.py` — `log(user_id, event_type, model, ...)` — same pattern.

OAuth (Google), email verification, password reset: stub the endpoints but mark with `# TODO: Sprint 7 — Billing & Auth Polish`. Do NOT implement now.

### STEP 6 — Alembic Initial Migration

`alembic/env.py` — async-aware, imports `Base.metadata` from `app.core.db`.
`alembic/versions/0001_initial.py` — creates ALL four tables:
- `users` — matching the User model in `core/03-ARCHITECTURE.md`
- `audit_log` — per STEP 5B above
- `usage_events` — per STEP 5B above
- `feature_flags` — per STEP 5B above (with seed data for 6 flags)

### STEP 7 — main.py

```python
# app/main.py — example skeleton, expand as needed
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.routers import auth, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # init structlog, redis pool, qdrant client
    yield
    # cleanup


def create_app() -> FastAPI:
    app = FastAPI(
        title="Writing Twin AI API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.include_router(health.router)
    app.include_router(auth.router)
    return app


app = create_app()
```

### STEP 8 — Tests

`tests/conftest.py`:
- Override `DATABASE_URL` to a test database
- Provide `client: AsyncClient` fixture
- Provide `auth_headers` fixture that registers + logs in a test user

`tests/test_auth.py`:
- `test_register_creates_user_and_returns_token_pair`
- `test_login_with_correct_password_succeeds`
- `test_login_with_wrong_password_fails_with_401`
- `test_refresh_with_valid_token_returns_new_access_token`
- `test_me_endpoint_returns_authenticated_user`
- `test_me_endpoint_without_token_returns_401`

### STEP 9 — README + .env.example

`backend/.env.example` — copy from Vault/core/03-ARCHITECTURE.md (Environment Variables section).
Root `README.md` — quickstart only:
```
# Writing Twin AI

## Dev setup
cp backend/.env.example backend/.env
docker compose up -d postgres redis qdrant
cd backend && uv sync && uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

### STEP 10 — Verification

Run before committing:
```bash
cd backend
uv run ruff check app/
uv run mypy app/
uv run pytest -q
```

All three must pass. Then:
```bash
git add -A
git commit -m "feat: [Sprint 1] backend foundation — FastAPI + auth + DB"
```

### STEP 11 — Log Completion

Append to `Vault/core/10-DONE-LOG.md` using the template at the top of that file.
Include: files created, files modified (none expected), packages added, migration `0001_initial`, test count, branch name, commit SHA.

Also update `Vault/PROJECT_STATUS.md`:
- Sprint 1 status → 🟢 Done
- Sprint 2 status → 🔵 In Progress
- Last Completed Task → "Sprint 1 — Backend Foundation"
- Next Task → "Sprint 2 — Humanization API"
- Production Readiness → 10%
- MVP Readiness → 15%

---

## OUT OF SCOPE FOR SPRINT 1 (do NOT do these)

- ❌ Humanize endpoint (Sprint 2)
- ❌ LLM router (Sprint 2)
- ❌ Cache service (Sprint 2)
- ❌ Writing DNA (Sprint 4)
- ❌ Stripe (Sprint 7)
- ❌ Frontend (separate sprint)
- ❌ Chrome extension (Sprint 3)
- ❌ Email verification logic (Sprint 7)
- ❌ Google OAuth (Sprint 7)

---

## SUCCESS CRITERIA

When this prompt is done, the human can:

1. `docker compose up` and see Postgres, Redis, Qdrant boot
2. `cd backend && uv run uvicorn app.main:app` and see FastAPI on port 8000
3. `curl -X POST http://localhost:8000/v1/auth/register -H "Content-Type: application/json" -d '{"email":"a@b.com","password":"hunter2hunter2"}'` and get back a token pair
4. Use that access token to call `GET /v1/auth/me` and see the user back
5. Run `pytest -q` and see 6+ tests pass

If any of those fail, the sprint is incomplete. Stay in the session and fix.
```

---

## Notes for the human (Gyan)

- Expected duration: 45–90 min in Claude Code
- Expected token usage: 4k–7k
- After commit: open a PR (don't merge to main) so you have a checkpoint
- Next sprint (`Sprint 2: Humanization API`) creates its own paste-ready prompt — ask me when ready
