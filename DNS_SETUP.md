# DNS Setup — writingtwinai.com

Domain registered on Hostinger. This file is the single source of truth for DNS records.

---

## Architecture

| Subdomain | Points to | Purpose |
|---|---|---|
| `writingtwinai.com` (root) | Vercel | Phase 0 demo frontend |
| `www.writingtwinai.com` | Vercel | Redirect to root |
| `api.writingtwinai.com` | Render | Phase 0 backend API |

---

## Step 1 — Add domain to Vercel

1. Go to your Vercel project dashboard → **Settings → Domains**
2. Add `writingtwinai.com`
3. Also add `www.writingtwinai.com` (Vercel will auto-redirect www → root)
4. Vercel will show you the exact DNS values to enter. They will look like:

   | Type | Name | Value |
   |---|---|---|
   | `A` | `@` | `76.76.21.21` |
   | `CNAME` | `www` | `cname.vercel-dns.com` |

   > **Use the values Vercel shows you** — the IP above is an example.

---

## Step 2 — Add domain to Render

1. Go to your Render service dashboard → **Settings → Custom Domain**
2. Click **Add Custom Domain** → enter `api.writingtwinai.com`
3. Render will show you a CNAME value. It will look like:

   | Type | Name | Value |
   |---|---|---|
   | `CNAME` | `api` | `your-service.onrender.com` |

   > **Use the value Render shows you** — the target will be your specific service hostname.

---

## Step 3 — Enter records in Hostinger DNS

1. Log in to Hostinger → **Domains → Manage → DNS / Nameservers**
2. Click **Manage DNS Records**
3. Add these records (exact values from Step 1 and 2):

   | Type | Name/Host | Value/Target | TTL |
   |---|---|---|---|
   | `A` | `@` | *(from Vercel)* | 3600 |
   | `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |
   | `CNAME` | `api` | *(from Render)* | 3600 |

   > If Hostinger already has an A record for `@` (default parking page), delete it first.

---

## Step 4 — Set env vars in Vercel and Render

**Vercel** (project settings → Environment Variables):
```
BACKEND_URL = https://api.writingtwinai.com
```

**Render** (service settings → Environment Variables):
```
ALLOWED_ORIGIN = https://writingtwinai.com
GEMINI_API_KEY = <your key>
UPSTASH_REDIS_REST_URL = <your upstash url>
UPSTASH_REDIS_REST_TOKEN = <your upstash token>
```

---

## Step 5 — Add GitHub secret for keep-warm cron

1. GitHub repo → **Settings → Secrets and variables → Actions**
2. Add secret:
   ```
   RENDER_BACKEND_URL = https://api.writingtwinai.com
   ```

The `.github/workflows/keep-warm.yml` workflow pings `/health` every 14 minutes to prevent Render free tier cold starts.

---

## Step 6 — Verify

```bash
# Check root domain resolves to Vercel
curl -I https://writingtwinai.com

# Check API subdomain resolves to Render
curl https://api.writingtwinai.com/health
# → {"status":"ok"}

# Check validation stats
curl https://api.writingtwinai.com/stats
```

---

## DNS propagation

DNS changes typically propagate in 15–60 minutes. Hostinger's default TTL is 3600s (1 hour).
Check propagation: https://dnschecker.org/#A/writingtwinai.com

---

## Future subdomains (post-Phase 0)

| Subdomain | Purpose | When |
|---|---|---|
| `app.writingtwinai.com` | Next.js dashboard (Sprint 8) | Post-MVP |
| `api.writingtwinai.com/v1/` | Production FastAPI (Sprint 1+) | Sprint 1 |
| `writingtwinai.com` | Marketing landing page (Sprint 9) | Pre-launch |
| `support@writingtwinai.com` | Support email (Google Workspace / Hostinger mail) | Anytime |
