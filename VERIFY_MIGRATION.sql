-- ============================================================================
-- VERIFY MIGRATION SUCCESS
-- ============================================================================
-- Run this to confirm everything was applied correctly
-- ============================================================================

-- Check 1: Verify DRAFT enum value exists
SELECT 
  '✅ Check 1: DRAFT Enum Value' as test,
  enumlabel as enum_values
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ApprovalStatus')
ORDER BY enumsortorder;

-- Check 2: Verify new columns exist
SELECT 
  '✅ Check 2: New Columns' as test,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('registrationComplete', 'registrationStartedAt', 'registrationCompletedAt')
ORDER BY column_name;

-- Check 3: Verify indexes were created
SELECT 
  '✅ Check 3: New Indexes' as test,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname IN ('idx_users_registration_status', 'idx_users_draft_cleanup');

-- Check 4: Summary of clinic owner statuses
SELECT 
  '✅ Check 4: Clinic Owner Status Summary' as test,
  "approvalStatus",
  "registrationComplete",
  COUNT(*) as count
FROM "users"
WHERE "role" = 'CLINIC_OWNER'
GROUP BY "approvalStatus", "registrationComplete"
ORDER BY "approvalStatus";

-- Check 5: Sample data from users table
SELECT 
  '✅ Check 5: Sample User Data' as test,
  id,
  name,
  email,
  mobile,
  "approvalStatus",
  "registrationComplete",
  "registrationStartedAt",
  "createdAt"
FROM "users"
WHERE "role" = 'CLINIC_OWNER'
ORDER BY "createdAt" DESC
LIMIT 5;
