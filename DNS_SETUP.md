# DNS Setup — writingtwinai.com

Domain registered on Hostinger. Deployed on Hostinger VPS (`72.61.236.80`).

---

## Architecture

| Subdomain | Points to | Port on VPS | Purpose |
|---|---|---|---|
| `writingtwinai.com` (root) | VPS `72.61.236.80` | 3010 (Next.js) | Phase 0 demo frontend |
| `www.writingtwinai.com` | VPS `72.61.236.80` | → 301 redirect to root | www redirect |
| `api.writingtwinai.com` | VPS `72.61.236.80` | 8011 (FastAPI) | Phase 0 backend API |

NGINX proxies all three. SSL via Let's Encrypt (Certbot).

---

## Step 1 — Add DNS records in Hostinger

1. Log in to Hostinger → **Domains → Manage → DNS / Nameservers**
2. Click **Manage DNS Records**
3. Add these 3 records (delete any existing A record for `@` first):

   | Type | Name/Host | Value/Target | TTL |
   |---|---|---|---|
   | `A` | `@` | `72.61.236.80` | 3600 |
   | `A` | `www` | `72.61.236.80` | 3600 |
   | `A` | `api` | `72.61.236.80` | 3600 |

---

## Step 2 — Wait for DNS propagation, then get SSL

DNS typically propagates in 15–60 minutes.
Check: https://dnschecker.org/#A/writingtwinai.com

Once DNS resolves, SSH to the VPS and run Certbot:

```bash
ssh root@72.61.236.80

certbot --nginx \
  -d writingtwinai.com \
  -d www.writingtwinai.com \
  -d api.writingtwinai.com \
  --non-interactive \
  --agree-tos \
  -m ngyan.prakash@gmail.com
```

Certbot will auto-fill the SSL cert paths in `/etc/nginx/sites-enabled/writingtwinai` and reload NGINX.

---

## Step 3 — Verify

```bash
# Frontend
curl -I https://writingtwinai.com
# → HTTP/2 200

# www redirect
curl -I https://www.writingtwinai.com
# → HTTP/2 301 → https://writingtwinai.com

# Backend health
curl https://api.writingtwinai.com/health
# → {"status":"ok"}
```

---

## Containers on VPS

```bash
ssh root@72.61.236.80
docker ps --filter 'name=wt_'
# wt_backend   Up   127.0.0.1:8011->8000/tcp
# wt_frontend  Up   127.0.0.1:3010->3000/tcp
```

Logs:
```bash
docker logs wt_backend -f
docker logs wt_frontend -f
```

Redeploy after code changes:
```bash
# From local project root:
./Vault/deploy/deploy-phase0.sh
```

---

## DNS propagation

Check: https://dnschecker.org/#A/writingtwinai.com
