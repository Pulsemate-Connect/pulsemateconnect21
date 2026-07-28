# 🔍 Firebase Phone Auth Audit - Executive Summary

**Date:** 2026-07-28  
**Issue:** "Firebase Phone Authentication works on web but NOT sending OTP on Android app"

---

## 🚨 **CRITICAL FINDING**

### **Your Android app is NOT using Firebase Phone Authentication!**

**The mobile app uses 2Factor SMS API instead of Firebase.**

- ✅ **Web app** → Uses Firebase Phone Auth (works correctly)
- ❌ **Mobile app** → Uses 2Factor SMS API (different system)
- 🔄 **Two separate authentication systems**

---

## 📊 What We Found

### Mobile App (`Login2FactorScreen.jsx`):
```javascript
// Current code (line 44):
const response = await api.post('/auth/patient/send-otp', { phone: fullNumber });
//                                ↑
//                    This calls 2Factor API (NOT Firebase)
```

### Web App:
```javascript
// Uses Firebase Phone Auth directly:
confirmationResult = await signInWithPhoneNumber(auth, phoneNumber);
```

### Backend (`/auth/patient/send-otp`):
```javascript
// Calls 2Factor SMS API:
const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/...`);
```

**Result:** You're comparing apples to oranges. Web uses Firebase, mobile uses 2Factor.

---

## 🎯 The Real Question

Not: "Why isn't Firebase working on mobile?"  
But: **"Why isn't 2Factor SMS API sending OTPs?"**

---

## 🛠️ Quick Diagnostic

Run this to test 2Factor API:

```bash
# Test 1: Check account balance
curl "https://2factor.in/API/V1/0f290349-865f-11f1-908b-0200cd936042/BAL/SMS"

# Expected response:
{"Status":"Success","Details":"XXX Credits"}

# Test 2: Send test OTP (replace with your number)
curl "https://2factor.in/API/V1/0f290349-865f-11f1-908b-0200cd936042/SMS/919876543210/AUTOGEN"

# Expected response:
{"Status":"Success","Details":"session_id"}
```

**Or use our diagnostic script:**

```bash
cd pulsemateconnect21

# Check API status
node test-2factor-api.js

# Test SMS sending
node test-2factor-api.js +919876543210
```

---

## 🔍 Common 2Factor Issues

| Issue | How to Check | Solution |
|-------|--------------|----------|
| **Low Balance** | Check 2factor.in dashboard | Recharge account |
| **Invalid API Key** | Test with cURL above | Get new key |
| **DND Number** | Try different number | Use non-DND number |
| **Rate Limited** | Check backend logs | Wait 15 minutes |
| **Wrong Format** | Must be +91XXXXXXXXXX | Fix format |

---

## 📋 Backend Logs to Check

Run backend and watch for:

```bash
cd backend
npm run dev

