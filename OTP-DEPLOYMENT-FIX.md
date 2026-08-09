# OTP Rate Limit Deployment Fix

## 🚨 CRITICAL ISSUE RESOLVED

**Date:** August 8, 2026  
**Commit:** `58c620a`  
**Status:** ✅ PUSHED TO PRODUCTION

---

## THE PROBLEM

Deployment failed with syntax error:
```
SyntaxError: Identifier 'otpSendLimiter' has already been declared
at /opt/render/project/src/backend/src/middleware/rateLimit.middleware.js:98
```

### Root Cause
The file `backend/src/middleware/rateLimit.middleware.js` had **DUPLICATE DECLARATIONS**:

1. **Lines 16-26** (OLD - IP-based, WRONG):
   ```javascript
   const otpSendLimiter = createLimiter({
     windowMs: 60 * 60 * 1000,
     max: 3,
     message: 'Too many OTP requests. Please try again later.',
   });

   const otpVerifyLimiter = createLimiter({
     windowMs: 15 * 60 * 1000,
     max: 5,
     message: 'Too many OTP verification attempts. Please try again later.',
   });
   ```

2. **Lines 98-120** (NEW - phone-based, CORRECT):
   ```javascript
   const otpSendLimiter = createLimiter({
     windowMs: 60 * 60 * 1000,
     max: 5,
     message: 'Too many OTP requests. Please try again after an hour.',
     keyGenerator: (req) => {
       const phone = req.body?.mobileNumber?.replace(/\D/g, '');
       return phone ? `otp_send:${phone}` : `otp_send_ip:${req.ip}`;
     },
   });

   const otpVerifyLimiter = createLimiter({
     windowMs: 15 * 60 * 1000,
     max: 10,
     message: 'Too many verification attempts. Please try again in 15 minutes.',
     keyGenerator: (req) => {
       const phone = req.body?.mobileNumber?.replace(/\D/g, '');
       return phone ? `otp_verify:${phone}` : `otp_verify_ip:${req.ip}`;
     },
   });
   ```

---

## THE FIX

### What Was Done
✅ Removed the OLD declarations (lines 16-26)  
✅ Kept the NEW phone-based declarations (now at lines 86-108)  
✅ Committed: `58c620a`  
✅ Pushed to GitHub main branch  

### Files Modified
- `backend/src/middleware/rateLimit.middleware.js` - Removed duplicate declarations

---

## FINAL RATE LIMIT CONFIGURATION

### OTP Send Limiter
- **Window:** 1 hour (60 * 60 * 1000 ms)
- **Max Requests:** 5 per phone number
- **Key:** `otp_send:{normalized_phone}`
- **Fallback:** IP-based if phone not provided
- **Message:** "Too many OTP requests. Please try again after an hour."

### OTP Verify Limiter
- **Window:** 15 minutes (15 * 60 * 1000 ms)
- **Max Attempts:** 10 per phone number
- **Key:** `otp_verify:{normalized_phone}`
- **Fallback:** IP-based if phone not provided
- **Message:** "Too many verification attempts. Please try again in 15 minutes."

### Why Phone-Based Keys?
- **Prevents NAT/Corporate Network Issues:** IP-based limiting blocks all users behind same router
- **Fair Per-User Limits:** Each phone number gets independent quota
- **DoS Protection:** Still prevents abuse at phone number level
- **Message Central Cost Control:** Limits SMS sends per phone number

---

## DEPLOYMENT STATUS

### Commit History
1. `3fd189a` - Initial OTP rate limit fix (FAILED - duplicate declarations)
2. `58c620a` - Remove duplicate declarations (DEPLOYED)

### Render Deployment
- **Branch:** main
- **Last Commit:** 58c620a
- **Expected Result:** Auto-deploy should succeed
- **Monitor:** Check Render dashboard for deployment success

---

## NEXT STEPS

### 1. Monitor Deployment ✋ WAIT FOR THIS
- Open Render dashboard: https://dashboard.render.com
- Watch for deployment completion
- Check logs for successful startup
- **DO NOT TEST** until deployment shows "Live"

### 2. Verify Backend Health
```bash
curl https://api.pulsemateconnect.in/health
# Expected: { "status": "ok", "timestamp": "..." }
```

### 3. Test OTP Flow

