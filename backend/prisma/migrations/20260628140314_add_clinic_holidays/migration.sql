/*
  Warnings:

  - A unique constraint covering the columns `[firebaseUid]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE IF NOT EXISTS "clinic_holidays" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "reason" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "clinic_holidays_clinicId_idx" ON "clinic_holidays"("clinicId");

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "clinic_holidays_date_idx" ON "clinic_holidays"("date");

-- CreateIndex (only if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "clinic_holidays_clinicId_date_key" ON "clinic_holidays"("clinicId", "date");

-- CreateIndex (only if not exists - this is the problematic one)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'users_firebaseUid_key'
    ) THEN
        CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");
    END IF;
END $$;

-- AddForeignKey (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clinic_holidays_clinicId_fkey'
    ) THEN
        ALTER TABLE "clinic_holidays" ADD CONSTRAINT "clinic_holidays_clinicId_fkey" 
        FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
