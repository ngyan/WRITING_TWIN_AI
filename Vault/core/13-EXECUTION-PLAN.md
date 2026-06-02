# Execution Plan + Founder Reality Check + Final Recommendation

> **Audience:** Solo founder (Gyan) making build/cut decisions.
> **Read before starting any sprint.**
> **Revised:** 2026-06-02

---

## Part 1 — Practical Execution Plan (Solo Founder)

### Solo Founder Constraints
- One person. No team. Full-stack.
- Every sprint must ship a usable product increment.
- No sprint > 7 working days (risk of losing momentum).
- Avoid premature infrastructure: use the simplest thing that works.
- Test on yourself daily. If you're not using it, users won't either.

---

### Sprint 11 — Voice Twin MVP

**Days required:** 5–7

**MVP scope (ship this):**
- Mic button in Gmail extension toolbar
- Records via browser MediaRecorder API (no native app needed)
- Sends audio blob to `/v1/voice/draft`
- Backend transcribes via Whisper → DNA-aware humanize → returns draft
- Draft displayed in extension popup — one-click copy to clipboard

**Nice-to-have (do NOT block launch):**
- Multiple output types (email, reply, jira, etc.) — start with just `email`
- Keyboard shortcut for mic — add in Sprint 13 polish
- Real-time recording indicator — plain "Recording…" text is fine

**Dependencies:**
- OpenAI API key with Whisper access (`OPENAI_API_KEY` already in backend .env)
- Browser MediaRecorder API (supported in Chrome without permissions needed for mic)

**Risks:**
- Mic permission UX in Chrome can confuse users → mitigate with clear copy ("Allow mic access to speak your email")
- Whisper latency adds ~1-2s → acceptable for v1. Cached transcription speeds up repeats.
- Large audio files (> 25MB limit on Whisper) → limit recording to 60 seconds in v1

**Test plan:**
1. Speak: "Hi [Customer], quick update on the issue we discussed. The root cause was an AMF configuration mismatch. Fix has been applied. Let me know if you need a detailed report."
2. Expected: a polished 3-4 sentence email in your voice, professional tone, preserving technical terms.
3. Measure: edit distance between your typical writing and the output.

---

### Sprint 12 — Outlook Extension

**Days required:** 4–6

**MVP scope (ship this):**
- `outlook.office.com` and `outlook.live.com` supported
- Detect compose window (new email, reply, forward)
- ✨ Humanize button injected (mic button if Sprint 11 done)
- Same shadow DOM approach as Gmail

**Nice-to-have:**
- Outlook desktop app support (requires different architecture — skip entirely)
- Outlook mobile — skip entirely

**Dependencies:**
- Manual DOM research in Outlook Web App (1–2 hours to map selectors)
- No new backend changes needed

**Risks:**
- Outlook's DOM is more complex than Gmail's (frequent React re-renders)
  → Use MutationObserver with a broader target; poll as fallback
- Microsoft may restrict content scripts in Outlook — verify with extension loaded in developer mode first
- Outlook Web App has different layouts for new vs. reply compose → test both before shipping

**Test plan:**
1. Open Outlook Web App
2. Start a new email, start a reply, start a forward
3. Verify ✨ Humanize button appears in all three
4. Verify humanize output appears correctly
5. Use it yourself for 3 real emails

---

### Sprint 13 — Context Engine V1

**Days required:** 3–4

**MVP scope (ship this):**
- Static rules only (URL → context_twin)
- Customer domain list (user adds their customer domains in popup settings)
- Context indicator shown in extension (one label, e.g., "Professional")
- Context passed to `/v1/humanize` and `/v1/voice/draft` requests

**Nice-to-have:**
- Automatic customer domain detection from sent email history
- Thread context analysis for escalation detection
- Manager/colleague relationship detection

**Dependencies:**
- Sprint 11 + 12 should be done so platform signals are available from multiple platforms

**Risks:**
- Over-engineering the rules engine → resist. Start with 7 rules max. Add more from user feedback.
- Edge cases (e.g., LinkedIn message to a customer) → default to more formal twin. User overrides.

