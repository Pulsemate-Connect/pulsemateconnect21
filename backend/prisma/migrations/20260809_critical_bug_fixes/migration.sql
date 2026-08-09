-- ============================================================================
-- CRITICAL BUG FIXES - Database Migrations
-- Date: 2026-08-09
-- Description: Fixes for duplicate bookings, session validation, free booking
--              exploit, and queue number collision
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- BUG #1: DUPLICATE SLOT BOOKING PREVENTION
-- ────────────────────────────────────────────────────────────────────────────
-- Add partial unique index to prevent duplicate active bookings for same slot
-- Only applies to non-cancelled, non-no-show, non-pending-payment appointments
--
-- This prevents: Patient A books 09:30, Patient B also books 09:30 ❌
-- Expected: Only ONE confirmed appointment per doctor+clinic+date+slot ✅

CREATE UNIQUE INDEX idx_unique_active_appointment_slot 
ON appointments (
  "doctorId", 
  "clinicId", 
  DATE("appointmentDate" AT TIME ZONE 'UTC'), 
  "slotTime"
) 
WHERE status NOT IN ('CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT');

-- Index to improve lookup performance
CREATE INDEX idx_appointment_slot_lookup 
ON appointments ("doctorId", "clinicId", "appointmentDate", "slotTime", status);


-- ────────────────────────────────────────────────────────────────────────────
-- BUG #4: QUEUE NUMBER COLLISION PREVENTION
-- ────────────────────────────────────────────────────────────────────────────
-- Add unique constraint on queue_id + queue_number
-- Prevents: Patient A = #5, Patient B = #5 ❌
-- Expected: Unique queue numbers within each queue ✅

CREATE UNIQUE INDEX idx_unique_queue_number 
ON queue_items ("queueId", "queueNumber");

-- Index to improve queue item lookups
CREATE INDEX idx_queue_item_status_position 
ON queue_items ("queueId", status, position);


-- ────────────────────────────────────────────────────────────────────────────
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ────────────────────────────────────────────────────────────────────────────

-- Index for free booking eligibility checks
CREATE INDEX idx_user_free_booking 
ON users (id, "freeBookingUsed") 
WHERE "freeBookingUsed" = false;

-- Index for session validation queries
CREATE INDEX idx_clinic_session_lookup 
ON clinic_sessions (id, "clinicId", enabled, "startTime", "endTime");

-- Index for doctor availability queries
CREATE INDEX idx_doctor_availability_lookup 
ON doctor_availability ("doctorId", "clinicId", "dayOfWeek", "isActive");


-- ────────────────────────────────────────────────────────────────────────────
-- DATA INTEGRITY CHECKS (RUN AFTER DEPLOYMENT)
-- ────────────────────────────────────────────────────────────────────────────

-- Check for existing duplicate slots (should be 0 after cleanup)
-- SELECT doctor_id, clinic_id, appointment_date, slot_time, COUNT(*) as count
-- FROM appointments
-- WHERE status NOT IN ('CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT')
--   AND slot_time IS NOT NULL
-- GROUP BY doctor_id, clinic_id, appointment_date, slot_time
-- HAVING COUNT(*) > 1;

-- Check for existing duplicate queue numbers (should be 0 after cleanup)
-- SELECT queue_id, queue_number, COUNT(*) as count
-- FROM queue_items
-- GROUP BY queue_id, queue_number
-- HAVING COUNT(*) > 1;

