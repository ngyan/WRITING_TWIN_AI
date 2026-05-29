#!/bin/bash
# Writing Twin AI — Deployment Script
# Usage: ./deploy/deploy.sh {backend|frontend|migrate|extension|full|logs|status}
# Adapted from ParentReady (OnwardSafe) deploy.sh — battle-tested production pattern.

set -e

# ─────────────────────────────────────────────────────────
# CONFIG — update before first deploy
# ─────────────────────────────────────────────────────────
SERVER="root@YOUR_VPS_IP"              # e.g., root@72.61.236.80
APP_DIR="/root/writing-twin-ai"         # Path on VPS where repo is cloned
COMPOSE_FILE="docker-compose.prod.yml"  # Production compose file

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
error() { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ─────────────────────────────────────────────────────────
# DEPLOY FUNCTIONS
# ─────────────────────────────────────────────────────────

deploy_backend() {
    log "Deploying backend API..."
    ssh "$SERVER" "
        cd $APP_DIR &&
        git pull origin main &&
        docker compose -f $COMPOSE_FILE build api &&
        docker compose -f $COMPOSE_FILE up -d api &&
        echo 'Backend deployed successfully'
    "
    log "Backend deployed ✓"
}

run_migrations() {
    log "Running Alembic migrations..."
    ssh "$SERVER" "
        cd $APP_DIR &&
        docker compose -f $COMPOSE_FILE exec api uv run alembic upgrade head &&
        echo 'Migrations complete'
    "
    log "Migrations applied ✓"
}

deploy_frontend() {
    log "Deploying Next.js frontend..."
    ssh "$SERVER" "
        cd $APP_DIR &&
        git pull origin main &&
        docker compose -f $COMPOSE_FILE build frontend &&
        docker compose -f $COMPOSE_FILE up -d frontend &&
        echo 'Frontend deployed successfully'
    "
    log "Frontend deployed ✓"
}

reload_nginx() {
    log "Validating and reloading NGINX..."
    # Backup current config
    ssh "$SERVER" "cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak"

    # Test config
    ssh "$SERVER" "nginx -t" || {
        warn "NGINX config test failed — rolling back"
        ssh "$SERVER" "cp /etc/nginx/nginx.conf.bak /etc/nginx/nginx.conf"
        error "NGINX reload aborted — check config"
    }

    # Reload
    ssh "$SERVER" "systemctl reload nginx"
    log "NGINX reloaded ✓"
}

deploy_full() {
    log "Full deployment starting..."
    deploy_backend
    run_migrations
    deploy_frontend
    reload_nginx
    check_health
    log "Full deployment complete ✓"
}

check_health() {
    log "Checking API health..."
    # Wait for containers to start
    sleep 3

    HEALTH=$(ssh "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/v1/health" 2>/dev/null || echo "000")

    if [ "$HEALTH" = "200" ]; then
        log "Health check passed ✓ (HTTP $HEALTH)"
    else
        warn "Health check failed (HTTP $HEALTH)"
        warn "Check logs: ./deploy.sh logs api"
    fi
}

show_logs() {
    SERVICE=${2:-api}
    log "Tailing logs for $SERVICE..."
    ssh "$SERVER" "cd $APP_DIR && docker compose -f $COMPOSE_FILE logs -f --tail=50 $SERVICE"
}

show_status() {
    log "Container status:"
    ssh "$SERVER" "cd $APP_DIR && docker compose -f $COMPOSE_FILE ps"
}

deploy_extension() {
    log "Chrome Extension notes:"
    log "  1. Build: cd extension && npm run build"
    log "  2. Package: zip -r writing-twin-v\$(cat extension/manifest.json | jq -r .version).zip extension/dist/"
    log "  3. Upload to Chrome Web Store Developer Dashboard"
    log "  (Extension uploads cannot be automated via SSH — must be done manually)"
}

rotate_keys() {
    warn "API Key Rotation Checklist:"
    warn "  1. Generate new OPENAI_API_KEY at platform.openai.com"
    warn "  2. Generate new ANTHROPIC_API_KEY at console.anthropic.com"
    warn "  3. Generate new GOOGLE_API_KEY at aistudio.google.com"
    warn "  4. Rotate JWT_SECRET (generate: openssl rand -base64 32)"
    warn "  5. Update .env on VPS: ssh $SERVER 'nano $APP_DIR/.env'"
    warn "  6. Restart services: ./deploy.sh backend"
    warn "  NEVER commit API keys to git. NEVER."
}

# ─────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────

case "$1" in
    backend)    deploy_backend ;;
    migrate)    run_migrations ;;
    frontend)   deploy_frontend ;;
    nginx)      reload_nginx ;;
    full)       deploy_full ;;
    health)     check_health ;;
    logs)       show_logs "$@" ;;
    status)     show_status ;;
    extension)  deploy_extension ;;
    rotate-keys) rotate_keys ;;
    *)
        echo ""
        echo "Usage: ./deploy/deploy.sh COMMAND"
        echo ""
        echo "Commands:"
        echo "  backend      Build + restart API container"
        echo "  migrate      Run Alembic migrations (alembic upgrade head)"
        echo "  frontend     Build + restart Next.js frontend container"
        echo "  nginx        Validate + reload NGINX (with backup + rollback)"
        echo "  full         backend + migrate + frontend + nginx + health check"
        echo "  health       Check API health endpoint"
        echo "  logs [svc]   Tail logs for service (default: api)"
        echo "  status       Show docker compose ps"
        echo "  extension    Instructions for Chrome Extension upload"
        echo "  rotate-keys  Checklist for rotating API keys"
        echo ""
        exit 1
        ;;
esac
