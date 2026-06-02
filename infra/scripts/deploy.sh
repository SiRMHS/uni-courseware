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

# بارگذاری متغیرهای محیطی از .env.prod
if [ -f .env.prod ]; then
  export $(grep -v '^\s*#' .env.prod | xargs)
else
  die ".env.prod file not found!"
fi

# دریافت متغیرها از گیت‌هاب اکشنز (تبدیل به حروف کوچک)
REPO="${GITHUB_REPOSITORY}"
TAG="${IMAGE_TAG:-latest}"
COMPOSE_FILE="infra/docker-compose.prod.yml" # مسیر دقیق فایل کمپوز شما

log "Deploying $REPO @ $TAG"

# ۱. دانلود ایمیج‌های جدید از ریجستری گیت‌هاب
log "Pulling images..."
GITHUB_REPOSITORY="$REPO" IMAGE_TAG="$TAG" docker-compose -f $COMPOSE_FILE pull

# ۲. اجرای خودکار مایگریشن‌های پریسما قبل از بالا آمدن نسخه جدید
log "Running database migrations..."
# با استفاده از --ignore-scripts در بیلد، کلاینت اینجا به صورت لوکال ساخته شده و مهاجرت دیتابیس بدون اینترنت انجام می‌شود
GITHUB_REPOSITORY="$REPO" IMAGE_TAG="$TAG" docker-compose -f $COMPOSE_FILE run --rm -T api sh -c "npx prisma migrate deploy" || die "Migration failed"

# ۳. استارت زدن سرویس‌ها با کانتینرهای جدید
log "Starting services..."
GITHUB_REPOSITORY="$REPO" IMAGE_TAG="$TAG" docker-compose -f $COMPOSE_FILE up -d --remove-orphans

# ۴. بررسی سلامت (Health Check) کانتینر API
log "Running health check..."
sleep 12 # افزایش زمان برای لود شدن کامل اکسپرس و پریسما

if docker-compose -f $COMPOSE_FILE ps api | grep -q "healthy"; then
  log "API health check passed! Deployment completely successful."
  
  # پاک کردن لایه‌ها و ایمیج‌های قدیمی برای جلوگیری از پر شدن هارد سرور
  log "Cleaning up old images..."
  docker image prune -f
else
  log "Health check failed — rolling back to previous version..."
  
  # پیدا کردن تگ قبلی موجود روی سرور برای رول‌بک
  PREV_TAG=$(docker images --format '{{.Tag}}' "ghcr.io/$REPO/api-server" | grep -v latest | grep -v "$TAG" | sort -r | head -n 1)
  
  if [ -n "$PREV_TAG" ]; then
    log "Rolling back to version: $PREV_TAG..."
    GITHUB_REPOSITORY="$REPO" IMAGE_TAG="$PREV_TAG" docker-compose -f $COMPOSE_FILE up -d
    sleep 8
    docker-compose -f $COMPOSE_FILE ps api | grep -q "healthy" || die "Critical: Rollback also failed! Manual intervention required."
    log "Rollback successful to $PREV_TAG"
  else
    die "No previous image found for rollback — manual intervention required!"
  fi
fi

log "Deployment process finished!"