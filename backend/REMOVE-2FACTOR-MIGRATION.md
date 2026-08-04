# 🔥 Remove 2Factor.in - Backend Migration Guide

**Status:** ⏳ READY TO EXECUTE (after frontend testing passes)  
**Date:** August 4, 2026  
**Impact:** Removes all 2Factor.in SMS OTP code, keeps only Firebase Phone Auth

---

## ⚠️ CRITICAL: When to Execute

**DO NOT execute until:**
1. ✅ Firebase Console is configured (Phone Auth enabled, SHA keys added)
2. ✅ New production build v1.3.6 (76) is created with React Native Firebase
3. ✅ Build is tested and OTP flow works without reCAPTCHA
4. ✅ Build is deployed to Play Store
5. ✅ Users have updated to new version (monitor adoption rate)

**Recommended Timeline:**
- Deploy new app build to Play Store
- Enable staged rollout (10% → 50% → 100% over 7 days)
- Monitor adoption: Wait until 95%+ users are on v1.3.6+
- Then execute this backend migration

---

## 📋 Files to Modify/Delete

### Files to DELETE:
1. `backend/src/services/twofactor.service.js` - 2Factor.in integration

### Files to UPDATE:
1. `backend/src/routes/auth.routes.js` - Remove 2Factor routes
2. `backend/src/controllers/auth.controller.js` - Remove 2Factor handlers
3. `backend/package.json` - Remove 2Factor dependencies (if any)
4. `backend/.env` - Remove TWOFACTOR_API_KEY

### Environment Variables to REMOVE (Render):
- `TWOFACTOR_API_KEY`

### Environment Variables to KEEP:
- `FIREBASE_SERVICE_ACCOUNT_JSON` ✅

---

## 🔧 Step-by-Step Migration

### Step 1: Backup Current State

```bash
cd backend

# Create backup branch
git checkout -b backup-before-2factor-removal
git push origin backup-before-2factor-removal

# Return to main
git checkout main
```

### Step 2: Remove 2Factor.in Service File

```bash
# Delete the service file
rm src/services/twofactor.service.js
```

Or manually delete: `backend/src/services/twofactor.service.js`

### Step 3: Update Routes File

**File:** `backend/src/routes/auth.routes.js`

**REMOVE these imports:**
```javascript
// ❌ REMOVE
const {
  patientSendOtpHandler,
  patientVerifyOtpHandler,
  clinicOwnerSendOtpHandler,
  clinicOwnerVerifyOtpHandler,
  // ... (remove 2Factor handlers)
} = require('../controllers/auth.controller');

const {
  otpSendLimiter,
  otpVerifyLimiter,
  // ... (keep firebasePhoneLoginLimiter)
} = require('../middleware/rateLimit.middleware');
```

**REMOVE these routes:**
```javascript
// ❌ REMOVE - Patient 2Factor SMS OTP (old)
router.post('/patient/send-otp', otpSendLimiter, validateRequest(patientSendOtpSchema), patientSendOtpHandler);
router.post('/patient/verify-otp', otpVerifyLimiter, validateRequest(patientVerifyOtpSchema), patientVerifyOtpHandler);

// ❌ REMOVE - Clinic owner legacy OTP
router.post('/clinic-owner/send-otp', otpSendLimiter, validateRequest(clinicOwnerOtpSendSchema), clinicOwnerSendOtpHandler);
router.post('/clinic-owner/verify-otp', otpVerifyLimiter, validateRequest(clinicOwnerOtpVerifySchema), clinicOwnerVerifyOtpHandler);

// ❌ REMOVE - Backward-compat endpoints
router.post('/send-otp', otpSendLimiter, validateRequest(patientSendOtpSchema), patientSendOtpHandler);
router.post('/verify-otp', otpVerifyLimiter, validateRequest(patientVerifyOtpSchema), patientVerifyOtpHandler);
```

**KEEP these routes:**
```javascript
// ✅ KEEP - Firebase Phone Auth (new)
router.post(
  '/patient/firebase-phone-login',
  firebasePhoneLoginLimiter,
  validateRequest(firebasePhoneLoginSchema),
  patientFirebasePhoneLoginHandler
);

router.post(
  '/clinic-owner/verify-firebase-phone',
  firebasePhoneVerifyLimiter,
  validateRequest(clinicOwnerFirebasePhoneVerifySchema),
  clinicOwnerVerifyFirebasePhoneHandler
);

router.post(
  '/doctor/verify-firebase-phone',
  firebasePhoneVerifyLimiter,
  validateRequest(doctorFirebasePhoneVerifySchema),
  doctorVerifyFirebasePhoneHandler
);
```

