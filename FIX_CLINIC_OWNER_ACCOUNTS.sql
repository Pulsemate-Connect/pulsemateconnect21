-- ========================================
-- FIX CLINIC OWNER ACCOUNTS
-- ========================================
-- This script will:
-- 1. Show both clinic owner accounts
-- 2. Help you decide which one to keep
-- 3. Clean up the unwanted account
-- ========================================

-- STEP 1: See all clinic owner accounts
SELECT 
  u.id,
  u.name,
  u.email,
  u.mobile,
  u."approvalStatus",
  u."isPhoneVerified",
  u."createdAt",
  CASE 
    WHEN u."clinicOnboardingData" IS NOT NULL THEN 'Has Onboarding Data'
    ELSE 'No Onboarding Data'
  END as onboarding_status
FROM users u
WHERE u.role = 'CLINIC_OWNER'
ORDER BY u."createdAt" DESC;

-- STEP 2: Check which account has onboarding data
SELECT 
  u.mobile,
  u.name,
  u."clinicOnboardingData" -> 'clinicInformation' ->> 'clinicName' as clinic_name,
  u."clinicOnboardingData" -> 'clinicInformation' ->> 'ownerName' as owner_name,
  u."clinicOnboardingData" -> 'clinicInformation' ->> 'ownerEmail' as owner_email
FROM users u
WHERE u.role = 'CLINIC_OWNER'
  AND u."clinicOnboardingData" IS NOT NULL;

-- ========================================
-- DECISION TIME:
-- After running the above queries, decide:
-- - Which account should be KEPT (your actual account)
-- - Which account should be DELETED (test/incomplete data)
-- ========================================

-- OPTION A: Delete the account with phone +918703635445 (Arjun U)
-- Uncomment the lines below if you want to delete this account:

/*
BEGIN;

-- Delete refresh tokens
DELETE FROM refresh_tokens 
WHERE "userId" IN (
  SELECT id FROM users WHERE mobile = '+918703635445' AND role = 'CLINIC_OWNER'
);

-- Delete sessions
DELETE FROM sessions 
WHERE "userId" IN (
  SELECT id FROM users WHERE mobile = '+918703635445' AND role = 'CLINIC_OWNER'
);

-- Delete audit logs
DELETE FROM audit_logs 
WHERE "userId" IN (
  SELECT id FROM users WHERE mobile = '+918703635445' AND role = 'CLINIC_OWNER'
);

-- Delete the user
DELETE FROM users 
WHERE mobile = '+918703635445' AND role = 'CLINIC_OWNER';

COMMIT;

SELECT 'Account with +918703635445 deleted successfully' as result;
*/

-- OPTION B: Delete the account with phone +919141638162 (Unknown)
-- Uncomment the lines below if you want to delete this account:

/*
BEGIN;

-- Delete refresh tokens
DELETE FROM refresh_tokens 
WHERE "userId" IN (
  SELECT id FROM users WHERE mobile = '+919141638162' AND role = 'CLINIC_OWNER'
);

-- Delete sessions
DELETE FROM sessions 
WHERE "userId" IN (
  SELECT id FROM users WHERE mobile = '+919141638162' AND role = 'CLINIC_OWNER'
);

-- Delete audit logs
DELETE FROM audit_logs 
WHERE "userId" IN (
  SELECT id FROM users WHERE mobile = '+919141638162' AND role = 'CLINIC_OWNER'
);

-- Delete the user
DELETE FROM users 
WHERE mobile = '+919141638162' AND role = 'CLINIC_OWNER';

COMMIT;

SELECT 'Account with +919141638162 deleted successfully' as result;
*/

-- ========================================
-- AFTER DELETION: Verify only one account remains
-- ========================================
-- Run this after deleting the unwanted account:
/*
SELECT 
  u.id,
  u.name,
  u.email,
  u.mobile,
  u."approvalStatus",
  u."createdAt"
FROM users u
WHERE u.role = 'CLINIC_OWNER';
*/
