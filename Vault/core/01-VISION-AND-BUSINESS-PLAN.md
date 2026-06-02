# Vision & Business Plan — Writing Twin AI

> **Audience:** Founder (Gyan) + future Claude Code sessions making product decisions.
> **Purpose:** When in doubt, this is the north star.

---

## 🎯 The Vision

**Writing Twin AI is not an AI writer. It is a Digital Communication Twin.**

A platform that learns how a person communicates across every channel and generates responses, emails, reports, messages, and documents that sound indistinguishable from that person.

The goal is not to write better. The goal is to **preserve and scale a person's communication identity.**

A user's communication style is a valuable asset built over years of experience. WritingTwinAI captures, learns, evolves, and deploys that communication identity across all platforms.

The promise the user feels every time they read the output:

> *"This sounds exactly like me."*

Not: "This sounds like good writing." Not: "This sounds like AI." **Like me.**

Current AI writes well. Writes fast. Sounds generic. WritingTwinAI learns continuously, preserves communication identity, and operates across every channel. The long-term destination is the world's first **Communication Operating System** — a living digital replica of how a person thinks, writes, and responds.

**Primary value proposition:** *"AI that sounds like you everywhere."*

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
| **Phase 1: Writing Twin MVP** ✅ | Gmail extension + DNA + billing + dashboard | 500 active users, 80% draft acceptance rate | Month 0–3 (DONE) |
| **Phase 2: Communication Twin** | Twin Score, Cringe Detector, Context Twins, LinkedIn+Slack+Outlook, Auto Draft | 2,000 active users, $20k MRR | Month 3–9 |
| **Phase 3: Voice Twin** | Speech-to-writing, meeting summaries, meeting-to-email/Jira/report | 10,000 users, $75k MRR | Month 9–18 |
| **Phase 4: Communication OS** | Universal Inbox, Relationship Intelligence, cross-platform memory | $250k MRR, 20% team plans | Year 2 |
| **Phase 5: Digital Executive Assistant** | Proactive drafting, meeting prep, morning brief | First $50k enterprise contract | Year 2–3 |

**The prime metric across all phases:** % of generated drafts sent without significant edits. Target: 80%+.

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

## 🚫 What We Will NOT Build (Phase 1–2)

- ❌ Full Grammarly replacement (no spell check, no grammar suggestions)
- ❌ Long-form ghostwriting (no blog posts > 500 words — we humanize, not ghostwrite)
- ❌ Image generation
- ❌ Translation as a primary feature (it's a side effect)
- ❌ Native iOS / Android (mobile is Phase 4+)
- ❌ Free unlimited tier (kills the cost model)
- ✅ Voice transcription — **planned Phase 3** (Voice Twin is our key differentiator)

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
