-- Check for approved doctors who are missing clinic_doctors entries
SELECT 
  u.id as user_id,
  u.name,
  u."approvalStatus",
  dp.id as profile_id,
  dp."invitationId",
  di."clinicId",
  di.status as invitation_status,
  dc.id as clinic_doctor_id,
  CASE 
    WHEN dc.id IS NULL AND di."clinicId" IS NOT NULL THEN 'MISSING_LINK'
    WHEN dc.id IS NOT NULL THEN 'LINKED'
    ELSE 'NO_INVITATION'
  END as link_status
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
LEFT JOIN doctor_invitations di ON dp."invitationId" = di.id
LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
WHERE u.role = 'DOCTOR' AND u."approvalStatus" = 'VERIFIED'
ORDER BY u."createdAt" DESC;
