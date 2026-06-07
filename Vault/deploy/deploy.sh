#!/bin/bash
# Writing Twin AI — Deployment Script
# Usage: ./Vault/deploy/deploy.sh {push|build|migrate|start|nginx|full|logs|status|health}
# Run from the project root. VPS has no git repo — deploys via rsync.
#
# Frontend env vars baked at build time — set these on VPS before first frontend build:
#   export NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxx
#   (NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY optional)

set -e

VPS="root@72.61.236.80"
REMOTE_DIR="/root/writing-twin-ai"
COMPOSE_FILE="docker-compose.prod.yml"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
error() { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ─────────────────────────────────────────────────────────
# push — rsync backend + frontend + compose file to VPS
# ─────────────────────────────────────────────────────────
push_code() {
    log "Pushing backend to VPS..."
    rsync -az --delete \
        --exclude='.env' \
        --exclude='.env.*' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='.pytest_cache' \
        --exclude='.mypy_cache' \
        --exclude='.ruff_cache' \
        --exclude='tests/' \
        "$REPO_ROOT/backend/" "$VPS:$REMOTE_DIR/backend/"

    log "Pushing frontend to VPS..."
    rsync -az --delete \
        --exclude='.env.local' \
        --exclude='.env.*' \
        --exclude='node_modules/' \
        --exclude='.next/' \
        "$REPO_ROOT/frontend/" "$VPS:$REMOTE_DIR/frontend/"

    rsync -az "$REPO_ROOT/$COMPOSE_FILE" "$VPS:$REMOTE_DIR/$COMPOSE_FILE"
    log "Code pushed ✓"
}

# ─────────────────────────────────────────────────────────
# build — docker build on VPS (backend + frontend)
# ─────────────────────────────────────────────────────────
build_image() {
    log "Building backend image on VPS..."
    ssh "$VPS" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE build api"
    log "Building frontend image on VPS..."
    # Read Stripe price IDs from backend/.env and expose as NEXT_PUBLIC_* build args.
    # NEXT_PUBLIC_* vars are baked into the Next.js bundle at build time.
    # CTA_MODE and CHROME_STORE_URL are hardcoded in docker-compose.prod.yml (extension is live).
    ssh "$VPS" "
        cd $REMOTE_DIR
        _MONTHLY=\$(grep '^STRIPE_PRICE_PRO_MONTHLY=' backend/.env 2>/dev/null | cut -d= -f2 | tr -d '\"' || echo '')
        _POSTHOG=\$(grep '^NEXT_PUBLIC_POSTHOG_KEY=' backend/.env 2>/dev/null | cut -d= -f2 | tr -d '\"' || echo '')
        export NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=\"\$_MONTHLY\"
        export NEXT_PUBLIC_POSTHOG_KEY=\"\$_POSTHOG\"
        docker compose -f $COMPOSE_FILE build frontend
    "
    log "Images built ✓"
}

# ─────────────────────────────────────────────────────────
# start — bring up all services (infra + api)
# ─────────────────────────────────────────────────────────
start_services() {
    log "Starting services..."
    ssh "$VPS" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE up -d"
    log "Services started ✓"
}

# ─────────────────────────────────────────────────────────
# migrate — run alembic upgrade head inside api container
# ─────────────────────────────────────────────────────────
run_migrations() {
    log "Running Alembic migrations..."
    ssh "$VPS" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE exec api uv run alembic upgrade head"
    log "Migrations applied ✓"
}

# ─────────────────────────────────────────────────────────
# nginx — copy + reload NGINX (run once after first deploy)
# ─────────────────────────────────────────────────────────
update_nginx() {
    log "Updating NGINX config..."
    rsync -az "$REPO_ROOT/Vault/deploy/nginx-writingtwinai.conf" \
        "$VPS:/etc/nginx/sites-available/writingtwinai"

    ssh "$VPS" "nginx -t" || error "NGINX config test failed — not reloading"
    ssh "$VPS" "systemctl reload nginx"
    log "NGINX reloaded ✓"
}

# ─────────────────────────────────────────────────────────
# health — check /v1/health endpoint
# ─────────────────────────────────────────────────────────
check_health() {
    log "Checking API health..."
    sleep 3
    HTTP=$(ssh "$VPS" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8010/v1/health" 2>/dev/null || echo "000")
    if [ "$HTTP" = "200" ]; then
        log "Health check passed ✓ (HTTP $HTTP)"
    else
        warn "Health check failed (HTTP $HTTP) — check logs: ./Vault/deploy/deploy.sh logs"
    fi
}

# ─────────────────────────────────────────────────────────
# full — push + build + start + migrate + nginx + health
# ─────────────────────────────────────────────────────────
deploy_full() {
    log "Full deployment starting..."
    push_code
    build_image
    start_services
    run_migrations
    update_nginx
    check_health
    log "Full deployment complete ✓"
    log "Frontend live at https://writingtwinai.com"
    log "API live at https://api.writingtwinai.com/v1/health"
}

# ─────────────────────────────────────────────────────────
# logs — tail container logs
# ─────────────────────────────────────────────────────────
show_logs() {
    SERVICE=${2:-api}
    ssh "$VPS" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE logs -f --tail=100 $SERVICE"
}

# ─────────────────────────────────────────────────────────
# status — show running containers
# ─────────────────────────────────────────────────────────
show_status() {
    ssh "$VPS" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE ps"
}

# ─────────────────────────────────────────────────────────
# env-check — verify .env exists on VPS (never prints values)
# ─────────────────────────────────────────────────────────
check_env() {
    log "Checking backend .env on VPS..."
    ssh "$VPS" "
        ENV_FILE=$REMOTE_DIR/backend/.env
        if [ -f \"\$ENV_FILE\" ]; then
            echo 'backend/.env exists'
            echo 'Keys present:'
            grep -v '^#' \"\$ENV_FILE\" | grep '=' | cut -d= -f1 | sed 's/^/  /'
        else
            echo 'ERROR: backend/.env NOT FOUND'
            echo 'Create it on VPS:'
            echo '  ssh $VPS'
            echo \"  nano $REMOTE_DIR/backend/.env\"
        fi
    "
}

case "$1" in
    push)       push_code ;;
    build)      build_image ;;
    start)      start_services ;;
    migrate)    run_migrations ;;
    nginx)      update_nginx ;;
    health)     check_health ;;
    full)       deploy_full ;;
    logs)       show_logs "$@" ;;
    status)     show_status ;;
    env-check)  check_env ;;
    *)
        echo ""
        echo "Usage: ./Vault/deploy/deploy.sh COMMAND"
        echo ""
        echo "First deploy:  push → env-check → build → start → migrate → nginx → health"
        echo "Re-deploy:     push → build → start"
        echo ""
        echo "Commands:"
        echo "  push        Rsync backend + frontend + compose file to VPS (no .env)"
        echo "  build       docker build api + frontend on VPS (NEXT_PUBLIC_* must be exported)"
        echo "  start       docker compose up -d (infra + api + frontend)"
        echo "  migrate     Run alembic upgrade head inside api container"
        echo "  nginx       Copy + reload NGINX config"
        echo "  health      Check /v1/health endpoint"
        echo "  full        All of the above in sequence"
        echo "  logs [svc]  Tail container logs (default: api)"
        echo "  status      docker compose ps"
        echo "  env-check   Verify backend/.env exists on VPS (shows keys, not values)"
        echo ""
        exit 1
        ;;
esac
