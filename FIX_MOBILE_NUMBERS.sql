-- ============================================================================
-- FIX MOBILE NUMBERS - Update to verified mobiles
-- ============================================================================
-- Run this to update both accounts with correct verified mobile numbers
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════
-- Fix Account 1: kotharkar276@gmail.com
-- ══════════════════════════════════════════════════════════════════════════
UPDATE users
SET 
  mobile = '+919999999999',
  "isPhoneVerified" = true,
  "updatedAt" = NOW()
WHERE email = 'kotharkar276@gmail.com';

-- Also update in clinicOnboardingData
UPDATE users
SET "clinicOnboardingData" = jsonb_set(
  "clinicOnboardingData",
  '{clinicInformation,ownerMobile}',
  '"+919999999999"'
)
WHERE email = 'kotharkar276@gmail.com';

-- ══════════════════════════════════════════════════════════════════════════
-- Fix Account 2: shubham27052002@gmail.com
-- ══════════════════════════════════════════════════════════════════════════
UPDATE users
SET 
  mobile = '+919141638162',
  "isPhoneVerified" = true,
  "updatedAt" = NOW()
WHERE email = 'shubham27052002@gmail.com';

-- Also update in clinicOnboardingData
UPDATE users
SET "clinicOnboardingData" = jsonb_set(
  "clinicOnboardingData",
  '{clinicInformation,ownerMobile}',
  '"+919141638162"'
)
WHERE email = 'shubham27052002@gmail.com';

-- ══════════════════════════════════════════════════════════════════════════
-- Verify the fix worked
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  name,
  email,
  mobile as "updated_mobile",
  "isPhoneVerified",
  "clinicOnboardingData"->'clinicInformation'->>'ownerMobile' as "form_mobile",
  "approvalStatus"
FROM users
WHERE email IN ('kotharkar276@gmail.com', 'shubham27052002@gmail.com')
ORDER BY email;

-- ══════════════════════════════════════════════════════════════════════════
-- Expected Results After Fix:
-- ══════════════════════════════════════════════════════════════════════════
/*
Should show:

1. kotharkar276@gmail.com
   - updated_mobile: +919999999999 ✅
   - form_mobile: +919999999999 ✅
   - isPhoneVerified: true ✅

2. shubham27052002@gmail.com
   - updated_mobile: +919141638162 ✅
   - form_mobile: +919141638162 ✅
   - isPhoneVerified: true ✅
*/
