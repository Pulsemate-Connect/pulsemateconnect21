# Quick Migration - Run This SQL in Supabase

## The Problem
Your local machine cannot reach the Supabase database directly due to DNS/network issues. This is common and easily solved.

## The Solution
Run the SQL directly in Supabase's SQL Editor (web interface).

---

## Step 1: Open Supabase SQL Editor

Visit: **https://supabase.com/dashboard/project/czpalrflesdhxfreyaqo/sql/new**

Or:
1. Go to https://supabase.com/dashboard
2. Click your project: **czpalrflesdhxfreyaqo**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

---

## Step 2: First Check if Migration Already Exists

**Before running the migration SQL, check if it's already applied:**

```sql
-- Check if the new columns already exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND column_name IN ('sessionTokenHash', 'lastActivityAt', 'revokedAt', 'loginMethod')
ORDER BY column_name;
```

**If you see all 4 columns listed**, the migration is already applied! Skip to Step 4.

**If you see 0 rows or fewer than 4 columns**, continue to Step 3 to run the migration.

---

## Step 3: Run This SQL (Only if Step 2 shows missing columns)

Copy and run this in Supabase SQL Editor:

```sql
-- =====================================================================
-- PRODUCTION AUTHENTICATION SESSION MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================================

-- Add new session token hash column
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
UPDATE "sessions" 
SET "sessionTokenHash" = "refreshTokenHash",
    "lastActivityAt" = "lastUsedAt"
WHERE "sessionTokenHash" IS NULL AND "refreshTokenHash" IS NOT NULL;

-- Make sessionTokenHash NOT NULL after backfill (only if there are no rows with NULL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "sessions" WHERE "sessionTokenHash" IS NULL) THEN
    ALTER TABLE "sessions" ALTER COLUMN "sessionTokenHash" SET NOT NULL;
  END IF;
END $$;
```

**Click "Run" or press Ctrl+Enter**

You should see: **Success. No rows returned**

---

## Step 4: Tell Prisma the Migration is Applied

Back in your terminal, run:

```bash
cd backend
npx prisma migrate resolve --applied 20260906_add_production_session_fields
```

This marks the migration as complete in Prisma's records.

---

## Step 4: Tell Prisma the Migration is Applied

```bash
cd backend
npx prisma migrate status
```

You should see: **"Database schema is up to date!"**

---

## Step 5: Verify Migration Success

```bash
cd backend
npx prisma migrate status
```

You should see: **"Database schema is up to date!"**

---

## Troubleshooting

### If Step 2 shows columns already exist

Great! The schema already has the fields. This can happen if:
- A previous migration already added them
- The database was created with a newer schema

Just proceed to Step 4 to mark the migration as applied.

### If you see "relation 'sessions' does not exist"

Your table might be named differently. Check the table name:

```sql
-- Run this first to see your table names
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

If you see `sessions` (lowercase) instead of `Session`, that's correct - use `"sessions"` in the SQL (as shown above).

If no session table exists at all, you need to run all Prisma migrations:
```bash
cd backend
npx prisma db push --accept-data-loss
```
(This will create all tables from scratch)

### If you see "column already exists"

The migration is idempotent (safe to re-run). This message is fine. Just continue to Step 3.

### If you see permission errors

Make sure you're logged into Supabase with the correct account that owns this project.

---

## What This Migration Does

Adds these new columns to your Session table:

- ✅ `sessionTokenHash` - Hashed session token for cookie authentication
- ✅ `revokedAt` - Timestamp when session was revoked (for logout)
- ✅ `revokedReason` - Why session was revoked
- ✅ `lastActivityAt` - Last activity for idle timeout tracking
- ✅ `maxIdleMinutes` - Session idle timeout (default 7 days)
- ✅ `loginMethod` - How user logged in (PASSWORD, FIREBASE_PHONE, etc.)

Plus indexes for performance.

---

## After Migration is Complete

Your production authentication system is ready! 🎉

Next steps:
1. ✅ Test login (cookie will be set)
2. ✅ Test hard refresh (session persists)
3. ✅ Test logout (session revoked immediately)

See: `PRODUCTION_AUTH_TESTING_GUIDE.md` for comprehensive testing.

---

**Need Help?**

If you encounter any issues:
1. Check the Supabase SQL Editor for error messages
2. Take a screenshot and review the error
3. The SQL is safe to re-run multiple times (uses IF NOT EXISTS)
