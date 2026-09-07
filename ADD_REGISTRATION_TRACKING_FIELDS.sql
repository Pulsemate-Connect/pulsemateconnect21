-- ============================================================================
-- MIGRATION: Add Registration Tracking Fields
-- ============================================================================
-- Purpose: Support Hybrid Registration Flow (DRAFT → PENDING)
-- Date: September 6, 2026
-- ============================================================================

-- Step 1: Add new columns to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "registrationComplete" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "registrationStartedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "registrationCompletedAt" TIMESTAMP;

-- Step 2: Update existing incomplete clinic owner registrations to DRAFT
-- (Those who verified email/mobile but never submitted)
UPDATE "users" 
SET 
  "approvalStatus" = 'DRAFT',
  "registrationComplete" = false,
  "registrationStartedAt" = "createdAt"
WHERE 
  "role" = 'CLINIC_OWNER'
  AND "approvalStatus" = 'PENDING'
  AND (
    "clinicOnboardingData" IS NULL 
    OR "clinicOnboardingData"::text NOT LIKE '%"onboardingComplete":true%'
  );

-- Step 3: Mark completed registrations properly
-- (Those who submitted all steps)
UPDATE "users" 
SET 
  "registrationComplete" = true,
  "registrationCompletedAt" = "updatedAt"
WHERE 
  "role" = 'CLINIC_OWNER'
  AND "approvalStatus" = 'PENDING'
  AND "clinicOnboardingData"::text LIKE '%"onboardingComplete":true%';

-- Step 4: Add DRAFT to ApprovalStatus enum if not exists
-- Note: This will be handled by Prisma migration
-- Manual SQL for direct database update:
/*
ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
*/

-- Step 5: Create index for faster queries on registration status
CREATE INDEX IF NOT EXISTS "idx_users_registration_status" 
ON "users" ("role", "approvalStatus", "registrationComplete");

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check how many users were affected
SELECT 
  "approvalStatus",
  "registrationComplete",
  COUNT(*) as count
FROM "users"
WHERE "role" = 'CLINIC_OWNER'
GROUP BY "approvalStatus", "registrationComplete";

-- View all clinic owner registration states
SELECT 
  "id",
  "name",
  "email",
  "mobile",
  "approvalStatus",
  "registrationComplete",
  "registrationStartedAt",
  "registrationCompletedAt",
  CASE 
    WHEN "clinicOnboardingData" IS NOT NULL THEN 'Has Data'
    ELSE 'No Data'
  END as onboarding_data
FROM "users"
WHERE "role" = 'CLINIC_OWNER'
ORDER BY "createdAt" DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Migration completed successfully! ✅' as status;
