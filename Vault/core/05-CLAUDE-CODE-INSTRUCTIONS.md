# Claude Code Instructions — Writing Twin AI

> **Read this file at the start of EVERY Claude Code session.**
> **Purpose:** Prevent hallucination, prevent scope creep, minimize token waste.

---

## 🚨 BEFORE YOU WRITE ANY CODE

1. **Confirm working directory:**
   ```bash
   pwd
   # Must be: /Users/gyanprakash/Gyan/Claud_Code/WRITING_TWIN_AI
   ```
2. **Read the target sprint file** from `Vault/core/04-SPRINT-PLAN.md`
3. **Read ONLY the files listed under "Read"** for that sprint — no exploring
4. **Never run `pip install` directly** — add to `pyproject.toml` and use `uv pip install -r`
5. **Never run `alembic upgrade head` without a fresh migration** — generate first, review, then apply

---

## 🚫 ABSOLUTE RULES (Never Break)

| Rule | Reason |
|------|--------|
| Do NOT hardcode API keys | Use Pydantic `Settings` from `.env` |
| Do NOT call OpenAI/Anthropic/Gemini SDKs directly in business logic | All LLM calls go through `RouterService` |
| Do NOT bypass `CacheService` for any rewrite | Cache is the unit-economics moat |
| Do NOT modify production migrations | Always create a new Alembic revision |
| Do NOT log full email bodies in production | PII redaction is on by default |
| Do NOT remove feature flags without product approval | They protect us from rollback pain |
| Do NOT touch `requirements.txt` if `pyproject.toml` exists | Single source of truth |
| Do NOT couple services to each other's models | Use repositories + DTOs |
| Do NOT add a new top-level dependency without a justification comment | Bloat is silent |

---

## ✅ Standard Session Start Checklist

```bash
# 1. Confirm project root
pwd && ls -la

# 2. Read current sprint context
#    File: Vault/core/04-SPRINT-PLAN.md → find current Sprint section

# 3. Read only the files listed under "Read" for that sprint
#    Do NOT cat the whole codebase

# 4. Create only files listed under "Create"
# 5. Modify only files listed under "Modify"

# 6. Run quality gates
ruff check backend/
mypy backend/app/
pytest backend/tests/ -q

# 7. Log completion in Vault/core/10-DONE-LOG.md
# 8. Commit: git add -A && git commit -m "feat: [Sprint N] <feature>"
```

---

## 📝 Python File Template

```python
# backend/app/<layer>/<name>.py
"""
<Layer>: <Short purpose>

Sprint: S<N> — <Feature Name>
Owner: <service or domain>
Read before editing: Vault/core/04-SPRINT-PLAN.md
"""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass

# Imports: stdlib → third-party → first-party (separated by blank lines)

# Module body
```

---

## 🧱 Service Class Template

```python
# backend/app/services/<name>_service.py
from app.repositories.<x>_repo import XRepository
from app.schemas.<x> import XCreate, XRead


class XService:
    """One service = one responsibility. No cross-service imports."""

    def __init__(self, repo: XRepository) -> None:
        self._repo = repo

    async def create(self, data: XCreate) -> XRead:
        # 1. Validate (Pydantic already did basic; add business rules here)
        # 2. Call repo
        # 3. Return DTO (never raw ORM model)
        ...
```

---

## 🔌 API Router Template

```python
# backend/app/routers/<name>.py
from fastapi import APIRouter, Depends, status
from app.deps.auth import current_user
from app.deps.db import get_db
from app.schemas.<x> import XCreate, XRead
from app.services.<x>_service import XService

router = APIRouter(prefix="/v1/<name>", tags=["<name>"])


@router.post("", response_model=XRead, status_code=status.HTTP_201_CREATED)
async def create_x(
    data: XCreate,
    user = Depends(current_user),
    service: XService = Depends(),
) -> XRead:
    return await service.create(data, user)
```

---

## 🧪 Test Template

```python
# backend/tests/test_<feature>.py
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_<scenario>(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/v1/<endpoint>",
        json={...},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["field"] == "expected"
```

**Always mock external services.** Never hit real OpenAI/Anthropic/Stripe in CI.

---

## 🏁 Session End Checklist

```bash
# 1. Quality gates green
ruff check backend/
mypy backend/app/
pytest backend/tests/ -q

# 2. No files outside the sprint scope were modified
git diff --name-only

# 3. Add entry to Vault/core/10-DONE-LOG.md

# 4. Commit
git add -A
git commit -m "feat: [Sprint <N>] <short feature name>"

# 5. Push to feature branch (never main)
git push -u origin sprint-<n>-<feature-name>
```

---

## 🧠 Common Mistakes & Correct Approaches

| Mistake | Correct |
|---|---|
| `from anthropic import Anthropic` in `humanize_service.py` | Use `RouterService` |
| Hardcoded model string like `"claude-3-haiku"` | Pull from `Settings.DEFAULT_MODEL_PRO` etc. |
| Calling Stripe API directly inside a router | Wrap in `BillingService` |
| Using `print()` for debugging | Use `structlog` (already configured) |
| Forgetting `await` on async repo call | Mypy will catch — run it |
| Creating new DB session inside service | Inject via `Depends(get_db)` |
| Adding `try/except: pass` | Always log + re-raise unless explicitly handled |
| Hardcoding URLs like `http://localhost:8000` | Use `Settings.API_BASE_URL` |
| Importing from `app.models` in routers | Routers see schemas, not models |

---

## 🔍 When Stuck

1. **Re-read** the relevant section of `03-ARCHITECTURE.md`
2. **Search** for similar patterns: `grep -r "class .*Service" backend/app/services/`
3. **Ask the human** rather than guess — token cost of asking is < token cost of unwinding a bad path

---

## 🧰 Tools You're Allowed to Add

| Tool | When |
|---|---|
| `ruff` | Already in `pyproject.toml` |
| `mypy` | Already configured |
| `pytest` + `pytest-asyncio` + `httpx` | Already configured |
| `pytest-cov` | OK to add for coverage |
| `factory-boy` or `polyfactory` | OK if test data getting verbose |
| Anything else | Get approval first |
