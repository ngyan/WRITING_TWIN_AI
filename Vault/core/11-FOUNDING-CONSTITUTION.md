# Founding Constitution — Writing Twin AI

> **Status:** Immutable north star. Everything else in this vault serves this document.
> **Rule:** If a feature, sprint, or decision conflicts with this file, the feature is wrong — not this file.
> **Read:** Before any major product or strategic decision.

---

## 🧭 Core Belief

People do not want AI to write *for* them. People want AI to help them communicate better **while preserving their identity.**

Writing Twin AI exists to become the **trusted communication layer between human intent and digital communication.**

The end state: **"Your Personal Communication Identity"** — across Gmail, Outlook, Slack, Teams, LinkedIn, documents, mobile, voice, and AI agents.

---

## ⭐ North Star

When a user reads the output, they think:

> **"This sounds exactly like me."**

NOT "This sounds AI-generated."
NOT "This sounds rewritten."

**The AI should become invisible.**

Every quality metric, every prompt, every model choice serves this single test. If output trips the user's "this is AI" detector, we have failed — regardless of how grammatically perfect it is.

---

## 🏛️ Company Vision

Build the world's most trusted AI communication platform.

- Not a rewriter.
- Not a humanizer.
- Not a prompt tool.

**A communication operating system.**

---

## 🎯 Positioning

**Name:** Writing Twin AI

**Tagline:** *Write Like Yourself. Everywhere.*

**Alternative:** *Your Personal Communication Identity.*

---

## 📜 Product Philosophy — The Five Pillars

Everything must follow, in priority order:

1. **Simplicity** — Users should never need prompt engineering.
2. **Trust** — Reading someone's communication is a trust act. Earn it daily.
3. **Speed** — Magical but predictable. < 3s or it breaks the flow.
4. **Privacy** — Identity data is sacred. Default to protection.
5. **Personalization** — The reason we exist and the reason we win.

> The product should feel **magical but predictable.**

---

## 🧱 The Four Principles

### Principle 1 — One Click Magic
Every feature should ideally require one click. If a feature needs configuration, the default must be excellent. Configuration is a power-user escape hatch, never the main path.

### Principle 2 — The User Is The Brand
The AI amplifies the user's identity. **Never replaces it.** When in doubt, preserve the user's voice over "improving" it. A slightly less polished email that sounds like the user beats a perfect email that sounds like ChatGPT.

### Principle 3 — Personalization Is The Moat
The moat is **NOT** AI rewriting, humanization, or prompt engineering — those are commodities.

The moat **IS**:
- Writing DNA
- Communication memory
- Behavioral adaptation
- Cross-platform identity

(See `08-MOAT.md` for the operational version of this principle.)

### Principle 4 — Enterprise Ready From Day One
Architecture supports SSO, audit logs, compliance, and local deployment **from the start** — even when not exposed in the UI. We never paint ourselves into a consumer-only corner. (See `03-ARCHITECTURE.md` — every state-changing action is audit-loggable by design.)

---

## 🔺 The Product Pyramid

Each layer is only built once the layer below is loved by users. **Do not skip layers.**

| Layer | Capability | Phase | Status |
|---|---|---|---|
| **L1** | Rewrite | Phase 1 | 🔵 Building |
| **L2** | Humanize | Phase 1 | 🔵 Building |
| **L3** | Write Like Me (DNA) | Phase 2 | ⚪ Planned |
| **L4** | Communication Memory | Phase 2–3 | ⚪ Planned |
| **L5** | Communication Identity | Phase 3–4 | ⚪ Vision |
| **L6** | AI Communication Operating System | Phase 4–5 | ⚪ Vision |

> **Discipline rule:** It is tempting to chase L5/L6 because they're exciting. Resist. L1+L2 must be profitable and loved before L3 ships. See `09-GTM-STRATEGY.md` → "Things That Will Tempt Us."

---

## 👥 User Segments (Constitutional Tiers)

