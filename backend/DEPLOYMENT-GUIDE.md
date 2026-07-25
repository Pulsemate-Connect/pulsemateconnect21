# 🚀 Deployment Guide: Add Clinic Owner Profile

## ⚠️ Current Situation

Prisma migration is timing out due to database advisory lock.

**Solution:** Deploy manually via Supabase SQL Editor (safer and faster)

---

## 📋 Option 1: Manual Deployment (RECOMMENDED)

### **Step 1: Open Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your **PulseMate Connect** project
3. Click **"SQL Editor"** in the left sidebar

### **Step 2: Run Deployment Script**

1. Click **"+ New query"**
2. Open file: `backend/MANUAL-DEPLOYMENT.sql`
3. **Copy ALL content** from that file
4. **Paste** into Supabase SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`

### **Step 3: Verify Results**

You should see output like:
```
NOTICE: Created clinic_owner_profiles table
NOTICE: Added unique constraint on userId
NOTICE: Added unique constraint on primaryClinicId
NOTICE: Added foreign key to users table
NOTICE: Added foreign key to clinics table
NOTICE: Added index on userId
NOTICE: Added index on primaryClinicId

Rows returned: X (number of existing clinic owners migrated)
```

### **Step 4: Run Verification Queries**

In the same SQL Editor, run these queries one by one:

```sql
-- 1. Check if table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'clinic_owner_profiles'
) AS table_exists;
-- Expected: table_exists = true

-- 2. Count profiles
SELECT COUNT(*) AS profile_count 
FROM clinic_owner_profiles;
-- Expected: Number of existing clinic owners

-- 3. Check migration status
SELECT migration_name, finished_at 
FROM "_prisma_migrations" 
WHERE migration_name = '20260725155225_add_clinic_owner_profile';
-- Expected: 1 row with migration name and timestamp

-- 4. Sample data check
SELECT 
    u.name AS owner_name,
    cop."businessName",
    c.name AS primary_clinic
FROM users u
LEFT JOIN clinic_owner_profiles cop ON cop."userId" = u.id
LEFT JOIN clinics c ON c.id = cop."primaryClinicId"
WHERE u.role = 'CLINIC_OWNER'
LIMIT 5;
-- Expected: List of clinic owners with their profiles
```

---

## 📋 Option 2: Retry Prisma Migration

If the database lock is released, you can try:

```bash
cd backend

# Wait a moment for locks to clear
sleep 30

# Try migration again
npx prisma migrate deploy
```

**If it still fails:** Use Option 1 (Manual Deployment) instead.

---

## 🔄 After Deployment

### **Step 1: Verify Backend Connection**

```bash
cd backend

# Generate Prisma Client (to sync with new table)
npx prisma generate

# Check database status
npx prisma migrate status
```

**Expected output:**
```
Database schema is up to date!
```

### **Step 2: Restart Backend Server**

**If using PM2:**
```bash
pm2 restart pulsemate-backend
```

**If using Docker:**
```bash
docker-compose restart backend
```

**If using Render/Heroku:**
```bash
# Deploy the updated code
git add .
git commit -m "Add clinic owner profile table"
git push production main
```

### **Step 3: Test the Changes**

#### **Test 1: Register New Clinic Owner**

```bash
POST https://api.pulsemateconnect.in/api/auth/clinic-owner/register

# Check response includes ownerProfile
{
  "user": { ... },
  "clinic": { ... },
  "ownerProfile": {  ← Should be present!
    "id": "...",
    "userId": "...",
    "primaryClinicId": "...",
    "businessName": "...",
    "profileCompleted": false
  }
}
```

#### **Test 2: Login as Clinic Owner**

```bash
POST https://api.pulsemateconnect.in/api/auth/login

# Response:
{
  "accessToken": "...",
  "user": {
    "role": "CLINIC_OWNER",
    "clinicOwnerProfile": {  ← Should be present!
      "businessName": "...",
      "primaryClinicId": "...",
      ...
    }
  }
}
```

#### **Test 3: Verify in Database**

```sql
-- Check profiles were created
SELECT 
    u.name,
    u.mobile,
    cop."businessName",
    cop."profileCompleted",
    c.name AS clinic_name
FROM users u
INNER JOIN clinic_owner_profiles cop ON cop."userId" = u.id
LEFT JOIN clinics c ON c.id = cop."primaryClinicId"
WHERE u.role = 'CLINIC_OWNER';
```

---

## ✅ Success Checklist

- [ ] SQL script executed in Supabase SQL Editor
- [ ] Table `clinic_owner_profiles` created
- [ ] Existing clinic owners migrated
- [ ] Migration marked as applied
- [ ] Prisma Client regenerated (`npx prisma generate`)
- [ ] Backend server restarted
- [ ] New clinic owner registration creates profile
- [ ] Existing clinic owner login returns profile
- [ ] No errors in backend logs

---

## 🐛 Troubleshooting

### **Issue 1: "Table already exists"**

**Solution:** The script is idempotent. It will skip creation if table exists.

### **Issue 2: "Foreign key constraint violation"**

**Solution:** Check that all users in the migration query have corresponding clinics.

```sql
-- Find clinic owners without clinics
SELECT u.id, u.name, u.mobile 
FROM users u 
WHERE u.role = 'CLINIC_OWNER' 
  AND NOT EXISTS (SELECT 1 FROM clinics c WHERE c."ownerId" = u.id);
```

### **Issue 3: "Migration already applied"**

**Solution:** Good! It means it's already done. Just restart backend and test.

### **Issue 4: Backend errors after deployment**

**Check:**
```bash
# 1. Prisma Client up to date?
cd backend
npx prisma generate

# 2. Backend restarted?
pm2 logs pulsemate-backend

# 3. Any SQL errors?
# Check backend console output
```

---

## 📞 Need Help?

**If deployment fails:**

1. **Check Supabase logs**: Project → Logs → PostgreSQL
2. **Check backend logs**: `pm2 logs` or container logs
3. **Verify database connection**: `npx prisma db pull`
4. **Share error message** for troubleshooting

---

## 🎉 Expected Result

After successful deployment:

### **Database:**
```
users table
  └─ clinic_owner_profiles table (NEW!)
       └─ Links to users and clinics

✅ All clinic owners have profiles
✅ New registrations auto-create profiles
✅ Login returns complete user data
```

### **API Response:**
```json
{
  "user": {
    "role": "CLINIC_OWNER",
    "clinicOwnerProfile": {
      "businessName": "PulseMate Clinic",
      "primaryClinicId": "...",
      "profileCompleted": false,
      "totalClinics": 1
    },
    "ownedClinics": [...]
  }
}
```

---

## 🚀 Ready!

Once you've completed the deployment:
1. ✅ Database has new table
2. ✅ Existing owners migrated
3. ✅ Backend restarted
4. ✅ Tests passed

**Your database architecture is now complete!** 🎊

All roles (Patient, Doctor, Receptionist, Clinic Owner, Admin) now have dedicated profile tables following the same consistent pattern.