---

### Sprint 14 — DNA Learning Engine

**Days required:** 3–5

**MVP scope (ship this):**
- `edited_draft` field added to feedback endpoint
- Async learning job extracts: phrases added, phrases removed, formality delta
- Cringe phrases: auto-detected from consistent removals (no manual list required)
- `profile_version` increments on meaningful updates
- One-line dashboard: "Your twin learned 7 new patterns this week"

**Nice-to-have:**
- "What your twin learned" explainer page
- Per-phrase annotation ("you never say 'leverage'")
- Learning speed controls

**Dependencies:**
- Feedback endpoint exists from Sprint 2. Enhancement only.

**Risks:**
- Noisy learning from hasty edits (user reformats without stylistic intent)
  → Require minimum edit distance of 5 words before treating as learning signal
- Profile divergence: aggressive learning overwrites good DNA
  → Keep snapshot of original DNA; allow revert to baseline

---

### Sprint 15 — Auto Draft Engine

**Days required:** 5–7

**MVP scope (ship this):**
- Gmail reply only (Outlook reply in Sprint 12 polish)
- Detect reply compose window
- Read incoming email body (first 500 words)
- Auto-call `/v1/humanize/auto-draft` (non-blocking, 2s timeout)
- Inject draft into compose with dismissible banner
- Track: kept vs. dismissed

**Nice-to-have:**
- Thread history (not just last message) for better context
- Auto Draft for new emails (no incoming context — harder problem, skip)
- Priority detection (P1 incident → escalation tone)

**Dependencies:**
- S13 Context Engine (so the right twin is used for the auto draft)
- Must have accurate permission from user (inform in onboarding that extension reads incoming emails)

**Risks:**
- Privacy perception: "the extension reads my emails" → be explicit, show in onboarding
- Incorrect auto-draft (completely wrong tone) → dismissal must be trivially easy (X button, not a flow)
- Extension inject timing: reply window opens, content script fires, backend takes 2s → user already started typing. Handle gracefully: only inject if compose body is empty.

---

### Sprint 16 — LinkedIn + Reddit

**Days required:** 6–8 (both platforms)

**LinkedIn MVP scope:**
- Post compose box
- Comment box on feed posts
- Inject ✨ Humanize + mic button
- Auto-select Social Twin

**Reddit MVP scope:**
- Reply box (`textarea[name="text"]` in old Reddit, content-editable in new Reddit)
- Inject ✨ Humanize + mic button
- Auto-select Community Twin

**Nice-to-have:**
- Direct message compose on LinkedIn
- Reddit post compose (harder DOM)

**Dependencies:**
- S13 Context Engine for Social/Community twin selection

**Risks:**
- LinkedIn is aggressive about DOM changes (quarterly redesigns)
  → Use broad selectors + MutationObserver. Accept some breakage and patch reactively.
- Reddit new vs. old Reddit have very different DOM
  → Ship old.reddit.com first (simpler DOM), then new Reddit

---

### Sprint 17 — Communication Graph

**Days required:** 5–6

**MVP scope:**
- Auto-infer contacts from platform usage data
- Simple dashboard list: contact identifier + inferred relationship + confirm/override button
- No visualization (list only)
- Context Engine reads from graph to improve auto-detection

**Nice-to-have:**
- Import contacts from Gmail/Outlook (requires OAuth scope expansion)
- Relationship strength indicators
- "You haven't talked to [contact] in 3 weeks" prompts

---

### Sprint 18 — Meeting Intelligence

**Days required:** 5–7

**MVP scope:**
- Web page `/meetings`
- Paste transcript → select output types → generate → review
- Output types: summary, email, action items (3 minimum)
- All outputs DNA-aware

**Nice-to-have:**
- Audio upload (transcribe then process)
- Jira ticket creation via API
- "Send via Gmail" direct integration

---

## Part 2 — Founder Reality Check

*Brutally honest. Read this quarterly.*

---

### What Should Be Removed Immediately

