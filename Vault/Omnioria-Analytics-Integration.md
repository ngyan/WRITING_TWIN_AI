# Omnioria Umbrella Analytics — Integration Note

> Context handoff (2026-06-30). WritingTwinAI is now tracked in **Omnioria's umbrella
> analytics dashboard**. This note explains what changed, why, and what to keep in mind.

## What & why
Omnioria (omnioria.com) is the parent/umbrella institution for the product family. Its
analytics hub is a **self-hosted Umami** instance, now served at
**https://analytics.omnioria.com**, which aggregates every product in one dashboard
(OnwardSafe, Omnioria, and now **WritingTwinAI**). This replaces nothing — it's an additional,
privacy-friendly (cookieless) view alongside any existing analytics.

> Note: this app **also** uses PostHog (`PostHogProvider` in `layout.tsx`). Umami is additive;
> both coexist. Umami feeds the cross-product Omnioria umbrella view.

## The change (committed)
File: `frontend/src/app/layout.tsx` — added inside `<head>`, after the JSON-LD scripts:

```tsx
{/* Omnioria umbrella analytics (self-hosted Umami) */}
<script
  defer
  src="https://analytics.omnioria.com/script.js"
  data-website-id="9b7b373c-8b65-48bb-819a-513e64799a4c"
/>
```

- **Umami website:** `WritingTwinAI`
- **website_id:** `9b7b373c-8b65-48bb-819a-513e64799a4c`
- **Script src:** `https://analytics.omnioria.com/script.js`
- **Dashboard:** https://analytics.omnioria.com (same Umami login as analytics.onwardsafe.com)

## Deployment status
- ✅ **Live on the VPS already.** The same edit was applied to the deployed copy at
  `/root/writing-twin-ai/frontend/src/app/layout.tsx` and the `writing_twin_frontend` container
  (writingtwinai.com, `127.0.0.1:3011`) was rebuilt. A real pageview was recorded.
- ✅ **Now committed to this repo** so a fresh deploy keeps it.
- The VPS copy is **not** a git checkout (deployed as files). If you redeploy from this repo,
  the change is already in source — no action needed. If you only rsync, it's already there too.

## For the aux Claude Code session
- Do **not** remove the PostHog integration; Umami is in addition to it.
- The `data-website-id` is specific to the Umami "WritingTwinAI" site — don't change it.
- If you change the analytics domain, update it in Omnioria too (it owns the Umami instance);
  Omnioria's repo: `github.com/ngyan/Omnioria` (the institutional site at omnioria.com).
- Adding tracking to a new product = create a Umami website (in the Omnioria-managed instance)
  and drop the same `<script>` with that site's `data-website-id`.
