# Writing Twin AI — Product Roadmap v2.1

> **North Star:** Speak naturally. Your twin handles the writing.
>
> **Prime metric:** % of generated drafts sent without significant edits. Target: 80%+.
>
> **Principle:** Every feature must save time immediately, improve output quality, learn user behavior, or increase switching costs. If it does none of these, cut it.
>
> **Last Updated:** 2026-06-02

---

## Phase 1 — Writing Twin MVP ✅ COMPLETE

Gmail extension, Writing DNA, billing, dashboard, Chrome Web Store packaging. Foundation live.

| Capability | Status |
|---|---|
| Gmail ✨ Humanize button + 6 tones | ✅ Live |
| Writing DNA extraction + onboarding | ✅ Live |
| Communication Memory (feedback loop) | ✅ Live |
| JWT auth + refresh rotation | ✅ Live |
| Free (20/mo) + Pro ($5/mo, 300/mo) via Stripe | ✅ Live |
| Next.js dashboard | ✅ Live |
| PostHog analytics | ✅ Live |
| Chrome Web Store ZIP ready | ✅ Ready to submit |

---

## Phase 2 — Voice Twin + Platform Expansion

**Theme:** Voice becomes the primary input. Outlook joins Gmail. Context is inferred automatically. Every interaction sharpens the twin.

**Gate to Phase 3:** 2,000 active users AND 70%+ draft acceptance rate.

---

### Sprint 11 — Voice Twin MVP

**Goal:** User speaks for 30 seconds → receives a send-ready email, reply, or update in their voice.

**User value:** Eliminates the blank-page problem entirely. Speak like you think, receive communication you'd actually send.

#### Technical Scope
- `POST /v1/voice/draft` endpoint:
  - Accepts: audio blob (WebM/MP3) OR pre-transcribed text + `output_type`
  - Transcription: OpenAI Whisper API (`whisper-1`)
  - Passes transcript through DNA-aware humanize pipeline with format context injected
  - `output_type` options: `email`, `reply`, `customer_update`, `jira_ticket`, `technical_report`, `linkedin_comment`, `reddit_reply`
  - Returns: `{ transcript, draft, output_type, twin_score_internal, rewrite_id }`
- Extension: microphone button added to Gmail compose toolbar (shadow DOM injection)
- Extension popup: Voice mode tab — record + output type selector + draft preview

#### Database Changes
```sql
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  transcript TEXT,
  output_type VARCHAR(50),
  draft TEXT,
  accepted BOOLEAN,
  edited_draft TEXT,
  audio_duration_sec INT,
  created_at TIMESTAMPTZ
);
```

#### API Changes
- `POST /v1/voice/draft` — new endpoint
- `POST /v1/voice/draft/{id}/feedback` — accept/edit signal (same pattern as humanize)

#### UI Changes
- Extension: mic icon button in compose toolbar (alongside ✨ Humanize)
- Extension popup: Voice tab with record button + output type dropdown + draft display
- Keyboard shortcut: `Cmd+Shift+V` (Mac) / `Ctrl+Shift+V` (Windows) to start recording

#### Success Metric
- User completes voice → draft → send in < 20 seconds
- 50%+ of voice-generated drafts sent without major edits within 30 days of launch

#### Complexity: Medium — 5–7 days

---

### Sprint 12 — Outlook Extension

**Goal:** Same Voice + Humanize experience inside Outlook Web App. The founder can use his own product daily.

**User value:** Outlook is the primary tool for enterprise and technical professionals. Without Outlook support, the product is inaccessible to the highest-value users.

#### Technical Scope
- `extension/src/content/outlook.ts` — content script for Outlook Web App
  - Target: `https://outlook.live.com/*` and `https://outlook.office.com/*`
  - Detect compose window (new email vs. reply vs. forward)
  - Same Shadow DOM injection approach as Gmail
  - Inject ✨ Humanize button + mic button into compose toolbar
  - Read compose body for humanize input
  - Handle Outlook's different DOM mutation patterns (polling + MutationObserver)
- Manifest: add `outlook.live.com` and `outlook.office.com` to `host_permissions`
- Auto-selects Professional Twin context

#### Database Changes
None.

#### API Changes
None — same `/v1/humanize` and `/v1/voice/draft` endpoints.

#### UI Changes
- Same extension shadow DOM UI, Outlook-specific selectors
- Extension popup: shows "Outlook connected" status when on Outlook tab

