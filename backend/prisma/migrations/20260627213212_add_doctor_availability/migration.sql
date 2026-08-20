-- CreateTable
CREATE TABLE IF NOT EXISTS "doctor_availability" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDurationMin" INTEGER NOT NULL DEFAULT 15,
    "maxPatients" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- Remove any potential duplicates BEFORE creating unique index
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_availability') THEN
        -- Delete duplicates, keeping the row with the latest createdAt (highest id)
        DELETE FROM "doctor_availability" a
        USING "doctor_availability" b
        WHERE a.id < b.id
        AND a."doctorId" = b."doctorId"
        AND a."clinicId" = b."clinicId"
        AND a."dayOfWeek" = b."dayOfWeek";
        
        RAISE NOTICE 'Removed duplicate doctor_availability records';
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "doctor_availability_doctorId_idx" ON "doctor_availability"("doctorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "doctor_availability_clinicId_idx" ON "doctor_availability"("clinicId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "doctor_availability_dayOfWeek_idx" ON "doctor_availability"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_availability_doctorId_clinicId_dayOfWeek_key" ON "doctor_availability"("doctorId", "clinicId", "dayOfWeek");

-- CreateIndex for users.firebaseUid (skip if already exists)
-- Check both pg_indexes and pg_constraint to handle both index and constraint cases
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'users_firebaseUid_key'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_firebaseUid_key'
    ) THEN
        CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");
        RAISE NOTICE 'Created users_firebaseUid_key index';
    ELSE
        RAISE NOTICE 'users_firebaseUid_key already exists, skipping';
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctor_availability_doctorId_fkey'
    ) THEN
        ALTER TABLE "doctor_availability" 
        ADD CONSTRAINT "doctor_availability_doctorId_fkey" 
        FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'Created doctor_availability_doctorId_fkey';
    ELSE
        RAISE NOTICE 'doctor_availability_doctorId_fkey already exists, skipping';
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctor_availability_clinicId_fkey'
    ) THEN
        ALTER TABLE "doctor_availability" 
        ADD CONSTRAINT "doctor_availability_clinicId_fkey" 
        FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'Created doctor_availability_clinicId_fkey';
    ELSE
        RAISE NOTICE 'doctor_availability_clinicId_fkey already exists, skipping';
    END IF;
END $$;
