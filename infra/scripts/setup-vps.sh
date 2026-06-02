#!/usr/bin/env bash
set -euo pipefail

# ========================================
# One-time VPS setup script
# Run this once on a fresh Ubuntu 22.04+ VPS
# ========================================

log() { echo "[$(date +'%H:%M:%S')] $*"; }

if [ "$EUID" -eq 0 ]; then
  log "Please run as a regular user with sudo access (not root directly)."
  exit 1
fi

log "Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

log "Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  newgrp docker || true
fi

log "Installing Docker Compose plugin..."
sudo apt-get install -y -qq docker-compose-plugin

log "Enabling Docker on boot..."
sudo systemctl enable docker
sudo systemctl start docker

log "Testing Docker..."
docker --version
docker compose version

log "Creating project directory..."
mkdir -p ~/uni/{scripts,backups}

log "Creating logs directory for Caddy..."
mkdir -p ~/uni/data/logs

log "Creating backup directory for database..."
mkdir -p ~/uni/backups/postgres

log "--- Setup complete! ---"
echo ""
echo "Next steps:"
echo "  1. cd ~/uni"
echo "  2. Copy your .env.prod file here"
echo "  3. Copy infra/docker-compose.prod.yml here as docker-compose.yml"
echo "  4. Copy infra/Caddyfile here"
echo "  5. Copy infra/scripts/deploy.sh and rollback.sh to scripts/"
echo "  6. Run: chmod +x scripts/*.sh"
echo "  7. Set up GitHub Actions secrets:"
echo "     - VPS_HOST, VPS_USER, VPS_SSH_KEY"
echo "     - GITHUB_TOKEN (auto-available)"
echo "  8. Push to main branch to trigger first deploy"
echo ""
echo "After first deploy, if SSH key is set up, the deploy will run automatically."
