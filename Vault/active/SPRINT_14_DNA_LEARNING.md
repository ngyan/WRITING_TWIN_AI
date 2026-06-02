# Sprint 14 — DNA Learning Engine

**Branch:** `sprint-14-dna-learning`
**Base:** `2.0`
**Status:** ✅ Code Complete

---

## What We Built

Every time a user edits an AI rewrite before sending, the system extracts what changed —
which phrases were added, which were removed, and how formality shifted. After 3+ removals
of the same phrase, it becomes a "cringe phrase" that the twin actively avoids.

Zero manual list. Zero LLM calls. Pure signal from the user's own behavior.

---

## Architecture

```
User edits rewrite → FeedbackRequest(action="edited", edit_text=...) 
  → humanize_service.record_feedback()
  → dna_learning_service.schedule_learning()  [asyncio.create_task]
  → extract_phrases(original_output, final_text)  [2-gram + 3-gram diff]
  → compute_formality_delta()
  → dna_learning_repo.create()  [INSERT dna_learnings row]
  → _maybe_update_cringe()  [if phrase removed 3+ times → update writing_profiles.cringe_phrases]
  → writing_profiles.version++  [profile_version increments on cringe update]
```

### Minimum edit gate
Requires ≥ 5 words of symmetric difference between original and final text.
Prevents noise from minor punctuation fixes or reformatting.

### Cringe detection
- Queries all `phrases_removed` arrays via SQL `unnest()` 
- Phrases removed ≥ 3 times → promoted to `writing_profiles.cringe_phrases` (JSONB)
- `profile_version` bumped on each cringe list update

---

## New Files

| File | Purpose |
|---|---|
| `backend/app/models/dna_learning.py` | DNALearning ORM model |
| `backend/app/repositories/dna_learning_repo.py` | create, count_this_week, count_total, get_removed_phrase_counts |
| `backend/app/services/dna_learning_service.py` | extract_phrases, compute_formality_delta, process_edit, get_stats, schedule_learning |
| `backend/alembic/versions/0008_dna_learning.py` | Migration: dna_learnings table + cringe_phrases on writing_profiles |

## Modified Files

| File | Change |
|---|---|
| `backend/app/models/writing_profile.py` | Added `cringe_phrases: JSONB` column |
| `backend/app/core/config.py` | Added `FEATURE_DNA_LEARNING: bool = True` |
| `backend/app/services/humanize_service.py` | Hook into record_feedback for edited rewrites |
| `backend/app/routers/dna.py` | Added `GET /v1/dna/learning-stats` endpoint |
| `backend/app/schemas/dna.py` | Added `LearningStatsResponse` |
| `backend/app/main.py` | Registered dna_learning model |
| `frontend/src/lib/api.ts` | Added `LearningStats` interface + `getLearningStats()` |
| `frontend/src/app/dashboard/page.tsx` | Added "What your twin learned" card with cringe phrases |

---

## New API

### GET /v1/dna/learning-stats
Returns learning stats for the dashboard. Auth required.

```json
{
  "patterns_learned_this_week": 7,
  "total_learnings": 24,
  "cringe_phrases": ["as per my last email", "leverage", "circle back"],
  "profile_version": 3
}
```

---

## Deploy Steps

1. `alembic upgrade head` (migration 0008)
2. `FEATURE_DNA_LEARNING=True` is default — no .env change needed

---

## Quality

- ruff ✅
- mypy ✅ (also fixed pre-existing billing_service.py str|None return type)
- pytest ✅ 48 tests passing
- tsc ✅
