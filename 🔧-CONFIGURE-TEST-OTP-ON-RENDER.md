# 🔧 Configure Test OTP on Render - Step by Step

**Status:** ⚠️ **NOT CONFIGURED** (Message Central is being used)  
**Need:** Enable test OTP to avoid SMS costs during testing

---

## 📋 CURRENT STATUS

### What's Happening Now

From the logs, I can see:
```
User entered: +919663080521
Backend sent: Real SMS via Message Central
Time taken: 24,952 ms (real SMS delivery)
Result: Real OTP sent (costs ₹0.12)
```

**Problem:** Test OTP is not configured on Render, so ALL numbers go through Message Central

---

## ✅ HOW TO FIX

### Step 1: Go to Render Dashboard

1. Open browser: https://dashboard.render.com/
2. Login to your account
3. Click on: **pulsemate-backend** service

### Step 2: Add Environment Variables

1. Click: **Environment** tab (left sidebar)
2. Scroll down to find existing variables
3. Add these 3 environment variables:

#### Variable 1: Enable Test OTP
```
Key:   ENABLE_TEST_OTP
Value: true
```

#### Variable 2: Test Phone Numbers
```
Key:   TEST_OTP_NUMBERS
Value: 9999999999,8888888888,7777777777
```
*(No spaces, comma-separated, no +91 prefix)*

#### Variable 3: Test OTP Code
```
Key:   TEST_OTP_CODE
Value: 123456
```

### Step 3: Save Changes

1. Click: **Save Changes** button
2. Render will automatically restart your backend
3. Wait: 2-3 minutes for deployment

---

## 🧪 HOW TO TEST

### Test Case 1: Use Test Number

```
1. Open app on emulator
2. Enter phone: +91 9999999999
3. Click "Send OTP"
4. Check time: Should be instant (< 1 second)
5. Enter OTP: 123456
6. Click "Verify"
7. ✅ Should login immediately (no real SMS sent)
```

**Expected logs:**
```
[Auth] 🧪 TEST MODE: Using test OTP for +919999999999
[Auth] ⚡ Instant validation (no SMS sent)
[Auth] 🔑 OTP: 123456
[Auth] ✅ Test OTP validated
Time: < 100ms (instant)
Cost: ₹0.00 (no SMS)
```

### Test Case 2: Use Real Number (Non-Test)

```
1. Enter phone: +91 9663080521
2. Click "Send OTP"
3. Check time: Will take 20-30 seconds
4. Real SMS sent via Message Central
5. Enter OTP from SMS
6. ✅ Should login (real SMS sent)
```

**Expected logs:**
```
[MessageCentral] 📱 Sending OTP via Message Central
[MessageCentral] ⏱️  Time: 24,952ms
[MessageCentral] ✅ OTP sent successfully
Cost: ₹0.12 (real SMS)
```

---

## 📊 COMPARISON

### Without Test OTP (Current)

```
All numbers → Message Central
  ↓
Real SMS sent
  ↓
20-30 second delay
  ↓
Cost: ₹0.12 per OTP
```

### With Test OTP (After Config)

```
Test numbers (9999999999) → Instant OTP
  ↓
No SMS sent
  ↓
< 1 second response
  ↓
Cost: ₹0.00

Real numbers → Message Central
  ↓
Real SMS sent
  ↓
20-30 second delay
  ↓
Cost: ₹0.12 per OTP
```

---

## 🎯 BENEFITS

### Development & Testing

✅ **Instant testing** - No waiting for SMS  
✅ **Zero cost** - No SMS charges for test numbers  
✅ **Predictable** - Always 123456, no need to check phone  
✅ **Reliable** - No SMS delivery failures  

### Production

✅ **Real users** - Still use Message Central (normal flow)  
✅ **No impact** - Only test numbers affected  
✅ **Security** - Test numbers are limited (only 3 configured)  

---

## 🔍 VERIFICATION

### Check if Test OTP is Working

**Method 1: Check Render Logs**

1. Go to Render Dashboard
2. Click on **pulsemate-backend**
3. Click **Logs** tab
4. Look for on startup:
   ```
   [Auth] ✅ Test OTP enabled
   [Auth] 📱 Test numbers: 9999999999, 8888888888, 7777777777
   [Auth] 🔑 Test OTP code: 123456
   ```

**Method 2: Try Test Number**

1. Open app
2. Enter: +91 9999999999
3. If test OTP working:
   - Response < 1 second
   - Enter OTP: 123456
   - Logs show: "TEST MODE"
