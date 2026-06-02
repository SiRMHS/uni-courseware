#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Rollback script
# Run manually via SSH when needed:
#   ssh user@vps 'bash -s' < infra/scripts/rollback.sh <tag_or_sha>
# ========================================

log() { echo "[$(date +'%H:%M:%S')] $*"; }
die() { log "FATAL: $*"; exit 1; }

cd ~/uni

export $(grep -v '^\s*#' .env.prod | xargs)

REPO="${GITHUB_REPOSITORY:-uni-courseware}"
TARGET_TAG="${1:-}"

if [ -z "$TARGET_TAG" ]; then
  # List available tags
  echo "Available api-server tags:"
  docker images --format '{{.Tag}}' "ghcr.io/$REPO/api-server" | sort -r | head -10
  echo ""
  echo "Usage: $0 <tag>"
  echo "Example: $0 abc123def"
  exit 1
fi

log "Rolling back $REPO to tag: $TARGET_TAG"

# Check if tag exists
if ! docker image inspect "ghcr.io/$REPO/api-server:$TARGET_TAG" &>/dev/null; then
  die "Image ghcr.io/$REPO/api-server:$TARGET_TAG not found locally. Pulling..."
  docker pull "ghcr.io/$REPO/api-server:$TARGET_TAG"
  docker pull "ghcr.io/$REPO/web:$TARGET_TAG" || die "Web image not found"
fi

# Save current running version tag for potential re-rollback
CURRENT_API_TAG=$(docker inspect --format '{{index .Config.Labels "org.opencontainers.image.version"}}' "$(docker compose -f docker-compose.yml ps -q api)" 2>/dev/null || echo "unknown")

log "Current version: $CURRENT_API_TAG"
log "Stopping current services..."
docker compose -f docker-compose.yml down

log "Starting services with tag: $TARGET_TAG..."
GITHUB_REPOSITORY="$REPO" IMAGE_TAG="$TARGET_TAG" docker compose -f docker-compose.yml up -d

log "Running health check..."
sleep 10
if docker compose -f docker-compose.yml ps api | grep -q "healthy"; then
  log "Rollback successful! Now on tag: $TARGET_TAG"
else
  log "Rollback failed — reverting to previous version..."
  docker compose -f docker-compose.yml down
  GITHUB_REPOSITORY="$REPO" IMAGE_TAG="$CURRENT_API_TAG" docker compose -f docker-compose.yml up -d
  die "Rollback to $TARGET_TAG failed, reverted to $CURRENT_API_TAG"
fi
