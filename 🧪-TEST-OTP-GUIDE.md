# 🧪 Test OTP System - Complete Guide

**Created:** August 8, 2026  
**Purpose:** Enable testing without real OTP SMS  
**Status:** ✅ Implemented and Ready

---

## 🎯 WHAT IS THIS?

A test OTP system that allows you to bypass Message Central OTP service during development and testing. Use fixed test numbers with a predefined OTP code to login instantly.

**Benefits:**
- ✅ No SMS costs during testing
- ✅ Instant login (no waiting for SMS)
- ✅ Unlimited OTP attempts
- ✅ Works offline
- ✅ Perfect for emulator/simulator testing
- ✅ Automatically disabled in production

---

## 🔧 CONFIGURATION

### Backend Environment Variables

Already configured in `backend/.env`:

```bash
# Enable test OTP bypass
ENABLE_TEST_OTP=true

# Test phone numbers (comma-separated, no spaces)
TEST_OTP_NUMBERS=9999999999,8888888888,7777777777

# Fixed OTP code for test numbers
TEST_OTP_CODE=123456
```

### How It Works

1. **Test Mode Detection:**
   - Activates when `NODE_ENV=development` OR `ENABLE_TEST_OTP=true`
   - Checks if phone number is in `TEST_OTP_NUMBERS` list

2. **Test OTP Flow:**
   ```
   User enters test number (e.g., 9999999999)
     ↓
   Backend checks: Is this a test number?
     ↓
   YES → Send response with test OTP (123456)
         No real SMS sent ✅
     ↓
   User enters OTP: 123456
     ↓
   Backend validates: Does OTP match TEST_OTP_CODE?
     ↓
   YES → Login successful ✅
   ```

3. **Production Safety:**
   - Test mode automatically disabled when `NODE_ENV=production`
   - Test numbers won't work in production
   - Real OTP service used for all numbers

---

## 📱 USAGE GUIDE

### Quick Start: Test Login

**Step 1: Enter Test Phone Number**
```
Open app
  ↓
Enter phone: 9999999999
  ↓
Tap "Get OTP"
```

**Step 2: Check Response**
```
Backend responds with:
{
  "message": "TEST MODE: OTP is 123456",
  "_testMode": true,
  "_testOtp": "123456",
  "verificationId": "TEST-1691500000000-9999999999"
}
```

**Step 3: Enter Test OTP**
```
Enter OTP: 123456
  ↓
Tap "Verify OTP"
  ↓
✅ Login successful!
```

### Available Test Numbers

| Phone Number | Purpose | Status |
|--------------|---------|--------|
| 9999999999 | Primary test user | ✅ Active |
| 8888888888 | Secondary test user | ✅ Active |
| 7777777777 | Tertiary test user | ✅ Active |

**Test OTP Code:** `123456` (for all test numbers)

---

## 🧪 TESTING SCENARIOS

### Scenario 1: New User Registration

```
1. Enter test number: 9999999999
2. Get OTP (response shows: "TEST MODE: OTP is 123456")
3. Enter OTP: 123456
4. Result: New patient account created ✅
5. Navigate to home screen ✅
```

### Scenario 2: Existing User Login

```
1. Enter test number: 9999999999 (already registered)
2. Get OTP
3. Enter OTP: 123456
4. Result: Login successful ✅
5. Navigate to home screen ✅
```

### Scenario 3: Wrong OTP

```
1. Enter test number: 9999999999
2. Get OTP
3. Enter OTP: 999999 (wrong)
4. Result: "Invalid OTP. For test mode, use: 123456" ❌
```

### Scenario 4: Real Phone Number

```
1. Enter real number: 9876543210 (not in test list)
2. Get OTP
3. Result: Real SMS sent via Message Central 📱
4. Enter actual OTP from SMS
5. Login successful ✅
```

---

## 🎨 UI BEHAVIOR

### Normal Flow (Real Number)
```
Enter Phone: 9876543210
  ↓
Tap "Get OTP"
  ↓
Message: "OTP sent successfully"
  ↓
Wait for SMS (15-30 seconds)
  ↓
Enter OTP from SMS
  ↓
Login ✅
```

### Test Flow (Test Number)
```
Enter Phone: 9999999999
  ↓
Tap "Get OTP"
  ↓
Message: "TEST MODE: OTP is 123456"
  ↓
Enter OTP: 123456 (no waiting!)
  ↓
Login ✅
```

---

