-- Requirements 10.11 & 10.12: Performance indexes for dashboard queries

CREATE INDEX IF NOT EXISTS idx_appointment_clinic_created
  ON "appointments"("clinicId", "createdAt");

CREATE INDEX IF NOT EXISTS idx_payment_clinic_paid
  ON "payments"("clinicId", "paidAt");

-- DashboardWidgetPreference table for per-user widget layout persistence

CREATE TABLE "dashboard_widget_preferences" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "clinicId"  TEXT NOT NULL,
    "widgets"   JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widget_preferences_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one preference record per user
CREATE UNIQUE INDEX "dashboard_widget_preferences_userId_key"
  ON "dashboard_widget_preferences"("userId");

-- Additional indexes for lookup performance
CREATE INDEX "dashboard_widget_preferences_userId_idx"
  ON "dashboard_widget_preferences"("userId");

CREATE INDEX "dashboard_widget_preferences_clinicId_idx"
  ON "dashboard_widget_preferences"("clinicId");

-- Foreign key: userId → users.id (cascade delete)
ALTER TABLE "dashboard_widget_preferences"
  ADD CONSTRAINT "dashboard_widget_preferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign key: clinicId → clinics.id (cascade delete)
ALTER TABLE "dashboard_widget_preferences"
  ADD CONSTRAINT "dashboard_widget_preferences_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "clinics"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
