-- ============================================================================
-- COMPLETE FIX FOR DOCTOR-CLINIC LINKING ISSUE
-- ============================================================================
-- This script fixes all issues with doctors not appearing in clinic dashboards
-- Run this script to fix approved doctors missing from clinic dashboards
-- ============================================================================

\echo '============================================================================'
\echo 'STEP 1: Checking for doctors missing clinic_doctors links...'
\echo '============================================================================'

SELECT 
  u.id as user_id,
  u.name,
  u."approvalStatus",
  dp.id as profile_id,
  dp."invitationId",
  di."clinicId",
  c.name as clinic_name,
  di.status as invitation_status,
  dc.id as clinic_doctor_id,
  CASE 
    WHEN dc.id IS NULL AND di."clinicId" IS NOT NULL THEN 'MISSING LINK ❌'
    WHEN dc.id IS NOT NULL THEN 'PROPERLY LINKED ✅'
    ELSE 'NO INVITATION ⚠️'
  END as link_status
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
LEFT JOIN doctor_invitations di ON dp."invitationId" = di.id
LEFT JOIN clinics c ON di."clinicId" = c.id
LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
WHERE u.role = 'DOCTOR' AND u."approvalStatus" = 'VERIFIED'
ORDER BY u."createdAt" DESC;

\echo ''
\echo '============================================================================'
\echo 'STEP 2: Fixing doctor profiles with missing invitationId...'
\echo '============================================================================'

-- Link doctor profiles to their invitations if invitationId is missing
UPDATE doctor_profiles dp
SET "invitationId" = di.id
FROM users u
JOIN doctor_invitations di ON di."doctorUserId" = u.id
WHERE dp."userId" = u.id
  AND dp."invitationId" IS NULL
  AND di.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM doctor_profiles dp2 
    WHERE dp2."invitationId" = di.id AND dp2.id != dp.id
  );

\echo 'Fixed invitationId links:'
SELECT 
  COUNT(*) as profiles_linked,
  STRING_AGG(DISTINCT u.name, ', ' ORDER BY u.name) as doctor_names
FROM doctor_profiles dp
JOIN users u ON dp."userId" = u.id
JOIN doctor_invitations di ON dp."invitationId" = di.id
WHERE dp."updatedAt" > NOW() - INTERVAL '10 seconds';

\echo ''
\echo '============================================================================'
\echo 'STEP 3: Creating missing clinic_doctors entries...'
\echo '============================================================================'

-- Create missing clinic_doctors entries for approved doctors
INSERT INTO clinic_doctors (
  id,
  "doctorId",
  "clinicId",
  "inviteStatus",
  "roleAtClinic",
  "consultationFee",
  "availableDays",
  "avgConsultationMins",
  "isActive",
  "joinedAt",
  "adminVerifiedAt",
  "invitationAcceptedAt",
  "verificationSubmittedAt",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid() as id,
  dp.id as "doctorId",
  di."clinicId",
  'ACCEPTED' as "inviteStatus",
  COALESCE(di.specialization, 'CONSULTANT') as "roleAtClinic",
  dp."consultationFee" as "consultationFee",
  ARRAY[]::text[] as "availableDays",
  COALESCE(dp."avgConsultationMins", 10) as "avgConsultationMins",
  true as "isActive",
  COALESCE(di."verifiedAt", di."acceptedAt", NOW()) as "joinedAt",
  di."verifiedAt" as "adminVerifiedAt",
  di."acceptedAt" as "invitationAcceptedAt",
  di."submittedAt" as "verificationSubmittedAt",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
JOIN doctor_invitations di ON dp."invitationId" = di.id
LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
WHERE u.role = 'DOCTOR' 
  AND u."approvalStatus" = 'VERIFIED'
  AND di."clinicId" IS NOT NULL
  AND dc.id IS NULL
ON CONFLICT ("doctorId", "clinicId") DO UPDATE SET
  "inviteStatus" = EXCLUDED."inviteStatus",
  "isActive" = true,
  "updatedAt" = NOW();

\echo 'Created clinic_doctors entries:'
SELECT 
  COUNT(*) as links_created,
  STRING_AGG(DISTINCT u.name, ', ' ORDER BY u.name) as doctor_names
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
JOIN clinic_doctors dc ON dp.id = dc."doctorId"
WHERE dc."createdAt" > NOW() - INTERVAL '10 seconds';

\echo ''
\echo '============================================================================'
\echo 'STEP 4: Final Verification - All Doctors Should Be Properly Linked Now'
\echo '============================================================================'

SELECT 
  u.id as user_id,
  u.name,
  u."approvalStatus",
  c.name as clinic_name,
  dc."inviteStatus",
  dc."isActive",
  dc."joinedAt",
  CASE 
    WHEN dc.id IS NOT NULL THEN '✅ PROPERLY LINKED'
    ELSE '❌ STILL MISSING'
  END as status
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
LEFT JOIN doctor_invitations di ON dp."invitationId" = di.id
LEFT JOIN clinics c ON di."clinicId" = c.id
LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
WHERE u.role = 'DOCTOR' AND u."approvalStatus" = 'VERIFIED'
ORDER BY 
  CASE WHEN dc.id IS NULL THEN 0 ELSE 1 END,
  u."createdAt" DESC;

\echo ''
\echo '============================================================================'
\echo 'SUMMARY'
\echo '============================================================================'

SELECT 
  COUNT(*) as total_verified_doctors,
  COUNT(CASE WHEN dc.id IS NOT NULL THEN 1 END) as properly_linked,
  COUNT(CASE WHEN dc.id IS NULL THEN 1 END) as still_missing,
  ROUND(100.0 * COUNT(CASE WHEN dc.id IS NOT NULL THEN 1 END) / COUNT(*), 2) as success_percentage
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
LEFT JOIN doctor_invitations di ON dp."invitationId" = di.id
LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
WHERE u.role = 'DOCTOR' AND u."approvalStatus" = 'VERIFIED';

\echo ''
\echo '✅ FIX COMPLETE! Doctors should now appear in clinic dashboard and mobile app.'
\echo ''
