-- Check all pending clinic registrations
SELECT 
  id,
  mobile,
  email,
  name,
  role,
  approvalStatus,
  createdAt,
  updatedAt,
  clinicOnboardingData->>'lastUpdatedStep' as last_step,
  clinicOnboardingData->>'submittedAt' as submitted_at
FROM "User"
WHERE role = 'CLINIC_OWNER'
  AND approvalStatus = 'PENDING'
ORDER BY updatedAt DESC;

-- Count pending applications
SELECT COUNT(*) as pending_count
FROM "User"
WHERE role = 'CLINIC_OWNER'
  AND approvalStatus = 'PENDING';

-- Check all clinic owner statuses
SELECT 
  approvalStatus,
  COUNT(*) as count
FROM "User"
WHERE role = 'CLINIC_OWNER'
GROUP BY approvalStatus
ORDER BY count DESC;

-- Check specific email
-- SELECT * FROM "User" WHERE email = 'your-email@example.com';

-- Check specific mobile
-- SELECT * FROM "User" WHERE mobile = '9999999999';
