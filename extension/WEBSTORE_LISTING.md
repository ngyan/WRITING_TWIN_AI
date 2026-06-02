# Chrome Web Store — Listing Copy

## Basic info

**Name:** Writing Twin AI
**Summary (132 chars max):**
AI writing assistant that learns your voice and rewrites text to sound exactly like you — in Gmail.

**Category:** Productivity
**Language:** English

---

## Description (full)

Writing Twin AI learns how YOU write — your sentence rhythm, word choices, tone — and rewrites any text to sound exactly like you. Not like ChatGPT. Not like a template. Like you.

**How it works:**
1. Sign up at writingtwinai.com (free)
2. Paste a few of your emails or messages to train your Writing Twin
3. Open Gmail → click ✨ Humanize next to the Send button
4. Pick a tone. Hit Rewrite. Your words, your style.

**Features:**
- 6 writing tones: Professional, Casual, Friendly, Direct, Diplomatic, Executive
- Writing DNA — learns your voice from real messages you've sent
- Works in Gmail (LinkedIn, Slack, Outlook coming soon)
- Free plan: 20 rewrites/month. Pro: 300 rewrites/month ($5/mo, founding member pricing)
- Keyboard shortcut: Cmd+Shift+H (Mac) / Ctrl+Shift+H (Windows)

**Privacy:**
The extension only reads compose window text when you explicitly click Humanize. It does not monitor your browsing or access your inbox. Full privacy policy at writingtwinai.com/privacy.

---

## Store assets checklist

- [ ] Icon: 128x128 PNG — `icons/icon128.png` ✓
- [ ] Screenshots (1-5, 1280x800 or 640x400):
  - [ ] Gmail compose with Humanize button visible
  - [ ] Tone picker panel open
  - [ ] Before/after rewrite example
- [ ] Small promo tile: 440x280 PNG (optional but recommended)
- [ ] Privacy policy URL: https://writingtwinai.com/privacy ✓

---

## Submission steps

1. Go to https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 developer registration fee (if not already done)
3. Click **New item** → upload `writing-twin-ai-extension.zip`
4. Fill in listing with copy above
5. Upload screenshots
6. Set Privacy policy URL: `https://writingtwinai.com/privacy`
7. Submit for review (typically 1–7 business days)

## After approval — update backend CORS

Once the extension is published, Chrome assigns it a permanent ID (e.g. `abcdefghijklmnopabcdefghijklmnop`).
Add it to the backend `.env` on VPS:

```
EXTENSION_ORIGIN=chrome-extension://YOUR_EXTENSION_ID_HERE
```

Then update `backend/app/main.py` CORS origins to include it.
