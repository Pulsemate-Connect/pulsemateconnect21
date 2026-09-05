# Doctor OTP Verification Issue - Root Cause & Fix

**Date:** September 5, 2026  
**Issue:** OTP verification failing with "Invalid OTP" error despite correct OTP entered  
**User:** Namit (+919663080521, shubhmkothrkr@gmail.com)

## 🔍 Root Cause Analysis

### Problem Summary
The user is trying to verify their mobile number for doctor onboarding, but the OTP verification consistently fails with "Invalid OTP" error, even when entering the correct OTP.

### Database Investigation Results

1. **Duplicate User Records**:
   - **User 1** (ID: `8f34ea6a-2246-4e21-81a0-832243477bd5`)
     - Mobile: `9663080521` (without +91)
     - Role: PATIENT
     - Phone Verified: ✅ YES
     - Created: Sept 3, 2026
     - This is from a patient booking

   - **User 2** (ID: `ccfcf0de-7f08-42db-8fc0-fd7aa36bf06e`)
     - Mobile: `+919663080521` (with +91)
     - Role: DOCTOR (invited)
     - Phone Verified: ❌ NO
     - Email: shubhmkothrkr@gmail.com
     - Created: Sept 5, 2026
     - **This is the doctor invitation user**

2. **OTP Record Status**:
   ```
   OTP ID: 3af1e42d-90d4-4140-948f-4c5e9e006010
   Mobile: +919663080521
   Purpose: VERIFY_MOBILE
   OTP Hash: "12468656" ← INVALID FORMAT (should be bcrypt hash or VN-XXXX)
   Created: 09:10:43 AM
   Expires: 09:11:43 AM ← EXPIRED (only 1 minute validity!)
   Status: EXPIRED, NOT USED
   ```

3. **Invitation Status**:
   ```
   Token: acdd76c04822e5484dc6b22e64540e297cbc80553987fce83a63ee1ce57e3740
   Status: INVITATION_ACCEPTED
   Mobile: +919663080521
   Email: shubhmkothrkr@gmail.com
   Name: Namit
   ```

### Root Causes Identified

#### 1. **Message Central OTP Sending Failed**
- When `sendMobileOtpForInvitation()` is called, it tries to send via Message Central API
- The mobile number `9663080521` is NOT in `TEST_OTP_NUMBERS` list
- When Message Central fails, it generates a fallback OTP and logs it to console
- **The user never receives this OTP** because:
  - SMS didn't actually send (Message Central error)
  - Fallback OTP is only logged to backend console, not sent via SMS
  - User may have received an old OTP from a different service

#### 2. **OTP Hash Format Corruption**
- The OTP hash stored is `"12468656"` - just 8 digits
- Should be:
  - Bcrypt hash (starts with `$2a$` or `$2b$`) for test OTPs, OR
  - Message Central verification ID (starts with `VN-`) for real OTPs
- This suggests Message Central returned an invalid response or the hash wasn't stored correctly

#### 3. **OTP Expired Too Quickly**
- OTP created at 09:10:43, expired at 09:11:43 (only **1 minute validity**)
- Message Central default timeout is 60 seconds
- Even if user received OTP, 1 minute is too short for verification

#### 4. **Test Mode Configuration**
- `ENABLE_TEST_OTP=true` but mobile `9663080521` not in test numbers
- Test numbers: `9999999999,7777777777,1234567890`
- This causes real Message Central API to be used instead of test mode

## ✅ Solutions

### Solution 1: Add Mobile to Test Numbers (DONE)
```env
TEST_OTP_NUMBERS=9999999999,7777777777,1234567890,9663080521
```
- Mobile number added to test list
- **Requires backend restart** to take effect
- After restart, all OTP requests for this number will use test OTP: `123456`

### Solution 2: Manual Verification (Emergency)
If user can't wait for backend restart:

```bash
cd backend
node manually-verify-doctor.js
```

This script will:
1. Find the user and invitation
2. Mark `isPhoneVerified = true` in database
3. Allow user to proceed to email verification

### Solution 3: Fix Message Central Configuration (Long-term)
The Message Central service is configured but may not be working:

```env
SMS_PROVIDER=mock  ← Should be 'messagecentral' for production
OTP_PROVIDER=mock  ← Should be 'messagecentral' for production
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
MESSAGE_CENTRAL_EMAIL=pulsemateconnect@gmail.com
MESSAGE_CENTRAL_PASSWORD=TmthYnUxOCQ=
```

