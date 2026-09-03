-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK M3: REMOVE CRITICAL INDEXES
-- ═══════════════════════════════════════════════════════════════════════════
-- Use this if M3 needs to be rolled back
-- SAFE: Only drops indexes, does not affect data
-- ═══════════════════════════════════════════════════════════════════════════

-- Appointments indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_appointments_status_date";
DROP INDEX CONCURRENTLY IF EXISTS "idx_appointments_doctor_id";
DROP INDEX CONCURRENTLY IF EXISTS "idx_appointments_clinic_id";
DROP INDEX CONCURRENTLY IF EXISTS "idx_appointments_clinic_date";
DROP INDEX CONCURRENTLY IF EXISTS "idx_appointments_doctor_date";

-- Queue items indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_queue_items_clinic_doctor_date_status";
DROP INDEX CONCURRENTLY IF EXISTS "idx_queue_items_queue_date";

-- Payments indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_payments_status";
DROP INDEX CONCURRENTLY IF EXISTS "idx_payments_razorpay_order_id";
DROP INDEX CONCURRENTLY IF EXISTS "idx_payments_patient_created";

-- Clinics indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_clinics_is_verified";
DROP INDEX CONCURRENTLY IF EXISTS "idx_clinics_is_active";

-- Doctor profiles indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_doctor_profiles_verification_status";

-- User notifications indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_user_notifications_user_read";
DROP INDEX CONCURRENTLY IF EXISTS "idx_user_notifications_type";

-- Audit logs indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_entity_type_id";
DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_logs_timestamp";

-- Sessions indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_sessions_expires_at";

-- Refresh tokens indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_refresh_tokens_expires_at";
DROP INDEX CONCURRENTLY IF EXISTS "idx_refresh_tokens_user_is_revoked";

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ M3 ROLLBACK COMPLETE: Critical indexes removed';
  RAISE NOTICE '';
END $$;