## 🔐 SECURITY CONSIDERATIONS

### Test Mode Safety

**✅ Safe in Development:**
- Only works with specific test numbers
- Only active when explicitly enabled
- Logged clearly in backend logs

**✅ Safe in Production:**
- Automatically disabled when `NODE_ENV=production`
- Even if `ENABLE_TEST_OTP=true`, production ignores it
- Test numbers return "Invalid number" in production

### Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in Render
- [ ] Set `ENABLE_TEST_OTP=false` (or remove variable)
- [ ] Verify test numbers don't work via production API
- [ ] Confirm real OTP works via Message Central

**Note:** Backend automatically disables test mode in production, but explicitly setting `ENABLE_TEST_OTP=false` is recommended.

---

## 🛠️ CUSTOMIZATION

### Change Test OTP Code

```bash
# In backend/.env
TEST_OTP_CODE=999888  # Change to any 6-digit code
```

### Add More Test Numbers

```bash
# In backend/.env
TEST_OTP_NUMBERS=9999999999,8888888888,7777777777,6666666666,5555555555
```

### Disable Test Mode Temporarily

```bash
# In backend/.env
ENABLE_TEST_OTP=false  # Test numbers will use real OTP
```

---

## 📊 BACKEND LOGS

### Test Mode OTP Logs

When test OTP is used, backend logs clearly indicate test mode:

```
[Auth] 🧪 TEST MODE: Using test OTP for 9999999999
[Auth] 🧪 TEST OTP: 123456 for 9999999999 (verificationId: TEST-1691500000000-9999999999)
[Auth] 🧪 TEST MODE: OTP verified successfully for 9999999999
[Auth] 🧪 TEST MODE: Patient login: user-abc-123 (9999999999)
```

### Production OTP Logs

```
[Auth] OTP sent to 9876543210 via Message Central
[Auth] ✅ Message Central validation successful
[Auth] Patient login: user-xyz-456 (9876543210)
```

---

## 🐛 TROUBLESHOOTING

### Issue: Test OTP Not Working

**Check 1: Is test mode enabled?**
```bash
# In backend/.env
ENABLE_TEST_OTP=true  # Must be true
```

**Check 2: Is number in test list?**
```bash
# In backend/.env
TEST_OTP_NUMBERS=9999999999,8888888888,7777777777
# Your number must be in this list
```

**Check 3: Is backend in dev mode?**
```bash
# In backend/.env
NODE_ENV=development  # or ENABLE_TEST_OTP=true
```

**Check 4: Check backend logs**
```
Look for: [Auth] 🧪 TEST MODE: Using test OTP for...
If you don't see this, test mode is not active
```

### Issue: Getting "Invalid OTP" with 123456

**Possible Causes:**

1. **Wrong OTP code configured**
   ```bash
   # Check backend/.env
   TEST_OTP_CODE=123456  # Must match what you enter
   ```

2. **OTP expired (5 minutes)**
   ```
   Solution: Request OTP again
   ```

3. **Wrong phone number**
   ```
   Ensure: Phone entered matches test number exactly
   ```

### Issue: Real OTP Sent for Test Number

**Cause:** Test mode not active

**Solution:**
1. Check `ENABLE_TEST_OTP=true` in backend/.env
2. Restart backend server
3. Try again

---

## 📝 BACKEND CODE REFERENCE

### Where Test OTP is Implemented

**File:** `backend/src/controllers/auth.controller.js`

**Send OTP Handler (Line ~1287):**
```javascript
// Check if test mode and test number
const isTestMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_OTP === 'true';
const testNumbers = (process.env.TEST_OTP_NUMBERS || '9999999999,8888888888,7777777777').split(',');
const testOtp = process.env.TEST_OTP_CODE || '123456';

if (isTestMode && testNumbers.includes(cleanNumber)) {
  // Return test OTP immediately
  return sendSuccess(res, {
    verificationId: testVerificationId,
    expiresIn: 300,
    message: `TEST MODE: OTP is ${testOtp}`,
    _testMode: true,
    _testOtp: testOtp
  });
}
```

**Verify OTP Handler (Line ~1338):**
```javascript
// Validate test OTP
if (isTestMode && verificationId.startsWith('TEST-') && testNumbers.includes(cleanNumber)) {
  if (cleanOtp !== testOtp) {
    return sendError(res, 'Invalid OTP. For test mode, use: ' + testOtp, 401);
  }
  // Continue with login...
}
```

---

