# Patient Name Not Showing in Queue - Fix Guide

## 🐛 Issue

Queue screen shows "Patient" with mobile number instead of actual patient name:

```
#2  Patient
    9380328154
```

Should show:
```
#2  Rahul Kumar
    9380328154
```

## 🔍 Root Cause

The `users` table has `name` field that is either:
- `NULL`
- Empty string `''`
- Default placeholder `'Patient'`

When the queue API fetches patient data, it includes:
```javascript
patient: { select: { id: true, name: true, mobile: true } }
```

If `name` is NULL/empty, the frontend falls back to:
```javascript
{item.patient?.name || 'Patient'}
```

## ✅ How to Fix

### Step 1: Check Which Patients Have Missing Names

Run: `CHECK_PATIENT_NAME.sql`

This will show:
```sql
SELECT id, name, mobile, role
FROM users
WHERE mobile LIKE '%9380328154%';
```

### Step 2: Update Patient Name

**Option A: Update Specific Patient**
```sql
UPDATE users
SET name = 'Rahul Kumar'  -- Actual patient name
WHERE mobile = '9380328154' OR mobile = '+919380328154';
```

**Option B: Set Default Name for All Missing**
```sql
UPDATE users
SET name = CONCAT('Patient - ', SUBSTRING(mobile, -10, 10))
WHERE role = 'PATIENT' 
  AND (name IS NULL OR name = '' OR name = 'Patient')
  AND mobile IS NOT NULL;
```

This will create names like:
- `Patient - 9380328154`
- `Patient - 9876543210`

### Step 3: Verify the Fix

```sql
SELECT u.id, u.name, u.mobile, qi."queueNumber"
FROM users u
JOIN queue_items qi ON qi."patientId" = u.id
WHERE u.mobile LIKE '%9380328154%';
```

Should now show the updated name.

### Step 4: Refresh Frontend

- Receptionist should **refresh the page** or **click a different doctor and back**
- Queue data is fetched fresh on each load
- Name should now appear correctly

## 🔧 Why Names Are Missing

### Possible Reasons:

1. **Old Registration Flow**
   - Patient registered before name field was required
   - Registration allowed NULL names

2. **Mobile OTP Login**
   - Some users login with just OTP
   - Never completed profile setup

3. **Incomplete Profile**
   - Patient skipped profile completion
   - Name field left blank

4. **Test Data**
   - Created via script without names
   - Seeding scripts didn't set names

## 🛡️ Prevent This in Future

### Frontend Fix: Require Name on Registration

**File:** `src/screens/auth/PatientRegistrationScreen.jsx` (or similar)

Add validation:
```javascript
if (!formData.name || formData.name.trim() === '') {
  setError('Please enter your name');
  return;
}
```

### Backend Fix: Require Name on User Creation

**File:** `backend/src/controllers/auth.controller.js`

Add validation:
```javascript
if (!name || name.trim() === '') {
  return sendError(res, 'Name is required', 400);
}

// Don't allow default "Patient" as name
if (name.trim().toLowerCase() === 'patient') {
  return sendError(res, 'Please enter your real name', 400);
}
```

### Database Constraint: Make Name NOT NULL

**Migration:**
```sql
-- First, update existing NULL names
UPDATE users
SET name = CONCAT('Patient - ', SUBSTRING(mobile, -10, 10))
WHERE name IS NULL AND mobile IS NOT NULL;

-- Then add NOT NULL constraint
ALTER TABLE users
ALTER COLUMN name SET NOT NULL;
```

## 📊 Check All Missing Names

```sql
-- Count by role
SELECT role, COUNT(*) as missing_names
FROM users
WHERE name IS NULL OR name = '' OR name = 'Patient'
GROUP BY role;

-- List all patients with missing names
SELECT id, mobile, email, "createdAt"
FROM users
WHERE role = 'PATIENT' 
  AND (name IS NULL OR name = '' OR name = 'Patient')
ORDER BY "createdAt" DESC;
```

## 🎯 Quick Fix for Current Issue

**For mobile `9380328154`:**

1. **Find patient ID:**
```sql
SELECT id, name, mobile FROM users WHERE mobile LIKE '%9380328154%';
```

2. **Update name:**
```sql
UPDATE users
SET name = 'Patient Name'  -- Replace with real name
WHERE id = 'user-id-from-step-1';
```

3. **Verify:**
```sql
SELECT u.name, qi."queueNumber"
FROM users u
JOIN queue_items qi ON qi."patientId" = u.id
WHERE u.id = 'user-id-from-step-1';
```

4. **Refresh frontend** - Name should now show!

## 📝 Files Created

- `CHECK_PATIENT_NAME.sql` - Diagnostic queries
- `FIX_MISSING_PATIENT_NAMES.sql` - Fix queries  
- `PATIENT_NAME_NOT_SHOWING_IN_QUEUE.md` - This guide

---

**Status:** Needs database update  
**Impact:** Display only (functionality works)  
**Priority:** Medium (cosmetic issue)  
**Fix Time:** <5 minutes with SQL
