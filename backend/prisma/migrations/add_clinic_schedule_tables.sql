-- Add Clinic Schedule Management Tables
-- This migration adds comprehensive schedule management for clinics

-- Clinic Working Hours (Weekly Schedule)
CREATE TABLE IF NOT EXISTS "clinic_working_hours" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "clinicId" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6), -- 0=Sunday, 6=Saturday
  "isOpen" BOOLEAN DEFAULT true,
  "morningStartTime" TEXT, -- Format: "09:00"
  "morningEndTime" TEXT,
  "eveningStartTime" TEXT,
  "eveningEndTime" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("clinicId", "dayOfWeek")
);

-- Clinic Breaks
CREATE TABLE IF NOT EXISTS "clinic_breaks" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "clinicId" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL, -- e.g., "Lunch Break"
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "applicableDays" INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6], -- Days when this break applies
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Clinic Holidays & Special Closures
CREATE TABLE IF NOT EXISTS "clinic_holidays" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "clinicId" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "name" TEXT NOT NULL, -- e.g., "Independence Day"
  "type" TEXT NOT NULL CHECK ("type" IN ('PUBLIC_HOLIDAY', 'CLINIC_HOLIDAY', 'EMERGENCY_CLOSURE', 'CUSTOM')),
  "reason" TEXT,
  "isRecurring" BOOLEAN DEFAULT false, -- For annual holidays
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Special Hours (Override regular schedule for specific dates)
CREATE TABLE IF NOT EXISTS "clinic_special_hours" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "clinicId" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "name" TEXT, -- e.g., "Extended Hours - Festival"
  "morningStartTime" TEXT,
  "morningEndTime" TEXT,
  "eveningStartTime" TEXT,
  "eveningEndTime" TEXT,
  "isClosed" BOOLEAN DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("clinicId", "date")
);

-- Temporary Closure (for emergencies or temporary closures)
CREATE TABLE IF NOT EXISTS "clinic_temporary_closures" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "clinicId" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP,
  "reason" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdBy" TEXT REFERENCES "users"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Appointment Settings (per clinic)
CREATE TABLE IF NOT EXISTS "clinic_appointment_settings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "clinicId" TEXT NOT NULL UNIQUE REFERENCES "clinics"("id") ON DELETE CASCADE,
  "slotDurationMinutes" INTEGER DEFAULT 30,
  "maxAppointmentsPerSession" INTEGER,
  "bookingOpenDaysBefore" INTEGER DEFAULT 30,
  "bookingCloseMinutesBefore" INTEGER DEFAULT 30,
  "sameDayBookingEnabled" BOOLEAN DEFAULT true,
  "onlineBookingEnabled" BOOLEAN DEFAULT true,
  "walkInEnabled" BOOLEAN DEFAULT true,
  "autoConfirmAppointments" BOOLEAN DEFAULT false,
  "bufferBetweenAppointments" INTEGER DEFAULT 0, -- Minutes
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Queue Settings (per clinic)
CREATE TABLE IF NOT EXISTS "clinic_queue_settings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "clinicId" TEXT NOT NULL UNIQUE REFERENCES "clinics"("id") ON DELETE CASCADE,
  "queueStartTime" TEXT DEFAULT '09:00',
  "queueCloseTime" TEXT DEFAULT '20:00',
  "maxQueueCapacity" INTEGER,
  "walkInTokenEnabled" BOOLEAN DEFAULT true,
  "onlineBookingInQueue" BOOLEAN DEFAULT true,
  "estimatedConsultationMinutes" INTEGER DEFAULT 15,
  "autoTokenGenerationEnabled" BOOLEAN DEFAULT true,
  "tokenPrefix" TEXT DEFAULT 'T', -- e.g., T001, T002
  "notifyPatientMinutesBefore" INTEGER DEFAULT 15,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_clinic_working_hours_clinicId" ON "clinic_working_hours"("clinicId");
CREATE INDEX IF NOT EXISTS "idx_clinic_breaks_clinicId" ON "clinic_breaks"("clinicId");
CREATE INDEX IF NOT EXISTS "idx_clinic_holidays_clinicId_date" ON "clinic_holidays"("clinicId", "date");
CREATE INDEX IF NOT EXISTS "idx_clinic_special_hours_clinicId_date" ON "clinic_special_hours"("clinicId", "date");
CREATE INDEX IF NOT EXISTS "idx_clinic_temporary_closures_clinicId_active" ON "clinic_temporary_closures"("clinicId", "isActive");

-- Add triggers to update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clinic_working_hours_updated_at BEFORE UPDATE ON "clinic_working_hours" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_breaks_updated_at BEFORE UPDATE ON "clinic_breaks" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_holidays_updated_at BEFORE UPDATE ON "clinic_holidays" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_special_hours_updated_at BEFORE UPDATE ON "clinic_special_hours" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_temporary_closures_updated_at BEFORE UPDATE ON "clinic_temporary_closures" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_appointment_settings_updated_at BEFORE UPDATE ON "clinic_appointment_settings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_queue_settings_updated_at BEFORE UPDATE ON "clinic_queue_settings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
