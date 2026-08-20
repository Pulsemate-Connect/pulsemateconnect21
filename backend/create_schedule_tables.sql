-- Clinic Schedule & Timings Tables Creation
-- Run this SQL if prisma db push fails due to existing constraint issues

-- Create ClinicHolidayType enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "ClinicHolidayType" AS ENUM ('PUBLIC_HOLIDAY', 'CLINIC_HOLIDAY', 'DOCTOR_UNAVAILABLE', 'EMERGENCY_CLOSURE', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Clinic Working Hours Table
CREATE TABLE IF NOT EXISTS "clinic_working_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "morningStartTime" TEXT,
    "morningEndTime" TEXT,
    "eveningStartTime" TEXT,
    "eveningEndTime" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_working_hours_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "clinic_working_hours_clinicId_dayOfWeek_key" ON "clinic_working_hours"("clinicId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "clinic_working_hours_clinicId_idx" ON "clinic_working_hours"("clinicId");

-- 2. Clinic Breaks Table
CREATE TABLE IF NOT EXISTS "clinic_breaks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "applicableDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_breaks_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "clinic_breaks_clinicId_idx" ON "clinic_breaks"("clinicId");

-- 3. Clinic Holidays Table (Drop old one if exists and recreate with new structure)
DROP TABLE IF EXISTS "clinic_holidays" CASCADE;

CREATE TABLE "clinic_holidays" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ClinicHolidayType" NOT NULL,
    "reason" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_holidays_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "clinic_holidays_clinicId_date_idx" ON "clinic_holidays"("clinicId", "date");

-- 4. Clinic Special Hours Table
CREATE TABLE IF NOT EXISTS "clinic_special_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT,
    "morningStartTime" TEXT,
    "morningEndTime" TEXT,
    "eveningStartTime" TEXT,
    "eveningEndTime" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_special_hours_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "clinic_special_hours_clinicId_date_key" ON "clinic_special_hours"("clinicId", "date");
CREATE INDEX IF NOT EXISTS "clinic_special_hours_clinicId_date_idx" ON "clinic_special_hours"("clinicId", "date");

-- 5. Clinic Temporary Closure Table
CREATE TABLE IF NOT EXISTS "clinic_temporary_closures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_temporary_closures_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "clinic_temporary_closures_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "clinic_temporary_closures_clinicId_isActive_idx" ON "clinic_temporary_closures"("clinicId", "isActive");

-- 6. Clinic Appointment Settings Table
CREATE TABLE IF NOT EXISTS "clinic_appointment_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL UNIQUE,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxAppointmentsPerSession" INTEGER,
    "bookingOpenDaysBefore" INTEGER NOT NULL DEFAULT 30,
    "bookingCloseMinutesBefore" INTEGER NOT NULL DEFAULT 30,
    "sameDayBookingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "onlineBookingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "walkInEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoConfirmAppointments" BOOLEAN NOT NULL DEFAULT false,
    "bufferBetweenAppointments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_appointment_settings_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. Clinic Queue Settings Table
CREATE TABLE IF NOT EXISTS "clinic_queue_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL UNIQUE,
    "queueStartTime" TEXT NOT NULL DEFAULT '09:00',
    "queueCloseTime" TEXT NOT NULL DEFAULT '20:00',
    "maxQueueCapacity" INTEGER,
    "walkInTokenEnabled" BOOLEAN NOT NULL DEFAULT true,
    "onlineBookingInQueue" BOOLEAN NOT NULL DEFAULT true,
    "estimatedConsultationMinutes" INTEGER NOT NULL DEFAULT 15,
    "autoTokenGenerationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tokenPrefix" TEXT NOT NULL DEFAULT 'T',
    "notifyPatientMinutesBefore" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinic_queue_settings_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Clinic Schedule & Timings tables created successfully!';
END $$;
