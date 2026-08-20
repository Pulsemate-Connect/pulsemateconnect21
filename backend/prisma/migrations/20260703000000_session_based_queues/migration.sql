-- Add sessionId to queues table for per-session queue separation
ALTER TABLE "queues" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;

-- Add sessionId to appointments table
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;

-- Drop old unique constraint (clinicId, doctorId, date)
ALTER TABLE "queues" DROP CONSTRAINT IF EXISTS "queues_clinicId_doctorId_date_key";

-- Add new unique constraint including sessionId (NULL-safe: use coalesce trick via partial index)
-- Since sessionId can be NULL (legacy rows), we create a unique index that treats NULL as unique
CREATE UNIQUE INDEX IF NOT EXISTS "queues_clinicId_doctorId_date_sessionId_key"
  ON "queues" ("clinicId", "doctorId", "date", "sessionId")
  WHERE "sessionId" IS NOT NULL;

-- Keep the old constraint for NULL sessionId rows (backwards compatibility)
CREATE UNIQUE INDEX IF NOT EXISTS "queues_clinicId_doctorId_date_null_session_key"
  ON "queues" ("clinicId", "doctorId", "date")
  WHERE "sessionId" IS NULL;

-- Add FK index for sessionId on queues
CREATE INDEX IF NOT EXISTS "queues_sessionId_idx" ON "queues" ("sessionId");

-- Add FK index for sessionId on appointments
CREATE INDEX IF NOT EXISTS "appointments_sessionId_idx" ON "appointments" ("sessionId");
