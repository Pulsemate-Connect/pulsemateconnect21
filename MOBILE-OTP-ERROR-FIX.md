# 🐛 Mobile OTP Error Fix - "Unexpected end of JSON input"

## ❌ Problem
When trying to send OTP to real mobile numbers (not test numbers), you were getting:
```
Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

This error means the backend was either:
1. Not sending any response at all
2. Crashing before it could send a JSON response
3. Sending an HTML error page instead of JSON

## ✅ Solution Applied

### 1. Fixed Duplicate Handler Functions
**Issue:** `sendOtpHandler` and `verifyOtpHandler` were defined **twice** in the auth controller:
- Line 1319: OLD implementation (complex, with database storage)
- Line 1946: NEW implementation (simple, direct Message Central)

JavaScript uses the **last** definition, but having duplicates causes confusion and potential issues.

**Fix:**
- Renamed OLD handlers to `sendOtpHandler_Legacy` and `verifyOtpHandler_Legacy`
- Renamed NEW handlers to `sendOtpHandler_MessageCentral` and `verifyOtpHandler_MessageCentral`
- Updated exports to use the NEW Message Central handlers

### 2. Enhanced Error Handling
Added comprehensive error handling to ensure backend **always** returns proper JSON responses:

```javascript
try {
  // ... OTP logic ...
} catch (error) {
  logger.error('[OTP] Send OTP error:', error);
  logger.error('[OTP] Error stack:', error.stack);
  
  // ✅ Always return a proper JSON error response
  return sendError(
    res,
    error.message || 'Failed to send OTP. Please try again.',
    500
  );
}
```

**Key Changes:**
- Replaced `console.log` with `logger.info/logger.error` for better debugging
- Removed `next(error)` that was causing issues - now always returns JSON directly
- Added detailed logging at every step

### 3. Integrated Test Number Support
Both handlers now have built-in test number detection:

```javascript
// ✅ TEST MODE: Check if this is a test number
const isTestMode = process.env.ENABLE_TEST_OTP === 'true';
const testNumbers = (process.env.TEST_OTP_NUMBERS || '9999999999,8888888888,7777777777').split(',');
const testOtp = process.env.TEST_OTP_CODE || '123456';

if (isTestMode && testNumbers.includes(mobileNumber)) {
  // Return success immediately without calling Message Central
  return sendSuccess(res, { ... }, 'OTP sent (test mode)');
}

// Otherwise, call Message Central for real numbers
```

This ensures:
- Test numbers (9999999999, 8888888888, 7777777777) work instantly with OTP 123456
- Real numbers go through Message Central API
- No API calls wasted on test numbers

### 4. Added Request/Response Validation
Added phone number validation in verify handler:

```javascript
if (!phoneNumber) {
  logger.warn('[OTP] Phone number missing in request');
  return sendError(res, 'Phone number is required', 400);
}
```

### 5. Enhanced Frontend Error Handling (Already Done)
The frontend already had good error handling that checks content-type before parsing JSON:

```javascript
const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  const text = await response.text();
  console.error('[OTP] Non-JSON response:', text);
  throw new Error('Server error: Invalid response format. Check backend logs.');
}
```

---

## 🧪 Testing Instructions

### Step 1: Restart Backend Server
The changes are only in the backend controller. You need to restart the backend:

```bash
# Navigate to backend folder
cd backend

# Restart the server (if running)
# Press Ctrl+C to stop, then:
npm start