#### Success Metric
- Founder uses in Outlook at least 3x per day within 1 week of shipping
- Extension injects without errors across new/reply/forward compose types

#### Complexity: Medium — 4–6 days

---

### Sprint 13 — Context Engine V1

**Goal:** The right voice is selected automatically based on platform, recipient, and thread. Zero manual setup required.

**User value:** User never thinks about which "mode" they're in. The twin already knows.

#### Technical Scope
- Context detection service (`backend/app/services/context_service.py`)
  - Input: `platform`, `recipient_domain`, `thread_subject`, `thread_history_snippet`
  - Output: `context_twin` enum (professional, social, community, casual, customer, manager, technical)
  - Rules engine V1 (static rules, no ML):
    - `platform=outlook` OR `platform=gmail` → `professional`
    - `platform=linkedin` → `social`
    - `platform=reddit` → `community`
    - `platform=whatsapp` → `casual`
    - `platform=jira` OR `platform=confluence` → `technical`
    - Recipient domain in user's `customer_domains` list → `customer`
    - Subject contains escalation keywords (incident, P1, urgent, SLA) → escalation variant
- Extension: passes `platform` and available `recipient_domain` with every humanize/voice request
- Context twin selection modifies system prompt in humanize pipeline (tone, formality, vocabulary constraints)
- User can override context per message (dropdown in extension UI)
- Every override is stored as a training signal for later learning

#### Database Changes
```sql
ALTER TABLE users ADD COLUMN customer_domains TEXT[] DEFAULT '{}';
CREATE TABLE context_overrides (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  detected_context VARCHAR(50),
  selected_context VARCHAR(50),
  platform VARCHAR(50),
  recipient_domain VARCHAR(255),
  created_at TIMESTAMPTZ
);
```

#### API Changes
- `POST /v1/humanize` — new optional fields: `platform`, `recipient_domain`, `thread_subject`
- `POST /v1/context/customer-domains` — add/remove customer domains
- `GET /v1/context/customer-domains`

#### UI Changes
- Extension: context indicator badge in toolbar (e.g., "Professional" / "Social")
- Extension: click badge to override context for this message
- Dashboard: simple list of customer domains to configure

#### Success Metric
- Auto-detected context is correct 85%+ of the time (measured by override rate < 15%)
- Zero user confusion about "what mode am I in"

#### Complexity: Low-Medium — 3–4 days

---

### Sprint 14 — DNA Learning Engine (Continuous)

**Goal:** Every edit to a generated draft becomes a training event. The twin improves automatically without the user doing anything.

**User value:** The product gets better the more they use it. Switching cost compounds every week.

#### Technical Scope
- Enhanced `POST /v1/humanize/{id}/feedback` endpoint:
  - Accept `edited_draft` (the actual text the user sent)
  - Calculate edit distance + change vectors (added/removed phrases, formality shifts)
  - Fire async `learn_from_feedback` task (no latency impact on user)
- `learn_from_feedback` task:
  - Extract learning signals: new phrases added, AI phrases removed, tone adjustments
  - Update `writing_profiles.qualitative` JSONB with new patterns
  - Increment `profile_version`
  - Store raw event in `dna_learning_events`
- Cringe Detector (lightweight version):
  - Maintain per-user list of phrases they consistently remove from drafts
  - Auto-flag these in future drafts (highlight, not block)
  - This builds naturally from edit history — no manual list required initially

#### Database Changes
```sql
CREATE TABLE dna_learning_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  rewrite_id UUID REFERENCES rewrites(id),
  original_draft TEXT,
  edited_draft TEXT,
  edit_distance INT,
  extracted_signals JSONB,
  applied_to_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
);
ALTER TABLE writing_profiles ADD COLUMN cringe_phrases TEXT[] DEFAULT '{}';
ALTER TABLE writing_profiles ADD COLUMN preferred_phrases TEXT[] DEFAULT '{}';
```

#### API Changes
- `POST /v1/humanize/{id}/feedback` — enhanced with `edited_draft` field
- `GET /v1/dna/learned-patterns` — show what the system has learned (for transparency, not gamification)

#### UI Changes
- Subtle "Your twin updated" indicator in extension after significant edit (not a score)
- Dashboard: "Patterns learned this week: 7" — one line, no charts

