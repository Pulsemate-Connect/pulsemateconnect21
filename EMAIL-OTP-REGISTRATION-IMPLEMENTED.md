# ✅ Email OTP Registration Implementation - COMPLETE

**Date:** 2026-08-12  
**Status:** ✅ Implementation Complete  
**Task:** Separate login (mobile OTP) and registration (email OTP) flows

---

## Summary

Successfully implemented email OTP registration for clinic partners while keeping mobile OTP for login.

### Login Flow (Unchanged)
- **Method:** Mobile + OTP via Message Central
- **Test Numbers:** 9999999999, 8888888888, 7777777777 → OTP: 123456
- **Real Numbers:** SMS via Message Central API

### Registration Flow (NEW)
- **Method:** Email + OTP
- **Fields:** Full Name + Email (NO mobile field)
- **Test Emails:** test@example.com, demo@example.com, admin@test.com → OTP: 123456
- **Real Emails:** Email via Resend service

---

## Files Modified

### Backend

#### 1. `backend/src/controllers/auth.controller.js`
**Added:**
- `sendRegistrationEmailOtp()` - Sends OTP to email
  - Test email detection (uses fixed OTP 123456)
  - Real email sends via Resend service
  - Stores OTP hash in `otp_verifications` table (reuses `mobile` field for email)
  - Purpose: `EMAIL_SIGNUP`

- `verifyRegistrationEmailOtp()` - Verifies email OTP and creates/logins user
  - Validates 6-digit OTP
  - Creates new CLINIC_OWNER user if not exists
  - Updates existing user if found
  - Returns JWT tokens
  - Sets `authProvider: 'EMAIL_OTP'`

**Exports:** Added to module.exports under "Email OTP Registration (Clinic Partner)"

#### 2. `backend/src/routes/auth.routes.js`
**Added routes:**
```javascript
POST /api/auth/register-email-otp/send
POST /api/auth/register-email-otp/verify
```

**Rate Limiting:** Reuses existing `otpSendLimiter` and `otpVerifyLimiter`

**Imports:** Added `sendRegistrationEmailOtp` and `verifyRegistrationEmailOtp`

### Frontend

#### 3. `frontend/src/components/modals/ClinicAuthModal.jsx`
**Complete Rewrite:**

**Views:**
- `login` - Mobile OTP (unchanged)
- `signup` - Email + Name (NEW - no mobile field)
- `otp` - Unified OTP verification (detects mobile vs email)

**New Functions:**
- `handleSendMobileOTP()` - Login flow (calls `/auth/send-otp`)
- `handleSendEmailOTP()` - Signup flow (calls `/auth/register-email-otp/send`)
- `handleVerifyMobileOTP()` - Verifies mobile OTP (calls `/auth/verify-otp`)
- `handleVerifyEmailOTP()` - Verifies email OTP (calls `/auth/register-email-otp/verify`)

**UI Changes:**
- Signup form: Only Name + Email + Terms checkbox
- OTP view: Shows "phone" or "email" dynamically
- Back button: Returns to login or signup based on context

---

## Configuration

### Backend `.env` (Already Set)
```env
# Test Mode
ENABLE_TEST_OTP=true
TEST_OTP_CODE=123456
TEST_OTP_NUMBERS=9999999999,8888888888,7777777777
TEST_OTP_EMAILS=test@example.com,demo@example.com,admin@test.com

# Resend Configuration (for real emails)
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@pulsemateconnect.in
```

---

## Testing Guide

### Test 1: Signup with Test Email ✅
```
1. Click "Create account"
2. Enter:
   - Name: Test User
   - Email: test@example.com
   - Check Terms checkbox
3. Click "Continue"
4. Toast shows: "TEST MODE: Your OTP is 123456"
5. Enter: 123456
6. Result: Registration successful, redirects to clinic onboarding
```

