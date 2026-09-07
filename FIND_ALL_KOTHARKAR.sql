-- Find ALL records with kotharkar276@gmail.com email
SELECT 
  id,
  name,
  email,
  mobile,
  "isPhoneVerified",
  "approvalStatus",
  "createdAt",
  "updatedAt"
FROM users
WHERE email LIKE '%kotharkar276%'
ORDER BY "createdAt" DESC;

-- Also check by name
SELECT 
  id,
  name,
  email,
  mobile,
  "approvalStatus",
  "createdAt"
FROM users
WHERE name LIKE '%Nk%' OR name LIKE '%ankd%'
ORDER BY "createdAt" DESC;

-- Check all CLINIC_OWNER to see the pattern
SELECT 
  id,
  name,
  email,
  mobile,
  "approvalStatus",
  "createdAt"
FROM users
WHERE role = 'CLINIC_OWNER'
ORDER BY "createdAt" DESC
LIMIT 10;
