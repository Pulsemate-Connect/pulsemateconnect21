-- Add audit trail fields to patient_profiles table for tracking staff-created patients

ALTER TABLE "patient_profiles" 
ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT,
ADD COLUMN IF NOT EXISTS "createdByRole" TEXT,
ADD COLUMN IF NOT EXISTS "registeredVia" TEXT NOT NULL DEFAULT 'SELF',
ADD COLUMN IF NOT EXISTS "registeredClinicId" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "patient_profiles"."createdByUserId" IS 'User ID of staff member who created this patient (DOCTOR, RECEPTIONIST, CLINIC_OWNER, or SUPER_ADMIN)';
COMMENT ON COLUMN "patient_profiles"."createdByRole" IS 'Role of the staff member who created this patient';
COMMENT ON COLUMN "patient_profiles"."registeredVia" IS 'How the patient was registered: SELF (patient self-registered) or DOCTOR/RECEPTIONIST/CLINIC_OWNER/ADMIN (staff-created)';
COMMENT ON COLUMN "patient_profiles"."registeredClinicId" IS 'Clinic ID where patient was registered (if registered by clinic staff)';
