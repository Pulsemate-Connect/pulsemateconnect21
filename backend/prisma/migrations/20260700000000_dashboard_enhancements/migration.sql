-- Requirements 10.11 & 10.12: Performance indexes for dashboard queries
-- Note: payments table has no direct clinicId — it links via appointmentId.
-- Index on appointments(clinicId, createdAt) covers revenue queries via joins.

CREATE INDEX IF NOT EXISTS idx_appointment_clinic_created
  ON "appointments"("clinicId", "createdAt");

-- DashboardWidgetPreference table for per-user widget layout persistence

CREATE TABLE IF NOT EXISTS "dashboard_widget_preferences" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "clinicId"  TEXT NOT NULL,
    "widgets"   JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widget_preferences_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one preference record per user
CREATE UNIQUE INDEX IF NOT EXISTS "dashboard_widget_preferences_userId_key"
  ON "dashboard_widget_preferences"("userId");

-- Additional indexes for lookup performance
CREATE INDEX IF NOT EXISTS "dashboard_widget_preferences_userId_idx"
  ON "dashboard_widget_preferences"("userId");

CREATE INDEX IF NOT EXISTS "dashboard_widget_preferences_clinicId_idx"
  ON "dashboard_widget_preferences"("clinicId");

-- Foreign keys (only add if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'dashboard_widget_preferences_userId_fkey'
  ) THEN
    ALTER TABLE "dashboard_widget_preferences"
      ADD CONSTRAINT "dashboard_widget_preferences_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'dashboard_widget_preferences_clinicId_fkey'
  ) THEN
    ALTER TABLE "dashboard_widget_preferences"
      ADD CONSTRAINT "dashboard_widget_preferences_clinicId_fkey"
      FOREIGN KEY ("clinicId") REFERENCES "clinics"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
