# Vision & Business Plan — Writing Twin AI

> **Audience:** Founder (Gyan) + future Claude Code sessions making product decisions.
> **Purpose:** When in doubt, this is the north star.

---

## 🎯 The Vision

Writing Twin AI is not a rewriter. It is a **persistent AI communication identity** — your second writing brain, available everywhere you write.

The promise the user feels every time they click:

> *"This sounds exactly like me — but better."*

Generic AI sounds like ChatGPT. Grammarly fixes grammar. We do something neither does: **preserve the user's voice while making them faster and more confident.**

---

## 👥 Primary ICPs (in order of acquisition difficulty)

| ICP | Pain | Willingness to Pay | Channel |
|---|---|---|---|
| **Non-native English professionals** | Sound fluent in formal settings | **HIGH** ($15-30/mo) | LinkedIn ads, Korean/Indian creator partnerships |
| **B2B sales reps** | Personalize 50+ emails/day | **VERY HIGH** ($30-50/mo) | Outbound to revops teams, Apollo + Lemlist communities |
| **Founders / solo execs** | Write less, sound more polished | **HIGH** ($20-40/mo) | Twitter, IndieHackers, Founder podcasts |
| **LinkedIn creators** | Maintain voice across daily posts | **MEDIUM** ($15-25/mo) | LinkedIn organic, creator partnerships |
| **Job seekers** | Cover letters that don't sound AI-written | **LOW** ($5-10/mo or one-time) | Career subreddits, university partnerships |
| **Customer support teams** | Empathic but on-brand replies at scale | **VERY HIGH** ($25-75/seat) | Outbound to CS Ops leaders |
| **Enterprise comms teams** | Voice consistency across 100s of writers | **EXTREME** ($50-150/seat + setup fee) | Direct sales, 6-month cycles |

**Tonight's bet:** Start with **Non-native English professionals (Korean, Indian, Japanese markets)** + **LinkedIn creators**. They have the strongest emotional pain, the lowest CAC via creator partnerships, and they evangelize.

---

## 📈 5-Phase Vision (with success criteria)

| Phase | Product | Success Signal | Approx Timeline |
|---|---|---|---|
| **Phase 1: Email Rewriter** | Chrome extension + Humanize API + Gmail support | 1,000 WAU, 8% paid conversion | Month 0–3 |
| **Phase 2: Writing DNA** | Profile extraction from past emails + personalized rewrites | 70% of Pro users complete DNA onboarding | Month 3–6 |
| **Phase 3: Cross-Platform** | LinkedIn, Outlook, Slack, Notion, Gmail | 5,000 paid users, $50k MRR | Month 6–12 |
| **Phase 4: Communication OS** | Standalone web app, mobile, voice draft | $250k MRR, 20% from teams | Year 2 |
| **Phase 5: Enterprise Identity** | SSO, team voice guides, on-prem deployment | First $50k+ enterprise contract | Year 2–3 |

---

## 💰 Pricing & Revenue Model

### Free Tier — "Writing Twin Free"
- 30 rewrites/day
- 3 tones (Casual, Professional, Executive)
- No Writing DNA
- No saved styles
- **Routing:** Gemini Flash only
- **Purpose:** Acquisition + virality, NOT a real product. The free tier exists so creators can try it before recommending it.

### Pro Tier — "Writing Twin Pro" — **$19/month** (or $190/year)
- Unlimited rewrites
- Full Writing DNA (extracted from 50+ writing samples)
- All tones + custom tone training
- Chrome extension priority queue
- **Routing:** Claude Haiku + Gemini Flash fallback
- **Margin target:** 90%+

### Team — "Writing Twin Teams" — **$39/seat/month** (3 seat min)
- Everything in Pro
- Shared brand voice profile
- Team analytics
- Admin controls
- **Routing:** Claude Haiku + Sonnet for executive tier rewrites

### Enterprise — "Writing Twin Identity" — **Custom ($99–$200/seat/month)**
- SSO (SAML, Okta, Azure AD)
- Audit logs + GDPR exports
- On-prem / VPC deployment (Ollama fallback)
- Custom tone profiles per department
- Dedicated success manager
- **Routing:** Claude Sonnet + customer's choice of provider
- **Contract minimums:** $25k ACV

### Add-ons (Phase 3+)
- API access for developers: $0.01–0.03/rewrite tiered
- Voice-to-email drafts: $10/mo add-on
- Per-org brand voice training: $5k one-time setup

---

## 🎯 MVP Success Metrics (Phase 1)

| Metric | Target | How Measured |
|---|---|---|
| Rewrite latency p95 | < 3s | LangFuse trace |
| Cache hit rate | ≥ 40% by month 2 | Redis counter / total requests |
| Free → Pro conversion | ≥ 5% by day 14 | Stripe + PostHog cohort |
| Chrome extension 7-day retention | ≥ 30% | PostHog |
| Daily rewrite volume per active user | ≥ 8 | App analytics |
| Pro user churn (monthly) | < 5% | Stripe |
| Cost per Pro user per month | < $2 | LangFuse cost tracking |

---

## 🚫 What We Will NOT Build (Phase 1)

- ❌ Full Grammarly replacement (no spell check, no grammar suggestions)
- ❌ Long-form ghostwriting (no blog posts > 500 words)
- ❌ Image generation
- ❌ Translation as a primary feature (it's a side effect)
- ❌ Voice transcription
- ❌ Native iOS / Android (mobile is Phase 4)
- ❌ Free unlimited tier (kills the cost model)

---

## 🔑 The Core Insight (Don't Forget This)

Grammarly is winning because it's **always there**. ChatGPT is winning because it's **smart**. Wordtune is dying because it's **neither always there nor smart enough**.

Our wedge: **always there + sounds like you, not like AI.**

The Writing DNA is what makes this defensible. See `08-MOAT.md`.

---

## 🧨 Top Existential Risks

| Risk | Mitigation |
|---|---|
| OpenAI/Anthropic ship "personal style" natively | Ship faster, own the extension surface, build switching cost via DNA profile |
| Grammarly adds voice cloning | Out-execute on non-English markets where Grammarly is weakest |
| LLM costs spike | Multi-provider routing already in place; semantic cache; Ollama on enterprise |
| Chrome locks down LLM extensions | Diversify to Edge, Safari, web app, Firefox early |
| Privacy backlash on "reading my emails" | Zero-retention mode, on-device DNA option (Phase 5), GDPR-first design |

---

## 📊 Funding Strategy

- **Bootstrap to $20k MRR** before any external capital
- At $20k MRR, seed round becomes optional, not necessary
- If raising: target $1.5M seed at $10M post on $20k MRR + 30% MoM growth
- Strategic investors only — angels from Notion, Linear, Superhuman, Loom

---

END — Re-read every quarter and update.