| Tier | Segments | When |
|---|---|---|
| **Tier 1** | Non-native English professionals, corporate employees, engineers, managers, founders | Phase 1 acquisition focus |
| **Tier 2** | Sales teams, support teams, recruiters, consultants | Phase 3 expansion |
| **Tier 3** | Enterprises, BPOs, global organizations | Phase 5 |

> Note: `09-GTM-STRATEGY.md` narrows Phase 1 to **two** Tier-1 sub-segments (non-native professionals in KR/IN/SEA + LinkedIn creators) for focus. The Constitution defines the full universe; the GTM doc defines tonight's beachhead.

---

## 🧬 The Six Engines (Constitutional Mandate)

These are the systems that deliver the moat. Architecture detail lives in `03-ARCHITECTURE.md`; this is the *why*.

### 1. Writing DNA Engine — *the primary moat*
Extracts and continuously evolves: vocabulary preferences, phrase frequency, greeting/signoff habits, sentence & paragraph rhythm, warmth, confidence, directness, emotional profile, punctuation patterns, response tendencies. Stores metadata + embeddings + communication memory.

### 2. Communication Memory Engine
Stores approved outputs, user edits, accepted rewrites, rejected rewrites, and historical preferences. **The system learns continuously** — every interaction sharpens the twin.

### 3. Context Engine
Detects executive, technical, sales, support, negotiation, apology, social, creator, and recruitment contexts. Adjusts automatically — no user prompting.

### 4. Cultural Intelligence Engine
Adapts politeness, directness, hierarchy sensitivity, and communication style across US, India, Korea, Europe, Middle East, and Southeast Asia — **without explicit prompting.** This is how we win non-English markets where Grammarly is weak.

### 5. AI Orchestration Layer
Routes across OpenAI, Claude, Gemini, and local models based on cost, complexity, latency, user plan, and quality. Always selects the best provider automatically. (Operational rules in `06-COST-MODEL.md`.)

### 6. Quality Engine
Every response receives a Human Score, Style Match, Readability, Confidence, and Risk Assessment. **The system retries automatically when thresholds fail** — the user never sees a sub-threshold output.

---

## 🌍 Cultural Intelligence — Constitutional Requirement

The system adapts, without being told:

| Dimension | Example of adaptation |
|---|---|
| **Politeness** | Korean honorific awareness; Japanese keigo levels |
| **Directness** | US/Dutch direct vs. Japanese/Indian indirect |
| **Hierarchy sensitivity** | Addressing seniors in Korean/Indian corporate culture |
| **Communication style** | High-context (East Asia) vs. low-context (US/Germany) |

This is a **first-class engine**, not a localization afterthought. It is a core reason Tier-1 non-native professionals choose us over Grammarly/ChatGPT.

---

## 🎨 Design Philosophy

Reference design system: **Deep Ink + Warm Amber** — premium, professional, trustworthy, human.

- Use the approved token system (`02-DESIGN-SYSTEM.md`).
- Never hardcode colors.
- Never hardcode spacing.
- Follow accessibility requirements.
- The design system document is the **single source of truth** for all UI.

---

## 🧩 Chrome Extension — Primary Growth Engine

Targets in order: Gmail → Outlook → LinkedIn → Slack → Teams.

The extension must feel **native. Never intrusive.** It is the wedge that makes us "always there" — the second half of our moat (see `08-MOAT.md` → "Always-There Surface").

---

## 🔚 How to Use This Document

- **Strategic fork in the road?** Re-read Core Belief + North Star + Four Principles.
- **Tempted to skip a pyramid layer?** Re-read The Product Pyramid.
- **Debating a feature's voice vs. polish?** Principle 2 decides: voice wins.
- **A sprint contradicts this file?** The sprint is wrong. Fix the sprint.

This Constitution changes rarely. When it does, increment the version and log it in `10-DONE-LOG.md`.

**Version:** 1.0 — 2026-05-30
