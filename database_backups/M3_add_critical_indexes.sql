-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION M3: ADD CRITICAL PERFORMANCE INDEXES
-- ═══════════════════════════════════════════════════════════════════════════
-- Status: CRITICAL ONLY
-- Risk: LOW (only adding indexes, no data changes)
-- Rollback: Drop indexes (see M3_rollback.sql)
-- Performance Impact: Minimal (using CONCURRENTLY where possible)
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: CONCURRENTLY cannot be used inside a transaction block
-- We'll create indexes one by one outside transactions

-- ─────────────────────────────────────────────────────────────────────────────
-- APPOINTMENTS TABLE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Critical: Composite index for appointment queries by status and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_appointments_status_date" 
  ON "appointments"("status", "appointmentDate");

-- Critical: Index for doctor's appointments
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_appointments_doctor_id" 
  ON "appointments"("doctorId");

-- Critical: Index for clinic's appointments
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_appointments_clinic_id" 
  ON "appointments"("clinicId");

-- Critical: Composite for clinic + date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_appointments_clinic_date" 
  ON "appointments"("clinicId", "appointmentDate");

-- Critical: Composite for doctor + date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_appointments_doctor_date" 
  ON "appointments"("doctorId", "appointmentDate");

-- ─────────────────────────────────────────────────────────────────────────────
-- QUEUE_ITEMS TABLE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Critical: Composite index for active queue queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_queue_items_clinic_doctor_date_status" 
  ON "queue_items"("clinicId", "doctorId", "queueDate", "status");

-- Critical: Index for queue date lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_queue_items_queue_date" 
  ON "queue_items"("queueDate");

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYMENTS TABLE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Critical: Index for payment status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_status" 
  ON "payments"("status");

-- Critical: Index for Razorpay order ID lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_razorpay_order_id" 
  ON "payments"("razorpayOrderId") WHERE "razorpayOrderId" IS NOT NULL;

-- Critical: Composite for patient payment history
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_patient_created" 
  ON "payments"("patientId", "createdAt" DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- CLINICS TABLE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Critical: Index for clinic verification status
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_clinics_is_verified" 
  ON "clinics"("isVerified");

-- Critical: Index for active clinics
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_clinics_is_active" 
  ON "clinics"("isActive");

-- ─────────────────────────────────────────────────────────────────────────────
-- DOCTOR_PROFILES TABLE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Critical: Index for doctor verification status
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_doctor_profiles_verification_status" 
  ON "doctor_profiles"("verificationStatus");

-- ─────────────────────────────────────────────────────────────────────────────
-- USER_NOTIFICATIONS TABLE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Critical: Index for unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_notifications_user_read" 
  ON "user_notifications"("userId", "isRead") WHERE "isRead" = false;

-- Critical: Index for notification type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_notifications_type" 
  ON "user_notifications"("type");

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT_LOGS TABLE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Critical: Index for audit log queries by entity
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_entity_type_id" 
  ON "audit_logs"("entityType", "entityId");

-- Critical: Index for audit log queries by timestamp
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_timestamp" 
  ON "audit_logs"("timestamp" DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SESSIONS TABLE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Critical: Index for active session validation
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_sessions_expires_at" 
  ON "sessions"("expiresAt") WHERE "expiresAt" > NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- REFRESH_TOKENS TABLE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Critical: Index for token validation
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_refresh_tokens_expires_at" 
  ON "refresh_tokens"("expiresAt") WHERE "expiresAt" > NOW();

-- Critical: Index for user's active tokens
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_refresh_tokens_user_is_revoked" 
  ON "refresh_tokens"("userId", "isRevoked") WHERE "isRevoked" = false;

-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATE TABLE STATISTICS
-- ═══════════════════════════════════════════════════════════════════════════
ANALYZE appointments;
ANALYZE queue_items;
ANALYZE payments;
ANALYZE clinics;
ANALYZE doctor_profiles;
ANALYZE user_notifications;
ANALYZE audit_logs;
ANALYZE sessions;
ANALYZE refresh_tokens;
ANALYZE users;
ANALYZE user_roles;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ M3 MIGRATION COMPLETE: CRITICAL INDEXES ADDED';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Total indexes in public schema: %', index_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Critical indexes added for:';
  RAISE NOTICE '  • Appointments (status, date, clinic, doctor)';
  RAISE NOTICE '  • Queue items (clinic, doctor, date, status)';
  RAISE NOTICE '  • Payments (status, Razorpay ID, patient)';
  RAISE NOTICE '  • Clinics (verification, active status)';
  RAISE NOTICE '  • Doctor profiles (verification status)';
  RAISE NOTICE '  • User notifications (unread, type)';
  RAISE NOTICE '  • Audit logs (entity, timestamp)';
  RAISE NOTICE '  • Sessions & refresh tokens (expiration)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Table statistics updated';
  RAISE NOTICE '';
END $$;
