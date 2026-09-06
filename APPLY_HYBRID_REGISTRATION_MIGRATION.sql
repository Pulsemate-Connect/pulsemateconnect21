-- ============================================================================
-- MIGRATION: Hybrid Registration Flow (DRAFT → PENDING)
-- ============================================================================
-- Run this in your Supabase SQL Editor
-- ============================================================================
-- IMPORTANT: PostgreSQL requires enum values to be committed before use
-- So we split this into multiple parts
-- ============================================================================

-- ============================================================================
-- PART 1: Add DRAFT enum value (MUST be in separate transaction)
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DRAFT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ApprovalStatus')
    ) THEN
        -- Add DRAFT as first value (before PENDING)
        ALTER TYPE "ApprovalStatus" ADD VALUE 'DRAFT' BEFORE 'PENDING';
        RAISE NOTICE '✅ Added DRAFT to ApprovalStatus enum';
    ELSE
        RAISE NOTICE 'ℹ️  DRAFT already exists in ApprovalStatus enum';
    END IF;
END $$;

-- ⚠️ IMPORTANT: After running the above, the enum value needs to be committed
-- before we can use it. This is a PostgreSQL requirement.
-- 
-- In Supabase SQL Editor: The above will auto-commit when you run it.
-- Now continue with the rest of the migration below:

-- ============================================================================
-- PART 2: Add new columns and update data
-- ============================================================================

-- Step 1: Add new tracking columns
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "registrationComplete" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "registrationStartedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "registrationCompletedAt" TIMESTAMP;

-- Step 2: Update existing incomplete registrations to DRAFT
UPDATE "users" 
SET 
  "approvalStatus" = 'DRAFT',
  "registrationComplete" = false,
  "registrationStartedAt" = COALESCE("registrationStartedAt", "createdAt")
WHERE 
  "role" = 'CLINIC_OWNER'
  AND "approvalStatus" = 'PENDING'
  AND (
    "clinicOnboardingData" IS NULL 
    OR "clinicOnboardingData"::text NOT LIKE '%"onboardingComplete":true%'
  );

-- Step 3: Mark completed registrations properly
UPDATE "users" 
SET 
  "registrationComplete" = true,
  "registrationStartedAt" = COALESCE("registrationStartedAt", "createdAt"),
  "registrationCompletedAt" = COALESCE("registrationCompletedAt", "updatedAt")
WHERE 
  "role" = 'CLINIC_OWNER'
  AND "approvalStatus" IN ('PENDING', 'VERIFIED', 'REJECTED', 'UNDER_REVIEW')
  AND "clinicOnboardingData"::text LIKE '%"onboardingComplete":true%';

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_registration_status" 
ON "users" ("role", "approvalStatus", "registrationComplete");

CREATE INDEX IF NOT EXISTS "idx_users_draft_cleanup" 
ON "users" ("approvalStatus", "registrationComplete", "createdAt")
WHERE "approvalStatus" = 'DRAFT' AND "registrationComplete" = false;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the results
SELECT 
  "approvalStatus",
  "registrationComplete",
  COUNT(*) as count
FROM "users"
WHERE "role" = 'CLINIC_OWNER'
GROUP BY "approvalStatus", "registrationComplete"
ORDER BY "approvalStatus";

-- View sample records
SELECT 
  "id",
  "name",
  "email",
  "mobile",
  "approvalStatus",
  "registrationComplete",
  "registrationStartedAt",
  TO_CHAR("createdAt", 'YYYY-MM-DD HH24:MI:SS') as created
FROM "users"
WHERE "role" = 'CLINIC_OWNER'
ORDER BY "createdAt" DESC
LIMIT 10;

SELECT '✅ Migration completed successfully!' as status;
