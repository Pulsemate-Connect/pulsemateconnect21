-- Add deletionRequestedAt to users for soft-delete / scheduled purge
ALTER TABLE "users" ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);

-- Index for efficient cron job queries
CREATE INDEX "users_deletionRequestedAt_idx" ON "users"("deletionRequestedAt");
