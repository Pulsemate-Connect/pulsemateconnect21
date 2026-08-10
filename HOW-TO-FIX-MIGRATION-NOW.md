# 🚨 FIX FAILED MIGRATION - DO THIS NOW

## Problem
The migration `99999999999999_fix_notification_enums` failed on production and is blocking ALL deployments.

## Root Cause
When a Prisma migration fails, it's recorded in the `_prisma_migrations` table with a failed status. Prisma refuses to run ANY new migrations until the failed one is resolved.

## Solution
Delete the failed migration record from the production database.

---

## OPTION 1: Using Supabase Dashboard (EASIEST)

1. **Go to Supabase SQL Editor**:
   - Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
   - Or navigate: Your Project → SQL Editor

2. **Run This Query**:
```sql
-- Delete the failed migration record
DELETE FROM _prisma_migrations 
WHERE migration_name = '99999999999999_fix_notification_enums';
```

3. **Verify It's Gone**:
```sql
-- Check last 5 migrations
SELECT migration_name, finished_at, started_at, rolled_back_at 
FROM _prisma_migrations 
ORDER BY started_at DESC 
LIMIT 5;
```

4. **Trigger Deployment**:
   - Go to Render dashboard
   - Click "Manual Deploy" → "Clear build cache & deploy"
   - OR push any change to GitHub to trigger auto-deploy

---

## OPTION 2: Using psql Command Line

If you have `psql` installed:

```bash
# Connect to production database
psql "postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

# Delete failed migration
DELETE FROM _prisma_migrations WHERE migration_name = '99999999999999_fix_notification_enums';

# Exit
\q
```

---

## OPTION 3: Using Node.js Script

```javascript
// fix-migration.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMigration() {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '99999999999999_fix_notification_enums'
    `;
    console.log(`✅ Deleted failed migration. Rows affected: ${result}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
```

Run with:
```bash
cd backend
node fix-migration.js
```

---

## What Happens After Fixing

1. ✅ Failed migration record removed from `_prisma_migrations` table
2. ✅ Prisma will no longer block on failed migration
3. ✅ Next deployment will succeed
4. ✅ Backend will build and start normally
5. ✅ Frontend will deploy successfully
6. ✅ Patient login will work

---

## Why This Happened

The migration `99999999999999_fix_notification_enums` tried to create enum types that may have already existed or had syntax issues. The migration failed mid-execution and was recorded as failed.

We've since:
- ✅ Deleted the migration file locally
- ✅ Fixed all schema issues
- ⏳ Need to clean up the failed migration record in production

---

## Verification After Fix

After running the DELETE query, your next deployment should show:

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres"...
29 migrations found in prisma/migrations

No pending migrations to apply.

✔ Generated Prisma Client
```

Instead of:
```
Error: P3009
migrate found failed migrations in the target database
The `99999999999999_fix_notification_enums` migration ... failed
```

---

## Quick Command Reference

**Check failed migrations:**
```sql
SELECT * FROM _prisma_migrations WHERE finished_at IS NULL;
```

**Delete specific failed migration:**
```sql
DELETE FROM _prisma_migrations WHERE migration_name = '99999999999999_fix_notification_enums';
```

**View all migrations:**
```sql
SELECT migration_name, started_at, finished_at FROM _prisma_migrations ORDER BY started_at;
```

---

## ⚡ FASTEST PATH: Do This Right Now

1. Open Supabase Dashboard
2. Click "SQL Editor"
3. Paste: `DELETE FROM _prisma_migrations WHERE migration_name = '99999999999999_fix_notification_enums';`
4. Click "Run"
5. Go to Render and click "Manual Deploy"
6. Wait 2-3 minutes
7. ✅ Deployments succeed!

---

**Priority**: 🔥 CRITICAL - Blocking ALL deployments  
**Time Required**: 30 seconds  
**Difficulty**: Easy (just run one SQL command)
