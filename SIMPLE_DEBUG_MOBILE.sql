-- ============================================================================
-- SIMPLE DEBUG: Check mobile number for kotharkar276@gmail.com
-- ============================================================================
-- Run each query separately if needed
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════
-- Query 1: Check user account
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  id,
  name,
  email,
  mobile,
  "isEmailVerified",
  "isPhoneVerified",
  role,
  "approvalStatus",
  "createdAt"
FROM users
WHERE email = 'kotharkar276@gmail.com';

-- ══════════════════════════════════════════════════════════════════════════
-- Query 2: Check form data (Step 1)
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  id,
  name,
  "clinicOnboardingData"->'clinicInformation'->>'ownerMobile' as form_mobile,
  "clinicOnboardingData"->'clinicInformation'->>'ownerName' as form_name,
  "clinicOnboardingData"->'clinicInformation'->>'clinicName' as clinic_name,
  "clinicOnboardingData"->>'currentStep' as current_step
FROM users
WHERE email = 'kotharkar276@gmail.com';

-- ══════════════════════════════════════════════════════════════════════════
-- Query 3: Check if +918711670726 belongs to another user
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  id,
  name,
  email,
  mobile,
  "createdAt"
FROM users
WHERE mobile = '+918711670726' 
   OR mobile = '8711670726'
   OR mobile = '918711670726';

-- ══════════════════════════════════════════════════════════════════════════
-- Query 4: Check if 9999999999 exists
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  id,
  name,
  email,
  mobile,
  "createdAt"
FROM users
WHERE mobile = '+919999999999' 
   OR mobile = '9999999999'
   OR mobile = '919999999999';

-- ══════════════════════════════════════════════════════════════════════════
-- Query 5: Show all clinic owners (recent)
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  id,
  name,
  email,
  mobile,
  "approvalStatus",
  "createdAt"
FROM users
WHERE role = 'CLINIC_OWNER'
ORDER BY "createdAt" DESC
LIMIT 10;