#### Success Metric
- Edit distance on drafts decreases 20% after 50 interactions per user
- Cringe phrases detected and removed in future drafts automatically

#### Complexity: Medium — 3–5 days

---

### Sprint 15 — Auto Draft Engine

**Goal:** User opens a reply → the draft is already there, waiting for review.

**User value:** The 80% time reduction promise becomes real. Review is faster than writing.

#### Technical Scope
- Content script enhancement for Gmail + Outlook:
  - Detect when user opens a reply compose (vs. new email)
  - Read incoming email body + sender info + thread subject
  - Call `POST /v1/humanize/auto-draft` in background (non-blocking)
  - When draft arrives, inject into compose as pre-filled text with "Twin drafted this ↑" banner
  - User can: keep as-is, edit, or dismiss (×) to start blank
- `POST /v1/humanize/auto-draft`:
  - Takes `incoming_message`, `sender_domain`, `thread_context`, `platform`
  - Returns draft in Professional Twin (or detected context) voice
  - Skips cache (always fresh for replies)
  - Marked as `auto_draft=true` in rewrites table for acceptance tracking

#### Database Changes
```sql
ALTER TABLE rewrites ADD COLUMN auto_draft BOOLEAN DEFAULT FALSE;
ALTER TABLE rewrites ADD COLUMN auto_draft_kept BOOLEAN;
```

#### API Changes
- `POST /v1/humanize/auto-draft` — new endpoint

#### UI Changes
- Gmail + Outlook: "Twin drafted this ↑" dismissible banner above compose body
- Extension popup: toggle to enable/disable Auto Draft per platform
- Auto Draft enabled by default, dismissible

#### Success Metric
- 40%+ of auto-drafts kept without dismissal within 60 days of launch
- No user complaints about unwanted text in compose

#### Complexity: Medium-High — 5–7 days

---

### Sprint 16 — LinkedIn + Reddit Extension

**Goal:** Same voice-first experience on the social platforms the founder uses daily.

**User value:** LinkedIn comments and Reddit replies take 10 minutes. Voice Twin makes them take 30 seconds.

#### Technical Scope
- `extension/src/content/linkedin.ts`:
  - Targets: `linkedin.com/feed`, `linkedin.com/in/*`, `linkedin.com/posts/*`
  - Detect: post compose, comment box, reply box
  - Auto-selects Social Twin context
  - Inject ✨ Humanize + mic button
- `extension/src/content/reddit.ts`:
  - Targets: `reddit.com/*`, `old.reddit.com/*`
  - Detect: reply box, post compose
  - Auto-selects Community Twin context
  - Inject ✨ Humanize + mic button
- Manifest: add `linkedin.com` and `reddit.com` to `host_permissions`

#### Database Changes
None.

#### API Changes
None.

#### UI Changes
- Platform-specific shadow DOM injection per content script
- Extension popup: shows active platforms in "Connected" list

#### Success Metric
- Founder uses for LinkedIn + Reddit at least 5x/week
- No DOM injection errors on standard LinkedIn/Reddit pages

#### Complexity: Low-Medium — 3–4 days per platform (6–8 days total)

---

## Phase 3 — Meeting Intelligence + Voice Scale

**Gate to Phase 4:** 5,000 active users AND $30k MRR AND avg 3+ platforms per user.

---

### Sprint 17 — Communication Graph (Behavior-Inferred)

**Goal:** The system learns relationship context from observed communication patterns — no manual tagging.

**User value:** The twin gets smarter about who you're writing to without any effort from the user.

#### Technical Scope
- Observe: recipient domains, platforms, override patterns from context engine
- Build: per-user contact graph from observed interactions
- Infer: relationship type from domain + frequency + time-of-day + edit patterns
- Present: simple list of "people you communicate with" + inferred relationship type
- User confirms/corrects: one tap to confirm "yes, this is my customer"
- Every confirmation trains the context engine

