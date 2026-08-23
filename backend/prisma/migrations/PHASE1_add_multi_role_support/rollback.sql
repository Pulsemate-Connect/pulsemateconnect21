-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 1 ROLLBACK: Remove Multi-Role Support
-- ══════════════════════════════════════════════════════════════════════════════
-- Description: Rollback Phase 1 changes if needed
-- WARNING: This will remove role_approval_status table and multi-role columns
-- Data in role_approval_status will be lost
-- The original 'role' column is preserved, so user data is safe
-- ══════════════════════════════════════════════════════════════════════════════

-- Step 1: Drop helper functions
DROP FUNCTION IF EXISTS user_has_role(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_approved_roles(TEXT);

-- Step 2: Drop role_approval_status table
DROP TABLE IF EXISTS "role_approval_status";

-- Step 3: Remove new columns from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "roles";
ALTER TABLE "users" DROP COLUMN IF EXISTS "primaryRole";

-- Step 4: Remove comments from legacy columns
COMMENT ON COLUMN "users"."role" IS NULL;
COMMENT ON COLUMN "users"."approvalStatus" IS NULL;

-- Rollback complete - system reverted to single-role architecture
-- ══════════════════════════════════════════════════════════════════════════════
