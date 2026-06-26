-- Create clinic_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "clinic_sessions" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxPatients" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_sessions_pkey" PRIMARY KEY ("id")
);

-- Create index if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'clinic_sessions_clinicId_idx'
    ) THEN
        CREATE INDEX "clinic_sessions_clinicId_idx" ON "clinic_sessions"("clinicId");
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clinic_sessions_clinicId_fkey'
    ) THEN
        ALTER TABLE "clinic_sessions" ADD CONSTRAINT "clinic_sessions_clinicId_fkey" 
        FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
