# Fix DeliveryStatus Enum Error

## Problem
The production database is missing the `DeliveryStatus` enum type, causing this error:
```
type "public.DeliveryStatus" does not exist
```

## Solution
Run the migration SQL to create the missing enum types and convert columns.

## Option 1: Run via Render Shell (Recommended)

1. Go to your Render dashboard
2. Open your backend service
3. Go to **Shell** tab
4. Run these commands:

```bash
cd /opt/render/project/src/backend
cat prisma/migrations/fix_delivery_status_enum.sql | npx prisma db execute --stdin
```

## Option 2: Run via psql (If you have direct database access)

If you have the DATABASE_URL:

```bash
cd backend
psql "$DATABASE_URL" -f prisma/migrations/fix_delivery_status_enum.sql
```

## Option 3: Run via Prisma Migration (Cleanest)

Create a proper migration:

```bash
cd backend

# Create the migration
npx prisma migrate dev --name fix_notification_enums --create-only

# Copy the SQL content from fix_delivery_status_enum.sql into the new migration file

# Apply it
npx prisma migrate deploy
```

## Verification

After running the migration, verify it worked:

```sql
-- Check if enum types exist
SELECT typname FROM pg_type WHERE typname IN ('DeliveryStatus', 'NotificationType', 'NotificationPriority');

-- Check column types
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND column_name IN ('type', 'priority', 'deliveryStatus');
```

You should see:
- `type` → `NotificationType`
- `priority` → `NotificationPriority`  
- `deliveryStatus` → `DeliveryStatus`

## What This Fix Does

1. Creates three missing enum types:
   - `NotificationType` (21 notification event types)
   - `NotificationPriority` (LOW, NORMAL, HIGH, URGENT)
   - `DeliveryStatus` (PENDING, SENT, DELIVERED, FAILED, RETRY, EXPIRED)

2. Converts TEXT columns to proper enum types in the `notifications` table

3. Safe to run multiple times (uses `IF NOT EXISTS` checks)

## After Fix

The notification system will work correctly and the errors will stop appearing in your logs.
