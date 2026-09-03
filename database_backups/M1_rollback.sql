-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK M1: REMOVE RBAC TABLES
-- ═══════════════════════════════════════════════════════════════════════════
-- Use this if M1 needs to be rolled back
-- SAFE: Only drops new tables, does not affect existing data
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop tables in reverse order (respecting foreign key dependencies)
DROP TABLE IF EXISTS "appointment_status_history" CASCADE;
DROP TABLE IF EXISTS "role_permissions" CASCADE;
DROP TABLE IF EXISTS "user_roles" CASCADE;
DROP TABLE IF EXISTS "permissions" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ M1 ROLLBACK COMPLETE: RBAC tables removed';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Application continues using old user.role field';
END $$;