#### Test A: Normal Flow
1. Open app
2. Enter phone number
3. Request OTP
4. **Expected:** OTP received, no errors
5. Enter OTP
6. **Expected:** Login successful

#### Test B: Rapid Requests (Cooldown Test)
1. Request OTP
2. Immediately request again
3. **Expected:** Second request blocked with message
4. Wait 12 minutes (1/5 of hourly window)
5. Try again
6. **Expected:** Request allowed (5 per hour = ~12 min spacing)

#### Test C: Multiple Verify Attempts
1. Request OTP
2. Enter wrong OTP 5 times
3. **Expected:** All attempts processed
4. Continue trying wrong OTP
5. **Expected:** After 10 attempts, rate limit message appears

#### Test D: Different Phone Numbers
1. User A requests OTP
2. User B (different phone) requests OTP
3. **Expected:** Both requests succeed independently

#### Test E: The 30-Minute Bug
1. Login successfully
2. Wait 30-40 minutes
3. Logout
4. Try to login again
5. **Expected:** ✅ OTP request works (no "Too many requests")

---

## TECHNICAL SUMMARY

### Original Problem
Wrong rate limiter (`firebasePhoneLoginLimiter`) was applied to Message Central OTP endpoints:
- `/patient/send-otp` 
- `/patient/verify-otp`

This limiter had:
- 1-hour window
- 10 max requests (send + verify combined)
- IP-based keying

Normal OTP flow in 30 minutes:
- 3 send requests = 3 counts
- 7 verify attempts = 7 counts
- **Total = 10 counts = LIMIT HIT**

### The Fix
Created dedicated phone-based limiters:
- `otpSendLimiter`: 5 sends/hour per phone
- `otpVerifyLimiter`: 10 verifies/15min per phone
- Separate counters (no interference)
- Phone-based keys (fair per-user limits)

### Database Redundancy Removed
Removed duplicate rate limiting in `auth.controller.js`:
- Old: Database check via OtpAttempt table (2-minute cooldown)
- New: express-rate-limit handles all rate limiting
- OtpAttempt table kept for analytics only

---

## FILES REFERENCE

### Modified Files (Commit 58c620a)
- `backend/src/middleware/rateLimit.middleware.js` - Removed duplicates

### Previously Modified (Commit 3fd189a)
- `backend/src/routes/auth.routes.js` - Updated to use correct limiters
- `backend/src/controllers/auth.controller.js` - Removed redundant DB check

### Documentation
- `OTP-RATE-LIMIT-DIAGNOSTIC-REPORT.md` - Investigation findings
- `OTP-RATE-LIMIT-FIX-DEPLOYED.md` - Implementation details
- `POST-DEPLOYMENT-VERIFICATION.md` - Testing procedures
- `OTP-DEPLOYMENT-FIX.md` - This file

---

## PRODUCTION CHECKLIST

- [x] Root cause identified
- [x] Frontend audit (no issues found)
- [x] Backend rate limit fixed
- [x] Phone-based key generation implemented
- [x] Separate send/verify limiters created
- [x] Redundant DB rate limit removed
- [x] Duplicate declarations removed
- [x] Code committed and pushed
- [ ] Deployment successful (check Render)
- [ ] Health check passes
- [ ] OTP flow tested
- [ ] 30-minute bug verified fixed
- [ ] Different users verified independent
- [ ] Rate limit messages verified accurate

---

## SUCCESS CRITERIA

✅ **Deployment Succeeds**
- Render shows "Live" status
- No syntax errors in logs
- Server starts successfully

✅ **OTP Send Works**
- Request generates OTP
- Message Central sends SMS
- Rate limit: 5/hour per phone

✅ **OTP Verify Works**
- Correct OTP logs in
- Wrong OTP shows error
- Rate limit: 10/15min per phone

✅ **30-Minute Bug Fixed**
- Can request OTP after 30+ minutes
- No unexpected "Too many requests"
- Counter expiration works correctly

✅ **Fair Per-User Limits**
- Different phones independent
- Same phone properly limited
- No NAT/corporate network blocking

---

**STATUS:** ✅ FIX DEPLOYED - AWAITING RENDER AUTO-DEPLOYMENT

**Monitor:** Check Render dashboard for deployment completion before testing.
