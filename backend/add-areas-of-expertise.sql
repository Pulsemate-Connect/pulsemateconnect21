-- Add areasOfExpertise field to doctor_profiles
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "areasOfExpertise" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update index comment
COMMENT ON COLUMN "doctor_profiles"."areasOfExpertise" IS 'Areas of expertise/specialization for the doctor';
