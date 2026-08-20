-- Drop the problematic index if it exists
DROP INDEX IF EXISTS "queues_clinicId_doctorId_date_sessionId_key" CASCADE;

-- Create the new tables for doctor invitation workflow
CREATE TABLE IF NOT EXISTS "doctor_invitations" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "doctorMobile" TEXT NOT NULL,
    "doctorEmail" TEXT,
    "specialization" TEXT,
    "invitationToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INVITATION_SENT',
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "doctorUserId" TEXT,
    "doctorProfileId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "doctor_verification_documents" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentCategory" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_verification_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "doctor_verification_logs" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "adminId" TEXT,
    "oldStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_verification_logs_pkey" PRIMARY KEY ("id")
);

-- Add new columns to doctor_profiles if they don't exist
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "fullLegalName" TEXT;
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "medicalSystem" TEXT;
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "registrationAuthority" TEXT;
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "registrationYear" INTEGER;
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "invitationId" TEXT;
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "profileCompletionPercentage" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "profileSubmittedAt" TIMESTAMP(3);
ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "lastEditedAt" TIMESTAMP(3);

-- Add new columns to clinic_doctors if they don't exist
ALTER TABLE "clinic_doctors" ADD COLUMN IF NOT EXISTS "invitationAcceptedAt" TIMESTAMP(3);
ALTER TABLE "clinic_doctors" ADD COLUMN IF NOT EXISTS "verificationSubmittedAt" TIMESTAMP(3);
ALTER TABLE "clinic_doctors" ADD COLUMN IF NOT EXISTS "adminVerifiedAt" TIMESTAMP(3);
ALTER TABLE "clinic_doctors" ADD COLUMN IF NOT EXISTS "adminVerifiedById" TEXT;
ALTER TABLE "clinic_doctors" ADD COLUMN IF NOT EXISTS "changesRequestedAt" TIMESTAMP(3);
ALTER TABLE "clinic_doctors" ADD COLUMN IF NOT EXISTS "changesRequestedReason" TEXT;

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_invitations_invitationToken_key" ON "doctor_invitations"("invitationToken");
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_profiles_invitationId_key" ON "doctor_profiles"("invitationId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "doctor_invitations_clinicId_idx" ON "doctor_invitations"("clinicId");
CREATE INDEX IF NOT EXISTS "doctor_invitations_doctorMobile_idx" ON "doctor_invitations"("doctorMobile");
CREATE INDEX IF NOT EXISTS "doctor_invitations_invitationToken_idx" ON "doctor_invitations"("invitationToken");
CREATE INDEX IF NOT EXISTS "doctor_invitations_status_idx" ON "doctor_invitations"("status");
CREATE INDEX IF NOT EXISTS "doctor_invitations_createdAt_idx" ON "doctor_invitations"("createdAt");

CREATE INDEX IF NOT EXISTS "doctor_verification_documents_doctorProfileId_idx" ON "doctor_verification_documents"("doctorProfileId");
CREATE INDEX IF NOT EXISTS "doctor_verification_documents_documentType_idx" ON "doctor_verification_documents"("documentType");
CREATE INDEX IF NOT EXISTS "doctor_verification_documents_verificationStatus_idx" ON "doctor_verification_documents"("verificationStatus");

CREATE INDEX IF NOT EXISTS "doctor_verification_logs_doctorProfileId_idx" ON "doctor_verification_logs"("doctorProfileId");
CREATE INDEX IF NOT EXISTS "doctor_verification_logs_adminId_idx" ON "doctor_verification_logs"("adminId");
CREATE INDEX IF NOT EXISTS "doctor_verification_logs_createdAt_idx" ON "doctor_verification_logs"("createdAt");

CREATE INDEX IF NOT EXISTS "doctor_profiles_invitationId_idx" ON "doctor_profiles"("invitationId");
CREATE INDEX IF NOT EXISTS "doctor_profiles_verificationStatus_idx" ON "doctor_profiles"("verificationStatus");
CREATE INDEX IF NOT EXISTS "doctor_profiles_profileSubmittedAt_idx" ON "doctor_profiles"("profileSubmittedAt");

-- Add foreign keys
ALTER TABLE "doctor_invitations" DROP CONSTRAINT IF EXISTS "doctor_invitations_clinicId_fkey";
ALTER TABLE "doctor_invitations" ADD CONSTRAINT "doctor_invitations_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_invitations" DROP CONSTRAINT IF EXISTS "doctor_invitations_invitedById_fkey";
ALTER TABLE "doctor_invitations" ADD CONSTRAINT "doctor_invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "doctor_invitations" DROP CONSTRAINT IF EXISTS "doctor_invitations_doctorUserId_fkey";
ALTER TABLE "doctor_invitations" ADD CONSTRAINT "doctor_invitations_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "doctor_invitations" DROP CONSTRAINT IF EXISTS "doctor_invitations_verifiedById_fkey";
ALTER TABLE "doctor_invitations" ADD CONSTRAINT "doctor_invitations_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "doctor_invitations" DROP CONSTRAINT IF EXISTS "doctor_invitations_rejectedById_fkey";
ALTER TABLE "doctor_invitations" ADD CONSTRAINT "doctor_invitations_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "doctor_verification_documents" DROP CONSTRAINT IF EXISTS "doctor_verification_documents_doctorProfileId_fkey";
ALTER TABLE "doctor_verification_documents" ADD CONSTRAINT "doctor_verification_documents_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_verification_documents" DROP CONSTRAINT IF EXISTS "doctor_verification_documents_verifiedById_fkey";
ALTER TABLE "doctor_verification_documents" ADD CONSTRAINT "doctor_verification_documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "doctor_verification_logs" DROP CONSTRAINT IF EXISTS "doctor_verification_logs_doctorProfileId_fkey";
ALTER TABLE "doctor_verification_logs" ADD CONSTRAINT "doctor_verification_logs_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_verification_logs" DROP CONSTRAINT IF EXISTS "doctor_verification_logs_adminId_fkey";
ALTER TABLE "doctor_verification_logs" ADD CONSTRAINT "doctor_verification_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "doctor_profiles" DROP CONSTRAINT IF EXISTS "doctor_profiles_invitationId_fkey";
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "doctor_invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