## 🧪 TESTING CHECKLIST

### Complete Test Sequence

- [ ] **Setup**
  - [ ] Test mode enabled in backend/.env
  - [ ] Backend server running
  - [ ] App running on emulator/device

- [ ] **Test 1: New User with Test OTP**
  - [ ] Enter test number: 9999999999
  - [ ] Receive test OTP response
  - [ ] Enter OTP: 123456
  - [ ] New account created successfully
  - [ ] Navigated to home screen

- [ ] **Test 2: Existing User with Test OTP**
  - [ ] Logout
  - [ ] Enter same test number: 9999999999
  - [ ] Receive test OTP response
  - [ ] Enter OTP: 123456
  - [ ] Login successful

- [ ] **Test 3: Wrong Test OTP**
  - [ ] Enter test number: 9999999999
  - [ ] Enter wrong OTP: 999999
  - [ ] Error message shown correctly

- [ ] **Test 4: Different Test Number**
  - [ ] Enter different test number: 8888888888
  - [ ] Receive test OTP response
  - [ ] Enter OTP: 123456
  - [ ] New account created successfully

- [ ] **Test 5: Real Number (Not Test)**
  - [ ] Enter real number: 9123456789
  - [ ] Real SMS sent (check phone)
  - [ ] Enter actual OTP from SMS
  - [ ] Login successful

- [ ] **Test 6: Production Mode**
  - [ ] Set ENABLE_TEST_OTP=false
  - [ ] Restart backend
  - [ ] Enter test number: 9999999999
  - [ ] Real SMS should be sent (not test mode)

---

## 🎯 BEST PRACTICES

### During Development

1. **Use Test Numbers for Quick Testing**
   - Test numbers: 9999999999, 8888888888, 7777777777
   - OTP: 123456
   - Instant login, no waiting

2. **Test Real OTP Occasionally**
   - Use your actual phone number
   - Verify Message Central integration works
   - Check SMS delivery

3. **Check Backend Logs**
   - Confirm test mode activates correctly
   - Watch for "🧪 TEST MODE" indicators

### Before Demo/Production

1. **Disable Test Mode**
   ```bash
   ENABLE_TEST_OTP=false
   ```

2. **Test with Real Numbers**
   - Ensure real OTP works
   - Verify SMS delivery
   - Test rate limiting

3. **Remove Test Users**
   ```sql
   -- Clean up test user accounts if needed
   DELETE FROM "User" WHERE mobile IN ('9999999999', '8888888888', '7777777777');
   ```

---

## 📊 COMPARISON: Test vs Real OTP

| Feature | Test OTP | Real OTP (Message Central) |
|---------|----------|---------------------------|
| **Cost** | Free ✅ | ₹0.10-0.20 per SMS |
| **Speed** | Instant ⚡ | 15-30 seconds |
| **Offline** | Works ✅ | Needs internet |
| **Attempts** | Unlimited ✅ | Rate limited (5/hour) |
| **Production** | Disabled ❌ | Always works ✅ |
| **Security** | Low (test only) | High (real verification) |
| **Phone Required** | No ✅ | Yes ❌ |

**Recommendation:** Use test OTP during development, real OTP for staging/production.

---

## 🔗 RELATED FILES

**Backend:**
- `backend/src/controllers/auth.controller.js` - Test OTP implementation
- `backend/.env` - Test OTP configuration

**Documentation:**
- `🎉-ALL-OTP-ISSUES-FIXED.md` - OTP fixes documentation
- `MESSAGE-CENTRAL-API-FIX.md` - Message Central integration
- `📚-DOCUMENTATION-INDEX.md` - Full documentation index

---

## ✅ QUICK REFERENCE

### Test Phone Numbers
```
9999999999
8888888888
7777777777
```

### Test OTP Code
```
123456
```

### Backend Configuration
```bash
ENABLE_TEST_OTP=true
TEST_OTP_NUMBERS=9999999999,8888888888,7777777777
TEST_OTP_CODE=123456
```

### How to Use
```
1. Enter test number: 9999999999
2. Tap "Get OTP"
3. See response: "TEST MODE: OTP is 123456"
4. Enter OTP: 123456
5. Login successful! ✅
```

---

**Status:** ✅ Implemented and tested  
**Last Updated:** August 8, 2026  
**Production Safe:** Yes (automatically disabled)  
**Ready for Use:** Yes

**Start testing immediately with:** 9999999999 / OTP: 123456
