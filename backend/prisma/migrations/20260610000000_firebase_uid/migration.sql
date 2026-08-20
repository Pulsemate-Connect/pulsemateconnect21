-- AddColumn: firebaseUid (optional, unique) on users table
-- AddColumn: authProvider (optional string) on users table
-- These fields support Firebase Phone Auth for patient login.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firebaseUid" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "authProvider" TEXT;

-- Create unique index on firebaseUid (only on non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS "users_firebaseUid_key" ON "users"("firebaseUid") WHERE "firebaseUid" IS NOT NULL;
