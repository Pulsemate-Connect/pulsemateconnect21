-- Check the user data for kotharkar276@gmail.com
SELECT 
  id,
  name,
  email,
  mobile,
  role,
  "approvalStatus",
  "isEmailVerified",
  "isPhoneVerified",
  "registrationComplete",
  "registrationStartedAt",
  "registrationCompletedAt",
  "firebaseUid",
  "clinicOnboardingData",
  "createdAt",
  "updatedAt"
FROM users
WHERE email = 'kotharkar276@gmail.com'
OR mobile = '+918711670726';
