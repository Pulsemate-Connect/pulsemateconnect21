-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 1: Multi-Role Support - Database Schema Changes
-- ══════════════════════════════════════════════════════════════════════════════
-- Description: Add multi-role support while maintaining backward compatibility
-- Date: 2026-08-23
-- Breaking Changes: None (backward compatible)
-- Rollback: See rollback.sql in same directory
-- ══════════════════════════════════════════════════════════════════════════════

-- Step 1: Add new multi-role columns to users table
-- These columns work alongside the existing 'role' column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roles" TEXT[] DEFAULT ARRAY['PATIENT']::TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "primaryRole" TEXT DEFAULT 'PATIENT';

-- Step 2: Create role_approval_status table
CREATE TABLE IF NOT EXISTS "role_approval_status" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "requestData" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT "role_approval_status_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Unique constraint: one approval record per user per role
    CONSTRAINT "unique_user_role" UNIQUE ("userId", "role")
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS "role_approval_status_userId_idx" ON "role_approval_status"("userId");
CREATE INDEX IF NOT EXISTS "role_approval_status_role_idx" ON "role_approval_status"("role");
CREATE INDEX IF NOT EXISTS "role_approval_status_approvalStatus_idx" ON "role_approval_status"("approvalStatus");
CREATE INDEX IF NOT EXISTS "role_approval_status_role_approvalStatus_idx" ON "role_approval_status"("role", "approvalStatus");
CREATE INDEX IF NOT EXISTS "role_approval_status_requestedAt_idx" ON "role_approval_status"("requestedAt");

-- Step 4: Migrate existing data
-- Copy current role to roles array and primaryRole
UPDATE "users" 
SET 
    "roles" = ARRAY["role"::TEXT],
    "primaryRole" = "role"
WHERE "roles" IS NULL OR "primaryRole" IS NULL;

-- Step 5: Create role approval records for existing users
-- All existing users have their current role auto-approved
INSERT INTO "role_approval_status" ("userId", "role", "approvalStatus", "requestedAt", "approvedAt", "approvedBy")
SELECT 
    id,
    "role",
    "approvalStatus",
    "createdAt",
    CASE 
        WHEN "approvalStatus" IN ('VERIFIED', 'APPROVED') THEN "createdAt"
        ELSE NULL
    END,
    NULL  -- No approvedBy for migrated users
FROM "users"
ON CONFLICT ("userId", "role") DO NOTHING;

-- Step 6: Add comment to deprecated column
COMMENT ON COLUMN "users"."role" IS 'DEPRECATED: Legacy single role field. Use roles[] and primaryRole instead. Will be removed in Phase 3.';
COMMENT ON COLUMN "users"."approvalStatus" IS 'DEPRECATED: Legacy approval status. Use role_approval_status table instead. Will be removed in Phase 3.';

-- Step 7: Create helper function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(user_id TEXT, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "users"
        WHERE "id" = user_id
        AND check_role = ANY("roles")
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 8: Create helper function to get user's approved roles
CREATE OR REPLACE FUNCTION get_approved_roles(user_id TEXT)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT "role"
        FROM "role_approval_status"
        WHERE "userId" = user_id
        AND "approvalStatus" IN ('VERIFIED', 'APPROVED')
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Migration complete
-- ══════════════════════════════════════════════════════════════════════════════
-- Verification queries (run these to verify migration):
-- SELECT id, mobile, role, roles, "primaryRole" FROM users LIMIT 10;
-- SELECT * FROM role_approval_status LIMIT 10;
-- SELECT user_has_role('user-id-here', 'CLINIC_OWNER');
-- SELECT get_approved_roles('user-id-here');
-- ══════════════════════════════════════════════════════════════════════════════
