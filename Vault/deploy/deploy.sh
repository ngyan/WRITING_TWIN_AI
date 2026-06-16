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
# package — build extension + produce upload-ready zip
# ─────────────────────────────────────────────────────────
EXT_DIR="$REPO_ROOT/extension"
EXT_ZIP="$EXT_DIR/writing-twin-ai-extension.zip"

package_extension() {
    log "Building extension..."
    ( cd "$EXT_DIR" && npm run build ) || error "Extension build failed"
    rm -f "$EXT_ZIP"
    # Zip the CONTENTS of dist/ at the archive root (manifest uses root-relative paths)
    ( cd "$EXT_DIR/dist" && zip -r -q "$EXT_ZIP" . -x '*.map' -x '.DS_Store' -x '*/.DS_Store' ) \
        || error "Zip failed"
    VER=$(python3 -c "import json;print(json.load(open('$EXT_DIR/dist/manifest.json'))['version'])")
    log "Packaged v$VER → $EXT_ZIP ✓"
}

# ─────────────────────────────────────────────────────────
# publish — upload + publish extension via Chrome Web Store API
#   Runs over HTTPS/CLI, so Chrome's "gallery cannot be scripted"
#   restriction does NOT apply. Requires extension/.env.publish
#   (see extension/PUBLISH_SETUP.md). Never commits credentials.
# ─────────────────────────────────────────────────────────
publish_extension() {
    CREDS="$EXT_DIR/.env.publish"
    [ -f "$CREDS" ] || error "Missing $CREDS — run setup in extension/PUBLISH_SETUP.md"
    set -a; . "$CREDS"; set +a
    : "${WEBSTORE_CLIENT_ID:?Set WEBSTORE_CLIENT_ID in .env.publish}"
    : "${WEBSTORE_CLIENT_SECRET:?Set WEBSTORE_CLIENT_SECRET in .env.publish}"
    : "${WEBSTORE_REFRESH_TOKEN:?Set WEBSTORE_REFRESH_TOKEN in .env.publish}"
    : "${WEBSTORE_EXTENSION_ID:?Set WEBSTORE_EXTENSION_ID in .env.publish}"
    [ -f "$EXT_ZIP" ] || error "Missing $EXT_ZIP — run: ./Vault/deploy/deploy.sh package"

    log "Exchanging refresh token for access token..."
    TOKEN=$(curl -s "https://oauth2.googleapis.com/token" \
        -d "client_id=$WEBSTORE_CLIENT_ID" \
        -d "client_secret=$WEBSTORE_CLIENT_SECRET" \
        -d "refresh_token=$WEBSTORE_REFRESH_TOKEN" \
        -d "grant_type=refresh_token" \
        | python3 -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))")
    [ -n "$TOKEN" ] || error "Could not get access token — refresh token may be expired/revoked"

    log "Uploading package to item $WEBSTORE_EXTENSION_ID..."
    UP=$(curl -s -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "x-goog-api-version: 2" \
        -T "$EXT_ZIP" \
        "https://www.googleapis.com/upload/chromewebstore/v1.1/items/$WEBSTORE_EXTENSION_ID")
    echo "$UP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
st=d.get('uploadState')
print('  upload state:', st)
if st not in ('SUCCESS',):
    print('  detail:', json.dumps(d.get('itemError', d), indent=2)); sys.exit(1)
" || error "Upload failed — see detail above"

    log "Publishing (submitting for review)..."
    PUB=$(curl -s -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "x-goog-api-version: 2" \
        -H "Content-Length: 0" \
        "https://www.googleapis.com/chromewebstore/v1.1/items/$WEBSTORE_EXTENSION_ID/publish")
    echo "$PUB" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('  status:', d.get('status'))
print('  detail:', d.get('statusDetail'))
" || warn "Publish call returned unexpected output: $PUB"
    log "Submitted to Chrome Web Store ✓ — Google review typically takes hours to a few days"
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
    package)    package_extension ;;
    publish)    package_extension; publish_extension ;;
    publish-only) publish_extension ;;
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
        echo "Chrome extension (Web Store API — see extension/PUBLISH_SETUP.md):"
        echo "  package      Build extension + produce upload-ready zip"
        echo "  publish      package, then upload + submit to Chrome Web Store"
        echo "  publish-only Upload existing zip + submit (skip rebuild)"
        echo ""
        exit 1
        ;;
esac
