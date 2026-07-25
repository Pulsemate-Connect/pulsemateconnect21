-- ============================================================================
-- EMERGENCY FIX: Create clinic_owner_profiles table NOW
-- ============================================================================
-- Run this IMMEDIATELY in Supabase SQL Editor to fix the 500 error
-- ============================================================================

-- Check if table exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'clinic_owner_profiles'
    ) THEN
        RAISE NOTICE 'Table does not exist - creating now...';
        
        -- Create the table
        CREATE TABLE "clinic_owner_profiles" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL UNIQUE,
            "primaryClinicId" TEXT UNIQUE,
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
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Add indexes
        CREATE INDEX "clinic_owner_profiles_userId_idx" 
        ON "clinic_owner_profiles"("userId");
        
        CREATE INDEX "clinic_owner_profiles_primaryClinicId_idx" 
        ON "clinic_owner_profiles"("primaryClinicId");

        -- Add foreign keys
        ALTER TABLE "clinic_owner_profiles" 
        ADD CONSTRAINT "clinic_owner_profiles_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;

        ALTER TABLE "clinic_owner_profiles" 
        ADD CONSTRAINT "clinic_owner_profiles_primaryClinicId_fkey" 
        FOREIGN KEY ("primaryClinicId") REFERENCES "clinics"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;

        -- Migrate existing clinic owners
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
        ON CONFLICT ("userId") DO NOTHING;

        RAISE NOTICE 'Table created and data migrated successfully!';
    ELSE
        RAISE NOTICE 'Table already exists - no action needed';
    END IF;
END $$;

-- Verify
SELECT 
    'clinic_owner_profiles' AS table_name,
    COUNT(*) AS row_count
FROM clinic_owner_profiles;
