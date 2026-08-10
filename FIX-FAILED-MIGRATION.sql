-- Fix Failed Migration in Production Database
-- This marks the failed migration as rolled back so new deployments can proceed

-- Step 1: Check the current failed migration status
SELECT migration_name, finished_at, started_at, rolled_back_at, applied_steps_count 
FROM _prisma_migrations 
WHERE migration_name = '99999999999999_fix_notification_enums';

-- Step 2: Mark the failed migration as rolled back
UPDATE _prisma_migrations 
SET rolled_back_at = NOW(), 
    finished_at = NULL
WHERE migration_name = '99999999999999_fix_notification_enums';

-- Step 3: Or completely delete the failed migration record (cleaner approach)
DELETE FROM _prisma_migrations 
WHERE migration_name = '99999999999999_fix_notification_enums';

-- Step 4: Verify it's gone
SELECT migration_name, finished_at, started_at, rolled_back_at 
FROM _prisma_migrations 
ORDER BY started_at DESC 
LIMIT 5;
