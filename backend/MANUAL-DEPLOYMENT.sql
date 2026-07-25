-- ============================================================================
-- MANUAL DEPLOYMENT: Add Clinic Owner Profile
-- ============================================================================
-- Run this SQL directly in Supabase SQL Editor if Prisma migration is locked
-- https://supabase.com/dashboard → Your Project → SQL Editor
-- ============================================================================

BEGIN;

-- Step 1: Check if table already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'clinic_owner_profiles'
    ) THEN
        -- Create the clinic_owner_profiles table
        CREATE TABLE "clinic_owner_profiles" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "primaryClinicId" TEXT,
            "businessName" TEXT,
            "designation" TEXT,
            "profilePhoto" TEXT,
            "alternatePhone" TEXT,
            "businessAddress" TEXT,
            "gstNumber" TEXT,
            "panNumber" TEXT,
            "bio" TEXT,
            "linkedInProfile" TEXT,
            "yearsInHealthcare" INTEGER,
            "totalClinics" INTEGER NOT NULL DEFAULT 1,
            "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "clinic_owner_profiles_pkey" PRIMARY KEY ("id")
        );

        RAISE NOTICE 'Created clinic_owner_profiles table';
    ELSE
        RAISE NOTICE 'Table clinic_owner_profiles already exists, skipping creation';
    END IF;
END $$;

-- Step 2: Add unique constraint on userId (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clinic_owner_profiles_userId_key'
    ) THEN
        ALTER TABLE "clinic_owner_profiles" 
        ADD CONSTRAINT "clinic_owner_profiles_userId_key" 
        UNIQUE ("userId");
        
        RAISE NOTICE 'Added unique constraint on userId';
    ELSE
        RAISE NOTICE 'Unique constraint on userId already exists';
    END IF;
END $$;

-- Step 3: Add unique constraint on primaryClinicId (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clinic_owner_profiles_primaryClinicId_key'
    ) THEN
        ALTER TABLE "clinic_owner_profiles" 
        ADD CONSTRAINT "clinic_owner_profiles_primaryClinicId_key" 
        UNIQUE ("primaryClinicId");
        
        RAISE NOTICE 'Added unique constraint on primaryClinicId';
    ELSE
        RAISE NOTICE 'Unique constraint on primaryClinicId already exists';
    END IF;
END $$;

-- Step 4: Add foreign key to users table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clinic_owner_profiles_userId_fkey'
    ) THEN
        ALTER TABLE "clinic_owner_profiles" 
        ADD CONSTRAINT "clinic_owner_profiles_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key to users table';
    ELSE
        RAISE NOTICE 'Foreign key to users already exists';
    END IF;
END $$;

-- Step 5: Add foreign key to clinics table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clinic_owner_profiles_primaryClinicId_fkey'
    ) THEN
        ALTER TABLE "clinic_owner_profiles" 
        ADD CONSTRAINT "clinic_owner_profiles_primaryClinicId_fkey" 
        FOREIGN KEY ("primaryClinicId") REFERENCES "clinics"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added foreign key to clinics table';
    ELSE
        RAISE NOTICE 'Foreign key to clinics already exists';
    END IF;
END $$;

-- Step 6: Add index on userId (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'clinic_owner_profiles_userId_idx'
    ) THEN
        CREATE INDEX "clinic_owner_profiles_userId_idx" 
        ON "clinic_owner_profiles"("userId");
        
        RAISE NOTICE 'Added index on userId';
    ELSE
        RAISE NOTICE 'Index on userId already exists';
    END IF;
END $$;

-- Step 7: Add index on primaryClinicId (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'clinic_owner_profiles_primaryClinicId_idx'
    ) THEN
        CREATE INDEX "clinic_owner_profiles_primaryClinicId_idx" 
        ON "clinic_owner_profiles"("primaryClinicId");
        
        RAISE NOTICE 'Added index on primaryClinicId';
    ELSE
        RAISE NOTICE 'Index on primaryClinicId already exists';
    END IF;
END $$;

-- Step 8: Migrate existing clinic owners (create profiles)
INSERT INTO "clinic_owner_profiles" (
    "id",
    "userId",
    "primaryClinicId",
    "businessName",
    "totalClinics",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    u.id,
    c.id,
    c.name,
    (SELECT COUNT(*) FROM clinics WHERE "ownerId" = u.id),
    NOW(),
    NOW()
FROM users u
INNER JOIN clinics c ON c."ownerId" = u.id
WHERE u.role = 'CLINIC_OWNER'
  AND NOT EXISTS (
    SELECT 1 FROM clinic_owner_profiles cop 
    WHERE cop."userId" = u.id
  )
ON CONFLICT ("userId") DO NOTHING;

-- Step 9: Mark migration as applied in Prisma migrations table
INSERT INTO "_prisma_migrations" (
    id,
    checksum,
    finished_at,
    migration_name,
    logs,
    rolled_back_at,
    started_at,
    applied_steps_count
)
VALUES (
    gen_random_uuid(),
    'manual_deployment_clinic_owner_profile',
    NOW(),
    '20260725155225_add_clinic_owner_profile',
    'Manually deployed via SQL script',
    NULL,
    NOW(),
    1
)
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the deployment was successful:

-- 1. Check if table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'clinic_owner_profiles'
) AS table_exists;

-- 2. Check table structure
\d clinic_owner_profiles

-- 3. Count existing profiles
SELECT COUNT(*) AS profile_count 
FROM clinic_owner_profiles;

-- 4. Check migration status
SELECT migration_name, finished_at 
FROM "_prisma_migrations" 
WHERE migration_name = '20260725155225_add_clinic_owner_profile';

-- 5. Verify foreign keys work
SELECT 
    u.name AS owner_name,
    u.mobile,
    cop."businessName",
    c.name AS primary_clinic
FROM users u
LEFT JOIN clinic_owner_profiles cop ON cop."userId" = u.id
LEFT JOIN clinics c ON c.id = cop."primaryClinicId"
WHERE u.role = 'CLINIC_OWNER'
LIMIT 5;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- If all queries above return expected results, the deployment is complete!
-- Restart your backend server to use the new table.
-- ============================================================================
