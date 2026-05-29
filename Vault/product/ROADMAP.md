# Writing Twin AI — Product Roadmap

> Aligned with `core/11-FOUNDING-CONSTITUTION.md` → The Product Pyramid.
> **Rule:** Each phase is only built once the phase below is loved by users. Do not skip layers.
> **Last Updated:** 2026-05-30

---

## Phase 1 — MVP: Rewrite + Humanize (Sprints 1–3)

**Goal:** A working Chrome Extension that rewrites selected text via the backend API, feels magical, and returns output in < 3 seconds.

**Pyramid Layers Delivered:** L1 (Rewrite) + L2 (Humanize)

### Deliverables
- [x] Vault + architecture documentation
- [ ] FastAPI backend with JWT auth
- [ ] Rewrite API endpoint (`POST /v1/rewrite`)
- [ ] Humanization pipeline (context detection + AI routing)
- [ ] Semantic cache (Redis — avoids duplicate LLM calls)
- [ ] Chrome Extension MV3 — inject rewrite button on Gmail, LinkedIn, Slack
- [ ] Extension OAuth login (Google)
- [ ] Basic user account (settings, usage counter)
- [ ] Docker Compose dev + production setup

### Acceptance Criteria
- User selects text in Gmail, clicks "Rewrite" → gets rewritten output in < 3s
- Output does NOT trip common AI detectors (GPTZero, Originality.ai)
- Extension installs without error in Chrome
- `pytest -q` passes 30+ tests
- Health check green: `GET /v1/health → {"status":"ok"}`

### Risks
- LLM latency > 3s on complex rewrites (mitigation: streaming response, Gemini Flash first)
- Chrome Web Store review delay (mitigation: start review submission by Sprint 2 end)

### Success Metrics
- 200 extension installs within 2 weeks of launch
- 40% D7 retention (users return within 7 days)
- Avg rewrite latency < 2s

---

## Phase 2 — Write Like Me: Writing DNA (Sprint 4)

**Goal:** The system learns how the user writes and injects their voice into every rewrite. This is the first moat layer.

**Pyramid Layer Delivered:** L3 (Write Like Me)

### Deliverables
- [ ] Writing sample upload (`POST /v1/dna/samples`)
- [ ] DNA extraction pipeline (`dna.extract.v1` prompt — vocabulary, rhythm, warmth, etc.)
- [ ] Qdrant `user_dna` collection — store embeddings per user
- [ ] DNA-aware rewrite endpoint (`use_dna=true` flag)
- [ ] DNA profile review UI in dashboard
- [ ] Onboarding flow: 3-sample minimum before DNA is activated

### Acceptance Criteria
- User uploads 5 email samples → DNA profile visible in dashboard
- Rewrite with `use_dna=true` produces output that a colleague would recognize as "sounds like them"
- DNA extraction runs async (job queue) — does not block rewrite latency
- `pytest -q` passes 50+ tests

### Risks
- DNA quality depends on sample quality — too-short samples produce weak DNA
  (mitigation: minimum 100-word sample validation before acceptance)
- Qdrant not tuned for cosine similarity on writing style embeddings
  (mitigation: test with `text-embedding-3-small` + cosine, benchmark vs random)

### Success Metrics
- 60% of active users upload writing samples (DNA adoption)
- DNA rewrites rated "sounds like me" by 70%+ of users (in-app rating)
- D30 retention: DNA users 2x non-DNA users

---

## Phase 3 — Communication Memory (Sprint 5, partial)

**Goal:** The system learns continuously from the user's accept/edit/reject decisions. Every interaction sharpens the twin.

**Pyramid Layer Delivered:** L4 (Communication Memory)

### Deliverables
- [ ] Accept/reject/edit tracking on rewrite outputs
- [ ] `CommunicationMemory` table + `MemoryService`
- [ ] Qdrant `user_memory` collection — embed approved outputs
- [ ] Memory-aware rewrite (inject similar past-approved phrasings)
- [ ] Feedback loop: high edit-distance = strong negative signal
- [ ] Privacy control: user can delete all memory data

### Acceptance Criteria
- After 20+ rewrites, output drift toward user preferences is measurable
- Memory retrieval latency < 100ms (warm Qdrant cache)
- User can view + delete their memory data in dashboard

