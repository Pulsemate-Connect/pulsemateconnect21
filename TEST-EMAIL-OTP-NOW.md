# 🧪 Test Email OTP Registration - Quick Guide

**Date:** 2026-08-12  
**Implementation:** ✅ Complete and Running

---

## What Changed

### Login (NO CHANGES)
- **Still uses:** Mobile + OTP via Message Central
- **Test numbers still work:** 9999999999 → OTP: 123456

### Registration (NEW)
- **Now uses:** Email + OTP (NO mobile field)
- **Test emails work:** test@example.com → OTP: 123456
- **Real emails work:** Resend service (if API key configured)

---

## Quick Test Steps

### Test 1: Register with Test Email ✅

1. **Open browser:** http://localhost:3000/clinic-partner
2. **Click:** "Partner with us" button
3. **Click:** "Create account" (bottom of login modal)
4. **Fill in:**
   - Full name: `Test User`
   - Email: `test@example.com`
   - ✓ Check "I agree to Terms..."
5. **Click:** "Continue"
6. **Look for toast:** "TEST MODE: Your OTP is 123456"
7. **Enter OTP:** `123456`
8. **Click:** "Verify & Continue"
9. **Expected:** Registration successful → Redirect to clinic onboarding

---

### Test 2: Login with Mobile (Should Still Work) ✅

1. **Open browser:** http://localhost:3000/clinic-partner
2. **Click:** "Partner with us" button
3. **Stay on "Login" view**
4. **Enter mobile:** `9999999999`
5. **Click:** "Send One Time Password"
6. **Look for toast:** "TEST MODE: Your OTP is 123456"
7. **Enter OTP:** `123456`
8. **Click:** "Verify & Continue"
9. **Expected:** Login successful → Redirect to clinic onboarding

---

## Current Server Status

✅ **Backend:** Running on port 5000 (nodemon auto-restart)  
✅ **Frontend:** Running on port 3000 (Vite HMR active)  
✅ **Changes:** Already loaded (no restart needed)

---

## Test Emails & Numbers

### Test Emails (Fixed OTP: 123456)
```
test@example.com
demo@example.com
admin@test.com
```

### Test Mobile Numbers (Fixed OTP: 123456)
```
9999999999
8888888888
7777777777
```

---

## What to Look For

### Registration Form (Signup View)
- ✅ Only shows: Name + Email (NO mobile field)
- ✅ Terms checkbox present
- ✅ "Continue" button

### OTP Verification (After Signup)
- ✅ Shows: "Verify your email"
- ✅ Shows: "We've sent a 6-digit OTP to test@example.com"
- ✅ 6 OTP input boxes
- ✅ "Verify & Continue" button
- ✅ Resend option after countdown

### Login Form (Login View)
- ✅ Shows: Mobile number input with +91 prefix
- ✅ "Send One Time Password" button
- ✅ "Create account" link at bottom

### OTP Verification (After Login)
- ✅ Shows: "Verify your phone"
- ✅ Shows: "We've sent a 6-digit OTP to +91 9999999999"
- ✅ 6 OTP input boxes
- ✅ "Verify & Continue" button

---

## Troubleshooting

### ❌ "Invalid OTP. Please try again."
- **Check:** Using correct test email (test@example.com)
- **Check:** OTP is 123456 (not expired)
- **Try:** Clear browser cache and retry

### ❌ "Failed to send OTP"
- **Check:** Backend console for errors
- **Check:** `.env` has `ENABLE_TEST_OTP=true`
- **Check:** Test email is in `TEST_OTP_EMAILS` list

### ❌ "A user with this email already exists"
- **Solution:** Email already registered, use different email OR login instead

### ❌ Form validation errors
- **Check:** Name is at least 2 characters
- **Check:** Email is valid format
- **Check:** Terms checkbox is checked

---

## Browser Console Debugging

Open browser DevTools (F12) → Console tab:

### Registration Flow
```javascript
// Look for these logs:
[ClinicAuthModal] Sending register-email-otp/send request
[ClinicAuthModal] Response: {success: true, data: {...}}
[ClinicAuthModal] Sending register-email-otp/verify request
[ClinicAuthModal] Response: {success: true, data: {user: {...}, token: "..."}}
```

### Login Flow
```javascript
// Look for these logs:
[ClinicAuthModal] Sending verify-otp request
[ClinicAuthModal] Response: {success: true, data: {user: {...}, token: "..."}}
```

---

## Backend Console Debugging

Check backend terminal for these logs:

### Email OTP Send
```
[Auth] 🧪 TEST MODE: Using test OTP for test@example.com
[Auth] 🧪 TEST OTP: 123456 for test@example.com
```

### Email OTP Verify
```
[Auth] Email OTP verified successfully for test@example.com
[Auth] New CLINIC_OWNER registered: user_id (test@example.com)
```

### Mobile OTP Send (Login)
```
[Auth] 🧪 TEST MODE: Using test OTP for +919999999999
[Auth] 🧪 TEST OTP: 123456 for +919999999999
```

---

## API Testing (Optional)

### Test Email OTP Send
```bash
curl -X POST http://localhost:5000/api/auth/register-email-otp/send \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"name\":\"Test User\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "TEST MODE: OTP is 123456",
    "_testMode": true,
    "_testOtp": "123456"
  }
}
```

### Test Email OTP Verify
```bash
curl -X POST http://localhost:5000/api/auth/register-email-otp/verify \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"otp\":\"123456\",\"name\":\"Test User\",\"role\":\"CLINIC_OWNER\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token...",
    "user": {
      "id": "...",
      "name": "Test User",
      "email": "test@example.com",
      "role": "CLINIC_OWNER",
      "isEmailVerified": true,
      ...
    }
  },
  "message": "Account created successfully"
}
```

---

## Success Criteria

✅ Registration shows only Name + Email (no mobile)  
✅ Registration sends email OTP  
✅ Test email (test@example.com) shows OTP in toast  
✅ OTP verification creates user and returns JWT  
✅ User redirected to clinic onboarding after registration  
✅ Login with mobile still works (unchanged)  
✅ Test mobile (9999999999) shows OTP in toast  
✅ No console errors in frontend or backend  

---

## Next Steps

### To Use Real Emails:
1. Get Resend API key from https://resend.com
2. Update `backend/.env`:
   ```env
   RESEND_API_KEY=re_your_actual_api_key_here
   ```
3. Test with your real email address
4. Check email inbox for OTP

### Current Status:
✅ **Test Mode:** Fully functional  
⏳ **Real Emails:** Requires Resend API key  
✅ **Mobile Login:** Working (unchanged)  
✅ **Code:** No errors, ready to test  

---

**Ready to test!** Open http://localhost:3000/clinic-partner and try the steps above.
