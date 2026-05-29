# Writing Twin AI — Metrics & KPIs

> Track these religiously. Data drives product decisions, not opinions.
> **Last Updated:** 2026-05-30
> **Tracking tools:** PostHog (product) + LangFuse (AI) + Stripe (revenue)

---

## Product Metrics

### Activation
| Metric | Definition | Target (M1) | Target (M3) |
|---|---|---|---|
| Extension install → first rewrite | % of installs that complete first rewrite within 24h | > 60% | > 70% |
| First rewrite → second rewrite | % that return within 7 days | > 50% | > 60% |
| Free → DNA activation | % of free users who upload 3+ writing samples | > 20% | > 35% |
| Onboarding completion rate | % who complete 3-step onboarding (install → login → first rewrite) | > 55% | > 65% |

### Engagement
| Metric | Definition | Target (M1) | Target (M3) |
|---|---|---|---|
| DAU | Daily active users (≥ 1 rewrite) | 50 | 300 |
| WAU | Weekly active users | 150 | 800 |
| MAU | Monthly active users | 300 | 1,500 |
| Rewrites per DAU | Avg rewrites per active day | > 3 | > 5 |
| DAU/MAU | Stickiness ratio | > 20% | > 25% |
| Extension CTR | % of page visits where rewrite button is clicked | > 8% | > 12% |

### Retention
| Metric | Definition | Target (M1) | Target (M3) |
|---|---|---|---|
| D7 retention | Users who return within 7 days of first rewrite | > 40% | > 50% |
| D30 retention | Users who return within 30 days | > 25% | > 35% |
| D30 retention — DNA users | DNA users who return within 30 days | > 50% | > 60% |
| Monthly churn (paid) | Paid users who cancel/month | < 5% | < 3% |

### Quality
| Metric | Definition | Target |
|---|---|---|
| Rewrite acceptance rate | Rewrites used vs. discarded | > 70% |
| Edit rate | % of rewrites edited before use | < 30% |
| "Sounds like me" rating | In-app 👍/👎 on DNA rewrites | > 75% thumbs up |
| Retry rate | % of rewrites that trigger quality retry | < 15% |

---

## AI / LLM Metrics

Track in LangFuse. Review weekly.

| Metric | Definition | Target |
|---|---|---|
| Avg rewrite latency (P50) | Median end-to-end rewrite time | < 1.5s |
| Avg rewrite latency (P95) | 95th percentile | < 3.0s |
| Semantic cache hit rate | % of rewrites served from Redis cache | > 35% |
| LLM error rate | % of LLM calls that return error/exception | < 0.5% |
| Fallback rate | % of calls that fall back to secondary model | < 5% |
| Quality gate pass rate | % of rewrites that pass threshold without retry | > 85% |
| Quality gate retry-1 success | % that pass on first retry | > 90% |
| Cost per rewrite (Free) | Gemini Flash, incl. retry overhead | < $0.0005 |
| Cost per rewrite (Pro) | Claude Haiku, incl. retry overhead | < $0.002 |
| DNA embedding cost per user | Cost to extract + store Writing DNA once | < $0.05 |
| Model distribution | % of rewrites by model | Track per plan tier |

### Model Distribution Targets (By Plan)
| Plan | Gemini Flash | GPT-4o mini | Claude Haiku | Claude Sonnet |
|---|---|---|---|---|
| Free | > 95% | 5% | 0% | 0% |
| Pro | 20% | 30% | 50% | 0% |
| Enterprise | 0% | 0% | 30% | 70% |

---

## Business Metrics

Track in Stripe + manual spreadsheet. Review weekly.

| Metric | Definition | Target (M1) | Target (M3) | Target (M6) |
|---|---|---|---|---|
| MRR | Monthly Recurring Revenue | $500 | $3,000 | $10,000 |
| New MRR | Net new MRR from new customers | $500 | $1,000 | $3,000 |
| Churned MRR | MRR lost from cancellations | < $50 | < $150 | < $300 |
| Net MRR growth | New - Churned | > $450 | > $850 | > $2,700 |
| Paying customers | Total active paying users | 35 | 200 | 650 |
| Free → Pro conversion | % of free users who upgrade | > 8% | > 12% | > 15% |
| ARPU | Avg revenue per user (paid) | $15 | $16 | $18 |
| LTV (estimate) | ARPU / monthly churn | $300 | $400 | $500 |
| CAC | Cost to acquire one paying user | < $30 | < $25 | < $20 |
| LTV:CAC ratio | Target > 3:1 | > 10:1 | > 16:1 | > 25:1 |
| Gross margin | (MRR - LLM cost - VPS) / MRR | > 90% | > 92% | > 94% |

---

## Growth Metrics (Chrome Extension)

| Metric | Definition | Target (M1) | Target (M3) |
|---|---|---|---|
| Extension installs | Total Chrome Web Store installs | 200 | 1,000 |
| Weekly new installs | New installs per week | 50 | 150 |
| Install → signup rate | % of installs that create an account | > 40% | > 50% |
| Active extension users (WAU) | Users who triggered extension at least once in 7 days | 120 | 600 |
| Extension uninstall rate | % who uninstall within 7 days of install | < 20% | < 15% |
| Top surfaces | Gmail / LinkedIn / Slack / Other | Track | Track |

---

## Privacy-Safe Tracking Rules

**Do track:**
- Rewrite count (event: `rewrite_requested`)
- Surface (Gmail, LinkedIn, Slack, Google Docs, Other)
- Model used (Gemini, Haiku, Sonnet)
- Rewrite latency (ms)
- DNA active (boolean)
- User rating (👍/👎)
- Plan tier

**Never track:**
- Rewrite input text (PII)
- Rewrite output text (PII)
- User email addresses in events (use anonymous user_id)
- Any communication content whatsoever

---

## PostHog Event Schema

```python
# Track on every rewrite request
posthog.capture(
    distinct_id=user.id,
    event="rewrite_requested",
    properties={
        "source": "chrome_extension",       # or "web_app"
        "surface": "gmail",                  # gmail|linkedin|slack|docs|other
        "model": "claude-haiku-3",
        "dna_active": True,
        "text_length_chars": 450,
        "latency_ms": 1234,
        "cache_hit": False,
        "quality_retries": 0,
        "plan": "pro"
    }
)

# Track on user rating
posthog.capture(
    distinct_id=user.id,
    event="rewrite_rated",
    properties={
        "rating": "positive",               # positive|negative
        "dna_active": True,
        "edit_distance_pct": 12,            # % of characters changed before use
    }
)
```

---

## Dashboard Review Cadence

| Cadence | What to Review |
|---|---|
| Daily | LLM error rate, P95 latency, cache hit rate (LangFuse) |
| Weekly | DAU/WAU, rewrite acceptance rate, free→pro conversions, new MRR |
| Monthly | D30 retention, churn, LTV:CAC, DNA adoption rate |
| Quarterly | Competitor pricing, full unit economics review, update targets |
