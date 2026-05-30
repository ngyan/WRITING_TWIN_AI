#!/bin/bash
# Deploy Phase 0 demo to Hostinger VPS
# Usage: ./Vault/deploy/deploy-phase0.sh
# Run from the project root.

set -e

VPS="root@72.61.236.80"
REMOTE_DIR="/root/writing-twin-ai"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "==> Syncing code to VPS..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.env' \
  "$REPO_ROOT/" "$VPS:$REMOTE_DIR/"

echo "==> Building and starting containers..."
ssh "$VPS" "cd $REMOTE_DIR && docker compose -f docker-compose.phase0.yml up -d --build"

echo "==> Container status:"
ssh "$VPS" "docker ps --filter 'name=wt_' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo ""
echo "==> Done. If first deploy, also run:"
echo "    ssh $VPS"
echo "    cp $REMOTE_DIR/Vault/deploy/nginx-writingtwinai.conf /etc/nginx/sites-available/writingtwinai"
echo "    ln -sf /etc/nginx/sites-available/writingtwinai /etc/nginx/sites-enabled/writingtwinai"
echo "    nginx -t && systemctl reload nginx"
echo "    certbot --nginx -d writingtwinai.com -d www.writingtwinai.com -d api.writingtwinai.com"
