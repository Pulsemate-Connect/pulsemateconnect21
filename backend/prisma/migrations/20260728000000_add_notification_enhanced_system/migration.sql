-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260728000000_add_notification_enhanced_system
-- Creates enhanced notification tables required by notification-enhanced.service
-- Uses IF NOT EXISTS so it is safe to re-run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── notifications ─────────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS "notifications_userId_idx"                  ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_type_idx"                    ON "notifications"("type");
CREATE INDEX IF NOT EXISTS "notifications_isRead_idx"                  ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS "notifications_sentAt_idx"                  ON "notifications"("sentAt");
CREATE INDEX IF NOT EXISTS "notifications_deliveryStatus_idx"          ON "notifications"("deliveryStatus");
CREATE INDEX IF NOT EXISTS "notifications_scheduledFor_idx"            ON "notifications"("scheduledFor");
CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx"           ON "notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx"        ON "notifications"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_deliveryStatus_scheduledFor_idx" ON "notifications"("deliveryStatus", "scheduledFor");
CREATE INDEX IF NOT EXISTS "notifications_referenceType_referenceId_idx"   ON "notifications"("referenceType", "referenceId");

-- Add foreign key only if users table exists and FK not already present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_userId_fkey'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── scheduled_notifications ───────────────────────────────────────────────────
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

CREATE UNIQUE INDEX IF NOT EXISTS "scheduled_notifications_appointmentId_reminderType_key"
    ON "scheduled_notifications"("appointmentId", "reminderType");
CREATE INDEX IF NOT EXISTS "scheduled_notifications_appointmentId_idx" ON "scheduled_notifications"("appointmentId");
CREATE INDEX IF NOT EXISTS "scheduled_notifications_scheduledFor_idx"  ON "scheduled_notifications"("scheduledFor");
CREATE INDEX IF NOT EXISTS "scheduled_notifications_status_idx"        ON "scheduled_notifications"("status");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_notifications_appointmentId_fkey'
  ) THEN
    ALTER TABLE "scheduled_notifications"
      ADD CONSTRAINT "scheduled_notifications_appointmentId_fkey"
      FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── notification_templates ────────────────────────────────────────────────────
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

-- ── notification_preferences ─────────────────────────────────────────────────
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_preferences_userId_fkey'
  ) THEN
    ALTER TABLE "notification_preferences"
      ADD CONSTRAINT "notification_preferences_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── notification_delivery_log ─────────────────────────────────────────────────
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_delivery_log_notificationId_fkey'
  ) THEN
    ALTER TABLE "notification_delivery_log"
      ADD CONSTRAINT "notification_delivery_log_notificationId_fkey"
      FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── broadcast_notifications ───────────────────────────────────────────────────
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
