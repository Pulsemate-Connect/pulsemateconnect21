-- Check Patient Role Assignment
-- This script verifies that all users with patient profiles have role='PATIENT'

-- 1. Check all users with patient profiles
SELECT 
  u.id,
  u.name,
  u.mobile,
  u.role,
  u."approvalStatus",
  u."isActive",
  u."authProvider",
  u."createdAt",
  pp.id as "patientProfileId",
  pp."patientName"
FROM "User" u
LEFT JOIN "PatientProfile" pp ON pp."userId" = u.id
WHERE pp.id IS NOT NULL
ORDER BY u."createdAt" DESC;

-- 2. Find users with patient profiles but wrong role (should be empty!)
SELECT 
  u.id,
  u.name,
  u.mobile,
  u.role as "currentRole",
  '❌ WRONG ROLE' as "status"
FROM "User" u
INNER JOIN "PatientProfile" pp ON pp."userId" = u.id
WHERE u.role != 'PATIENT';

-- 3. Count by role
SELECT 
  u.role,
  COUNT(*) as "userCount",
  COUNT(pp.id) as "withPatientProfile"
FROM "User" u
LEFT JOIN "PatientProfile" pp ON pp."userId" = u.id
GROUP BY u.role
ORDER BY "userCount" DESC;

-- 4. Recent registrations (last 7 days)
SELECT 
  u.id,
  u.name,
  u.mobile,
  u.role,
  u."approvalStatus",
  u."authProvider",
  u."createdAt"
FROM "User" u
INNER JOIN "PatientProfile" pp ON pp."userId" = u.id
WHERE u."createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY u."createdAt" DESC;

-- 5. FIX SCRIPT (run only if query #2 shows wrong roles)
-- Uncomment the following lines to fix users with wrong roles:
/*
UPDATE "User" 
SET role = 'PATIENT'
WHERE id IN (
  SELECT u.id 
  FROM "User" u
  INNER JOIN "PatientProfile" pp ON pp."userId" = u.id
  WHERE u.role != 'PATIENT'
);
*/
