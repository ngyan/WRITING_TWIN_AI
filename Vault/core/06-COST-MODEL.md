# Cost Model — Writing Twin AI

> **Purpose:** Every architectural and product decision must defend itself against this file.
> **Updated:** 2026-05-30 — verify all pricing against provider websites before commit.

---

## 🎯 North Star

**Pro user (1,000 rewrites/month) costs < $2/month at the API layer.**
At $19/mo revenue, that's **89%+ gross margin** — enough to fund growth without venture capital.

If a feature breaks this number, it's a no-go without explicit justification.

---

## 💸 Provider Pricing (verify before launch)

> ⚠️ Pricing changes frequently. Run `python scripts/verify_pricing.py` quarterly. Numbers below are approximate as of mid-2026 — confirm in provider dashboards before locking budgets.

| Provider / Model                  | Input $/1M tok | Output $/1M tok | Use Case                        |
| --------------------------------- | -------------- | --------------- | ------------------------------- |
| Gemini Flash (latest)             | ~$0.075        | ~$0.30          | Free tier, low-stakes rewrites  |
| Claude Haiku 4.5                  | ~$1.00         | ~$5.00          | Pro tier default                |
| Claude Sonnet 4.6                 | ~$3.00         | ~$15.00         | Enterprise + executive tone     |
| GPT-4.1 mini                      | ~$0.40         | ~$1.60          | Backup for Claude downtime      |
| OpenAI `text-embedding-3-small`   | ~$0.02         | n/a             | DNA + semantic cache embeddings |
| Ollama (self-hosted Llama 3.1 8B) | Compute only   | Compute only    | Enterprise on-prem              |

---

## 🧮 Per-Rewrite Math

Typical rewrite shape (after compression):

- **System prompt + DNA block:** ~400 input tokens
- **User text (email body):** ~200 input tokens
- **Output (humanized version):** ~250 output tokens

### Cost per rewrite (cache miss)

| Tier | Provider | Input cost | Output cost | **Total** |
|---|---|---|---|---|
| Free | Gemini Flash | 600 × $0.075/M = $0.000045 | 250 × $0.30/M = $0.000075 | **~$0.00012** |
| Pro | Claude Haiku | 600 × $1/M = $0.0006 | 250 × $5/M = $0.00125 | **~$0.00185** |
| Enterprise | Claude Sonnet | 600 × $3/M = $0.0018 | 250 × $15/M = $0.00375 | **~$0.00555** |

### Monthly cost per user (no cache)

| Tier | Rewrites/mo | Cost/rewrite | **Monthly cost** | Plan price | Gross margin |
|---|---|---|---|---|---|
| Free | 900 (30/day × 30d) | $0.00012 | **$0.11** | $0 | -$0.11 (CAC) |
| Pro | 1,500 (realistic active) | $0.00185 | **$2.77** | $19 | 85% |
| Team | 2,000/seat | $0.00185 | **$3.70/seat** | $39/seat | 91% |
| Enterprise | 3,000/seat | $0.00555 | **$16.65/seat** | $99–200/seat | 83–92% |

### With 40% cache hit rate

- Pro effective cost: **$2.77 × 0.6 = $1.66/month** → 91% margin
- Free effective cost: **$0.066/month** → covers itself with creator referrals at ~$0.50 LTV

---

## 🧠 Routing Rules (Day 1)

```python
# backend/app/services/router_service.py — selection logic

def select_model(user_plan: str, intent: str | None, override: str | None = None) -> ModelChoice:
    if override:
        return MODELS[override]

    # Executive tone always uses the best model regardless of plan (within budget guard)
    if intent == "executive":
        return MODELS["claude-sonnet"]

    match user_plan:
        case "free":
            return MODELS["gemini-flash"]
        case "pro":
            return MODELS["claude-haiku"]
        case "team":
            return MODELS["claude-haiku"]
        case "enterprise":
            return MODELS["claude-sonnet"]
        case _:
            return MODELS["gemini-flash"]
```