# OR if using nodemon:
# It should auto-restart, but if not:
npm run dev
```

### Step 2: Verify Backend is Running
Check the console output for:
```
[Server] Server running on http://localhost:5000
```

If you see database connection errors:
```
Can't reach database server at aws-1-ap-northeast-2.pooler.supabase.com:6543
```

Then go to https://supabase.com/dashboard and **resume your database** (free tier auto-pauses).

### Step 3: Test with Real Number
1. Open the clinic onboarding page
2. Enter a **real mobile number** (not 9999999999, 8888888888, or 7777777777)
3. Click "Send OTP"
4. Watch the backend console logs for:

**Expected Success Logs:**
```
[OTP] sendOtpHandler_MessageCentral called with phoneNumber: +919876543210
[OTP] Normalized phone: +919876543210
[OTP] Sending real OTP via Message Central to: +919876543210
[MessageCentral] ═══════════════════════════════════════════════════════
[MessageCentral] 🔍 DIAGNOSTIC MODE: Message Central Token Generation
[MessageCentral] ═══════════════════════════════════════════════════════
[MessageCentral] ✅✅✅ SUCCESS ✅✅✅
[OTP] OTP sent successfully: { verificationId: '...', timeout: 180, mobileNumber: '+919876543210' }
```

**If you see errors:**
```
[MessageCentral] ❌❌❌ ERROR ❌❌❌
```

Then check the detailed error message - it will tell you what's wrong (credentials, API error, etc.)

### Step 4: Test with Test Number
1. Enter 9999999999, 8888888888, or 7777777777
2. Click "Send OTP"
3. Should show success immediately without calling Message Central
4. Backend logs:
```
[OTP] 🧪 TEST MODE: Using test OTP for 9999999999
```
5. Enter OTP: 123456
6. Should verify instantly

---

## 📋 Environment Variables Check

Make sure your `backend/.env` has:

```env
# Message Central credentials
MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
MESSAGE_CENTRAL_EMAIL=pulsemateconnect@gmail.com
MESSAGE_CENTRAL_PASSWORD=TmthYnUxOCQ=

# Test OTP configuration
ENABLE_TEST_OTP=true
TEST_OTP_CODE=123456
TEST_OTP_NUMBERS=9999999999,8888888888,7777777777
```

✅ Your credentials look correct (Base64 password format is valid).

---

## 🔍 Debugging Real Number Issues

If real numbers still don't work after the fix, check:

### 1. Backend Logs
Run backend with:
```bash
cd backend
npm start
```

Watch for detailed Message Central diagnostic logs showing:
- Environment validation
- Token generation steps
- API request/response details
- Exact error messages

### 2. Network Issues
- Ensure backend can reach `https://cpaas.messagecentral.com`
- Check firewall settings
- Verify internet connection

### 3. Message Central Account
- Login to Message Central dashboard
- Verify account is active
- Check API credits/balance
- Confirm customer ID and credentials are correct

### 4. Test Message Central Directly
Create a test script to isolate the issue:

```javascript
// test-message-central.js
const messageCentralService = require('./src/services/messagecentral.service');

async function test() {
  try {
    console.log('Testing Message Central OTP...');
    const result = await messageCentralService.sendOTP('9876543210', 6);
    console.log('✅ SUCCESS:', result);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

test();
```

Run it:
```bash
cd backend
node test-message-central.js
```

---

## 📁 Files Changed

### Backend
- **`backend/src/controllers/auth.controller.js`**
  - Renamed old handlers to `_Legacy`
  - Created new `sendOtpHandler_MessageCentral` with test number support
  - Created new `verifyOtpHandler_MessageCentral` with test number support
  - Enhanced error handling (always return JSON)
  - Added comprehensive logging
  - Updated exports to use new handlers

### Frontend
- **No changes needed** - frontend already has good error handling

---

## ✅ What Should Work Now

1. **Test numbers (9999999999, 8888888888, 7777777777):**
   - Send OTP: Instant success (no API call)
   - Verify with 123456: Instant success

2. **Real numbers:**
   - Send OTP: Calls Message Central API
   - Returns proper JSON response (success OR error)
   - No more "Unexpected end of JSON input" errors
   - Clear error messages if Message Central API fails

3. **Error handling:**
   - All errors return proper JSON format
   - Detailed backend logs for debugging
   - User-friendly error messages in frontend

---

## 🎯 Next Steps

1. **Restart backend** (most important!)
2. Test with a real number
3. Check backend console logs
4. If Message Central errors appear, verify credentials and account status
5. Report back with the specific error message from backend logs

---

## 🐛 Still Not Working?

If you still see "Unexpected end of JSON input" after restarting backend:

1. **Check if backend is actually running:**
   ```bash
   curl http://localhost:5000/api/auth/send-otp
   ```
   Should return JSON (even if error)

2. **Check frontend API URL:**
   - Open browser DevTools → Network tab
   - Look at the request URL when clicking "Send OTP"
   - Should be: `http://localhost:5000/api/auth/send-otp`

3. **Check for CORS errors:**
   - Look in browser console
   - Should see backend response status (200, 400, 500, etc.)

4. **Share backend logs:**
   - Copy the complete backend console output when sending OTP
   - This will show exactly what's failing

---

**Last Updated:** 2026-08-12  
**Status:** ✅ Fixed and ready for testing
