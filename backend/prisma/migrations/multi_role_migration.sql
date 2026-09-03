-- ============================================================================
-- PULSEMATE MULTI-ROLE MIGRATION
-- Date: 2026-08-30
-- Description: Migrate existing single-role users to multi-role architecture
-- Status: SAFE - No schema changes, only data population
-- ============================================================================

-- ============================================================================
-- STEP 1: Populate roles array from role field
-- ============================================================================
-- Ensure all users have their current role in the roles array
UPDATE users
SET roles = ARRAY[role]::user_role[]
WHERE roles IS NULL OR array_length(roles, 1) IS NULL OR array_length(roles, 1) = 0;

-- Verify: All users should now have at least one role
-- SELECT COUNT(*) FROM users WHERE roles IS NULL OR array_length(roles, 1) = 0;
-- Expected: 0

-- ============================================================================
-- STEP 2: Populate primaryRole field
-- ============================================================================
-- Set primaryRole to match the current role field
UPDATE users
SET primary_role = role
WHERE primary_role IS NULL;

-- Verify: All users should have a primary role
-- SELECT COUNT(*) FROM users WHERE primary_role IS NULL;
-- Expected: 0

-- ============================================================================
-- STEP 3: Create RoleApprovalStatus records for existing users
-- ============================================================================
-- Create approval status for each user's current role
-- This preserves their existing approval status
INSERT INTO role_approval_status (
  id,
  user_id,
  role,
  approval_status,
  requested_at,
  approved_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  id,
  role,
  approval_status,
  created_at,
  CASE 
    WHEN approval_status = 'VERIFIED' THEN created_at 
    ELSE NULL 
  END,
  created_at,
  updated_at
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM role_approval_status ras
  WHERE ras.user_id = users.id AND ras.role = users.role
);

-- Verify: Each user should have at least one RoleApprovalStatus
-- SELECT 
--   COUNT(DISTINCT u.id) as total_users,
--   COUNT(DISTINCT r.user_id) as users_with_approval
-- FROM users u
-- LEFT JOIN role_approval_status r ON u.id = r.user_id;
-- Expected: total_users = users_with_approval

-- ============================================================================
-- STEP 4: Verification Queries
-- ============================================================================

-- Run these after migration to verify success:

-- 1. Check users without roles array
-- SELECT id, mobile, email, role, roles FROM users 
-- WHERE roles IS NULL OR array_length(roles, 1) = 0;

-- 2. Check users without primaryRole
-- SELECT id, mobile, email, role, primary_role FROM users 
-- WHERE primary_role IS NULL;

-- 3. Check users without RoleApprovalStatus
-- SELECT u.id, u.mobile, u.role, COUNT(r.id) as approval_count
-- FROM users u
-- LEFT JOIN role_approval_status r ON u.id = r.user_id
-- GROUP BY u.id, u.mobile, u.role
-- HAVING COUNT(r.id) = 0;

-- 4. Check role distribution
-- SELECT role, approval_status, COUNT(*) 
-- FROM role_approval_status 
-- GROUP BY role, approval_status 
-- ORDER BY role, approval_status;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ All users have roles array populated
-- ✅ All users have primaryRole set
-- ✅ All users have RoleApprovalStatus record
-- ✅ No data lost
-- ✅ No schema changes
-- ============================================================================
