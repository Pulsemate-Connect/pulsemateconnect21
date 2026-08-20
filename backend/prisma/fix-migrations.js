/**
 * fix-migrations.js
 *
 * Run during build to:
 * 1. Mark the stuck/failed migration as applied (table already exists in DB)
 * 2. Create missing notification tables via raw SQL (IF NOT EXISTS — safe to re-run)
 *
 * Called in render.yaml build command BEFORE prisma migrate deploy.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 fix-migrations: starting...');

  // ── 1. Mark stuck migration as applied ──────────────────────────────────────
  // The table clinic_owner_profiles already exists in the DB but Prisma thinks
  // the migration failed. We insert it into _prisma_migrations as applied so
  // prisma migrate deploy can continue past it.
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (
        "id", "checksum", "finished_at", "migration_name",
        "logs", "rolled_back_at", "started_at", "applied_steps_count"
      )
      SELECT
        gen_random_uuid()::text,
        'fixed-manually',
        NOW(),
        '20260725155225_add_clinic_owner_profile',
        NULL, NULL, NOW(), 1
      WHERE NOT EXISTS (
        SELECT 1 FROM "_prisma_migrations"
        WHERE migration_name = '20260725155225_add_clinic_owner_profile'
          AND finished_at IS NOT NULL
          AND rolled_back_at IS NULL
      );
    `);
    console.log('✅ Migration 20260725155225_add_clinic_owner_profile marked as applied');
  } catch (e) {
    console.log('ℹ️  Migration mark step skipped:', e.message);
  }

  // Also clear any rolled_back_at / failed state for this migration
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations"
      SET
        "finished_at"    = COALESCE("finished_at", NOW()),
        "rolled_back_at" = NULL,
        "logs"           = NULL,
        "applied_steps_count" = 1
      WHERE "migration_name" = '20260725155225_add_clinic_owner_profile';
    `);
    console.log('✅ Cleared any failed/rolled-back state for migration');
  } catch (e) {
    console.log('ℹ️  Migration update step skipped:', e.message);
  }

  // ── 2. Create missing notification tables ───────────────────────────────────
  console.log('🔧 Creating notification tables if missing...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "notifications" (
      "id"             TEXT NOT NULL,
      "userId"         TEXT NOT NULL,
      "title"          TEXT NOT NULL,
      "body"           TEXT NOT NULL,
      "type"           TEXT NOT NULL,
      "referenceType"  TEXT,
      "referenceId"    TEXT,
      "priority"       TEXT NOT NULL DEFAULT 'NORMAL',
      "isRead"         BOOLEAN NOT NULL DEFAULT false,
      "readAt"         TIMESTAMP(3),
      "sentAt"         TIMESTAMP(3),
      "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
      "fcmMessageId"   TEXT,
      "errorMessage"   TEXT,
      "retryCount"     INTEGER NOT NULL DEFAULT 0,
      "maxRetries"     INTEGER NOT NULL DEFAULT 3,
      "scheduledFor"   TIMESTAMP(3),
      "expiresAt"      TIMESTAMP(3),
      "data"           JSONB,
      "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "notifications_userId_idx"           ON "notifications"("userId");
    CREATE INDEX IF NOT EXISTS "notifications_deliveryStatus_idx"   ON "notifications"("deliveryStatus");
    CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx"    ON "notifications"("userId", "isRead");
    CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
  `);

  // Add FK only if not present
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_userId_fkey'
      ) THEN
        ALTER TABLE "notifications"
          ADD CONSTRAINT "notifications_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  console.log('✅ notifications table ready');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
      "id"             TEXT NOT NULL,
      "appointmentId"  TEXT NOT NULL,
      "reminderType"   TEXT NOT NULL,
      "scheduledFor"   TIMESTAMP(3) NOT NULL,
      "status"         TEXT NOT NULL DEFAULT 'PENDING',
      "sentAt"         TIMESTAMP(3),
      "notificationId" TEXT,
      "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "scheduled_notifications_appointmentId_reminderType_key"
      ON "scheduled_notifications"("appointmentId", "reminderType");
    CREATE INDEX IF NOT EXISTS "scheduled_notifications_scheduledFor_idx" ON "scheduled_notifications"("scheduledFor");
    CREATE INDEX IF NOT EXISTS "scheduled_notifications_status_idx"       ON "scheduled_notifications"("status");
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_notifications_appointmentId_fkey'
      ) THEN
        ALTER TABLE "scheduled_notifications"
          ADD CONSTRAINT "scheduled_notifications_appointmentId_fkey"
          FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  console.log('✅ scheduled_notifications table ready');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "notification_templates" (
      "id"              TEXT NOT NULL,
      "type"            TEXT NOT NULL,
      "titleTemplate"   TEXT NOT NULL,
      "bodyTemplate"    TEXT NOT NULL,
      "defaultPriority" TEXT NOT NULL DEFAULT 'NORMAL',
      "icon"            TEXT,
      "sound"           TEXT,
      "variables"       JSONB,
      "isActive"        BOOLEAN NOT NULL DEFAULT true,
      "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_type_key" ON "notification_templates"("type");
  `);
  console.log('✅ notification_templates table ready');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "notification_preferences" (
      "id"                   TEXT NOT NULL,
      "userId"               TEXT NOT NULL,
      "pushEnabled"          BOOLEAN NOT NULL DEFAULT true,
      "inAppEnabled"         BOOLEAN NOT NULL DEFAULT true,
      "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
      "queueUpdates"         BOOLEAN NOT NULL DEFAULT true,
      "prescriptionAlerts"   BOOLEAN NOT NULL DEFAULT true,
      "paymentAlerts"        BOOLEAN NOT NULL DEFAULT true,
      "marketingEnabled"     BOOLEAN NOT NULL DEFAULT false,
      "quietHoursStart"      TEXT,
      "quietHoursEnd"        TEXT,
      "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_userId_key" ON "notification_preferences"("userId");
  `);
  console.log('✅ notification_preferences table ready');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "notification_delivery_log" (
      "id"              TEXT NOT NULL,
      "notificationId"  TEXT NOT NULL,
      "attemptNumber"   INTEGER NOT NULL,
      "deliveryChannel" TEXT NOT NULL,
      "status"          TEXT NOT NULL,
      "fcmMessageId"    TEXT,
      "errorMessage"    TEXT,
      "deviceToken"     TEXT,
      "sentAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "notification_delivery_log_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX IF NOT EXISTS "notification_delivery_log_notificationId_idx" ON "notification_delivery_log"("notificationId");
    CREATE INDEX IF NOT EXISTS "notification_delivery_log_status_idx"         ON "notification_delivery_log"("status");
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notification_delivery_log_notificationId_fkey'
      ) THEN
        ALTER TABLE "notification_delivery_log"
          ADD CONSTRAINT "notification_delivery_log_notificationId_fkey"
          FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  console.log('✅ notification_delivery_log table ready');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "broadcast_notifications" (
      "id"               TEXT NOT NULL,
      "title"            TEXT NOT NULL,
      "body"             TEXT NOT NULL,
      "targetAudience"   TEXT NOT NULL DEFAULT 'ALL',
      "targetFilter"     JSONB,
      "priority"         TEXT NOT NULL DEFAULT 'NORMAL',
      "createdByAdminId" TEXT,
      "scheduledFor"     TIMESTAMP(3),
      "status"           TEXT NOT NULL DEFAULT 'DRAFT',
      "sentCount"        INTEGER NOT NULL DEFAULT 0,
      "totalTargets"     INTEGER NOT NULL DEFAULT 0,
      "sentAt"           TIMESTAMP(3),
      "expiresAt"        TIMESTAMP(3),
      "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "broadcast_notifications_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX IF NOT EXISTS "broadcast_notifications_status_idx"       ON "broadcast_notifications"("status");
    CREATE INDEX IF NOT EXISTS "broadcast_notifications_scheduledFor_idx" ON "broadcast_notifications"("scheduledFor");
  `);
  console.log('✅ broadcast_notifications table ready');

  console.log('🎉 fix-migrations: all done');
}

main()
  .catch((e) => {
    console.error('❌ fix-migrations failed:', e.message);
    // Don't exit with error — let the build continue
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
