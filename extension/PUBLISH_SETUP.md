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

## Step 3 — Get a refresh token

Easiest path — the maintained helper walks the browser flow and prints all three values:

```bash
npx -y chrome-webstore-upload-keys
```

It will ask for the Client ID + Client secret from Step 2, open a Google consent page,
and after you approve, print your **refresh token**.

> If you prefer not to use the helper: do the OAuth "loopback" flow manually with scope
> `https://www.googleapis.com/auth/chromewebstore`, `access_type=offline`,
> `prompt=consent`, then exchange the returned code at `https://oauth2.googleapis.com/token`
> for a `refresh_token`. (Google deprecated the old `oob` flow, so a localhost redirect
> is required — the helper above just does this for you.)

## Step 4 — Save the credentials locally

```bash
cp extension/.env.publish.example extension/.env.publish
# then edit extension/.env.publish and paste:
#   WEBSTORE_CLIENT_ID, WEBSTORE_CLIENT_SECRET, WEBSTORE_REFRESH_TOKEN
# (WEBSTORE_EXTENSION_ID is already filled in)
```

`extension/.env.publish` is gitignored — it never gets committed.

## Step 5 — Publish

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
