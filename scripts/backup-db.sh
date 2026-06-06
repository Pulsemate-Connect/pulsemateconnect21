#!/bin/bash
# PulseMate Database Backup Script
# Usage: ./scripts/backup-db.sh [backup-name]
# Requires: docker compose, gpg, aws cli

set -euo pipefail

BACKUP_NAME=${1:-"backup-$(date +%Y%m%d-%H%M%S)"}
BACKUP_DIR="${BACKUP_DIR:-/var/backups/pulsemate}"
S3_BUCKET="${S3_BUCKET:-s3://pulsemate-backups}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "❌ BACKUP_ENCRYPTION_KEY is not set. Aborting."
  exit 1
fi

mkdir -p "$BACKUP_DIR"
echo "▶ Starting backup: $BACKUP_NAME"

# 1. Dump PostgreSQL (custom format = compressed + restoreable)
echo "  → Dumping database..."
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U pulsemate -d pulsemate_db --format=custom --compress=9 \
  > "$BACKUP_DIR/$BACKUP_NAME.dump"

DUMP_SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_NAME.dump" | cut -f1)
echo "  → Dump size: $DUMP_SIZE"

# 2. Encrypt the dump
echo "  → Encrypting..."
gpg --symmetric \
    --cipher-algo AES256 \
    --passphrase "$BACKUP_ENCRYPTION_KEY" \
    --batch \
    --yes \
    -o "$BACKUP_DIR/$BACKUP_NAME.dump.gpg" \
    "$BACKUP_DIR/$BACKUP_NAME.dump"

# 3. Remove unencrypted dump
rm "$BACKUP_DIR/$BACKUP_NAME.dump"

# 4. Upload to S3
echo "  → Uploading to $S3_BUCKET..."
aws s3 cp \
  "$BACKUP_DIR/$BACKUP_NAME.dump.gpg" \
  "$S3_BUCKET/$(date +%Y/%m)/$BACKUP_NAME.dump.gpg" \
  --storage-class STANDARD_IA

# 5. Cleanup local files older than 7 days
find "$BACKUP_DIR" -name "*.dump.gpg" -mtime +7 -delete

echo "✅ Backup complete: $BACKUP_NAME"
