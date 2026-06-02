# Writing Twin AI — Product Roadmap v2.0

> **North Star:** The world's first Digital Communication Twin. Every professional has a replica of their communication identity that writes, responds, and drafts across every channel — in their voice.
>
> **Prime metric:** % of generated drafts sent without significant edits. Target: 80%+.
>
> **Rule:** Each phase only starts when the phase below is loved. Do not skip layers.
>
> **Last Updated:** 2026-06-02

---

## Current State — Phase 1 Complete ✅

**Writing Twin MVP is live.** Gmail extension, Writing DNA, billing, dashboard, and Web Store packaging are done. The foundation is in place.

| Capability | Status |
|---|---|
| Gmail ✨ Humanize button | ✅ Live |
| 6 rewrite tones | ✅ Live |
| Writing DNA extraction (from samples) | ✅ Live |
| Communication Memory (accept/edit feedback loop) | ✅ Live |
| JWT auth + 15-min refresh rotation | ✅ Live |
| Free plan (20 rewrites/mo) + Pro ($5/mo, 300/mo) | ✅ Live |
| Stripe Checkout + Customer Portal | ✅ Live |
| Next.js dashboard (usage, DNA status, upgrade) | ✅ Live |
| PostHog analytics + funnel tracking | ✅ Live |
| Chrome Web Store packaging | ✅ Ready to submit |

---

## Phase 2 — Communication Twin

**Theme:** The user's twin understands context, not just style. It knows who they're writing to, flags language they'd never use, and learns continuously from every edit.

**Gate:** ≥ 500 active extension users AND ≥ 60% send drafts without major edits.

### 2A — Twin Score + Cringe Detector (Sprint 11)

The user sees exactly how well their twin matched them — and gets flagged when AI-speak slips through.

**Twin Score (visible to users):**
- 0–100% per generated draft
- Dimensions: Vocabulary Match / Sentence Rhythm / Formality / Decision Pattern
- Displayed in extension panel after each rewrite
- "Improve your twin" prompt when score < 75%

**AI Cringe Detector:**
- Flag phrases user would never write: "leverage", "thrilled", "synergy", "cutting-edge", "delighted to", "circling back", "world-class"
- Auto-suggest replacement from user's actual vocabulary
- User can add/remove words from their personal cringe list

**Sprint 11 deliverables:**
- `POST /v1/humanize` response includes `twin_score` object (vocabulary, rhythm, formality, decision_pattern, overall)
- `GET /v1/dna/cringe-words` — user's personal cringe list
- `POST /v1/dna/cringe-words` — add/remove
- Cringe detection runs post-generation, flags replacements inline
- Extension panel shows Twin Score badge after each rewrite

---

### 2B — Context Twins (Sprint 12)

Every user communicates differently depending on who they're talking to. The twin must learn this.

**Six context profiles, auto-selected:**

| Twin | Triggered when |
|---|---|
| **Technical Twin** | Writing to engineers, developers, data teams |
| **Executive Twin** | Writing to C-suite, board, investors |
| **Customer Twin** | Writing to clients, prospects, support |
| **Manager Twin** | Writing to direct manager, skip-level |
| **Team Twin** | Writing to colleagues, teammates |
| **Social Twin** | Writing on LinkedIn, Twitter, public channels |

**How context is determined:**
- User explicitly tags relationships in their Communication Graph
- Auto-detected from recipient domain, thread history, platform (LinkedIn = Social Twin)
- User can override context per message

**Sprint 12 deliverables:**
- `communication_graph` table — user's relationship registry (name/domain, relationship_type, notes)
- `POST /v1/graph/contacts` — add/update contact
- `GET /v1/graph` — list contacts + relationship types
- Context twin auto-selected in `POST /v1/humanize` via `context_twin` field (or auto-detect)
- Each context twin has a separate DNA sub-profile that diverges over time
- Extension: context indicator in the tone picker panel

---

### 2C — Platform Expansion (Sprint 13)

Gmail is the wedge. Phase 2 plants the flag on three more surfaces.

**LinkedIn:** content script injected into compose + comment boxes
**Slack:** content script for message composer
**Outlook (web):** content script for compose window

**Sprint 13 deliverables:**
- `extension/src/content/linkedin.ts` — inject button into LinkedIn post/comment compose
- `extension/src/content/slack.ts` — inject button into Slack message input
- `extension/src/content/outlook.ts` — inject button into Outlook Web App compose
- Manifest updated with new host_permissions
- Auto-selects Social Twin on LinkedIn, Team Twin on Slack

---

### 2D — Auto Draft Engine (Sprint 14)

The user stops writing first drafts. They review, adjust, send.

**How it works:**
- User opens a reply thread → twin reads the incoming message → generates a draft in background
- Draft appears in compose as a "suggestion" the user can accept, edit, or dismiss
- Every acceptance/edit is a learning event

**Sprint 14 deliverables:**
- `POST /v1/humanize/auto-draft` — takes incoming message + thread context, returns draft
- Content scripts detect new compose windows opened in reply-to context
- Extension: "Twin drafted this" badge in compose
- User can toggle Auto Draft on/off per platform in popup settings

---

## Phase 3 — Voice Twin

**Theme:** The user speaks. The twin writes. Every meeting becomes a deliverable in the user's voice.

**Gate:** ≥ 2,000 active users AND Twin Score ≥ 80% average across DNA-enabled users.

