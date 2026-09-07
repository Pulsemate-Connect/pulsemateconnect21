-- Check all clinic owner accounts and their details
SELECT 
  u.id,
  u.name,
  u.email,
  u.mobile,
  u.role,
  u."approvalStatus",
  u."isPhoneVerified",
  u."isEmailVerified",
  u."createdAt",
  u."clinicOnboardingData"::text as onboarding_data_summary
FROM users u
WHERE u.role = 'CLINIC_OWNER'
ORDER BY u."createdAt" DESC;

-- Check firebase phone verification records
SELECT * FROM firebase_phone_verifications
ORDER BY "createdAt" DESC;

-- Check if there's a clinic owner profile
SELECT 
  cop.id,
  cop."userId",
  cop."clinicId",
  cop."businessName",
  cop."businessType"
FROM clinic_owner_profiles cop;
