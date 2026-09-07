# Fix Admin Dashboard - Clinic Documents Not Showing

## Problem
After a clinic owner completes onboarding with mandatory documents, the admin dashboard doesn't show the uploaded documents.

## Root Cause
The Clinic table was missing the document field columns:
- `clinicRegistrationCertificate`
- `medicalLicense` 
- `ownerIdProof`
- `clinicExteriorUrl`, `receptionAreaUrl`, `consultationRoomUrl` (photos)

The frontend expects these fields, but they didn't exist in the database schema.

## Solution

### Step 1: Add Missing Database Columns

Run this SQL on your Supabase database:

```sql
-- Go to Supabase Dashboard > SQL Editor
-- Paste and run this:

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "clinicRegistrationCertificate" TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "medicalLicense" TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "ownerIdProof" TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "clinicExteriorUrl" TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "receptionAreaUrl" TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS "consultationRoomUrl" TEXT;
```

OR run the provided file:
```bash
# The SQL is in: ADD_DOCUMENT_FIELDS_TO_CLINICS.sql
```

### Step 2: Update Backend Clinic Controller

The clinic onboarding submission needs to save documents to these new fields.

Check `backend/src/controllers/clinic.controller.js` in the clinic submission/creation function and ensure documents are being saved to the Clinic table, not just in `clinicOnboardingData` JSON.

### Step 3: Deploy to Production

After running the SQL migration:

1. **Commit schema changes:**
```bash
git add backend/prisma/schema.prisma
git add ADD_DOCUMENT_FIELDS_TO_CLINICS.sql
git add FIX_ADMIN_DOCUMENT_VIEWING.md
git commit -m "fix: Add missing document fields to Clinic schema for admin dashboard"
git push
```

2. **Run SQL on Supabase:**
   - Go to https://supabase.com
   - Open your project
   - Go to SQL Editor
   - Paste the SQL from `ADD_DOCUMENT_FIELDS_TO_CLINICS.sql`
   - Execute

3. **Redeploy on Render** (automatic if auto-deploy is on)

### Step 4: Verify

1. Have a clinic owner complete registration with documents
2. Login as admin
3. Go to Clinics > View clinic detail
4. Documents should now be visible!

## For Existing Clinics with Missing Documents

If clinics were already registered before this fix, their documents might be in `clinicOnboardingData` JSON. You may need to migrate that data:

```sql
-- This will be needed if documents were stored in JSON but not in dedicated columns
-- Example migration (customize based on your JSON structure):

UPDATE clinics
SET 
  "clinicRegistrationCertificate" = (owner."clinicOnboardingData"->>'clinicDocuments'->>'clinicRegistrationCertificate'),
  "medicalLicense" = (owner."clinicOnboardingData"->>'clinicDocuments'->>'medicalLicense'),
  "ownerIdProof" = (owner."clinicOnboardingData"->>'clinicDocuments'->>'ownerIdProof')
FROM users owner
WHERE clinics."ownerId" = owner.id
AND clinics."clinicRegistrationCertificate" IS NULL
AND owner."clinicOnboardingData" IS NOT NULL;
```

## Files Changed
- `backend/prisma/schema.prisma` - Added document fields to Clinic model
- `ADD_DOCUMENT_FIELDS_TO_CLINICS.sql` - Migration script
- `FIX_ADMIN_DOCUMENT_VIEWING.md` - This guide

## Testing Checklist
- [ ] SQL migration executed on Supabase
- [ ] Schema changes committed and pushed
- [ ] Render deployment successful
- [ ] New clinic registration saves documents correctly
- [ ] Admin dashboard displays all uploaded documents
- [ ] Document images/PDFs open correctly when clicked