**1. Twin Score as a primary UI element**
Nobody opens an email app and thinks "I want to see my writing match score." They think "I have 30 emails to deal with." Twin Score belongs in settings as a diagnostic, not in the main flow. Remove it from the extension panel entirely.

**2. DNA dashboards with visualizations**
Charts and graphs of your vocabulary distribution are interesting for 3 minutes and forgotten forever. The product should feel invisible — the output is the evidence, not a dashboard about the output.

**3. "Profile strength" gamification**
Duolingo works because learning a language requires daily habit. Communication assistance is a tool, not a habit-forming game. Don't try to make it sticky with streaks and scores — make it so useful that not using it feels like leaving time on the table.

**4. Manual Communication Graph setup**
Asking users to manually tag their contacts is asking them to do work before they get value. Wrong order. Infer first, confirm later, visualize never.

---

### What Is Founder Ego

**"The world's first Communication Operating System."**
True long-term. Wrong to say now. You have a Chrome extension with a rewrite button and DNA training. Calling it a "Communication OS" in the first year is aspirational branding that creates expectation gaps. Say what it is: "AI that sounds like you." The OS framing is a 3-year story.

**Building for every platform simultaneously.**
The roadmap listed 15+ platforms. You are one person. Outlook + Gmail + LinkedIn + Reddit is already 4 platforms. Pick the ones you use personally and do them well before adding more.

**Twin Score as a differentiator.**
A score does not differentiate you from competitors. It is a feature anyone can add in a week. The differentiation is in the output quality, not the measurement of it.

---

### What Users Will Not Care About

- How many LLM providers you support internally (they care that it works)
- The architecture of the DNA extraction pipeline
- A visual graph of their communication network
- Whether their Vocabulary Match is 94% vs. 91%
- The "Cringe Detector" as a named feature — they care that it works, not what it's called
- Long onboarding flows — they want value in under 3 minutes

---

### What Users Will Pay For

Rank-ordered:

1. **"I spoke and got a ready-to-send Outlook email in my voice."** — This is the killer feature. Charge for it. Users will pay $15–30/mo for this alone.

2. **"It drafted my reply before I opened it."** — Auto Draft. When it works reliably (80%+ acceptance), this is worth $20/mo on its own.

3. **"My writing sounds more professional without extra effort."** — The baseline humanize feature. Entry-level value. Worth $5–10/mo.

4. **"It learned my writing style and keeps getting better."** — Retention driver, not acquisition driver. Nobody pays to sign up for this. They stay because of this.

5. **"I can generate 5 deliverables from one meeting."** — Meeting Intelligence. High willingness to pay from technical professionals. This is $30–50/mo value.

---

### Biggest Risk: Microsoft Copilot

Microsoft Copilot is already in Outlook. It already has voice input. It already has your email history. It is moving fast.

**The honest risk:** If Microsoft ships "Copilot writes replies in your style" in Outlook within 12 months, the Outlook Extension becomes a feature-parity battle you will lose on distribution.

