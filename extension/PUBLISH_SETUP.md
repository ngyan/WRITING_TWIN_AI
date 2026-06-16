# Chrome Web Store — Automated Publishing Setup

One-time setup (~5 min) so the extension can be published from the command line:

```bash
./Vault/deploy/deploy.sh publish
```

This uses the **Chrome Web Store API over HTTPS**, which is *not* subject to Chrome's
"the extensions gallery cannot be scripted" restriction (that only blocks in-browser
automation of the dashboard). Once set up, no manual dashboard upload is ever needed.

---

## Why this is a one-time manual step

Generating the credentials requires logging into **your** Google account and granting
consent — something only you can do. After it's done once, the refresh token is
long-lived and the CLI handles every future publish unattended.

---

## Step 1 — Enable the Chrome Web Store API

1. Go to <https://console.cloud.google.com/> (use the same Google account that owns the
   extension's developer listing).
2. Create or pick a project (e.g. "writing-twin-publish").
3. **APIs & Services → Library** → search **"Chrome Web Store API"** → **Enable**.

## Step 2 — Create an OAuth client

1. **APIs & Services → OAuth consent screen** → set up (External is fine).
   - Add your own Google account under **Test users** (so you can authorize without
     having to verify the app).
   - Add the scope `https://www.googleapis.com/auth/chromewebstore` if prompted.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Desktop app**.
   - Copy the **Client ID** and **Client secret**.

## Step 3 — Get a refresh token (one command)

With `extension/.env.publish` already holding the client ID + secret, run:

```bash
./Vault/deploy/deploy.sh webstore-token
```

This opens your browser to a Google consent page. Sign in as the **test user**
(`ngyan.prakash@gmail.com`), click **Allow**, and the refresh token is written straight
into `extension/.env.publish`. You'll see "Google hasn't verified this app" — that's
expected for a Testing-mode app you own; click **Continue / Advanced → Go to … (unsafe)**
to proceed (it's your own app).

> Fallback if you'd rather use the community tool: `npx -y chrome-webstore-upload-keys`
> (asks for the client ID + secret, does the same browser flow, prints the token).

`extension/.env.publish` is gitignored — it never gets committed.

## Step 4 — Publish

```bash
# Build a fresh zip from source, then upload + submit for review:
./Vault/deploy/deploy.sh publish

# Or upload the existing zip without rebuilding:
./Vault/deploy/deploy.sh publish-only
```

Google review typically takes a few hours to a couple of days before it goes live.

---

## Bumping a version

Before publishing a new release, bump `"version"` in `extension/manifest.json`
(Chrome rejects re-uploading the same version number). `deploy.sh package` reads the
version from the built `dist/manifest.json` and prints it so you can confirm.

## Troubleshooting

- **"Could not get access token"** — the refresh token was revoked or expired; redo Step 3.
- **uploadState `FAILURE` with `ITEM_NOT_UPDATABLE`** — the previous submission is still
  in review; wait for it to clear before uploading again.
- **`version` errors** — you re-used a version number; bump `manifest.json` and re-run.