#### Database Changes
```sql
CREATE TABLE communication_contacts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  identifier VARCHAR(255),       -- email domain or LinkedIn handle
  identifier_type VARCHAR(50),   -- domain, linkedin, reddit_user
  inferred_relationship VARCHAR(50),
  user_confirmed BOOLEAN DEFAULT FALSE,
  interaction_count INT DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

#### API Changes
- `GET /v1/graph` — list inferred contacts + relationship types
- `POST /v1/graph/{id}/confirm` — confirm/override inferred relationship

#### UI Changes
- Dashboard: "People you communicate with" — simple list, relationship badge, confirm button
- NOT a visual graph (graph = vanity, list = utility)

#### Success Metric
- Relationship inferences correct 80%+ without user confirmation
- Context engine accuracy improves 10%+ after graph data integrated

#### Complexity: Medium — 5–6 days

---

### Sprint 18 — Meeting Intelligence

**Goal:** Meeting transcript → 5 send-ready deliverables in under 2 minutes, all in the user's voice.

**User value:** The highest time-cost communication in technical work is post-meeting output. One meeting = multiple required deliverables. This sprint eliminates that effort entirely.

#### Technical Scope
- Web interface: upload transcript text / audio recording
- `POST /v1/meetings/process`:
  - Input: `transcript`, `output_types[]`, `meeting_context` (who attended, what project)
  - Runs parallel: summary, email, action items, jira_tickets[], technical_report, linkedin_post
  - All outputs DNA-aware + context-aware (customer meeting → Customer Twin, team standup → Team Twin)
  - Returns: `{ outputs: { summary, email, action_items, jira_tickets, report, linkedin } }`
- Meeting history stored for reference

#### Database Changes
```sql
CREATE TABLE meeting_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  transcript TEXT,
  meeting_context JSONB,
  outputs JSONB,
  output_types TEXT[],
  created_at TIMESTAMPTZ
);
```

#### API Changes
- `POST /v1/meetings/process` — new endpoint
- `GET /v1/meetings` — list past meeting sessions

#### UI Changes
- New web page: `/meetings` — upload transcript, select outputs, review and copy
- Each output: expandable section, copy button, "Send via Gmail/Outlook" button (future)

#### Success Metric
- User turns a meeting transcript into 3+ deliverables in under 2 minutes
- 60%+ of meeting outputs used without major edits

#### Complexity: Medium — 5–7 days

---

## Phase 4 — Communication OS

**Gate:** 10,000 active users AND $75k MRR AND 5+ platforms per user average.

### Key Capabilities
- Universal Inbox (Gmail + Outlook + LinkedIn DMs in one queue)
- Proactive drafting (drafts ready before user opens inbox)
- Cross-platform memory (one twin, consistent voice everywhere)
- Relationship Intelligence (Communication Graph fully realized)
- Morning Brief: "You have 9 messages. 7 are drafted."

---

## Phase 5 — Digital Executive Assistant

**Gate:** $1M ARR AND 20%+ team/enterprise plans.

### Key Capabilities
- Twin prepares communication before the user asks
- Understands who is communicating, why, what the user would say
- Meeting prep: pre-read draft for tomorrow's stakeholder meeting
- Weekly update: auto-drafted from calendar + Jira + Slack activity
- "You haven't contacted [customer] in 6 weeks. Here's a check-in."

---

## Sprint Summary Table

| Sprint | Feature | Phase | Days | Dependencies |
|---|---|---|---|---|
| **S11** | Voice Twin MVP | 2 | 5–7 | Whisper API key |
| **S12** | Outlook Extension | 2 | 4–6 | Outlook Web DOM research |
| **S13** | Context Engine V1 | 2 | 3–4 | S11+S12 for platform signals |
| **S14** | DNA Learning Engine | 2 | 3–5 | Feedback endpoint (exists) |
| **S15** | Auto Draft Engine | 2 | 5–7 | S13 context engine |
| **S16** | LinkedIn + Reddit | 2 | 6–8 | LinkedIn/Reddit DOM research |
| **S17** | Communication Graph | 3 | 5–6 | S13 context data |
| **S18** | Meeting Intelligence | 3 | 5–7 | Voice pipeline (S11) |

**Total Phase 2:** ~31–47 days of focused solo development.

---

## What Will Never Be Built

| Feature | Reason |
|---|---|
| Twin Score dashboard | Does not save time. Users don't pay for scores. |
| DNA Strength gamification | Vanity. Reduces identity to a number. |
| Standalone chat interface | We're not a chat tool. We're embedded everywhere. |
| Full grammar correction | That's Grammarly. Not our territory. |
| Long-form ghostwriting (blog posts) | We humanize and draft. Not ghostwrite. |
| Native iOS / Android (Phase 1–3) | Extension is the wedge. Mobile is Phase 4. |
| Translation as primary feature | Side effect, not the product. |
