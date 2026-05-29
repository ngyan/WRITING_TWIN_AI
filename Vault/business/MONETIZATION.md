# Writing Twin AI — Monetization & Unit Economics

> **Last Updated:** 2026-05-30
> Reference: `core/06-COST-MODEL.md` for LLM routing rules. `core/09-GTM-STRATEGY.md` for ICP + channels.

---

## Pricing Tiers

### Free — $0/month

**Purpose:** Acquisition + product-led growth. Show the magic. Convert to Pro.

| Feature | Limit |
|---|---|
| Rewrites per month | 30 |
| Writing DNA | ❌ Not included |
| Communication Memory | ❌ Not included |
| Cultural Intelligence | ❌ Not included |
| Chrome Extension | ✅ Included (limited) |
| Context detection | ✅ Basic (3 contexts) |
| AI model | Gemini Flash 1.5 only |
| Support | Community only |

**Conversion trigger:** User hits 30/month rewrite limit. Prompt: *"You've used 30 rewrites this month. Upgrade to Pro for unlimited rewrites + your personal Writing DNA."*

---

### Pro — $15/month (or $12/month billed annually = $144/yr)

**Purpose:** Individual professionals — the core paying segment.

| Feature | Limit |
|---|---|
| Rewrites per month | 500 |
| Writing DNA | ✅ Up to 3 active profiles |
| Communication Memory | ✅ Last 90 days |
| Cultural Intelligence | ✅ All locales |
| Chrome Extension | ✅ Full |
| Context detection | ✅ All 9 contexts |
| AI model | Claude Haiku 3 (default), GPT-4o mini (option) |
| Priority support | Email, 24h response |

**Pricing rationale:** Below Grammarly Pro ($12/mo) for comparison, but above Compose AI ($9.99/mo). Our DNA differentiation justifies slight premium. Annual plan creates LTV lock-in.

---

### Team — $49/month per 5 seats (or $39/month billed annually)

**Purpose:** Sales teams, support teams, recruiters. Shared DNA templates, admin controls.

| Feature | Limit |
|---|---|
| Rewrites per month | 2,000 per seat |
| Writing DNA | ✅ Per-user + shared team templates |
| Communication Memory | ✅ Last 365 days |
| Cultural Intelligence | ✅ All locales + custom locale rules |
| Chrome Extension | ✅ Full |
| Admin dashboard | ✅ Usage analytics, team settings |
| SSO | ✅ Google Workspace SSO |
| Audit log | ✅ 90-day export |
| Support | Slack Connect channel |

**Gate:** Available after Sprint 7 (Billing + Auth Polish).

---

### Enterprise — Custom pricing (typically $299–$999/month per 20–50 seats)

**Purpose:** Large organizations needing compliance, SSO, local deployment, SLA.

| Feature | Details |
|---|---|
| Rewrites | Unlimited |
| Writing DNA | Team DNA library, admin-managed |
| Communication Memory | Unlimited retention |
| SSO | SAML, OIDC, Azure AD, Okta |
| Audit log | Full, exportable, GDPR-compliant |
| Local deployment | Docker image, air-gapped option |
| SLA | 99.9% uptime, 4h response |
| Support | Dedicated CSM |

**Gate:** Available after Phase 6 (post-PMF). Do not build compliance/SSO until 1,000+ paying users.

---

## Unit Economics (LLM Cost Model)

### Cost Per Rewrite

| Model | Input cost /1M | Output cost /1M | Avg input | Avg output | Cost/rewrite |
|---|---|---|---|---|---|
| Gemini Flash 1.5 | $0.075 | $0.30 | 600 tokens | 400 tokens | **$0.000165** |
| GPT-4o mini | $0.15 | $0.60 | 600 tokens | 400 tokens | **$0.000330** |
| Claude Haiku 3 | $0.25 | $1.25 | 600 tokens | 400 tokens | **$0.000650** |
| Claude Sonnet 3.5 | $3.00 | $15.00 | 600 tokens | 400 tokens | **$0.007800** |

> DNA-enhanced rewrites add ~200 tokens input for the DNA block → multiply above by 1.33x.

### Monthly Cost Per User (By Plan)

| Plan | Rewrites/mo | Model | Raw LLM cost | Cache hit (40%) | Net LLM cost |
|---|---|---|---|---|---|
| **Free** | 30 | Gemini Flash | $0.005 | -$0.002 | **$0.003** |
| **Pro** | 500 | Claude Haiku | $0.325 | -$0.130 | **$0.195** |
| **Pro** (with DNA) | 500 | Claude Haiku | $0.433 | -$0.173 | **$0.260** |
| **Team** (per seat) | 2,000 | Claude Haiku | $1.300 | -$0.520 | **$0.780** |

### Gross Margin by Plan

| Plan | Revenue | LLM Cost | Infra ($5/user) | Gross Margin |
|---|---|---|---|---|
| Free | $0 | $0.003 | $0.10 | N/A |
| Pro | $15 | $0.26 | $0.10 | **97.7%** |
| Team (per seat) | $9.80 | $0.78 | $0.10 | **90.4%** |
| Enterprise (50 seats) | $599 | $39 | $5.00 | **92.6%** |

> Pro gross margin target: ≥ 90%. If LLM costs exceed $1.50/user/month, force-upgrade to higher plan or reduce model tier.

### Break-Even Analysis

| Milestone | MRR | Cost | Profit |
|---|---|---|---|
| 0 users | $0 | $20/mo (VPS) | -$20 |
| 50 Pro users | $750 | $33 (LLM) + $20 (VPS) | **+$697** |
| 100 Pro users | $1,500 | $46 + $20 | **+$1,434** |
| 500 Pro users | $7,500 | $150 + $50 | **+$7,300** |

**Break-even: ~2 Pro users.** The product is profitable almost immediately.

---

## Monetization Sequence

| Phase | Action |
|---|---|
| Pre-launch | Waitlist only. No payments. |
| Sprint 3 launch | Free tier only. Collect emails. |
| Sprint 7 (Billing) | Stripe integration. Pro tier unlocked. |
| Post-PMF | Team tier + annual plans. |
| Phase 6 | Enterprise custom contracts. |

---

## Expansion Opportunities

| Opportunity | When | Revenue Potential |
|---|---|---|
| Annual plan incentive ($12/mo vs $15) | Sprint 7 | +20% LTV |
| API access tier ($99/mo, for developers) | Post-PMF | New ICP (devs embedding Writing DNA in their apps) |
| Outlook add-in Premium ($5/mo add-on) | Phase 6 | Upsell path for Enterprise |
| White-label SDK for enterprise | Phase 6 | $10k–$50k/yr per enterprise |
| Writing Twin for Teams (shared brand voice) | Phase 4–5 | $499+/mo per org |

---

## Stripe Integration Notes

For Sprint 7:
- Products: `free`, `pro_monthly`, `pro_annual`, `team_monthly`
- Price IDs: Store in `.env` as `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`, etc.
- Webhook endpoint: `POST /v1/billing/webhook` — handle `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
- User plan stored in `users.plan` column (`free` | `pro` | `team` | `enterprise`)
- Usage metering: `usage_events` table → Stripe usage-based billing (for future API tier)
- Never store card details — Stripe Checkout only (PCI compliance)
