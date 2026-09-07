-- ═══════════════════════════════════════════════════════════════════════════
-- Add Missing Document Fields to Clinics Table
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Add mandatory document fields and clinic photo URLs that were missing
-- Run this on your Supabase database
-- ═══════════════════════════════════════════════════════════════════════════

-- Add mandatory document fields
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "clinicRegistrationCertificate" TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "medicalLicense" TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "ownerIdProof" TEXT;

-- Add clinic photo URLs
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "clinicExteriorUrl" TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "receptionAreaUrl" TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "consultationRoomUrl" TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clinics'
AND column_name IN (
  'clinicRegistrationCertificate',
  'medicalLicense',
  'ownerIdProof',
  'clinicExteriorUrl',
  'receptionAreaUrl',
  'consultationRoomUrl'
)
ORDER BY column_name;
