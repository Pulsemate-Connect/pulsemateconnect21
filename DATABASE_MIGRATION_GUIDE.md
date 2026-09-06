# Database Migration Guide
## Production Authentication Session Schema

**Status**: ⚠️ Database Not Reachable - Manual Migration Required  
**Date**: September 6, 2026

---

## Issue

The automatic migration failed with:
```
Error: P1001: Can't reach database server at `db.czpalrflesdhxfreyaqo.supabase.co:5432`
```

This is typically caused by:
1. **Supabase project paused** (free tier auto-pauses after inactivity)
2. **Network/firewall restrictions**
3. **VPN required for database access**

---

## Solution Options

### Option 1: Wake Up Supabase Project & Retry (RECOMMENDED)

1. **Visit Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/czpalrflesdhxfreyaqo
   ```

2. **Check Project Status**:
   - If paused: The project will automatically wake up when you access it
   - Wait 30-60 seconds for full startup

3. **Retry Migration**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

4. **Verify Success**:
   ```bash
   npx prisma migrate status
   # Should show: Database schema is up to date!
   ```

---

### Option 2: Run via Supabase SQL Editor

If automatic migration continues to fail:

1. **Open SQL Editor**:
   ```
   https://supabase.com/dashboard/project/czpalrflesdhxfreyaqo/sql
   ```

2. **Run Migration SQL**:
   Copy and paste the SQL below (or from the file):
   `backend/prisma/migrations/20260906_add_production_session_fields/migration.sql`

```sql
-- =====================================================================
-- PRODUCTION AUTHENTICATION SESSION MIGRATION
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
WHERE "sessionTokenHash" IS NULL;

-- Make sessionTokenHash NOT NULL after backfill
ALTER TABLE "sessions" ALTER COLUMN "sessionTokenHash" SET NOT NULL;
```

3. **Mark Migration as Applied** (Important!):
   After running the SQL manually, you need to tell Prisma the migration is complete:

   ```bash
   cd backend
   npx prisma migrate resolve --applied 20260906_add_production_session_fields
   ```

4. **Verify**:
   ```bash
   npx prisma migrate status
   # Should show: Database schema is up to date!
   ```

---

### Option 3: Alternative Database Access

If you have database access from another location:

1. **From Production Server** (if deployed):
   ```bash
   ssh user@your-server
   cd /path/to/backend
   npx prisma migrate deploy
   ```

2. **Through VPN** (if required):
   ```bash
   # Connect to company VPN
   # Then run migration locally
   cd backend
   npx prisma migrate deploy
   ```

---

## Verification Steps

After successfully running the migration:

### 1. Check Schema
```sql
-- In Supabase SQL Editor or psql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
ORDER BY ordinal_position;
```

**Expected New Columns**:
- `sessionTokenHash` (text, NOT NULL)
- `revokedAt` (timestamp, nullable)
- `revokedReason` (text, nullable)
- `lastActivityAt` (timestamp, NOT NULL, default now)
- `maxIdleMinutes` (integer, NOT NULL, default 10080)
- `loginMethod` (text, nullable)

### 2. Check Indexes
```sql
-- In Supabase SQL Editor
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'sessions';
```

**Expected New Indexes**:
- `sessions_sessionTokenHash_key` (unique)
- `sessions_expiresAt_idx`
- `sessions_lastActivityAt_idx`

### 3. Test Backend Connection
```bash
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.session.count().then(console.log).finally(() => prisma.$disconnect());"
```

Should print the number of sessions (0 or more, not an error).

---

## Troubleshooting

### "relation 'sessions' does not exist"
The table name in your database might be different. Check:
```sql
\dt
-- or
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

If the table is named `Session` (capital S), update the migration SQL:
```sql
-- Replace all occurrences of "sessions" with "Session"
ALTER TABLE "Session" ADD COLUMN ...
```

### "column already exists"
The migration is safe to re-run (uses `IF NOT EXISTS`). If you get errors:
```sql
-- Check existing columns
\d sessions
-- or
SELECT * FROM information_schema.columns WHERE table_name = 'sessions';
```

### "permission denied"
Your database user needs ALTER TABLE permissions:
```sql
-- Run as superuser or grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### Migration Shows as Pending After Manual Run
```bash
# Mark as applied
cd backend
npx prisma migrate resolve --applied 20260906_add_production_session_fields

# Verify
npx prisma migrate status
```

---

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- ⚠️ WARNING: This will remove session tracking columns
-- Backup your data first!

-- Remove new columns
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "sessionTokenHash";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "revokedAt";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "revokedReason";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "lastActivityAt";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "maxIdleMinutes";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "loginMethod";

-- Restore refreshTokenHash NOT NULL constraint
ALTER TABLE "sessions" ALTER COLUMN "refreshTokenHash" SET NOT NULL;

-- Drop indexes
DROP INDEX IF EXISTS "sessions_sessionTokenHash_key";
DROP INDEX IF EXISTS "sessions_expiresAt_idx";
DROP INDEX IF EXISTS "sessions_lastActivityAt_idx";
```

Then tell Prisma to roll back:
```bash
cd backend
npx prisma migrate resolve --rolled-back 20260906_add_production_session_fields
```

---

## Post-Migration Checklist

After successful migration:

- [ ] Migration status shows "up to date"
- [ ] All new columns exist in database
- [ ] All indexes created successfully
- [ ] Backend can connect to database
- [ ] No errors in application logs
- [ ] Test login creates session with sessionTokenHash
- [ ] Test logout revokes session (sets revokedAt)
- [ ] Session cleanup cron job can query sessions

---

## Network Troubleshooting

If database remains unreachable:

### Check Supabase Status
```
https://status.supabase.com/
```

### Test Connection from Local Machine
```bash
# Install psql (PostgreSQL client)
# Windows: Download from https://www.postgresql.org/download/windows/
# Or use Git Bash with psql

psql "postgresql://postgres.czpalrflesdhxfreyaqo:Sahilnaik18@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Check Firewall
```powershell
# Test port connectivity
Test-NetConnection -ComputerName db.czpalrflesdhxfreyaqo.supabase.co -Port 5432
Test-NetConnection -ComputerName aws-0-ap-south-1.pooler.supabase.com -Port 6543
```

### Supabase Connection Pooler
The project uses connection pooling (port 6543) for most operations. For migrations, Prisma needs the direct connection (port 5432). Make sure both ports are accessible.

---

## When Migration is Complete

Once the database migration is successful:

1. **Update Status Document**:
   ```markdown
   Status: ✅ COMPLETE
   Date: [date]
   Method: [Automatic / Manual SQL / Production Server]
   ```

2. **Proceed to Testing**:
   - Follow `PRODUCTION_AUTH_TESTING_GUIDE.md`
   - Test login with cookie creation
   - Test session persistence
   - Test logout with revocation

3. **Deploy Backend**:
   ```bash
   cd backend
   npm run build  # if applicable
   pm2 restart pulsemate-backend
   ```

4. **Deploy Frontend**:
   ```bash
   cd frontend
   npm run build
   # Deploy to hosting
   ```

---

## Contact & Support

If migration issues persist:

1. **Check Supabase Dashboard** for project health
2. **Review Supabase Logs** in dashboard
3. **Contact Supabase Support** if project is inaccessible
4. **Alternative**: Set up local PostgreSQL for testing

---

**Migration File Location**:  
`backend/prisma/migrations/20260906_add_production_session_fields/migration.sql`

**Current Status**: ⚠️ PENDING - Database not reachable  
**Next Step**: Wake up Supabase project and retry migration
