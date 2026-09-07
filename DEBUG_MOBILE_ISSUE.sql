-- ============================================================================
-- Debug: Check mobile number issue for kotharkar276@gmail.com
-- ============================================================================
-- Run this in Supabase SQL Editor to understand where +918711670726 came from
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════
-- Query 1: Check user account details
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  '🔍 User Account' as check_name,
  id,
  name,
  email,
  mobile as "user_account_mobile",
  "isEmailVerified",
  "isPhoneVerified",
  role,
  "approvalStatus",
  "registrationComplete",
  "registrationStartedAt",
  "createdAt",
  "updatedAt"
FROM users
WHERE email = 'kotharkar276@gmail.com';

-- ══════════════════════════════════════════════════════════════════════════
-- Query 2: Check clinicOnboardingData (Step 1 form data)
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  '📋 Form Data (Step 1)' as check_name,
  id,
  name,
  email,
  "clinicOnboardingData"->'clinicInformation'->>'ownerMobile' as "form_owner_mobile",
  "clinicOnboardingData"->'clinicInformation'->>'ownerName' as "form_owner_name",
  "clinicOnboardingData"->'clinicInformation'->>'ownerEmail' as "form_owner_email",
  "clinicOnboardingData"->'clinicInformation'->>'clinicName' as "clinic_name",
  "clinicOnboardingData"->>'currentStep' as "current_step",
  "clinicOnboardingData"->>'onboardingComplete' as "onboarding_complete"
FROM users
WHERE email = 'kotharkar276@gmail.com';

-- ══════════════════════════════════════════════════════════════════════════
-- Query 3: Check if mobile +918711670726 belongs to another user
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  '👤 Users with +918711670726' as check_name,
  id,
  name,
  email,
  mobile,
  role,
  "approvalStatus",
  "isEmailVerified",
  "isPhoneVerified",
  "createdAt"
FROM users
WHERE mobile LIKE '%8711670726%'
ORDER BY "createdAt" DESC;

-- ══════════════════════════════════════════════════════════════════════════
-- Query 4: Check if mobile 9999999999 exists anywhere
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  '👤 Users with 9999999999' as check_name,
  id,
  name,
  email,
  mobile,
  role,
  "approvalStatus",
  "isEmailVerified",
  "isPhoneVerified",
  "createdAt"
FROM users
WHERE mobile LIKE '%9999999999%'
ORDER BY "createdAt" DESC;

-- ══════════════════════════════════════════════════════════════════════════
-- Query 5: Check ALL clinic owners to see patterns
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  '📊 All Clinic Owners' as check_name,
  id,
  name,
  email,
  mobile,
  "approvalStatus",
  "registrationComplete",
  "createdAt"
FROM users
WHERE role = 'CLINIC_OWNER'
ORDER BY "createdAt" DESC
LIMIT 10;

-- ══════════════════════════════════════════════════════════════════════════
-- Query 6: Check Firebase phone verifications (if table exists)
-- ══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'firebase_phone_verifications'
  ) THEN
    RAISE NOTICE '✅ Checking firebase_phone_verifications table...';
  ELSE
    RAISE NOTICE 'ℹ️  firebase_phone_verifications table does not exist - skipping';
  END IF;
END $$;

-- Only run if table exists - comment out if it fails
-- SELECT 
--   '🔐 Firebase Verifications' as check_name,
--   id,
--   mobile,
--   "firebaseUid",
--   purpose,
--   "verifiedAt",
--   "createdAt"
-- FROM firebase_phone_verifications
-- WHERE mobile LIKE '%8711670726%' 
--    OR mobile LIKE '%9999999999%'
-- ORDER BY "createdAt" DESC;

-- ══════════════════════════════════════════════════════════════════════════
-- INTERPRETATION GUIDE
-- ══════════════════════════════════════════════════════════════════════════
/*
Expected Results:

Query 1 (User Account):
- Should show: mobile = +918711670726 OR mobile = +919999999999 OR mobile = NULL
- isPhoneVerified = true/false

Query 2 (Form Data):
- Should show: form_owner_mobile from clinicOnboardingData.clinicInformation
- This is what you entered in Step 1 form

Query 3 & 4:
- Shows if these numbers belong to other accounts

Query 5:
- Shows all clinic owners to spot patterns

Query 6:
- Shows Firebase verification records

POSSIBLE SCENARIOS:
==================

Scenario A: Old Account
- Query 3 shows +918711670726 belongs to an older account
- You might have registered before with this number

Scenario B: Form Saved Wrong Data
- Query 2 shows form_owner_mobile = +918711670726
- But you claim you entered 9999999999
- Possible browser autofill or cached data?

Scenario C: Database Updated from Different Source
- User.mobile was updated by a different endpoint
- Check Query 6 for Firebase verifications

*/
