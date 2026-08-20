-- ── Free Booking Benefit ─────────────────────────────────────────────────────
-- Every patient gets their first booking free (platform booking fee waived).
-- We track this at the User level for simplicity and performance.
-- freeBookingUsed: once set to true it is NEVER reset (even on cancellation).
-- freeBookingUsedAt: timestamp when the benefit was consumed.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "freeBookingUsed"   BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "freeBookingUsedAt"  TIMESTAMP(3);

-- Index for admin analytics queries (count how many users have consumed their free booking)
CREATE INDEX IF NOT EXISTS "users_freeBookingUsed_idx"
  ON "users"("freeBookingUsed");
