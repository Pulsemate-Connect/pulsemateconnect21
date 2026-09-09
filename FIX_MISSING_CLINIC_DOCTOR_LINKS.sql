-- ============================================================================
-- FIX MISSING CLINIC-DOCTOR LINKS
-- ============================================================================
-- This script fixes approved doctors who are missing their clinic_doctors entries
-- Run this to retroactively create the missing relationships

-- First, let's see what we need to fix
SELECT 
  u.id as user_id,
  u.name,
  dp.id as profile_id,
  di."clinicId",
  c.name as clinic_name,
  di.status as invitation_status,
  dc.id as existing_clinic_doctor_id
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
LEFT JOIN doctor_invitations di ON dp."invitationId" = di.id
LEFT JOIN clinics c ON di."clinicId" = c.id
LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
WHERE u.role = 'DOCTOR' 
  AND u."approvalStatus" = 'VERIFIED'
  AND di."clinicId" IS NOT NULL
  AND dc.id IS NULL;

-- Now create the missing clinic_doctors entries
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
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
LEFT JOIN doctor_invitations di ON dp."invitationId" = di.id
LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
WHERE u.role = 'DOCTOR' 
  AND u."approvalStatus" = 'VERIFIED'
  AND di."clinicId" IS NOT NULL
  AND dc.id IS NULL
ON CONFLICT ("doctorId", "clinicId") DO NOTHING;

-- Verify the fix
SELECT 
  COUNT(*) as fixed_count,
  STRING_AGG(DISTINCT u.name, ', ') as fixed_doctors
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
JOIN doctor_invitations di ON dp."invitationId" = di.id
JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
WHERE u.role = 'DOCTOR' 
  AND u."approvalStatus" = 'VERIFIED'
  AND dc."createdAt" > NOW() - INTERVAL '1 minute';
