#!/bin/bash
# PulseMate Database Migration Script — Production
# Always takes a backup before migrating.
# Usage: ./scripts/migrate.sh

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
APP_DIR="${APP_DIR:-/opt/pulsemate}"

echo "▶ PulseMate DB Migration"
echo "  → Taking pre-migration backup..."
"$APP_DIR/scripts/backup-db.sh" "pre-migration-$(date +%Y%m%d-%H%M%S)"

echo "  → Running Prisma migrations..."
docker compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy

echo "✅ Migration complete"
