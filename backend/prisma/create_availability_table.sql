-- Create doctor_availability table if not exists
CREATE TABLE IF NOT EXISTS "doctor_availability" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDurationMin" INTEGER NOT NULL DEFAULT 15,
    "maxPatients" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS "doctor_availability_doctorId_idx" ON "doctor_availability"("doctorId");
CREATE INDEX IF NOT EXISTS "doctor_availability_clinicId_idx" ON "doctor_availability"("clinicId");
CREATE INDEX IF NOT EXISTS "doctor_availability_dayOfWeek_idx" ON "doctor_availability"("dayOfWeek");
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_availability_doctorId_clinicId_dayOfWeek_key" ON "doctor_availability"("doctorId", "clinicId", "dayOfWeek");

-- Add foreign keys if not exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctor_availability_doctorId_fkey'
    ) THEN
        ALTER TABLE "doctor_availability" 
        ADD CONSTRAINT "doctor_availability_doctorId_fkey" 
        FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctor_availability_clinicId_fkey'
    ) THEN
        ALTER TABLE "doctor_availability" 
        ADD CONSTRAINT "doctor_availability_clinicId_fkey" 
        FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
