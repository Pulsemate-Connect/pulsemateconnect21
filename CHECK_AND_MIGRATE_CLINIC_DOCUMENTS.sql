-- ═══════════════════════════════════════════════════════════════════════════
-- Check and Migrate Clinic Documents
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Find where clinic documents are stored and migrate them if needed
-- Run this on your Supabase database
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Check current clinic records
SELECT 
  c.id,
  c.name,
  c."ownerId",
  c."approvalStatus",
  c."clinicRegistrationCertificate",
  c."medicalLicense",
  c."ownerIdProof",
  c."licenseDocumentUrl",
  c."medicalEstablishmentCertificateUrl",
  c."clinicLogoUrl",
  c."clinicExteriorUrl",
  c."receptionAreaUrl",
  c."consultationRoomUrl",
  c."createdAt",
  c."submittedAt"
FROM clinics c
WHERE c."approvalStatus" IN ('PENDING', 'DRAFT')
ORDER BY c."createdAt" DESC
LIMIT 10;

-- Step 2: Check owner's clinicOnboardingData for documents
SELECT 
  u.id as "userId",
  u.name as "userName",
  u.mobile,
  u.email,
  u."approvalStatus",
  u."clinicOnboardingData"->'clinicDocuments' as "documentsStep",
  u."clinicOnboardingData"->'clinicInformation' as "infoStep"
FROM users u
WHERE u.role = 'CLINIC_OWNER'
AND u."clinicOnboardingData" IS NOT NULL
AND u."approvalStatus" IN ('PENDING', 'DRAFT')
ORDER BY u."createdAt" DESC
LIMIT 10;

-- Step 3: Migrate documents from clinicOnboardingData to Clinic table
-- (Run this AFTER adding the new columns to clinics table)
UPDATE clinics c
SET 
  "clinicRegistrationCertificate" = COALESCE(
    c."clinicRegistrationCertificate",
    u."clinicOnboardingData"#>>'{clinicDocuments,clinicRegistrationCertificate}'
  ),
  "medicalLicense" = COALESCE(
    c."medicalLicense",
    u."clinicOnboardingData"#>>'{clinicDocuments,medicalLicense}'
  ),
  "ownerIdProof" = COALESCE(
    c."ownerIdProof",
    u."clinicOnboardingData"#>>'{clinicDocuments,ownerIdProof}'
  ),
  "clinicLogoUrl" = COALESCE(
    c."clinicLogoUrl",
    u."clinicOnboardingData"#>>'{clinicDocuments,clinicLogo}',
    u."clinicOnboardingData"#>>'{clinicDocuments,clinicPhotos,logo}'
  ),
  "clinicExteriorUrl" = COALESCE(
    c."clinicExteriorUrl",
    u."clinicOnboardingData"#>>'{clinicDocuments,clinicExterior}',
    u."clinicOnboardingData"#>>'{clinicDocuments,clinicPhotos,exterior}'
  ),
  "receptionAreaUrl" = COALESCE(
    c."receptionAreaUrl",
    u."clinicOnboardingData"#>>'{clinicDocuments,receptionArea}',
    u."clinicOnboardingData"#>>'{clinicDocuments,clinicPhotos,reception}'
  ),
  "consultationRoomUrl" = COALESCE(
    c."consultationRoomUrl",
    u."clinicOnboardingData"#>>'{clinicDocuments,consultationRoom}',
    u."clinicOnboardingData"#>>'{clinicDocuments,clinicPhotos,consultationRoom}'
  )
FROM users u
WHERE c."ownerId" = u.id
AND u.role = 'CLINIC_OWNER'
AND u."clinicOnboardingData" IS NOT NULL
AND c."approvalStatus" IN ('PENDING', 'DRAFT', 'CHANGES_REQUIRED')
AND (
  c."clinicRegistrationCertificate" IS NULL 
  OR c."medicalLicense" IS NULL 
  OR c."ownerIdProof" IS NULL
);

-- Step 4: Verify the migration worked
SELECT 
  c.id,
  c.name,
  c."approvalStatus",
  CASE 
    WHEN c."clinicRegistrationCertificate" IS NOT NULL THEN '✅' 
    ELSE '❌' 
  END as "hasRegistrationCert",
  CASE 
    WHEN c."medicalLicense" IS NOT NULL THEN '✅' 
    ELSE '❌' 
  END as "hasMedicalLicense",
  CASE 
    WHEN c."ownerIdProof" IS NOT NULL THEN '✅' 
    ELSE '❌' 
  END as "hasOwnerIdProof",
  CASE 
    WHEN c."clinicLogoUrl" IS NOT NULL THEN '✅' 
    ELSE '❌' 
  END as "hasLogo",
  c."clinicRegistrationCertificate",
  c."medicalLicense",
  c."ownerIdProof"
FROM clinics c
WHERE c."approvalStatus" IN ('PENDING', 'DRAFT')
ORDER BY c."createdAt" DESC;
