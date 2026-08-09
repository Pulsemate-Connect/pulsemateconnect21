-- Add grace period logout support
-- This allows users to re-login without OTP within 7 days of logout

-- Add softLogoutAt field to track when user "soft logged out"
ALTER TABLE "refresh_tokens" 
ADD COLUMN "softLogoutAt" TIMESTAMP;

-- Add index for efficient queries
CREATE INDEX "idx_refresh_tokens_soft_logout" ON "refresh_tokens"("softLogoutAt");

-- Comments:
-- softLogoutAt: When user clicked logout (but token still valid for grace period)
-- If set AND < 7 days ago: User can re-login without OTP
-- If set AND > 7 days ago: User needs OTP to login
