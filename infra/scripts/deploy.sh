#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Deploy script — runs on VPS via SSH
# Called by GitHub Actions after pushing
# new Docker images to ghcr.io
# ========================================

log() { echo "[$(date +'%H:%M:%S')] $*"; }
die() { log "FATAL: $*"; exit 1; }

cd ~/uni

# Load env vars from .env.prod (for DB_PASSWORD etc.)
export $(grep -v '^\s*#' .env.prod | xargs)

REPO="${GITHUB_REPOSITORY:-uni-courseware}"
TAG="${IMAGE_TAG:-latest}"

log "Deploying $REPO @ $TAG"

# 1. Pull new images
log "Pulling images..."
GITHUB_REPOSITORY="$REPO" IMAGE_TAG="$TAG" docker compose -f docker-compose.yml pull

# 2. Run database migrations
log "Running database migrations..."
docker compose -f docker-compose.yml run --rm -T api sh -c "cd packages/database && npx prisma migrate deploy" || die "Migration failed"

# 3. Start services
log "Starting services..."
GITHUB_REPOSITORY="$REPO" IMAGE_TAG="$TAG" docker compose -f docker-compose.yml up -d

# 4. Health check
log "Running health check..."
sleep 8

if docker compose -f docker-compose.yml ps api | grep -q "healthy"; then
  log "API health check passed"
else
  log "Health check failed — rolling back to previous version..."
  docker compose -f docker-compose.yml down

  # Rollback: re-tag previous as latest (previous is the tag before this deploy)
  # This works if the previous tag is still available
  PREV_TAG=$(docker images --format '{{.Tag}}' "ghcr.io/$REPO/api-server" | grep -v latest | sort -r | sed -n '2p')
  if [ -n "$PREV_TAG" ]; then
    log "Rolling back to $PREV_TAG..."
    GITHUB_REPOSITORY="$REPO" IMAGE_TAG="$PREV_TAG" docker compose -f docker-compose.yml up -d
    sleep 8
    docker compose -f docker-compose.yml ps api | grep -q "healthy" || die "Rollback also failed!"
    log "Rollback successful to $PREV_TAG"
  else
    die "No previous image found for rollback — manual intervention required"
  fi
fi

log "Deployment complete!"
