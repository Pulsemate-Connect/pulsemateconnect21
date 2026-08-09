-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- Then click "Run" button

-- Step 1: Drop the old table with wrong column names
DROP TABLE IF EXISTS otp_attempts CASCADE;

-- Step 2: Create table with correct Prisma camelCase column names
CREATE TABLE otp_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "mobileNumber" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'MESSAGE_CENTRAL',
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create performance indexes
CREATE INDEX idx_otp_attempts_mobile_created 
ON otp_attempts("mobileNumber", "createdAt");

CREATE INDEX idx_otp_attempts_verification_id 
ON otp_attempts("verificationId");

-- Done! Table is now ready for Message Central OTP