### Fallback Chain (each tier)
| Primary | Fallback 1 | Fallback 2 |
|---|---|---|
| Gemini Flash | GPT-4.1 mini | Claude Haiku |
| Claude Haiku | GPT-4.1 mini | Gemini Flash |
| Claude Sonnet | GPT-4.1 (full) | Claude Haiku |

**Trigger fallback** on: timeout > 8s, 5xx error, rate limit (429), or content filter false-positive.

---

## 🔁 Semantic Cache Strategy

### Hit Criteria
- **Exact hash match:** SHA-256 of `f"{tone}:{normalized_text}"`. TTL: 24h. Same user only.
- **Semantic match:** cosine ≥ **0.93** on `text-embedding-3-small` vectors. Same tone, same intent. Cross-user OK only if `user_consent_to_share_cache = true` (default false; opt-in).

### Cache Hit Rate Targets

| Phase | Target | How |
|---|---|---|
| Month 1 | 15% | Exact hash only (user replays) |
| Month 2 | 30% | Semantic cache live, same-user |
| Month 3 | 40% | Cross-user opt-in pool warmed up |
| Month 6 | 50%+ | Phrase-level prefix caching layer added |

### Cache Eviction
- LRU eviction at 50 GB Qdrant storage
- Hard delete on GDPR request within 24h

---

## 🛑 Cost Guardrails (CostGuardService)

```python
# Triggered at app startup and per-request

DAILY_LIMITS = {
    "free":       USD(2.00),   # whole tier combined; throttle then degrade
    "pro":        USD(0.50),   # per-user daily ceiling
    "team":       USD(1.00),   # per-seat daily ceiling
    "enterprise": USD(5.00),   # per-seat daily ceiling
}

# When ceiling hit:
# 1. Log to LangFuse + alert Slack #ops
# 2. Force-route user to next-cheapest model
# 3. If still over, return cached response with notice "cost-saver mode"
# 4. Never block — UX always responds, even if degraded
```

### Global Kill Switches (env-driven)
```bash
KILL_SWITCH_PROVIDER_OPENAI=false       # set true → stop using OpenAI immediately
KILL_SWITCH_PROVIDER_ANTHROPIC=false
KILL_SWITCH_PROVIDER_GEMINI=false
KILL_SWITCH_ALL_LLM=false               # nuclear: serve only cached responses
```

---

## 📊 Cost Observability

Every `Rewrite` row stores `cost_usd`. LangFuse traces include cost per call.

### Required Dashboards (Grafana)
1. **Cost / day** (line chart, split by provider)
2. **Cost / user / day** (top 50 users by spend)
3. **Cache hit rate** (line, 7-day rolling)
4. **Cost per Pro user MTD vs plan price** (gauge)
5. **Provider error rate + fallback frequency** (line)

### Alerts (PagerDuty / Slack)
- Pro user > $0.50 spend in 24h → investigate misuse
- Daily total > $200 in dev → cap
- Cache hit rate < 25% for 24h → investigate ingestion regression
- Any provider error rate > 5% over 1h → automatic fallback + alert

---

## 🧪 Embeddings Cost (Often Forgotten)

| Operation | Tokens | Cost |
|---|---|---|
| DNA extraction (50 samples × 300 tok avg) | 15,000 | $0.0003 |
| Semantic cache write (per rewrite) | 200 | $0.000004 |
| Semantic cache lookup (per rewrite) | 200 | $0.000004 |

Negligible at MVP scale. Revisit at 1M rewrites/month.

---

## 🔚 The Numbers That Matter This Quarter

| KPI | Target | Stretch | Owner |
|---|---|---|---|
| Cost per Pro rewrite (after cache) | < $0.0011 | $0.0008 | RouterService |
| Cache hit rate | > 40% by M3 | > 50% by M6 | CacheService |
| Latency p95 | < 3s | < 2s | RouterService |
| Provider error rate | < 1% | < 0.3% | RouterService |
| Pro gross margin | > 85% | > 92% | Founder |

If any KPI drifts: open an issue tagged `cost-regression` and re-read this file.
