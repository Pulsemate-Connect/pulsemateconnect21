-- Migration: Add FollowUp model and ClinicFollowUpSettings
-- Safe: only creates new tables and enum type
-- Existing data unaffected

-- 1. Create FollowUpStatus enum
DO $$ BEGIN
  CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING','UPCOMING','DUE','OVERDUE','BOOKED','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create clinic_followup_settings table
CREATE TABLE IF NOT EXISTS "clinic_followup_settings" (
  "id"                  TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "clinicId"            TEXT        NOT NULL,
  "followUpEnabled"     BOOLEAN     NOT NULL DEFAULT true,
  "preset7DaysEnabled"  BOOLEAN     NOT NULL DEFAULT true,
  "preset15DaysEnabled" BOOLEAN     NOT NULL DEFAULT true,
  "preset30DaysEnabled" BOOLEAN     NOT NULL DEFAULT true,
  "customDaysEnabled"   BOOLEAN     NOT NULL DEFAULT true,
  "defaultFollowUpDays" INTEGER     NOT NULL DEFAULT 15,
  "gracePeriodDays"     INTEGER     NOT NULL DEFAULT 7,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "clinic_followup_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "clinic_followup_settings_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "clinic_followup_settings_clinicId_key"
  ON "clinic_followup_settings"("clinicId");

-- 3. Create follow_ups table
CREATE TABLE IF NOT EXISTS "follow_ups" (
  "id"                  TEXT           NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId"           TEXT           NOT NULL,
  "clinicId"            TEXT           NOT NULL,
  "doctorId"            TEXT           NOT NULL,
  "originalVisitId"     TEXT           NOT NULL,
  "followUpDays"        INTEGER        NOT NULL,
  "followUpDate"        TIMESTAMPTZ    NOT NULL,
  "status"              "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
  "note"                TEXT,
  "bookedAppointmentId" TEXT,
  "createdAt"           TIMESTAMPTZ    NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ    NOT NULL DEFAULT now(),
  "createdByUserId"     TEXT           NOT NULL,
  "createdByRole"       TEXT           NOT NULL,
  "updatedByUserId"     TEXT,
  "cancelledByUserId"   TEXT,
  "cancelledAt"         TIMESTAMPTZ,
  "cancellationReason"  TEXT,
  CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "follow_ups_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "follow_ups_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "follow_ups_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "follow_ups_originalVisitId_fkey"
    FOREIGN KEY ("originalVisitId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "follow_ups_bookedAppointmentId_fkey"
    FOREIGN KEY ("bookedAppointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "follow_ups_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "follow_ups_updatedByUserId_fkey"
    FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "follow_ups_cancelledByUserId_fkey"
    FOREIGN KEY ("cancelledByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Unique: bookedAppointmentId (one follow-up per booked appointment)
CREATE UNIQUE INDEX IF NOT EXISTS "follow_ups_bookedAppointmentId_key"
  ON "follow_ups"("bookedAppointmentId")
  WHERE "bookedAppointmentId" IS NOT NULL;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS "follow_ups_patientId_idx"       ON "follow_ups"("patientId");
CREATE INDEX IF NOT EXISTS "follow_ups_clinicId_idx"        ON "follow_ups"("clinicId");
CREATE INDEX IF NOT EXISTS "follow_ups_doctorId_idx"        ON "follow_ups"("doctorId");
CREATE INDEX IF NOT EXISTS "follow_ups_originalVisitId_idx" ON "follow_ups"("originalVisitId");
CREATE INDEX IF NOT EXISTS "follow_ups_followUpDate_idx"    ON "follow_ups"("followUpDate");
CREATE INDEX IF NOT EXISTS "follow_ups_status_idx"          ON "follow_ups"("status");
