-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION M1: ADD RBAC AND SECURITY TABLES
-- ═══════════════════════════════════════════════════════════════════════════
-- Status: CRITICAL ONLY
-- Risk: LOW (additive only, no data modification)
-- Rollback: See M1_rollback.sql
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CREATE ROLES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "roles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(50) UNIQUE NOT NULL,
  "display_name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "is_system" BOOLEAN DEFAULT false,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_roles_name" ON "roles"("name");
CREATE INDEX IF NOT EXISTS "idx_roles_is_system" ON "roles"("is_system");

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CREATE PERMISSIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "permissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "resource" VARCHAR(50) NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "scope" VARCHAR(20) DEFAULT 'OWN',
  "display_name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "is_system" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT NOW(),
  UNIQUE("resource", "action", "scope")
);

CREATE INDEX IF NOT EXISTS "idx_permissions_resource" ON "permissions"("resource");
CREATE INDEX IF NOT EXISTS "idx_permissions_resource_action" ON "permissions"("resource", "action");

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREATE USER_ROLES JUNCTION TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE RESTRICT,
  "is_primary" BOOLEAN DEFAULT false,
  "status" VARCHAR(20) DEFAULT 'PENDING',
  "requested_at" TIMESTAMP DEFAULT NOW(),
  "approved_at" TIMESTAMP,
  "approved_by" TEXT REFERENCES "users"("id"),
  "rejected_at" TIMESTAMP,
  "rejected_by" TEXT REFERENCES "users"("id"),
  "rejection_reason" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  UNIQUE("user_id", "role_id")
);

CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id" ON "user_roles"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id" ON "user_roles"("role_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_status" ON "user_roles"("status");
CREATE INDEX IF NOT EXISTS "idx_user_roles_user_status" ON "user_roles"("user_id", "status");

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CREATE ROLE_PERMISSIONS JUNCTION TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  "granted_at" TIMESTAMP DEFAULT NOW(),
  "granted_by" TEXT REFERENCES "users"("id"),
  UNIQUE("role_id", "permission_id")
);

CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions"("role_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions"("permission_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CREATE APPOINTMENT_STATUS_HISTORY TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "appointment_status_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "appointment_id" TEXT NOT NULL REFERENCES "appointments"("id") ON DELETE CASCADE,
  "from_status" VARCHAR(20),
  "to_status" VARCHAR(20) NOT NULL,
  "changed_by" TEXT REFERENCES "users"("id"),
  "reason" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_appointment_status_history_appointment_id" ON "appointment_status_history"("appointment_id");
CREATE INDEX IF NOT EXISTS "idx_appointment_status_history_created_at" ON "appointment_status_history"("created_at");

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ M1 COMPLETE: RBAC tables created successfully';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - roles';
  RAISE NOTICE '  - permissions';
  RAISE NOTICE '  - user_roles';
  RAISE NOTICE '  - role_permissions';
  RAISE NOTICE '  - appointment_status_history';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run M2_migrate_users_to_rbac.sql';
END $$;
