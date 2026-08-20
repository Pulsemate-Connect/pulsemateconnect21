-- Manual migration for doctor management fields

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "DoctorProfileStatus" AS ENUM ('INCOMPLETE', 'COMPLETE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DoctorVerificationStatus" AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns to doctor_profiles if they don't exist
ALTER TABLE "doctor_profiles" 
ADD COLUMN IF NOT EXISTS "profileStatus" "DoctorProfileStatus" NOT NULL DEFAULT 'INCOMPLETE',
ADD COLUMN IF NOT EXISTS "verificationStatus" "DoctorVerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
ADD COLUMN IF NOT EXISTS "gender" TEXT,
ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT,
ADD COLUMN IF NOT EXISTS "profileImage" TEXT;

-- Create unique index on firebaseUid if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "users_firebaseUid_key" ON "users"("firebaseUid");
