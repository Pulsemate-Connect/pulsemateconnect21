-- ============================================================================
-- Check what mobile numbers are in the FORM DATA (Step 1)
-- ============================================================================

SELECT 
  name,
  email,
  mobile as "database_mobile",
  "clinicOnboardingData"->'clinicInformation'->>'ownerMobile' as "form_mobile",
  "clinicOnboardingData"->'clinicInformation'->>'clinicName' as "clinic_name",
  "approvalStatus",
  "createdAt"
FROM users
WHERE email IN ('kotharkar276@gmail.com', 'shubham27052002@gmail.com')
ORDER BY "createdAt" DESC;