**Why this matters:** Most competitors focus on writing. Voice-to-writing is a 10x workflow unlock. A 30-second voice note → a 3-paragraph email in the user's style is indistinguishable from magic.

### 3A — Speech-to-Writing Twin (Sprint 15)

**The pattern:**
```
User speaks: "The issue looks AMF related. Collect SCTP traces first."
Twin writes: "Based on current observations, the issue appears to originate 
             from the AMF side. It would be useful to collect additional SCTP 
             traces to verify the behavior before proceeding."
```

The output sounds like the user wrote it carefully — not like a transcript.

**Sprint 15 deliverables:**
- `POST /v1/voice/transcribe-and-draft` — accepts audio blob, returns draft
- Extension: microphone button added to toolbar (alongside ✨ Humanize)
- Whisper API (or local) for transcription → passed through DNA-aware humanize pipeline
- Voice note history in dashboard

---

### 3B — Meeting Intelligence (Sprint 16)

Every meeting becomes structured output — in the user's style.

**Supported outputs from a meeting transcript:**
- Summary (bullet-point or paragraph, user's style)
- Email update to stakeholders
- Action items
- Jira/Linear ticket drafts
- Customer-facing update
- LinkedIn post about the outcome

**Sprint 16 deliverables:**
- `POST /v1/meetings/process` — accepts transcript text, output_type, context
- Web interface: upload transcript → choose output format → review in your voice
- Meeting history in dashboard
- Integration with calendar (optional — Phase 4)

---

## Phase 4 — Communication OS

**Theme:** One place to manage, draft, and send everything. The twin operates proactively.

**Gate:** ≥ 10,000 active users AND ≥ 5 platforms active per user on average.

### 4A — Universal Inbox + Universal Drafting

All communication surfaces unified. One queue. One drafting experience.

- Incoming messages from Gmail, LinkedIn, Slack pulled into a single review UI
- For each: twin has already prepared a draft
- User reviews batch of 10 messages in 5 minutes instead of 45

### 4B — Relationship Intelligence

The Communication Graph becomes smart.

- Track communication frequency with each contact
- Surface: "You haven't responded to [Name] in 3 days — here's a draft"
- Detect communication pattern changes: someone usually replies in 2h, now 48h → flag
- Meeting prep: "You're meeting [Name] tomorrow — here's context + a pre-meeting note draft"

### 4C — Cross-Platform Memory

One DNA profile, coherent across all platforms.

- LinkedIn post, Slack message, email, Jira comment — all feel like the same person wrote them
- Memory updates from any platform strengthen the same core profile
- Behavioral patterns (how user escalates, requests, disagrees) extracted across channels

---

## Phase 5 — Digital Executive Assistant

**Theme:** The twin prepares communication before the user asks. The user only approves.

**Gate:** ≥ $1M ARR AND ≥ 20% of users on team/enterprise plans.

### What the twin does proactively:

- Morning brief: "Here are 7 messages that need a response. 5 are drafted."
- Weekly update: auto-drafted based on calendar + Jira + Slack activity
- Relationship health: "You haven't reached out to [Customer] in 6 weeks. Here's a check-in."
- Decision prep: "Meeting tomorrow about X — here's a pre-read draft for stakeholders"

The twin understands:
- Who is communicating
- Why they are communicating
- What the user would likely say
- What actions should be taken

---

## New Sprint Candidates (Post Phase 1)

| Sprint | Feature | Phase |
|---|---|---|
| **S11** | Twin Score + Cringe Detector | 2A |
| **S12** | Context Twins + Communication Graph | 2B |
| **S13** | LinkedIn + Slack + Outlook extension | 2C |
| **S14** | Auto Draft Engine | 2D |
| **S15** | Speech-to-Writing Twin | 3A |
| **S16** | Meeting Intelligence | 3B |
| **S17** | Universal Inbox + Universal Drafting | 4A |
| **S18** | Relationship Intelligence | 4B |
| **S19** | Cross-Platform Memory | 4C |
| **S20** | Digital Executive Assistant (beta) | 5 |

---

## Enterprise Gate (Phase 2+)

Build this when Phase 2 is loved (≥ 2,000 users, ≥ $20k MRR):

- SAML/OIDC SSO (Okta, Azure AD, Google Workspace)
- Team Context Twin templates (shared voice for sales/support teams)
- Admin dashboard (usage, billing, user management)
- Audit log export (CSV/JSON)
- GDPR right-to-erasure
- SOC 2 Type II preparation
- Local/on-prem deployment option

---

## What We Will NOT Build Until Phase 4+

| Temptation | Why to Resist |
|---|---|
| iOS / Android native app | Extension is the wedge. Mobile is Phase 4. |
| Standalone chat interface | We're not a chat tool — we're embedded everywhere. |
| Ghostwriting from scratch (blog posts, full articles) | We humanize and draft. Not ghostwrite. |
| Translation as primary feature | We write in the user's language, not translate. |
| Grammar correction | That's Grammarly's territory. Our moat is identity, not correction. |
| White-label before Phase 3 | Needs SSO + audit logs first. |

---

## The One Metric That Proves PMF

> **"How often does the user send the draft without significant edits?"**
>
> Target: **80% acceptance rate.**

When 8 in 10 generated drafts get sent with minimal changes, the twin has achieved product-market fit. Everything else — installs, revenue, NPS — is a lagging indicator of this.

Track it. Ship to improve it. Don't ship features that don't move it.
