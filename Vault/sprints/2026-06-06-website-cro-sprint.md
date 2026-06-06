# Sprint: Website CRO Redesign (2026-06-06)

## Goal
Increase visit → install conversion for writingtwinai.com by repositioning the site around the ICP (non-native English professionals), centralizing the CTA, and adding trust/social-proof scaffolding.

## Decision
Repositioned the homepage to lead with "Sound like yourself in English — not like AI" instead of the generic AI writing frame.
Added trust/privacy, ICP callout, comparison table, founder story, and FAQ sections.
Centralized the install CTA in `InstallButton.tsx` reading from `NEXT_PUBLIC_CHROME_STORE_URL` — one place, one env var, can never silently break.
Added interim waitlist mode while the extension is under Chrome Web Store review.

## Changes Implemented

### New files
- `frontend/src/components/InstallButton.tsx` — single CTA component, waitlist/install modes
- `frontend/src/components/WaitlistModal.tsx` — email capture modal
- `frontend/src/lib/analytics.ts` — provider-agnostic event tracker (PostHog / Plausible / GA4)
- `frontend/src/app/api/waitlist/route.ts` — Next.js API route → FastAPI backend
- `frontend/src/data/faq.ts` — FAQ data (shared between FAQ component + FAQPage JSON-LD)
- `frontend/src/components/ScrollDepthTracker.tsx` — fires scroll_depth events at 25/50/75/100%
- `frontend/src/components/sections/Hero.tsx`
- `frontend/src/components/sections/BeforeAfter.tsx`
- `frontend/src/components/sections/HowItWorks.tsx`
- `frontend/src/components/sections/TrustPrivacy.tsx`
- `frontend/src/components/sections/ICPSection.tsx`
- `frontend/src/components/sections/Comparison.tsx`
- `frontend/src/components/sections/SocialProof.tsx`
- `frontend/src/components/sections/FounderStory.tsx`
- `frontend/src/components/sections/PricingTeaser.tsx`
- `frontend/src/components/sections/FAQ.tsx`
- `frontend/src/components/sections/FinalCTA.tsx`
- `frontend/src/components/sections/SiteFooter.tsx`
- `frontend/src/app/vs-grammarly/page.tsx`
- `frontend/src/app/for/non-native-english/page.tsx`
- `Vault/sprints/2026-06-06-website-cro-sprint.md` (this file)

### Modified files
- `frontend/src/components/Nav.tsx` — replace "Get started free" with `<InstallButton>`
- `frontend/src/app/page.tsx` — full rebuild with all 12 sections
- `frontend/src/app/layout.tsx` — new title/meta + Organization + SoftwareApplication JSON-LD
- `frontend/src/app/sitemap.ts` — add /vs-grammarly + /for/non-native-english
- `frontend/.env.local.example` — add NEXT_PUBLIC_CHROME_STORE_URL + NEXT_PUBLIC_CTA_MODE
- `frontend/src/app/globals.css` — add pb-safe for mobile notch safe area

### Pending (before launch)
- Fill `NEXT_PUBLIC_CHROME_STORE_URL` with real extension URL once approved
- Switch `NEXT_PUBLIC_CTA_MODE=install` once extension is live
- Replace all `[PLACEHOLDER]` content in TrustPrivacy, SocialProof, FounderStory
- Add backend endpoint `POST /v1/waitlist` to store emails (waitlist API route is ready)
- Drop in demo GIF in Hero section
- Populate founder photo in FounderStory
- Fill Chrome Web Store rating badge in SocialProof

## Prediction (fill before launch)
- Current visit→install rate: 0% (no baseline — CTA was broken)
- Predicted 7-day rate after changes: 4%
- Confidence: 35%
## Outcome (fill 7 days post-launch)

## Lessons (fill after review)