### Step 4: Update Controllers File

**File:** `backend/src/controllers/auth.controller.js`

**REMOVE these imports:**
```javascript
// ❌ REMOVE
const { sendOtp, verifyOtp } = require('../services/otp.service');
```

**REMOVE these handler functions:**

1. **patientSendOtpHandler** (~50 lines)
   - Starts at line ~130
   - Handles `/patient/send-otp`
   
2. **patientVerifyOtpHandler** (~100 lines)
   - Starts at line ~180
   - Handles `/patient/verify-otp`

3. **clinicOwnerSendOtpHandler** (~20 lines)
   - Legacy clinic owner OTP send

4. **clinicOwnerVerifyOtpHandler** (~20 lines)
   - Legacy clinic owner OTP verify

**KEEP these handler functions:**

1. **patientFirebasePhoneLoginHandler** ✅
   - Firebase Phone Auth for patients
   
2. **clinicOwnerVerifyFirebasePhoneHandler** ✅
   - Firebase Phone Auth for clinic owners

3. **doctorVerifyFirebasePhoneHandler** ✅
   - Firebase Phone Auth for doctors

### Step 5: Check for Other 2Factor References

```bash
# Search for any remaining 2Factor references
cd backend
grep -r "2factor\|twofactor\|2Factor\|TwoFactor" src/
```

Remove any remaining references found.

### Step 6: Remove Environment Variables

**In Render Dashboard:**
1. Go to your backend service
2. Navigate to Environment tab
3. Remove: `TWOFACTOR_API_KEY`
4. Verify: `FIREBASE_SERVICE_ACCOUNT_JSON` exists
5. Click "Save"

**In local `.env`:**
```bash
# ❌ REMOVE
TWOFACTOR_API_KEY=your_key_here

# ✅ KEEP
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Step 7: Update Package.json (if needed)

Check if there are any 2Factor.in npm packages:

```bash
cd backend
npm list | grep -i "2factor\|twofactor"
```

If found, remove them:
```bash
npm uninstall <package-name>
```

### Step 8: Test Locally

```bash
cd backend

# Install dependencies
npm install

# Run locally
npm run dev

# Test Firebase endpoint
curl -X POST http://localhost:5000/api/auth/patient/firebase-phone-login \
  -H "Content-Type: application/json" \
  -d '{"firebaseIdToken": "test_token"}'

# Should respond (will fail token verification, but endpoint exists)
```

### Step 9: Commit Changes

```bash
cd backend

# Stage changes
git add .

# Commit
git commit -m "feat: Remove 2Factor.in, migrate to Firebase Phone Auth only

- Remove patientSendOtpHandler and patientVerifyOtpHandler
- Remove 2Factor.in service (twofactor.service.js)
- Remove /patient/send-otp and /patient/verify-otp routes
- Remove clinic owner legacy OTP routes
- Remove backward-compat OTP endpoints
- Keep only Firebase Phone Auth endpoints
- Remove TWOFACTOR_API_KEY environment variable

BREAKING CHANGE: Old OTP endpoints removed. All clients must use Firebase Phone Auth.
Clients on app version < 1.3.6 will fail to login after this deployment.

Cost Savings: ₹1,584/year (₹132/month)"

# Push to GitHub
git push origin main
```

### Step 10: Deploy to Render

Render will auto-deploy from GitHub push.

**Monitor deployment:**
1. Go to Render dashboard
2. Watch deployment logs
3. Verify successful deployment
4. Check for errors

### Step 11: Verify Production

**Test Firebase endpoint:**
```bash
# Test production endpoint
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/firebase-phone-login \
  -H "Content-Type: application/json" \
  -d '{"firebaseIdToken": "test_token"}'

# Should respond with 401 (token invalid) - endpoint is working
```

**Test old endpoints are gone:**
```bash
# These should return 404
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+911234567890"}'

# Expected: 404 Not Found ✅
```

### Step 12: Monitor Logs

```bash
# Watch Render logs for any issues
# Check for:
# - Successful logins with Firebase
# - No errors about missing 2Factor
# - No 404 errors (unless old clients still trying old endpoints)
```

---

## 🧪 Testing Checklist

After deployment, verify:

- [ ] Firebase login endpoint works: `/patient/firebase-phone-login`
- [ ] Old OTP endpoints return 404: `/patient/send-otp`, `/patient/verify-otp`
- [ ] Backend logs show no 2Factor errors
- [ ] Users on v1.3.6+ can login successfully
- [ ] No server errors in Render logs
- [ ] Firebase Console shows authentication events
- [ ] TWOFACTOR_API_KEY is removed from Render
- [ ] FIREBASE_SERVICE_ACCOUNT_JSON is present in Render
- [ ] Clinic owner registration works (Firebase phone verification)
- [ ] Doctor registration works (Firebase phone verification)

---

## 🚨 Rollback Plan

If something goes wrong:

### Quick Rollback (5 min):

```bash
cd backend

