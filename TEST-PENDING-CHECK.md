# Test Pending Registration Check

## How to Check if Code is Working

### Method 1: Test with Browser Console

1. **Try to register with an email/phone that has PENDING status**
2. **You should see error message:**
   ```
   An application with this email/phone is already pending review. 
   Please wait for admin approval or contact support.
   ```

### Method 2: Use Prisma Studio

```bash
cd backend
npx prisma studio
```

Then check the `User` table:
- Filter by `role = CLINIC_OWNER`
- Filter by `approvalStatus = PENDING`
- Note the email and mobile

### Method 3: Check Database Directly

Open the SQL file I created: `CHECK-PENDING-CLINICS.sql`

Run it in your database tool or:
```bash
# If using PostgreSQL CLI
psql -d your_database_name -f CHECK-PENDING-CLINICS.sql
```

### Method 4: Test API Directly

**Test Phone Verification:**
```bash
curl -X POST http://localhost:5000/api/auth/clinic-owner/verify-firebase-phone \
  -H "Content-Type: application/json" \
  -d '{"firebaseIdToken": "your-firebase-token-with-pending-phone"}'
```

**Expected Response (if phone has PENDING status):**
```json
{
  "success": false,
  "message": "An application with this phone number is already pending review. Please wait for admin approval or contact support."
}
```

**Test Email Verification:**
```bash
curl -X POST http://localhost:5000/api/auth/clinic-owner/send-email-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "pending@example.com", "ownerName": "Test"}'
```

**Expected Response (if email has PENDING status):**
```json
{
  "success": false,
  "message": "An application with this email is already pending review. Please wait for admin approval or contact support."
}
```

---

## Current Database Status Check

To check your current database status, run these queries:

### 1. Count Pending Applications
```sql
SELECT COUNT(*) as pending_count
FROM "User"
WHERE role = 'CLINIC_OWNER'
  AND approvalStatus = 'PENDING';
```

### 2. List All Pending Applications
```sql
SELECT 
  id,
  mobile,
  email,
  name,
  createdAt,
  updatedAt
FROM "User"
WHERE role = 'CLINIC_OWNER'
  AND approvalStatus = 'PENDING'
ORDER BY updatedAt DESC;
```

### 3. Check All Statuses
```sql
SELECT 
  approvalStatus,
  COUNT(*) as count
FROM "User"
WHERE role = 'CLINIC_OWNER'
GROUP BY approvalStatus;
```

Expected results might be:
```
approvalStatus | count
---------------|------
PENDING        | 5
VERIFIED       | 2
REJECTED       | 1
null           | 3  (not yet submitted)
```

---

## Test Flow

### Scenario 1: Register with NEW email/phone
**Expected:** ✅ Allows registration, sends OTP

### Scenario 2: Register with PENDING email/phone
**Expected:** ❌ Shows error: "already pending review"

### Scenario 3: Register with VERIFIED email/phone
**Expected:** ❌ Shows error: "already exists and is active"

### Scenario 4: Register with REJECTED email/phone
**Expected:** ❌ Shows error: "already exists"

---

## Code Implementation Summary

### What I Added:

**In `clinicOwnerSendEmailOtpHandler`:**
```javascript
const existing = await prisma.user.findUnique({
  where: { email: normalizedEmail },
  select: { 
    id: true, 
    approvalStatus: true,
    clinicOnboardingData: true 
  },
});

if (existing) {
  if (existing.approvalStatus === 'PENDING') {
    return sendError(res, 'An application with this email is already pending review...', 409);
  }
  // ... other checks
}
```

**In `clinicOwnerVerifyFirebasePhoneHandler`:**
```javascript
const existing = await prisma.user.findUnique({
  where: { mobile },
  select: { 
    id: true, 
    approvalStatus: true,
    clinicOnboardingData: true 
  },
});

if (existing) {
  if (existing.approvalStatus === 'PENDING') {
    return sendError(res, 'An application with this phone number is already pending review...', 409);
  }
  // ... other checks
}
```

---

## Status Code Reference

- **409 Conflict**: Resource already exists
- **400 Bad Request**: Invalid input
- **200 OK**: Success

---

## If You Want to Reset a PENDING Application

```sql
-- Change status from PENDING to REJECTED (allows re-registration)
UPDATE "User"
SET approvalStatus = 'REJECTED'
WHERE email = 'test@example.com'
  AND role = 'CLINIC_OWNER';

-- Or delete the user entirely (use carefully!)
DELETE FROM "User"
WHERE email = 'test@example.com'
  AND role = 'CLINIC_OWNER';
```

---

**The validation is now active!** Try registering with an email or phone that has a PENDING application and you should see the error message.
