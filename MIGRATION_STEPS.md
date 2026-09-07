# 🔧 Database Migration Steps

## ⚠️ Important: PostgreSQL Enum Limitation

PostgreSQL requires new enum values to be **committed** before they can be used in the same transaction. So we need to run the migration in **2 separate steps**.

---

## 📋 Step-by-Step Instructions

### Step 1: Add DRAFT Enum Value

**Copy and run this first:**

```sql
-- ============================================================================
-- PART 1: Add DRAFT enum value
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DRAFT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ApprovalStatus')
    ) THEN
        ALTER TYPE "ApprovalStatus" ADD VALUE 'DRAFT' BEFORE 'PENDING';
        RAISE NOTICE '✅ Added DRAFT to ApprovalStatus enum';
    ELSE
        RAISE NOTICE 'ℹ️  DRAFT already exists in ApprovalStatus enum';
    END IF;
END $$;
```

**Click "RUN"** and wait for success message.

**Expected Output:**
```
✅ Added DRAFT to ApprovalStatus enum
```

---

### Step 2: Add Columns and Update Data

**After Step 1 succeeds, copy and run this:**

```sql
-- ============================================================================
-- PART 2: Add new columns and update data
-- ============================================================================

-- Add new tracking columns
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "registrationComplete" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "registrationStartedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "registrationCompletedAt" TIMESTAMP;

-- Update existing incomplete registrations to DRAFT
UPDATE "users" 
SET 
  "approvalStatus" = 'DRAFT',
  "registrationComplete" = false,
  "registrationStartedAt" = COALESCE("registrationStartedAt", "createdAt")
WHERE 
  "role" = 'CLINIC_OWNER'
  AND "approvalStatus" = 'PENDING'
  AND (
    "clinicOnboardingData" IS NULL 
    OR "clinicOnboardingData"::text NOT LIKE '%"onboardingComplete":true%'
  );

-- Mark completed registrations properly
UPDATE "users" 
SET 
  "registrationComplete" = true,
  "registrationStartedAt" = COALESCE("registrationStartedAt", "createdAt"),
  "registrationCompletedAt" = COALESCE("registrationCompletedAt", "updatedAt")
WHERE 
  "role" = 'CLINIC_OWNER'
  AND "approvalStatus" IN ('PENDING', 'VERIFIED', 'REJECTED', 'UNDER_REVIEW')
  AND "clinicOnboardingData"::text LIKE '%"onboardingComplete":true%';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_registration_status" 
ON "users" ("role", "approvalStatus", "registrationComplete");

CREATE INDEX IF NOT EXISTS "idx_users_draft_cleanup" 
ON "users" ("approvalStatus", "registrationComplete", "createdAt")
WHERE "approvalStatus" = 'DRAFT' AND "registrationComplete" = false;
```

**Click "RUN"** and wait for success message.

**Expected Output:**
```
Success. No rows returned
(If you have existing clinic owners, it will show UPDATE X)
```

---

### Step 3: Verify Migration

**Run this to verify everything worked:**

```sql
-- Check the results
SELECT 
  "approvalStatus",
  "registrationComplete",
  COUNT(*) as count
FROM "users"
WHERE "role" = 'CLINIC_OWNER'
GROUP BY "approvalStatus", "registrationComplete"
ORDER BY "approvalStatus";

-- Check if DRAFT enum value exists
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ApprovalStatus')
ORDER BY enumsortorder;

-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('registrationComplete', 'registrationStartedAt', 'registrationCompletedAt');
```

**Expected Output:**

1. Status summary (may show 0 rows if no clinic owners exist)
2. Enum values including DRAFT
3. Three new columns

---

## ✅ Success Indicators

After both steps complete, you should see:

### 1. DRAFT Enum Value
```
ApprovalStatus enum now includes:
- DRAFT ✅ (NEW)
- PENDING
- VERIFIED
- REJECTED
- SUSPENDED
- UNDER_REVIEW
- CHANGES_REQUIRED
```

### 2. New Columns
```
users table now has:
- registrationComplete (boolean) ✅
- registrationStartedAt (timestamp) ✅
- registrationCompletedAt (timestamp) ✅
```

### 3. Data Updated
```
- Incomplete PENDING → DRAFT ✅
- Complete PENDING → PENDING (unchanged) ✅
- VERIFIED → VERIFIED (unchanged) ✅
```

---

## 🚨 Troubleshooting

### Error: "enum value already exists"
**Solution:** This is fine! It means DRAFT was already added. Continue to Step 2.

### Error: "column already exists"
**Solution:** This is fine! It means columns were already added. The migration is complete.

### Error: "relation does not exist"
**Solution:** Check that you're running this in the correct database. Verify your Supabase project is selected.

---

## 📝 Alternative: Run All At Once (May Fail)

If you want to try running everything in one go (might fail due to enum limitation):

1. Open `APPLY_HYBRID_REGISTRATION_MIGRATION.sql`
2. Copy entire file
3. Paste in Supabase SQL Editor
4. Click "RUN"

If it fails with enum error, just follow the 2-step process above.

---

## ✅ Post-Migration Checklist

After migration completes:

```bash
# 1. Regenerate Prisma Client
cd backend
npx prisma generate

# 2. Test cleanup script (should work now)
node scripts/cleanup-draft-registrations.js --dry-run

# 3. Restart backend server
npm run dev
```

---

## 🎯 What Changed in Database

### Before Migration:
```
User (CLINIC_OWNER):
- approvalStatus: PENDING (immediately after email verify)
- No tracking of registration progress
- Can't distinguish started vs completed registrations
```

### After Migration:
```
User (CLINIC_OWNER):
- approvalStatus: DRAFT (after email verify)
- approvalStatus: PENDING (after form submit)
- registrationComplete: true/false
- registrationStartedAt: timestamp
- registrationCompletedAt: timestamp
```

---

**Ready to proceed? Run Step 1 first, then Step 2!** 🚀
