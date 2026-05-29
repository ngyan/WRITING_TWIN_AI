# Writing Twin — Phase 0 Validation Demo

A 2-screen prototype that answers one question before building the full product:

> **Does personalized AI output sound more like the user than generic AI output?**

**Success threshold:** 70%+ of users prefer the Writing Twin version. 50%+ say it sounds like them.

---

## What it does

1. User pastes 3–5 writing samples (emails, messages they've actually written)
2. User pastes a draft message they want to send
3. The app generates two versions side by side:
   - **Generic AI:** Standard "improve this text" rewrite
   - **Writing Twin:** Rewrite constrained by the user's own writing samples
4. Blind A/B comparison — user picks which sounds more like them
5. Result + waitlist signup logged to Upstash Redis
6. Founder checks `/api/stats` (backend) for live validation progress

---

## Stack

| Layer | Tech | Cost |
|---|---|---|
| Frontend | Next.js 14 App Router | Free (Vercel) |
| Backend | FastAPI | Free (Render) |
| LLM | LiteLLM → Gemini Flash | ~$0.000165/rewrite |
| Storage | Upstash Redis | Free (10k cmd/day) |
| Rate limit | Vercel Edge Middleware | Free |

---

## Local dev (5 min setup)

### Backend

```bash
cd phase0/backend

# Copy env file and fill in your keys
cp .env.example .env
# Required: GEMINI_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

# Install deps (uv required: curl -LsSf https://astral.sh/uv/install.sh | sh)
uv venv .venv --python 3.12
source .venv/bin/activate
uv pip install -r pyproject.toml

# Run
uvicorn main:app --reload --port 8000
# → http://localhost:8000/health should return {"status":"ok"}
```

### Frontend

```bash
cd phase0/frontend

# Copy env file
cp .env.local.example .env.local
# BACKEND_URL=http://localhost:8000

npm install
npm run dev
# → http://localhost:3000
```

---

## Deploy (production)

### 1. Backend → Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo, set root directory to `phase0/backend`
3. Build: `pip install uv && uv pip install --system -r pyproject.toml`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`
6. Free plan — note 30-60s cold start on first request (by design for Phase 0)

### 2. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import project
2. Set root directory to `phase0/frontend`
3. Add environment variable: `BACKEND_URL=https://your-render-app.onrender.com`
4. Deploy → get your `writingtwin-demo.vercel.app` URL

### 3. Update backend CORS

Set `ALLOWED_ORIGIN=https://your-vercel-url.vercel.app` in Render env vars.

---

## Keep Render warm (optional)

To prevent cold-start abandonment, add a cron ping every 14 minutes.

**Option A:** GitHub Actions (free)

```yaml
# .github/workflows/keep-warm.yml
on:
  schedule:
    - cron: "*/14 * * * *"
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -s https://your-render-url.onrender.com/health
```

**Option B:** Upgrade to Railway Hobby ($5/month) — always on, no cold starts.

---

## Check validation progress

```bash
curl https://your-render-url.onrender.com/stats
```

Returns:
```json
{
  "total_comparisons": 12,
  "preferred_personalized": 9,
  "preferred_personalized_pct": 75,
  "would_send": 6,
  "would_send_pct": 50,
  "waitlist_signups": 4,
  "phase0_threshold_met": true
}
```

`phase0_threshold_met: true` = 10+ users, 70%+ prefer Writing Twin → proceed to Sprint 1.

---

## Phase 0 success criteria

| Metric | Target |
|---|---|
| Total comparisons | ≥ 10 users |
| Preferred personalized | ≥ 70% |
| "Sounds like me" | ≥ 50% |
| Waitlist signups | ≥ 5 |

If criteria met → proceed to Sprint 1 (Backend Foundation).
If not met → revisit the writing DNA prompt before building infrastructure.
