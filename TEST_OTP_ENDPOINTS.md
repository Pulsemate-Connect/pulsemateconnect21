# 🧪 Test OTP Login Endpoints

## Backend Status: ✅ RUNNING
- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- Prisma Client: ✅ Regenerated
- Migration: ✅ Applied

---

## 📱 Test Mobile OTP Login

### Step 1: Send Mobile OTP
```bash
curl -X POST http://localhost:5000/api/auth/clinic-owner/send-mobile-otp-login \
  -H "Content-Type: application/json" \
  -d "{\"mobile\": \"+919999999999\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2026-09-06T22:02:00.000Z"
}
```

### Step 2: Verify Mobile OTP
```bash
curl -X POST http://localhost:5000/api/auth/clinic-owner/verify-mobile-otp-login \
  -H "Content-Type: application/json" \
  -d "{\"mobile\": \"+919999999999\", \"otp\": \"123456\"}"
```

**Expected Response (DRAFT user):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "role": "CLINIC_OWNER",
    "approvalStatus": "DRAFT",
    "registrationComplete": false
  },
  "redirectTo": "/clinic-owner/register?resume=true"
}
```

**Expected Response (VERIFIED user):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "role": "CLINIC_OWNER",
    "approvalStatus": "VERIFIED",
    "registrationComplete": true
  },
  "redirectTo": "/clinic-owner/dashboard"
}
```

---

## 📧 Test Email OTP Login

### Step 1: Send Email OTP
```bash
curl -X POST http://localhost:5000/api/auth/clinic-owner/send-email-otp-login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2026-09-06T22:02:00.000Z"
}
```

### Step 2: Verify Email OTP
```bash
curl -X POST http://localhost:5000/api/auth/clinic-owner/verify-email-otp-login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\", \"otp\": \"123456\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "role": "CLINIC_OWNER",
    "approvalStatus": "DRAFT",
    "registrationComplete": false
  },
  "redirectTo": "/clinic-owner/register?resume=true"
}
```

---

## 🧪 Test Registration Flow

### Test 1: Email Verification Creates DRAFT User

**Endpoint:** `POST /api/auth/clinic-owner/verify-email-otp`

**Payload:**
```json
{
  "email": "newowner@example.com",
  "otp": "123456"
}
```

**Expected Result:**
- ✅ User created with `approvalStatus: "DRAFT"`
- ✅ `registrationComplete: false`
- ✅ `registrationStartedAt: <current timestamp>`
- ✅ Returns `tempToken` for mobile linking

### Test 2: Mobile Verification Links to User

**Endpoint:** `POST /api/auth/clinic-owner/verify-firebase-phone`

**Payload:**
```json
{
  "tempToken": "<from previous step>",
  "firebaseIdToken": "<Firebase ID token>",
  "mobile": "+919999999999"
}
```

**Expected Result:**
- ✅ Mobile linked to user
- ✅ `isPhoneVerified: true`
- ✅ User still has `approvalStatus: "DRAFT"`

### Test 3: Form Submission Changes to PENDING

**Endpoint:** `POST /api/clinic-owner/application/submit`

**Headers:**
```
Authorization: Bearer <token>
```

**Expected Result:**
- ✅ `approvalStatus: "DRAFT" → "PENDING"`
- ✅ `registrationComplete: true`
- ✅ `registrationCompletedAt: <current timestamp>`

---

## 📊 Verify Database Changes

### Check User Status
```sql
SELECT 
  id,
  name,
  email,
  mobile,
  role,
  "approvalStatus",
  "registrationComplete",
  "registrationStartedAt",
  "registrationCompletedAt",
  "createdAt"
FROM users
WHERE role = 'CLINIC_OWNER'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Check DRAFT Users
```sql
SELECT 
  COUNT(*) as draft_count
FROM users
WHERE role = 'CLINIC_OWNER'
  AND "approvalStatus" = 'DRAFT';
```

### Check Incomplete Registrations
```sql
SELECT 
  COUNT(*) as incomplete_count
FROM users
WHERE role = 'CLINIC_OWNER'
  AND "approvalStatus" = 'DRAFT'
  AND "registrationComplete" = false;
```

---

## 🔍 Debug Tips

### If OTP Send Fails
1. Check Twilio credentials in `.env`
2. Check email service (AWS SES/SendGrid) credentials
3. Check logs: Look at backend terminal for errors

### If OTP Verify Fails
1. Check if user exists with that mobile/email
2. Check if OTP is expired (5 min TTL)
3. Verify OTP is correct (check `otp_attempts` table)

### If Status Doesn't Change
1. Check Prisma client was regenerated
2. Check database has new columns
3. Run `VERIFY_MIGRATION.sql` in Supabase

### If Login After Registration Fails
1. Check `blockIfPasswordLoginDisallowed` allows DRAFT users
2. Check token is valid
3. Check user has `isEmailVerified: true`

---

## ✅ Success Criteria

After all tests pass, you should see:

### Database
- ✅ New users created with DRAFT status
- ✅ Mobile linked to user accounts
- ✅ Status changes to PENDING on submit
- ✅ Timestamps tracked correctly

### API Endpoints
- ✅ All 4 OTP endpoints respond
- ✅ OTP sends successfully
- ✅ OTP verification works
- ✅ JWT tokens generated
- ✅ Correct redirect URLs returned

### User Experience
- ✅ No password required
- ✅ Can login with OTP anytime
- ✅ DRAFT users redirected to continue registration
- ✅ PENDING users see application status
- ✅ VERIFIED users access dashboard

---

## 🎯 Next Steps

After verifying backend works:

1. **Frontend Changes** (Optional - already documented):
   - Remove password fields from registration
   - Add OTP login page
   - Handle post-login routing based on status
   - See `IMPLEMENTATION_SUMMARY.md` for details

2. **Cleanup Automation** (Optional):
   - Schedule `cleanup-draft-registrations.js` to run daily
   - See `DRAFT_CLEANUP_GUIDE.md` for setup instructions

3. **Monitoring**:
   - Track DRAFT → PENDING conversion rate
   - Monitor registration completion times
   - Identify drop-off points

---

**Ready to test?** Start with the mobile OTP endpoints! 🚀
