-- ═══════════════════════════════════════════════════════════════════════════
-- DELETE DRAFT CLINIC_OWNER USER
-- ═══════════════════════════════════════════════════════════════════════════
-- This will delete the user: infopulsemateconnect@gmail.com (mobile: 9999999999)
-- Status: DRAFT CLINIC_OWNER
-- 
-- ⚠️ SAFETY: This will NOT delete the SUPER_ADMIN (Sahil Naik)
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: View the user to be deleted (VERIFY FIRST!)
SELECT 
  id,
  name,
  mobile,
  email,
  role,
  "approvalStatus",
  "isActive"
FROM users
WHERE 
  email = 'infopulsemateconnect@gmail.com'
  AND mobile = '9999999999'
  AND role = 'CLINIC_OWNER'
  AND "approvalStatus" = 'DRAFT';

-- Expected result: 1 user with email infopulsemateconnect@gmail.com

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 2: DELETE RELATED DATA FIRST (CASCADE)
-- ═══════════════════════════════════════════════════════════════════════════

-- Delete clinic owner profile
DELETE FROM clinic_owner_profiles 
WHERE "userId" IN (
  SELECT id FROM users 
  WHERE email = 'infopulsemateconnect@gmail.com' 
    AND mobile = '9999999999'
    AND role = 'CLINIC_OWNER'
    AND "approvalStatus" = 'DRAFT'
);

-- Delete any sessions
DELETE FROM sessions 
WHERE "userId" IN (
  SELECT id FROM users 
  WHERE email = 'infopulsemateconnect@gmail.com' 
    AND mobile = '9999999999'
    AND role = 'CLINIC_OWNER'
    AND "approvalStatus" = 'DRAFT'
);

-- Delete any refresh tokens
DELETE FROM refresh_tokens 
WHERE "userId" IN (
  SELECT id FROM users 
  WHERE email = 'infopulsemateconnect@gmail.com' 
    AND mobile = '9999999999'
    AND role = 'CLINIC_OWNER'
    AND "approvalStatus" = 'DRAFT'
);

-- Delete any FCM tokens
DELETE FROM fcm_tokens 
WHERE "userId" IN (
  SELECT id FROM users 
  WHERE email = 'infopulsemateconnect@gmail.com' 
    AND mobile = '9999999999'
    AND role = 'CLINIC_OWNER'
    AND "approvalStatus" = 'DRAFT'
);

-- Delete any owned clinics (if any)
DELETE FROM clinics 
WHERE "ownerId" IN (
  SELECT id FROM users 
  WHERE email = 'infopulsemateconnect@gmail.com' 
    AND mobile = '9999999999'
    AND role = 'CLINIC_OWNER'
    AND "approvalStatus" = 'DRAFT'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 3: DELETE THE USER
-- ═══════════════════════════════════════════════════════════════════════════

DELETE FROM users 
WHERE 
  email = 'infopulsemateconnect@gmail.com'
  AND mobile = '9999999999'
  AND role = 'CLINIC_OWNER'
  AND "approvalStatus" = 'DRAFT';

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 4: VERIFY DELETION
-- ═══════════════════════════════════════════════════════════════════════════

-- Should return 0 rows
SELECT COUNT(*) as deleted_user_count
FROM users
WHERE 
  email = 'infopulsemateconnect@gmail.com'
  AND mobile = '9999999999';

-- Verify SUPER_ADMIN still exists (should return 1 row)
SELECT 
  id,
  name,
  mobile,
  email,
  role,
  "approvalStatus"
FROM users
WHERE 
  email = 'sahilnaik1515@gmail.com'
  AND role = 'SUPER_ADMIN';

-- View all remaining users
SELECT 
  id,
  name,
  mobile,
  email,
  role,
  "approvalStatus",
  "isActive"
FROM users
ORDER BY "createdAt" DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ EXPECTED RESULT:
-- - infopulsemateconnect@gmail.com user DELETED
-- - Sahil Naik (SUPER_ADMIN) still exists
-- - No orphaned data
-- ═══════════════════════════════════════════════════════════════════════════