### Success Metrics
- Edit distance on rewrites decreases 30% over first 30 interactions per user
- Zero user complaints about "wrong voice" after 50+ interactions

---

## Phase 4 — Personalization: DNA + Memory + Cultural (Sprint 5, remainder)

**Goal:** All three Constitutional engines (DNA, Memory, Cultural Intelligence) fire together on every rewrite.

**Pyramid Layer Delivered:** L4 fully + Cultural Intelligence Engine

### Deliverables
- [ ] Cultural Intelligence Engine (`CulturalService` — locale → politeness/directness/hierarchy rules)
- [ ] `user.locale` detection (from account settings or browser `navigator.language`)
- [ ] `cultural.adapt.v1` prompt block injected into personalized rewrites
- [ ] Locale-specific golden test cases (en-US, ko-KR, hi-IN, ja-JP, de-DE)
- [ ] Personalization service composing DNA + Memory + Cultural into single prompt

### Acceptance Criteria
- Korean user's rewrites are noticeably more formal/hierarchy-aware than US user's rewrites
- Indian English idioms ("do the needful", "revert back") preserved when tone != `executive`
- Cultural adaptation does NOT override user's DNA (DNA wins when they conflict)

### Success Metrics
- Non-native English professional NPS > 50
- Tier-1 market (KR, IN, SEA) retention rate > 45% D30

---

## Phase 5 — AI Routing Hardening + Quality (Sprint 6)

**Goal:** Every output passes quality thresholds before being shown to the user. The system retries automatically. Cost per rewrite is optimized.

**Pyramid Layer Delivered:** AI Orchestration Layer + Quality Engine fully operational

### Deliverables
- [ ] Quality Engine (`QualityService`) — score Human, Style Match, Readability, Confidence, Risk
- [ ] Auto-retry loop (up to 2 retries before fallback to cheaper response)
- [ ] Cost guardrails — daily/monthly token budget per user plan
- [ ] Model routing by user plan (Free → Gemini Flash, Pro → Claude Haiku, Enterprise → Claude Sonnet)
- [ ] LangFuse integration for LLM observability (token tracking, latency, cost per call)

### Acceptance Criteria
- Zero sub-threshold rewrites shown to users (quality gate before response)
- Cost per rewrite < $0.001 on Free tier, < $0.003 on Pro
- LLM fallback tested: kill OpenAI in test → Claude Haiku serves response without user-visible error

### Success Metrics
- P95 rewrite latency < 3s (including quality retry)
- Cost per MAU < $0.50/month on Pro plan (90% gross margin maintained)
- LLM error rate < 0.1% (fallback absorbs the rest)

---

## Phase 6 — Enterprise: SSO + Compliance + Scale (Post-PMF)

**Goal:** Sell to corporate IT. Support teams of 20+ users with shared DNA templates, audit logs, SSO, and compliance exports.

**Pyramid Layers Unlocked:** L5 (Communication Identity) + L6 (AI Communication OS) foundation

### Deliverables (Future)
- [ ] SAML/OIDC SSO (Okta, Azure AD, Google Workspace)
- [ ] Audit log export (CSV/JSON, date range, per-user)
- [ ] Team DNA templates (shared voice profiles for sales/support teams)
- [ ] Admin dashboard (usage analytics, billing, user management)
- [ ] GDPR export / right-to-erasure flow
- [ ] SOC 2 Type II preparation
- [ ] Local deployment option (on-prem Docker, air-gapped)
- [ ] Outlook add-in (parallel to Chrome extension)

### Gate
**Do not build this until:** 1,000 paying users OR first $10k MRR, whichever comes first.

---

## Things That Will Tempt You (Resist)

These are explicitly out of scope until Phase 6+ or post-PMF:

| Temptation | Why to Resist |
|---|---|
| iOS app | $99/yr Apple account, 2–4 week review cycle, 30% cut. Extension is the wedge. |
| Voice input | Interesting, but the moat is writing — stay focused on writing |
| AI email drafting from scratch | Scope creep — we rewrite + humanize, not generate from scratch |
| Slack bot / Teams app | Phase 3+ platform. Chrome extension first. |
| White-label for enterprises | Phase 6. Needs SSO + audit logs first. |
| "AI writing coach" pivot | Grammarly's territory. Our moat is identity, not correction. |
| Multi-language output | We write in the user's language, not translate. Don't conflate. |