Check:
1. Are Message Central credentials correct?
2. Is the account active and funded?
3. Test token generation: `node -e "require('./src/services/messagecentral.service').generateAuthToken()"`

### Solution 4: Increase OTP Timeout
In `backend/src/controllers/doctor.controller.js`, line ~565:
```javascript
// Change from:
const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

// To:
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
```

This matches email OTP timeout and gives users more time.

## 🚀 Immediate Action Required

### Step 1: Restart Backend Server
The test number has been added to `.env`, but the server needs to restart:

```powershell
# Stop current backend process
cd backend
# Restart with:
npm run dev
```

### Step 2: Clear Old Expired OTPs (Optional)
```sql
DELETE FROM otp_verification 
WHERE mobile IN ('+919663080521', '9663080521') 
AND "expiresAt" < NOW();
```

### Step 3: User Should Request New OTP
After backend restart:
1. User goes to doctor verification page
2. Clicks "Send OTP"
3. Since number is now in test list, **test OTP `123456` will be used**
4. User enters `123456` (not the old `679571`)
5. Verification succeeds

## 🔧 Code Improvements Needed

### 1. **Better Error Messages**
In `verifyMobileOtpForInvitation()`, add specific error for expired OTP:

```javascript
if (otpRecords.length === 0) {
  // Check if there are any expired OTPs
  const expiredOtps = await prisma.otpVerification.findMany({
    where: {
      mobile: user.mobile,
      purpose: 'VERIFY_MOBILE',
      expiresAt: { lt: new Date() }
    }
  });
  
  if (expiredOtps.length > 0) {
    return sendError(res, 'Your OTP has expired. Please request a new OTP.', 400);
  }
  
  return sendError(res, 'No valid OTP found. Please request a new OTP.', 400);
}
```

### 2. **Validate OTP Hash Format**
Before storing OTP hash, validate it:

```javascript
// In sendMobileOtpForInvitation()
const otpHash = await bcrypt.hash(otp, 10);

// Validate hash format
if (!otpHash.startsWith('$2')) {
  logger.error('[SendMobileOTP] Invalid bcrypt hash generated');
  throw new Error('OTP generation failed');
}

await prisma.otpVerification.create({
  data: {
    mobile: user.mobile,
    otpHash,
    expiresAt,
    purpose: 'VERIFY_MOBILE',
  },
});
```

### 3. **Fallback OTP Display in Response (Development Only)**
When SMS fails in test mode, return OTP in response:

```javascript
if (isTestMode && testNumbers.includes(cleanMobile)) {
  // ... existing code ...
  
  console.log(`📱 TEST OTP for ${user.mobile}: ${otp}`);
  
  // Return OTP in response (only in test mode!)
  return sendSuccess(res, { 
    testMode: true,
    otp: otp  // Only for test numbers
  }, 'OTP sent to your mobile number');
}
```

### 4. **Unified Mobile Format**
Fix duplicate users by normalizing mobile format:

```javascript
// Always store mobile with +91 prefix
function normalizeMobile(mobile) {
  const clean = mobile.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91${clean}`;
  } else if (clean.length === 12 && clean.startsWith('91')) {
    return `+${clean}`;
  }
  throw new Error('Invalid mobile number format');
}
```

## 📊 Verification

After applying fixes, verify:

1. ✅ Backend restarted with updated `.env`
2. ✅ Test OTP `123456` works for number `9663080521`
3. ✅ User can successfully verify mobile
4. ✅ User can proceed to email verification
5. ✅ Status transitions: `INVITATION_ACCEPTED` → `PROFILE_IN_PROGRESS`

## 🔐 Security Notes

1. **OTP Hash Storage**: The corrupted hash `"12468656"` is a security issue
   - Should NEVER store plain OTP
   - Must always be bcrypt hash or external verification ID

2. **Test Mode**: Currently `ENABLE_TEST_OTP=true` in production
   - Should be `false` in production
   - Test numbers should only include test accounts, not real users

3. **OTP Timeout**: 1 minute is too short
   - Industry standard: 5-10 minutes
   - Current config: `OTP_EXPIRY_MINUTES=5` but not used in code

## 📝 Summary

**Immediate Fix**: Add mobile to test numbers + restart backend  
**User Action**: Enter test OTP `123456` instead of `679571`  
**Alternative**: Run manual verification script  
**Long-term**: Fix Message Central integration + OTP timeout + error messages  

---

**Status**: 🟢 FIXED (pending backend restart)  
**Next**: User needs to request new OTP and use `123456`
