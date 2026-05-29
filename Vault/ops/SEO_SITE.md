# Writing Twin AI — SEO & Marketing Site

> Strategy for `writingtwinai.com` — the landing/marketing site.
> Tech: Next.js 14 App Router (SSG/ISR) deployed separately from the app.
> **Last Updated:** 2026-05-30

---

## Site Structure

```
writingtwinai.com/
├── /                   → Landing page (waitlist + product demo)
├── /features           → Feature breakdown (DNA, Memory, Cultural, Extension)
├── /pricing            → Pricing comparison table (vs Grammarly, Compose AI)
├── /blog               → SEO content (non-native English professionals)
├── /about              → Team + mission
├── /privacy            → Privacy policy
├── /terms              → Terms of service
└── /changelog          → Product updates (builds trust, SEO freshness signal)
```

---

## Core SEO Strategy

### Primary Keywords (High Intent)

| Keyword | Monthly Volume | Difficulty | Intent |
|---|---|---|---|
| "AI writing assistant that sounds like me" | ~1,200 | Medium | Product |
| "write like me AI" | ~800 | Low-Medium | Product |
| "AI email writer that preserves my voice" | ~600 | Low | Product |
| "non-native English writing tool" | ~2,000 | Medium | Problem |
| "AI email rewriter Chrome extension" | ~1,500 | Medium | Product |
| "humanize AI text" | ~8,000 | High | Problem |
| "how to not sound like AI in emails" | ~3,500 | Low | Problem |
| "writing voice AI" | ~500 | Low | Product |

### Secondary Keywords (Build Authority)

- "gmail writing assistant"
- "linkedin post rewriter"
- "professional email tone tool"
- "korean english email assistant"
- "indian english professional writing"
- "how to write professional emails non-native"

### Long-Tail Blog Topics

These drive Tier-1 ICP traffic with low competition:

1. "How to write professional emails in English when it's not your first language"
2. "Why AI rewrites sound like AI (and how to fix it)"
3. "Gmail writing tips for non-native English professionals"
4. "Korean vs. US email etiquette: a practical guide"
5. "How to build a consistent LinkedIn voice as a non-native English speaker"
6. "The 5 email mistakes non-native English speakers make (and how to fix them)"
7. "ChatGPT vs. Writing Twin: which one sounds more like you?"

---

## Technical SEO Checklist

### At Launch (Sprint 9)
- [ ] `sitemap.xml` — auto-generated from Next.js routes
- [ ] `robots.txt` — allow all, disallow `/v1/` (API routes)
- [ ] `og:title`, `og:description`, `og:image` on every page
- [ ] `twitter:card` meta tags
- [ ] Canonical URLs on all pages
- [ ] Page load speed < 2s (Lighthouse score > 90)
- [ ] `alt` text on all images
- [ ] Schema markup (`SoftwareApplication` + `Product` schema on landing page)
- [ ] Google Search Console registered
- [ ] Google Analytics 4 or PostHog web installed

### Ongoing
- [ ] Blog posts: minimum 1,000 words, internal links to feature pages
- [ ] Backlinks: aim for 10 quality backlinks in first 3 months (Product Hunt, IndieHackers, dev.to)
- [ ] Google Search Console: check impressions weekly, fix crawl errors
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## Landing Page Copy Strategy

### Hero Section

**Headline option A:**
> *"AI That Sounds Like You. Not Like AI."*

**Headline option B:**
> *"Write Emails That Sound Like You — Not Like ChatGPT."*

**Headline option C (for non-native English segment):**
> *"Write in English. Sound Like Yourself."*

**Subheadline:**
> "Writing Twin learns your communication style and rewrites anything in your voice. Works inside Gmail, LinkedIn, and Slack."

**CTA:** `Try for Free — No credit card required`

### Social Proof Section
- "Used by 500+ professionals across Korea, India, and Southeast Asia" *(update when true)*
- Testimonials from each persona segment
- Chrome Web Store rating badge
- Company logos of users (when available)

### Feature Demo Section
- Interactive before/after comparison (same email, ChatGPT rewrite vs. Writing Twin rewrite)
- Visual: "ChatGPT version sounds corporate. Writing Twin sounds like YOU."

---

## Chrome Web Store Listing

**Extension name:** Writing Twin — AI Rewriter for Gmail & LinkedIn
**Short description (132 chars max):**
> "Rewrite emails and LinkedIn posts in your voice. Writing Twin learns how you write — and keeps you sounding like you."

**Category:** Productivity
**Screenshots needed (1280×800):**
1. Gmail — rewrite button on selected text
2. LinkedIn — post rewrite in action
3. Writing DNA setup (3 sample upload)
4. Before/after comparison
5. Settings panel

**Privacy:** "Writing Twin does not store the content of your emails. Only anonymized usage metadata is logged."

---

## Product Hunt Launch Strategy

**Planned launch:** After Sprint 9 (MVP complete)

**Preparation checklist:**
- [ ] Gather 50 supporters from existing network pre-launch
- [ ] Create "maker post" explaining origin story (non-native English pain point)
- [ ] GIF demo ready (Gmail rewrite in < 10 seconds)
- [ ] Pricing page live before launch
- [ ] Response plan: reply to every comment within 2 hours on launch day

**Categories to target:** #Productivity, #AI, #Chrome Extensions, #Writing

**Hunt timing:** Tuesday–Thursday, post before midnight SF time

---

## SEO Content Calendar (First 3 Months)

| Month | Content | Target Keyword |
|---|---|---|
| Month 1 | Landing page live | "write like me AI" |
| Month 1 | Blog: "Why AI rewrites don't sound like you" | "AI email rewriter that sounds like me" |
| Month 2 | Blog: "Professional emails for non-native speakers" | "non-native English writing tool" |
| Month 2 | Blog: "Korean email etiquette guide" | "korean english email assistant" |
| Month 3 | Blog: "ChatGPT vs. Writing Twin comparison" | "humanize AI text" |
| Month 3 | Changelog post: "Sprint 4 — Writing DNA is live" | (brand search, trust signal) |
