-- Migration: Add follow-up appointment feature
-- Safe: only adds new nullable columns and a new enum type
-- Existing data is unaffected

-- 1. Create AppointmentKind enum
CREATE TYPE "AppointmentKind" AS ENUM ('NEW', 'FOLLOW_UP');

-- 2. Add appointmentKind to appointments (default NEW = backward compatible)
ALTER TABLE "appointments"
  ADD COLUMN "appointmentKind" "AppointmentKind" NOT NULL DEFAULT 'NEW',
  ADD COLUMN "followUpOfAppointmentId" TEXT;

-- 3. Add follow-up settings to clinic_doctors
ALTER TABLE "clinic_doctors"
  ADD COLUMN "followUpEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "followUpValidityDays" INTEGER NOT NULL DEFAULT 30;

-- 4. Index for follow-up lookup
CREATE INDEX IF NOT EXISTS "appointments_followUpOfAppointmentId_idx"
  ON "appointments"("followUpOfAppointmentId");

-- 5. Foreign key: followUpOfAppointmentId → appointments.id (nullable, on delete set null)
ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_followUpOfAppointmentId_fkey"
  FOREIGN KEY ("followUpOfAppointmentId")
  REFERENCES "appointments"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