**The defense:**
- Cross-platform (Copilot is Outlook-only; you work in Gmail, LinkedIn, Reddit too)
- Technical domain vocabulary preservation (Copilot uses generic AI; you use the user's DNA)
- Voice → communication output (Copilot does transcription; you do identity-preserved drafting)
- Speed: ship Outlook extension now, build Voice Twin now. Get users in before Copilot gets smarter.

**If Microsoft fully ships voice-to-identity in Outlook by end of 2026:**
Pivot to the platforms they don't control: LinkedIn, Reddit, Gmail, WhatsApp. The cross-platform twin becomes the moat.

---

### Fastest Path to First Paying Users

1. **You are user #1.** Use the product every day. If you're not using it for your actual Outlook emails and LinkedIn comments, it's not good enough yet. Ship Sprint 11 + 12 and use it for 2 weeks before acquiring anyone else.

2. **Find 10 people exactly like you.** Telecom engineers, or any technical professional who writes in English as a second language and uses Outlook. These are not generic "users" — they are people with your exact pain. Find them on LinkedIn (search: "telecom engineer", "network engineer", India/Korea/Japan). DM 20, get 10 to try it.

3. **One "wow" session is worth 100 CAC dollars.** When someone speaks 30 seconds and receives an email that sounds like them at their best, they become a referral machine. Every early user who experiences this becomes a distribution channel.

4. **Set price at $15/mo from day 1.** Do not free-launch. Free attracts users who will not pay. $15/mo is low enough to not require a procurement conversation and high enough to attract people with real pain.

5. **LinkedIn is the growth channel.** Post yourself using Voice Twin to generate a LinkedIn comment. Show the 30-second → send-ready output. One viral post (5,000 views) will acquire more users than a week of paid ads.

---

## Part 3 — Final Recommendation

*If I were CEO for the next 12 months.*

### The 12-Month Bet

The fastest path to $30k MRR is:
1. Voice Twin (Sprint 11) — the killer feature that makes people pay
2. Outlook (Sprint 12) — your personal platform, the enterprise wedge
3. Context Engine (Sprint 13) — makes everything feel smart
4. LinkedIn + Reddit (Sprint 16) — the social acquisition surface
5. Auto Draft (Sprint 15) — turns Pro users into power users

That's 6 sprints = ~30–40 days of focused work = roughly 6 weeks.

After that: DNA Learning (Sprint 14) and Meeting Intelligence (Sprint 18) for retention and expansion revenue.

**Do not build Communication Graph (Sprint 17) until you have 1,000 users.** You need behavioral data to make it useful. Without data it's just a settings page.

---

### Feature Priority Matrix

#### Must Build (Now — Sprints 11–16)
| Feature | Why |
|---|---|
| Voice Twin MVP | The product's reason to exist in Phase 2 |
| Outlook Extension | Founder's primary platform + enterprise wedge |
| Context Engine V1 | Makes the product feel intelligent without setup |
| DNA Learning Engine | Compounds switching cost with every interaction |
| Auto Draft Engine | The "80% time reduction" promise delivered |
| LinkedIn + Reddit | Your social surfaces; growth acquisition channel |

#### Should Build (Sprints 17–18)
| Feature | Why |
|---|---|
| Meeting Intelligence | High WTP from technical professionals |
| Communication Graph (inferred) | Deepens context accuracy; no user effort required |

#### Maybe Later (Phase 3–4)
| Feature | Why |
|---|---|
| WhatsApp Web extension | Adds a surface; lower value than above |
| Slack / Teams extension | Valid surface; depends on user demand signals |
| Voice Twin output formats beyond email (Jira, report) | Add once email works at 80%+ acceptance |
| Universal Inbox | Phase 4 complexity; don't touch before $75k MRR |
| Proactive morning brief | Phase 5; requires deep data accumulation first |

#### Never Build
| Feature | Why |
|---|---|
| Twin Score as primary UI | Vanity metric; does not save time |
| DNA Strength gamification | Doesn't drive payment or retention |
| Communication graph visualization | Graph view has zero utility; list is sufficient |
| Grammar correction | That's Grammarly |
| Long-form ghostwriting | Wrong product territory |
| iOS / Android native app (Phase 1–3) | Extension is the wedge |
| Translation as a feature | Side effect, not product |
| Writing coach / suggestions | Wrong product territory |

---

### The 12-Month Scorecard

If at month 12 you have:
- 2,000 active users
- $20k MRR
- 70%+ draft acceptance rate
- 4+ platforms per user
- Voice Twin used daily by > 50% of Pro users

You have proof that the Digital Communication Twin is real, defensible, and on the right trajectory.

If at month 12:
- Acceptance rate is below 70% → the twin isn't good enough; stop adding platforms, fix the quality
- Pro conversion is below 8% → pricing or onboarding is broken; fix the funnel before adding features
- Voice Twin usage is below 20% of Pro users → the voice UX is wrong; user test it and rebuild

**The most dangerous mistake is adding features when the core promise isn't delivering at 80% acceptance.** Breadth before depth is how products die.

---

*Filed: 2026-06-02. Review quarterly. Revise when acceptance rate data changes the picture.*
