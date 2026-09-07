-- Check what's actually in the database right now
SELECT 
  id,
  name,
  email,
  mobile as "user_mobile",
  "isPhoneVerified",
  "approvalStatus",
  "clinicOnboardingData"->'clinicInformation'->>'ownerMobile' as "form_mobile",
  "updatedAt"
FROM users
WHERE email = 'kotharkar276@gmail.com';
