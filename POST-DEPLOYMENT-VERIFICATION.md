# ✅ POST-DEPLOYMENT VERIFICATION GUIDE

**Deployment Status:** PUSHED TO REPOSITORY  
**Commit:** 3fd189a  
**Date:** 2026-08-08  
**Time:** Just now

---

## 🚀 DEPLOYMENT STATUS

### ✅ Git Operations Complete

```
[main 3fd189a] fix(auth): Correct OTP rate limiting with phone-based limits
 3 files changed, 45 insertions(+), 19 deletions(-)
 
Pushed to: github.com/Pulsemate-Connect/pulsemateconnect21.git
Branch: main
Status: SUCCESS
```

### ⏳ Render Auto-Deployment

Your Render backend should now be automatically deploying the changes.

**Monitor deployment:**
1. Open: https://dashboard.render.com
2. Select your backend service (api.pulsemateconnect.in)
3. Look for:
   - "Deploying..." status
   - Build logs showing "Installing dependencies..."
   - "Build successful"
   - "Live" status

**Expected deployment time:** 5-10 minutes

---

## 🧪 VERIFICATION TESTS

### Test 1: Basic OTP Flow (Critical)

**Wait until Render shows "Live" status, then test:**

#### Step 1: Send OTP
```bash
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+919876543210"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "...",
    "expiresIn": 180,
    "message": "OTP sent successfully"
  }
}
```

**Status Code:** 200 OK

#### Step 2: Verify OTP
```bash
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "<from-step-1>",
    "otp": "<6-digit-code>",
    "mobileNumber": "+919876543210"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {...}
  }
}
```

**Status Code:** 200 OK

✅ **If both work:** Basic flow is operational

---

### Test 2: Rate Limit - Send OTP (Important)

Test that phone-based limiting works correctly:

```bash
# Send 5 OTPs to the same number
for i in {1..5}; do
  echo "Request $i of 5..."
  curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
    -H "Content-Type: application/json" \
    -d '{"mobileNumber": "+919876543210"}'
  echo ""
  sleep 2
done

# 6th request should be blocked
echo "Request 6 (should be rate limited)..."
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+919876543210"}'
```

**Expected for requests 1-5:**
```json
{"success": true, ...}
```

**Expected for request 6:**
```json
{
  "success": false,
  "message": "Too many OTP requests. Please try again after an hour."
}
```

**Status Code:** 429 Too Many Requests

✅ **If 6th request blocked:** Rate limiting is working

---

### Test 3: Phone Number Isolation (Critical)

Verify that different phone numbers don't affect each other:

```bash
# Phone 1: Send 5 OTPs (hits limit)
for i in {1..5}; do
  curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
    -H "Content-Type: application/json" \
    -d '{"mobileNumber": "+919876543210"}'
done

# Phone 2: Should still work (different phone)
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+919876543211"}'
```

**Expected:** Phone 2 request succeeds with 200 OK

✅ **If Phone 2 works:** Phone-based limiting is working correctly

---

### Test 4: Verify Attempts (Important)

Test that verification has separate, more lenient limits:

```bash
# Send OTP
RESPONSE=$(curl -s -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+919876543210"}')

VERIFICATION_ID=$(echo $RESPONSE | grep -o '"verificationId":"[^"]*"' | cut -d'"' -f4)

# Try wrong OTP 9 times
for i in {1..9}; do
  echo "Wrong OTP attempt $i of 9..."
  curl -X POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp \
    -H "Content-Type: application/json" \
    -d "{
      \"verificationId\": \"$VERIFICATION_ID\",
      \"otp\": \"000000\",
      \"mobileNumber\": \"+919876543210\"
    }"
done

# 10th attempt should still work
echo "Attempt 10 (should still work)..."
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d "{
    \"verificationId\": \"$VERIFICATION_ID\",
    \"otp\": \"000000\",
    \"mobileNumber\": \"+919876543210\"
  }"
```

**Expected:** All 10 attempts allowed (before hitting verify limit)

✅ **If 10 attempts work:** Verify limiter is correctly configured

---

### Test 5: Mobile App Test (Most Important)

**Use the actual PulseMate Connect mobile app:**

1. **Open app**
2. **Go to Login screen**
3. **Enter mobile number** → Request OTP
4. **Verify OTP** → Should work ✅
5. **Logout**
6. **Login again** → Request OTP (2nd time)
7. **Verify OTP** → Should work ✅
8. **Repeat 3 more times** → Should work ✅
9. **Try 6th OTP request** → Should show "Too many OTP requests" (rate limit working)

**Critical check:** After 30 minutes of use, app should NOT show "Too many requests" unless you legitimately hit the 5 send/hour limit.

---

## 📊 WHAT TO LOOK FOR IN RENDER LOGS