# Revert the commit
git revert HEAD
git push origin main

# Render will auto-deploy the rollback
```

### Full Rollback (15 min):

```bash
# Restore from backup branch
git checkout backup-before-2factor-removal
git checkout -b restore-2factor
git push origin restore-2factor

# Update main to restore branch
git checkout main
git reset --hard backup-before-2factor-removal
git push origin main --force

# Re-add TWOFACTOR_API_KEY in Render
```

---

## 📊 Before/After Comparison

| Aspect | Before (2Factor.in) | After (Firebase) |
|--------|---------------------|------------------|
| **Patient Login Endpoint** | `/patient/send-otp` + `/patient/verify-otp` | `/patient/firebase-phone-login` |
| **OTP Generation** | Backend (2Factor.in API) | Frontend (Firebase SDK) |
| **OTP Delivery** | 2Factor.in SMS service | Firebase SMS service |
| **OTP Verification** | Backend (2Factor.in API) | Frontend (Firebase SDK) |
| **Backend Role** | Generate + verify OTP | Verify Firebase token only |
| **Cost** | ₹132/month | ₹0 (Firebase free tier) |
| **reCAPTCHA** | Not needed | Not needed (native) |
| **SMS Auto-fill** | No | Yes (Android) |
| **Dependencies** | `twofactor.service.js` | Firebase Admin SDK |
| **Environment Vars** | `TWOFACTOR_API_KEY` | `FIREBASE_SERVICE_ACCOUNT_JSON` |

---

## 💰 Cost Impact

**Before:**
- 2Factor.in: ₹132/month = ₹1,584/year
- Total SMS cost: ₹1,584/year

**After:**
- Firebase Phone Auth: ₹0 (free tier covers up to 10,000 verifications/month)
- Total SMS cost: ₹0

**Annual Savings:** ₹1,584 💰

---

## 📝 Migration Summary

### What Gets Removed:
1. ❌ `twofactor.service.js` - 2Factor.in integration
2. ❌ `patientSendOtpHandler` - Legacy OTP send
3. ❌ `patientVerifyOtpHandler` - Legacy OTP verify
4. ❌ `/patient/send-otp` route
5. ❌ `/patient/verify-otp` route
6. ❌ Clinic owner legacy OTP routes
7. ❌ Doctor legacy OTP routes (if any)
8. ❌ `TWOFACTOR_API_KEY` environment variable

### What Gets Kept:
1. ✅ `patientFirebasePhoneLoginHandler` - Firebase login
2. ✅ `clinicOwnerVerifyFirebasePhoneHandler` - Firebase verification
3. ✅ `doctorVerifyFirebasePhoneHandler` - Firebase verification
4. ✅ `/patient/firebase-phone-login` route
5. ✅ Firebase Admin SDK
6. ✅ `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable

### Impact:
- **Users on v1.3.6+:** ✅ No impact, using Firebase
- **Users on v1.3.5 or older:** ❌ Cannot login (must update app)
- **Cost:** ✅ Save ₹1,584/year
- **UX:** ✅ Better (no reCAPTCHA, SMS auto-fill)
- **Performance:** ✅ Faster (native Firebase)

---

## 🎯 Final Checklist Before Execution

- [ ] Firebase Console configured (Phone Auth enabled, SHA keys added)
- [ ] New app build v1.3.6 (76) created
- [ ] Build tested successfully (OTP works, no reCAPTCHA)
- [ ] Build deployed to Play Store
- [ ] Staged rollout enabled (10% → 50% → 100%)
- [ ] User adoption monitored (wait for 95%+ on v1.3.6+)
- [ ] Backup branch created (`backup-before-2factor-removal`)
- [ ] FIREBASE_SERVICE_ACCOUNT_JSON confirmed in Render
- [ ] Team notified about migration
- [ ] Rollback plan understood and ready

---

**IMPORTANT:** Do not execute this migration until the new app version (1.3.6+) is deployed and adopted by most users!

**Last Updated:** August 4, 2026  
**Status:** ⏳ Ready to Execute (after frontend adoption)  
**Estimated Time:** 30 minutes

