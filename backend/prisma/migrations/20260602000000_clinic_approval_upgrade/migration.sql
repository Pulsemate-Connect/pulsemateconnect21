-- Add CHANGES_REQUIRED to ApprovalStatus enum
ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'CHANGES_REQUIRED';

-- Add new fields to clinics table
ALTER TABLE "clinics"
  ADD COLUMN IF NOT EXISTS "changesRequestedReason" TEXT,
  ADD COLUMN IF NOT EXISTS "adminNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectedById" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT,
  ADD COLUMN IF NOT EXISTS "lastResubmittedAt" TIMESTAMP(3);

-- Create clinic_verification_logs table
CREATE TABLE IF NOT EXISTS "clinic_verification_logs" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "adminId" TEXT,
  "oldStatus" TEXT NOT NULL,
  "newStatus" TEXT NOT NULL,
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "clinic_verification_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "clinic_verification_logs"
  ADD CONSTRAINT "clinic_verification_logs_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