### ✅ Good Logs (Expected)

```
[2026-08-08 15:30:00] [RateLimit] Request from otp_send:9876543210 (1/5)
[2026-08-08 15:30:00] [MessageCentral] ✅ OTP sent successfully
[2026-08-08 15:30:00] [Auth] OTP sent to +919876543210 via Message Central

[2026-08-08 15:32:00] [RateLimit] Request from otp_verify:9876543210 (1/10)
[2026-08-08 15:32:00] [Auth] OTP verified successfully for +919876543210
[2026-08-08 15:32:00] [Auth] Patient login: <user-id> (+919876543210)
```

### ✅ Rate Limit Logs (Expected when limit hit)

```
[2026-08-08 15:45:00] [RateLimit] Request from otp_send:9876543210 (5/5)
[2026-08-08 15:46:00] [RateLimit] ❌ Rate limit exceeded for otp_send:9876543210
[2026-08-08 15:46:00] Response: 429 Too Many Requests
```

### ❌ Bad Logs (Report if you see)

```
[2026-08-08 15:30:00] TypeError: Cannot read property 'mobileNumber' of undefined
[2026-08-08 15:30:00] ReferenceError: otpSendLimiter is not defined
[2026-08-08 15:30:00] Error: connect ECONNREFUSED (database connection)
```

---

## 🎯 SUCCESS CRITERIA

Mark each as you verify:

- [ ] **Render deployment completed** - Shows "Live" status
- [ ] **No build errors** - Deployment logs show success
- [ ] **OTP send works** - Can request OTP successfully
- [ ] **OTP verify works** - Can verify and login successfully
- [ ] **Rate limit enforced** - 6th send request blocked
- [ ] **Phone isolation works** - Different phones have separate limits
- [ ] **Multiple verify attempts** - Can retry wrong OTP multiple times
- [ ] **Mobile app works** - Can login via actual app
- [ ] **30-minute test** - App doesn't show "Too many requests" after 30min
- [ ] **Logs are clean** - No errors in Render logs

---

## 🔄 IF ISSUES OCCUR

### Issue 1: Deployment Failed

**Check:**
- Render build logs for syntax errors
- Node.js version compatibility
- Missing dependencies

**Fix:**
```bash
# Check if there are any syntax errors
cd backend
npm run lint
```

### Issue 2: "otpSendLimiter is not defined"

**This means:** Module export is missing

**Fix:**
```bash
# Verify exports in rateLimit.middleware.js
cat backend/src/middleware/rateLimit.middleware.js | grep "module.exports"
```

Should show:
```javascript
module.exports = {
  otpSendLimiter,
  otpVerifyLimiter,
  ...
};
```

### Issue 3: Still getting 429 after 2 minutes

**This means:** Old code is still running

**Fix:**
1. Force restart Render service
2. Clear Render build cache
3. Verify deployment succeeded

### Issue 4: Rate limit not working at all

**This means:** Middleware not applied

**Fix:**
```bash
# Verify routes use the limiters
cat backend/src/routes/auth.routes.js | grep "otpSendLimiter"
```

Should show:
```javascript
router.post('/patient/send-otp', otpSendLimiter, sendOtpHandler);
```

---

## 📞 NEXT STEPS

### Immediate (Now)

1. ✅ Monitor Render deployment (5-10 minutes)
2. ✅ Run Test 1 (Basic OTP flow)
3. ✅ Run Test 5 (Mobile app test)

### Short-term (Today)

1. ✅ Run all verification tests
2. ✅ Monitor for any user complaints
3. ✅ Check Render logs for errors

### Long-term (This Week)

1. ✅ Monitor rate limit metrics
2. ✅ Verify no legitimate users are blocked
3. ✅ Consider Redis integration for horizontal scaling

---

## 🎉 EXPECTED OUTCOME

**After successful deployment:**

- ✅ Users can use the app normally
- ✅ No "Too many requests" after 30 minutes
- ✅ Rate limiting prevents spam/abuse
- ✅ Each phone number has independent quota
- ✅ Users on same network don't block each other
- ✅ Clear error messages when limit is hit

---

## 📝 MONITORING COMMANDS

### Check Render Deployment Status

```bash
# Via Render CLI (if installed)
render services list
render logs -s <service-id> --tail

# Via Web
# https://dashboard.render.com
```

### Check Backend Health

```bash
curl https://api.pulsemateconnect.in/health
```

### Check Rate Limit Headers

```bash
curl -v -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+919876543210"}' \
  2>&1 | grep -i "X-RateLimit"
```

**Expected headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: <timestamp>
```

---

**Status:** ✅ DEPLOYED TO REPOSITORY  
**Next:** Monitor Render auto-deployment  
**ETA to Live:** 5-10 minutes

**Your fix is on its way to production! 🚀**
