# ✅ Post-Deployment Checklist

## 🎉 Code Pushed to Render!

Your changes are now deploying. Follow this checklist to ensure everything works.

---

## 📋 Step 1: Monitor Render Deployment (5-10 min)

### **Watch the Deployment:**

1. Go to https://dashboard.render.com
2. Click your **PulseMate API** service
3. Click **"Logs"** tab
4. Watch for:
   ```
   ✓ Installing dependencies
   ✓ Running prisma generate
   ✓ Starting server
   ✓ Server listening on port 5000
   ```

### **Expected Build Commands:**
```bash
npm install
npx prisma generate
# Migrations run automatically on Render if configured
```

---

## 📋 Step 2: Run Database Migration

### **Option A: Automatic (if configured in Render)**

If your Render service has this in the start command:
```bash
npx prisma migrate deploy && npm start
```

Then migrations run automatically ✅

---

### **Option B: Manual (RECOMMENDED for first time)**

**Why manual?** More control, can verify each step.

1. **Open Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select PulseMate Connect project
   - Click "SQL Editor"

2. **Run the Migration Script**
   - Open file: `backend/MANUAL-DEPLOYMENT.sql`
   - Copy ALL content
   - Paste in Supabase SQL Editor
   - Click "Run"

3. **Verify Success**
   ```sql
   -- Check table was created
   SELECT COUNT(*) FROM clinic_owner_profiles;
   
   -- Check migration recorded
   SELECT * FROM "_prisma_migrations" 
   WHERE migration_name = '20260725155225_add_clinic_owner_profile';
   ```

---

## 📋 Step 3: Verify Backend is Running

### **Check Health Endpoint:**

```bash
curl https://api.pulsemateconnect.in/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "PulseMate API",
  "version": "1.0.0",
  "timestamp": "2026-07-25T..."
}
```

---

## 📋 Step 4: Test the New Feature

### **Test 1: Login as Existing Clinic Owner**

```bash
POST https://api.pulsemateconnect.in/api/auth/login
Content-Type: application/json

{
  "identifier": "+91XXXXXXXXXX",
  "password": "your-password"
}
```

**Expected response:**
```json
{
  "data": {
    "accessToken": "...",
    "user": {
      "id": "...",
      "role": "CLINIC_OWNER",
      "clinicOwnerProfile": {  ← SHOULD BE PRESENT!
        "id": "...",
        "userId": "...",
        "primaryClinicId": "...",
        "businessName": "Your Clinic Name",
        "profileCompleted": false,
        "totalClinics": 1
      },
      "ownedClinics": [...]
    }
  }
}
```

### **Test 2: Register New Clinic Owner**

Try registering a new clinic owner through your registration flow.

**Expected:** Owner profile should be created automatically.

---

## 📋 Step 5: Check Render Logs

Look for any errors in Render logs:

```bash
# Good signs:
✓ Prisma Client generated
✓ Server started successfully
✓ No migration errors

# Bad signs (need attention):
✗ Prisma migration failed
✗ Database connection error
✗ Module not found errors
```

---

## 📋 Step 6: Monitor Application

### **For the next hour, check:**

- ✅ Existing users can still login
- ✅ New clinic owner registrations work
- ✅ Clinic owner profiles are created
- ✅ No 500 errors in logs
- ✅ Firebase auth still working

---

## 🐛 Troubleshooting

### **Issue 1: Migration didn't run automatically**

**Solution:** Run manual deployment SQL in Supabase (see Step 2, Option B)

---

### **Issue 2: "Table clinic_owner_profiles does not exist"**

**Cause:** Migration not applied yet

**Solution:**
```sql
-- Run in Supabase SQL Editor
-- Copy content from backend/MANUAL-DEPLOYMENT.sql
-- Paste and run
```

Then restart Render service:
- Go to Render dashboard
- Click your service
- Click "Manual Deploy" → "Clear build cache & deploy"

---

### **Issue 3: "Module @prisma/client not found"**

**Cause:** Prisma Client not generated

**Solution:**
- Check Render build logs
- Ensure `npx prisma generate` runs during build
- Add to package.json scripts:
  ```json
  {
    "scripts": {
      "postinstall": "prisma generate"
    }
  }
  ```

---

### **Issue 4: Login returns null for clinicOwnerProfile**

**Possible causes:**
1. Migration not applied → Run manual SQL
2. Existing owners not migrated → Run migration SQL again (it's idempotent)
3. Backend not restarted → Restart Render service

**Check database:**
```sql
-- Verify profiles exist
SELECT u.mobile, cop."businessName"
FROM users u
LEFT JOIN clinic_owner_profiles cop ON cop."userId" = u.id
WHERE u.role = 'CLINIC_OWNER';
```

---

## ✅ Success Indicators

### **You know it worked when:**

1. ✅ Render deployment succeeded (green checkmark)
2. ✅ Health endpoint responds
3. ✅ `clinic_owner_profiles` table exists in database
4. ✅ Existing clinic owners have profiles
5. ✅ Login returns `clinicOwnerProfile` data
6. ✅ New registrations create profiles automatically
7. ✅ No errors in Render logs
8. ✅ Firebase auth still works

---

## 📊 Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- 1. Check table structure
\d clinic_owner_profiles

-- 2. Count profiles
SELECT 
  COUNT(*) AS total_profiles,
  COUNT(CASE WHEN "profileCompleted" = true THEN 1 END) AS completed_profiles
FROM clinic_owner_profiles;

-- 3. Sample data
SELECT 
  cop."businessName",
  cop."totalClinics",
  cop."profileCompleted",
  c.name AS primary_clinic,
  u.mobile AS owner_phone
FROM clinic_owner_profiles cop
INNER JOIN users u ON u.id = cop."userId"
LEFT JOIN clinics c ON c.id = cop."primaryClinicId"
LIMIT 5;

-- 4. Check for any owners without profiles
SELECT u.name, u.mobile, u."createdAt"
FROM users u
WHERE u.role = 'CLINIC_OWNER'
  AND NOT EXISTS (
    SELECT 1 FROM clinic_owner_profiles cop 
    WHERE cop."userId" = u.id
  );
-- Expected: 0 rows (all owners should have profiles)
```

---

## 🎯 Timeline

| Time | Action |
|------|--------|
| **0-5 min** | Render builds and deploys |
| **5-10 min** | Run migration in Supabase |
| **10-15 min** | Test login and registration |
| **15-60 min** | Monitor for errors |

---

## 📞 All Good?

If all checks pass:
- ✅ Deployment successful
- ✅ Migration applied
- ✅ Tests passed
- ✅ No errors

**🎉 Congratulations! Your database architecture is now complete!**

All roles (Patient, Doctor, Receptionist, Clinic Owner, Admin) now have dedicated, consistent profile tables.

---

## 🚨 Need Help?

If something's not working:

1. Check Render logs first
2. Verify migration in Supabase
3. Test health endpoint
4. Check database with verification queries
5. Review `DEPLOYMENT-GUIDE.md` for detailed troubleshooting

---

## 📝 Next Steps After Success

1. ✅ Update any frontend code that uses clinic owner data
2. ✅ Consider adding API endpoints for profile updates
3. ✅ Add profile completion tracking
4. ✅ Implement owner profile editing UI
5. ✅ Document the new profile structure for your team

---

**Deployment Status:** In Progress ⏳

**Check Render dashboard now:** https://dashboard.render.com

