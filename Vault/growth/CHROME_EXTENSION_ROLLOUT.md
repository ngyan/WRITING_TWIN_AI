# Writing Twin AI — Chrome Extension Rollout Plan

> The extension is the primary growth engine. See `core/11-FOUNDING-CONSTITUTION.md` → Chrome Extension Strategy.
> **Sprint:** Sprint 3 (Extension MVP) + Sprint 6 (quality + polish)
> **Last Updated:** 2026-05-30

---

## Extension Architecture

### File Structure
```
extension/
├── manifest.json           → MV3 manifest (permissions, service worker, content scripts)
├── background.js           → Service worker: API calls, auth, message routing
├── content.js              → Injected into pages: rewrite button UI
├── popup.html              → Extension popup: account, settings, usage counter
├── popup.js
├── options.html            → Options page: DNA samples, preferences
├── options.js
├── styles/
│   ├── content.css         → Rewrite button + result overlay styles
│   └── popup.css
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── lib/
    └── utils.js            → Shared utilities (debounce, sanitize)
```

### Manifest (MV3)
```json
{
    "manifest_version": 3,
    "name": "Writing Twin — AI Rewriter",
    "version": "0.1.0",
    "description": "Rewrite anything in your voice. Powered by your Writing DNA.",
    "permissions": [
        "activeTab",
        "scripting",
        "storage",
        "identity"
    ],
    "host_permissions": [
        "https://mail.google.com/*",
        "https://www.linkedin.com/*",
        "https://app.slack.com/*",
        "https://outlook.live.com/*",
        "https://outlook.office365.com/*"
    ],
    "background": {
        "service_worker": "background.js",
        "type": "module"
    },
    "content_scripts": [{
        "matches": [
            "https://mail.google.com/*",
            "https://www.linkedin.com/*",
            "https://app.slack.com/*"
        ],
        "js": ["content.js"],
        "css": ["styles/content.css"],
        "run_at": "document_idle"
    }],
    "action": {
        "default_popup": "popup.html",
        "default_icon": {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
        }
    },
    "web_accessible_resources": [{
        "resources": ["styles/*", "icons/*"],
        "matches": ["<all_urls>"]
    }]
}
```

---

## Surface Rollout Order

| Phase | Surface | Sprint | Notes |
|---|---|---|---|
| 1 | Gmail (compose + reply) | Sprint 3 | Highest email volume for ICP |
| 2 | LinkedIn (post + message) | Sprint 3 | Marcus + Arjun persona use case |
| 3 | Slack | Sprint 6 | Add to existing extension |
| 4 | Google Docs | Post-launch | Separate content script pattern |
| 5 | Outlook Web | Sprint 6+ | Different DOM, more complex |
| 6 | Teams | Phase 3 | Microsoft ecosystem complexity |

---

## Core UX Flow (Gmail)

```
1. User selects text in Gmail compose window
   ↓
2. Writing Twin button appears near selection ("+Rewrite" pill)
   ↓
3. User clicks → button enters loading state (spinner)
   ↓
4. background.js calls POST /v1/rewrite with JWT
   ↓
5. API returns rewritten text in ~1.5s
   ↓
6. Overlay appears: shows original + rewritten, side by side
   ↓
7. User clicks "Use This" → text replaced in compose window
      OR "Edit" → opens text in overlay for manual adjustment
      OR "Regenerate" → calls API again with same params
      OR "Dismiss" → closes overlay, keeps original
   ↓
8. If used: POST /v1/feedback {rating: "accepted", edit_distance: 0}
   If edited: POST /v1/feedback {rating: "edited", final_text: "...", edit_distance: N}
   If dismissed: POST /v1/feedback {rating: "rejected"}
```

---

## Auth Flow (Extension)

```
Extension popup → "Sign in with Google"
    ↓ chrome.identity.launchWebAuthFlow
    ↓ Google OAuth → redirect to writingtwinai.com/callback
    ↓ Backend exchanges code for JWT
    ↓ JWT stored in chrome.storage.sync (encrypted at rest by Chrome)
    ↓ Background service worker attaches JWT to all API calls
```

**Rule:** JWT stored in `chrome.storage.sync` ONLY. Never `localStorage`, never hardcoded. Refresh token handled server-side (backend exchanges refresh token, returns new access token via `/v1/auth/extension/refresh`).

---

## Usage Counter (Free Tier Enforcement)

Popup displays:
```
[ Writing Twin ]
  ✨ 23 / 30 rewrites used this month
  [ Upgrade to Pro ]     [ ⚙️ Settings ]
```

When limit hit → API returns `402 Payment Required` → Extension shows upgrade prompt.

---

## Chrome Web Store Submission Checklist

- [ ] Developer account registered ($5 one-time fee)
- [ ] Privacy policy URL set in manifest
- [ ] All permissions justified in store listing description
- [ ] Extension packaged: `zip -r writing-twin-v0.1.0.zip extension/`
- [ ] Screenshots ready (5 × 1280×800 PNG)
- [ ] Store description (< 132 char short, full description)
- [ ] Support email set: `support@writingtwinai.com`
- [ ] Review submitted (allow 2–7 days for first-time developer review)

**Sensitive permissions that require justification:**
- `activeTab`: Required to inject rewrite button on active tab
- `scripting`: Required to inject content scripts dynamically
- `storage`: Required to store JWT and user preferences
- `identity`: Required for Google OAuth sign-in flow

---

## Extension Testing Checklist (Before CWS Submission)

- [ ] Install unpacked extension from `chrome://extensions` (developer mode)
- [ ] Gmail: select text in compose → rewrite button appears → click → result displays
- [ ] LinkedIn: select text in post box → rewrite button → click → result displays
- [ ] Sign out → extension shows "Sign in" prompt → sign in → extension works
- [ ] Free limit hit → upgrade prompt appears → Pro plan → limits reset
- [ ] Network offline → extension shows "No connection" gracefully (no JS errors)
- [ ] Uninstall + reinstall → user session persists (chrome.storage.sync survives reinstall)
- [ ] Test on Chrome 120+ (minimum supported version)

---

## Beta Rollout Strategy

1. **Private beta (Sprint 3 launch):** Share install link with 20 personal contacts. Collect feedback via Typeform.
2. **Friends & family (Week 2):** 50–100 users. Monitor error logs (Sentry). Fix P1 bugs within 24h.
3. **Chrome Web Store public listing (Week 3–4):** Submit for review. Start SEO + content marketing.
4. **Product Hunt launch (Week 6–8):** After 200+ installs and reviews collected.

---

## Extension Analytics (Privacy-Preserving)

Events sent from `background.js`:

```javascript
// Rewrite requested
posthog.capture("rewrite_requested", {
    source: "chrome_extension",
    surface: "gmail",           // gmail|linkedin|slack|docs|other
    text_length: 450,
    dna_active: true,
    plan: "pro"
})

// Rewrite outcome
posthog.capture("rewrite_outcome", {
    outcome: "accepted",        // accepted|edited|rejected|regenerated
    edit_distance_pct: 0,       // 0 = accepted as-is
    latency_ms: 1234
})
```

**Never send:** email content, rewritten text, user's name or email address.