4. If NOT working:
   - Response 20-30 seconds
   - Need real SMS OTP
   - Logs show: "Message Central"

---

## ⚠️ TROUBLESHOOTING

### Issue: Test OTP Not Working After Config

**Symptoms:**
- Test number still sends real SMS
- Takes 20-30 seconds
- Message Central logs appear

**Solutions:**

1. **Check Environment Variables**
   ```
   Render → Environment → Verify:
   - ENABLE_TEST_OTP = true (not "1" or "yes")
   - TEST_OTP_NUMBERS = 9999999999,8888888888,7777777777 (no spaces!)
   - TEST_OTP_CODE = 123456
   ```

2. **Restart Backend**
   ```
   Render → Manual Deploy → Deploy Latest Commit
   Wait 2-3 minutes
   ```

3. **Clear App Cache**
   ```
   On emulator: Settings → Apps → PulseMate → Clear Data
   Or: adb shell pm clear com.pulsemateconnect.pulsemate
   Reopen app and try again
   ```

### Issue: Test Number Format Wrong

**Problem:** Using +91 prefix in TEST_OTP_NUMBERS

**Incorrect:**
```
TEST_OTP_NUMBERS = +919999999999,+918888888888
```

**Correct:**
```
TEST_OTP_NUMBERS = 9999999999,8888888888,7777777777
```

The backend automatically handles the +91 prefix matching.

---

## 📝 BACKEND CODE REFERENCE

### How Test OTP Works

**File:** `backend/src/controllers/auth.controller.js`

```javascript
// Check if this is a test number
const isTestNumber = process.env.ENABLE_TEST_OTP === 'true' &&
  process.env.TEST_OTP_NUMBERS?.split(',').includes(cleanMobile);

if (isTestNumber) {
  // TEST MODE: Skip Message Central
  const testOtp = process.env.TEST_OTP_CODE || '123456';
  
  // Return instant response
  return sendSuccess(res, {
    verificationId: 'TEST_' + Date.now(),
    expiresIn: 300,
    message: 'Test OTP sent (TEST MODE)',
    testMode: true,
  });
}

// PRODUCTION: Use Message Central
const result = await messageCentralService.sendOTP(mobileNumber);
```

### Validation Code

```javascript
// Check if test OTP validation
if (verificationId.startsWith('TEST_') && 
    process.env.ENABLE_TEST_OTP === 'true') {
  
  const testOtpCode = process.env.TEST_OTP_CODE || '123456';
  
  if (cleanOtp !== testOtpCode) {
    return sendError(res, 'Invalid test OTP', 401);
  }
  
  // Test OTP valid - proceed with login
}
```

---

## ✅ QUICK CHECKLIST

### Before Adding Variables

- [ ] Have Render dashboard access
- [ ] Know the backend service name (pulsemate-backend)
- [ ] Ready to restart backend (auto-happens)

### Adding Variables

- [ ] Open Render dashboard
- [ ] Click pulsemate-backend service
- [ ] Go to Environment tab
- [ ] Add: ENABLE_TEST_OTP = true
- [ ] Add: TEST_OTP_NUMBERS = 9999999999,8888888888,7777777777
- [ ] Add: TEST_OTP_CODE = 123456
- [ ] Click Save Changes
- [ ] Wait for auto-redeploy (2-3 min)

### After Configuration

- [ ] Check Render logs for "Test OTP enabled"
- [ ] Test with +91 9999999999
- [ ] Verify instant response (< 1 second)
- [ ] Use OTP: 123456
- [ ] Login successful without SMS ✅

---

## 🎉 EXPECTED RESULT

### Before Configuration
```
Phone: +91 9999999999
  ↓
Message Central called
  ↓
Real SMS sent
  ↓
Cost: ₹0.12
Time: 20-30 seconds
```

### After Configuration
```
Phone: +91 9999999999
  ↓
Test mode detected
  ↓
Instant OTP: 123456
  ↓
Cost: ₹0.00 💰
Time: < 1 second ⚡
```

---

## 📞 SUPPORT

If test OTP still doesn't work after configuration:

1. Check Render logs for errors
2. Verify environment variable values (no typos!)
3. Try manual deploy (not just save)
4. Clear app cache and retry
5. Check that phone number format is correct (10 digits, no +91 in config)

---

**Status:** Configuration needed on Render  
**Time Required:** 5 minutes  
**Impact:** Instant testing, zero SMS costs for test numbers  

**DO THIS NOW to enable test OTP! 🚀**