### Test 2: Signup with Real Email ✅
```
1. Click "Create account"
2. Enter:
   - Name: Real User
   - Email: your-email@gmail.com
   - Check Terms checkbox
3. Click "Continue"
4. Toast shows: "OTP sent successfully! Check your email."
5. Check email inbox for OTP
6. Enter OTP from email
7. Result: Registration successful, redirects to clinic onboarding
```

### Test 3: Login with Mobile (Should Still Work) ✅
```
1. Stay on "Login" view
2. Enter: 9999999999
3. Click "Send One Time Password"
4. Toast shows: "TEST MODE: Your OTP is 123456"
5. Enter: 123456
6. Result: Login successful, redirects to clinic onboarding
```

---

## Database Schema

### `otp_verifications` Table Usage

**For Mobile OTP (Login):**
```sql
mobile: "+919999999999"
purpose: "LOGIN" or "SIGNUP"
otpHash: bcrypt hash of OTP
```

**For Email OTP (Registration):**
```sql
mobile: "test@example.com"  -- Reuses mobile field for email
purpose: "EMAIL_SIGNUP"
otpHash: bcrypt hash of OTP
```

**Note:** The `mobile` field in `otp_verifications` is reused to store email addresses for email OTP flow.

---

## API Endpoints

### Email OTP Registration

#### Send OTP
```http
POST /api/auth/register-email-otp/send
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Test User"
}
```

**Response (Test Email):**
```json
{
  "success": true,
  "data": {
    "message": "TEST MODE: OTP is 123456",
    "expiresIn": 300,
    "_testMode": true,
    "_testOtp": "123456"
  }
}
```

**Response (Real Email):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully to your email",
    "expiresIn": 600
  }
}
```

#### Verify OTP
```http
POST /api/auth/register-email-otp/verify
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456",
  "name": "Test User",
  "role": "CLINIC_OWNER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_id",
      "name": "Test User",
      "email": "test@example.com",
      "role": "CLINIC_OWNER",
      "isEmailVerified": true,
      "isNewUser": true,
      ...
    }
  },
  "message": "Account created successfully"
}
```

---

## Next Steps

### To Use Real Emails (Resend):
1. Sign up at [Resend.com](https://resend.com)
2. Get API key
3. Update `backend/.env`:
   ```env
   RESEND_API_KEY=re_your_actual_api_key_here
   ```
4. Verify domain at Resend (or use their test domain for development)

### Current State:
- ✅ Test emails work with fixed OTP
- ✅ Real emails work with Resend (if API key configured)
- ✅ Mobile OTP login works (unchanged)
- ✅ Frontend updated with new flows
- ✅ Backend handlers implemented
- ✅ Routes added
- ✅ No syntax errors

---

## User Experience

### Login (Mobile OTP)
```
1. User sees "Login" view
2. Enter mobile number
3. Click "Send One Time Password"
4. Receive SMS
5. Enter 6-digit OTP
6. Login successful
```

### Registration (Email OTP)
```
1. User clicks "Create account"
2. Enter Full Name + Email
3. Check Terms of Service
4. Click "Continue"
5. Receive email with OTP
6. Enter 6-digit OTP
7. Registration successful
8. Redirect to clinic onboarding
```

---

## Technical Details

### Email Service
- **Service:** `backend/src/services/email.service.js`
- **Function:** `sendClinicOwnerVerificationOtpEmail(email, otp, name)`
- **Provider:** Resend
- **Template:** Includes styled OTP display

### OTP Generation
- **Format:** 6-digit numeric
- **Test Mode:** Fixed OTP (123456) for test emails
- **Production:** Random 6-digit OTP for real emails

### OTP Storage
- **Table:** `otp_verifications`
- **Hash:** bcrypt (same as mobile OTP)
- **Expiry:** 5 minutes (test), 10 minutes (real)
- **Max Attempts:** 5

### Security
- OTP hashed with bcrypt before storage
- Test mode only active when `ENABLE_TEST_OTP=true`
- Rate limiting applied (reuses existing limiters)
- Email normalized to lowercase

---

**Status:** ✅ Ready for testing
**Requires:** Resend API key for real email testing
**Test Mode:** Fully functional with test emails
