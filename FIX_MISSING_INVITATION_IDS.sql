-- ============================================================================
-- FIX MISSING INVITATION IDs IN DOCTOR PROFILES
-- ============================================================================
-- This script links doctor profiles to their invitations if the invitationId is missing

-- First, see which profiles are missing invitationId
SELECT 
  dp.id as profile_id,
  u.id as user_id,
  u.name,
  dp."invitationId" as current_invitation_id,
  di.id as found_invitation_id,
  di."clinicId",
  c.name as clinic_name
FROM doctor_profiles dp
JOIN users u ON dp."userId" = u.id
LEFT JOIN doctor_invitations di ON di."doctorUserId" = u.id
LEFT JOIN clinics c ON di."clinicId" = c.id
WHERE dp."invitationId" IS NULL
  AND di.id IS NOT NULL
ORDER BY dp."createdAt" DESC;

-- Update doctor profiles to link them to their invitations
UPDATE doctor_profiles dp
SET "invitationId" = di.id
FROM users u
JOIN doctor_invitations di ON di."doctorUserId" = u.id
WHERE dp."userId" = u.id
  AND dp."invitationId" IS NULL
  AND di.id IS NOT NULL
  AND NOT EXISTS (
    -- Make sure this invitation isn't already linked to another profile
    SELECT 1 FROM doctor_profiles dp2 
    WHERE dp2."invitationId" = di.id AND dp2.id != dp.id
  );

-- Verify the update
SELECT 
  COUNT(*) as profiles_fixed,
  STRING_AGG(DISTINCT u.name, ', ') as fixed_doctor_names
FROM doctor_profiles dp
JOIN users u ON dp."userId" = u.id
JOIN doctor_invitations di ON dp."invitationId" = di.id
WHERE dp."updatedAt" > NOW() - INTERVAL '1 minute';