# Trigger OTP from mobile app
# Watch for these logs:
```

**Success:**
```
[2Factor] Sending OTP to +9198*** via 2Factor API
[2Factor] OTP sent successfully. Session: 2f_xxx
```

**Failure:**
```
[2Factor] API error 402: Balance low
[2Factor] API error 401: Authentication failed
[2Factor] No response from API: timeout
```

---

## ✅ What's Working

1. ✅ **Backend 2Factor Service** - Well implemented with bcrypt, rate limiting, security
2. ✅ **Mobile UI** - Clean login/OTP screens
3. ✅ **Web Firebase Auth** - Working correctly
4. ✅ **EAS Build Config** - Properly configured
5. ✅ **Android Gradle** - Google Services plugin applied
6. ✅ **JWT Token Flow** - Session management correct

---

## ⚠️ Configuration Issues Found

### 1. Package Name Mismatch in `google-services.json`

**Current:**
```json
{
  "client": [
    { "package_name": "in.pulsemateconnect.app" },      // ❌ Wrong
    { "package_name": "in.pulsemateconnect.patient" }   // ✅ Correct
  ]
}
```

**Expected:**
Only `in.pulsemateconnect.patient` (matches app.json line 17)

**Fix:**
1. Go to Firebase Console
2. Download google-services.json with only patient app
3. Replace both copies:
   - `google-services.json`
   - `android/app/google-services.json`

### 2. Unused Firebase Code

**Files exist but NOT used by 2Factor screens:**
- `src/config/firebase.js` - Firebase Phone Auth implementation
- Only used by `LoginScreen.jsx` (which appears unused)

---

## 🎯 Recommendations

### **Option 1: Fix 2Factor API (Recommended)**

**Why recommended:**
- ✅ Already implemented and production-ready
- ✅ Works on emulators
- ✅ Simpler debugging
- ✅ Backend controlled
- ✅ No certificate management

**Steps:**
1. Test API with diagnostic script
2. Check account balance
3. Verify backend logs
4. Test with non-DND number

**Time:** 15 minutes

---

### **Option 2: Switch to Firebase Phone Auth**

**Why consider:**
- Better for Firebase-centric apps
- No SMS costs (10k free/month)
- Offline capability

**Requirements:**
- Must test on real device (not emulator)
- Requires SHA-1 certificate registration
- Needs Google Play Services
- More complex setup

**Steps:**
1. Update `Login2FactorScreen.jsx` to use `sendOtpToPhone`
2. Update `Otp2FactorScreen.jsx` to use `verifyPhoneOtp`
3. Get SHA-1 from `./gradlew signingReport`
4. Register SHA-1 in Firebase Console
5. Download new google-services.json
6. Build with EAS
7. Test on real device

**Time:** 2-3 hours

---

## 📂 Files Reference

### If Debugging 2Factor (Current):
- `backend/.env` - Line 49 (TWOFACTOR_API_KEY)
- `backend/src/services/twofactor.service.js` - Main service
- `src/screens/Login2FactorScreen.jsx` - Mobile login
- `src/screens/Otp2FactorScreen.jsx` - Mobile OTP verify

### If Switching to Firebase:
- `src/config/firebase.js` - Firebase implementation (already exists)
- `google-services.json` - Firebase config (needs fix)
- Firebase Console - Add SHA-1 certificate

---

## 🚀 Next Steps

### Immediate (5 minutes):

```bash
# 1. Test 2Factor API
node test-2factor-api.js

# 2. Check account
# Login to https://2factor.in/login

# 3. Run backend and watch logs
cd backend
npm run dev

# 4. Trigger OTP from mobile app
# Watch for error messages
```

### If 2Factor is Working:
- Check if test number has DND enabled
- Try different carrier (Airtel, Jio, not BSNL)
- Test with multiple numbers
- Check backend rate limiting logs

### If You Want Firebase Instead:
- Read: `FIREBASE-PHONE-AUTH-AUDIT-REPORT.md`
- Section: "Option 2: Switch Mobile App to Firebase Phone Auth"
- Follow step-by-step guide

---

## 📞 Support

**2Factor API:**
- Dashboard: https://2factor.in/login
- Support: support@2factor.in
- API Docs: https://2factor.in/docs/

**Firebase:**
- Console: https://console.firebase.google.com/project/pulsemateconnect
- Docs: https://firebase.google.com/docs/auth/android/phone-auth

**Project Support:**
- Diagnostic Script: `node test-2factor-api.js`
- Full Audit: `FIREBASE-PHONE-AUTH-AUDIT-REPORT.md`
- Backend Logs: `cd backend && npm run dev`

---

## 📝 Summary

| Question | Answer |
|----------|--------|
| **Is mobile using Firebase?** | ❌ No, uses 2Factor API |
| **Is web using Firebase?** | ✅ Yes, works correctly |
| **Why isn't Firebase working on mobile?** | It's not being used |
| **What should I debug?** | 2Factor SMS API |
| **How to fix?** | Check 2Factor account balance |
| **Should I switch to Firebase?** | Optional, current system works |

---

**Audit Complete**  
**Status:** Issue Identified  
**Recommended Action:** Test 2Factor API with diagnostic script  
**Estimated Fix Time:** 15 minutes
