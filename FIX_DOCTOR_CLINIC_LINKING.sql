-- ============================================================================
-- COMPLETE FIX FOR DOCTOR-CLINIC LINKING ISSUE
-- ============================================================================
-- This script fixes all issues with doctors not appearing in clinic dashboards
-- ============================================================================

-- STEP 1: Fix doctor profiles with missing invitationId
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

-- STEP 2: Create missing clinic_doctors entries for approved doctors
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
