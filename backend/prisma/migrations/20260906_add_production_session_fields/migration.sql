-- =====================================================================
-- PRODUCTION AUTHENTICATION SESSION MIGRATION
-- =====================================================================
-- This migration enhances the Session model for production-grade
-- cookie-based authentication with proper session management
-- =====================================================================

-- Add new session token hash column (will replace refreshTokenHash as primary auth)
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "sessionTokenHash" TEXT;

-- Make refreshTokenHash nullable (for backward compatibility)
ALTER TABLE "sessions" ALTER COLUMN "refreshTokenHash" DROP NOT NULL;

-- Add session lifecycle and security columns
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "maxIdleMinutes" INTEGER DEFAULT 10080;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "loginMethod" TEXT;

-- Create unique index on sessionTokenHash
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_sessionTokenHash_key" ON "sessions"("sessionTokenHash");

-- Create index on expiresAt for cleanup queries
CREATE INDEX IF NOT EXISTS "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- Create index on lastActivityAt for idle timeout checks
CREATE INDEX IF NOT EXISTS "sessions_lastActivityAt_idx" ON "sessions"("lastActivityAt");

-- Update existing sessions to have sessionTokenHash (copy from refreshTokenHash temporarily)
-- This ensures backward compatibility during migration
UPDATE "sessions" 
SET "sessionTokenHash" = "refreshTokenHash",
    "lastActivityAt" = "lastUsedAt"
WHERE "sessionTokenHash" IS NULL;

-- Make sessionTokenHash NOT NULL after backfill
ALTER TABLE "sessions" ALTER COLUMN "sessionTokenHash" SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN "sessions"."sessionTokenHash" IS 'Hashed session token for cookie-based authentication';
COMMENT ON COLUMN "sessions"."lastActivityAt" IS 'Last activity timestamp for idle timeout tracking';
COMMENT ON COLUMN "sessions"."maxIdleMinutes" IS 'Maximum idle time in minutes before session expires (default 7 days)';
COMMENT ON COLUMN "sessions"."loginMethod" IS 'Authentication method used: PASSWORD, FIREBASE_PHONE, OTP, etc.';
