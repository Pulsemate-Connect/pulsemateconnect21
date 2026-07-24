# 📱 Complete OTP → SMS Workflow Guide

## Current Architecture

```
Phone App (React Native/Expo)
        ↓
  [Login Screen]
        ↓
  User enters phone number: +917022818878
        ↓
  User clicks "Send OTP"
        ↓
  App calls: POST /api/auth/patient/send-otp-expo
        ↓
─────────────────────────────────────────────────────
        ↓
Backend Server (Node.js/Express)
        ↓
  [OTP Handler]
  ├─ Generate 6-digit code (e.g., 123456)
  ├─ Store in cache with 5-min expiry
  ├─ Call SMS service: sendOtpSms(phone, otp)
  └─ Return verificationId to app
        ↓
  [SMS Service]
  Check SMS_PROVIDER environment variable:
  ├─ If "mock" → Log to console (current)
  ├─ If "twilio" → Send via Twilio API
  ├─ If "msg91" → Send via MSG91 API
  └─ If "2factor" → Send via 2Factor API
        ↓
─────────────────────────────────────────────────────
        ↓
User receives SMS (or logs to console if mock)
        ↓
  User enters code: 123456
        ↓
  User clicks "Verify OTP"
        ↓
  App calls: POST /api/auth/patient/verify-otp-expo
  with: { verificationId, code: "123456" }
        ↓
─────────────────────────────────────────────────────
        ↓
Backend Server verifies OTP
  ├─ Check verificationId exists in cache
  ├─ Check code is correct
  ├─ Check OTP hasn't expired (5 min)
  └─ If all good → return idToken
        ↓
  App receives idToken
        ↓
  App calls: POST /auth/patient/firebase-phone-login
  with: { firebaseIdToken, name }
        ↓
─────────────────────────────────────────────────────
        ↓
Backend Server creates/logs in user
  ├─ Create user in database if new
  ├─ Generate JWT tokens
  └─ Return accessToken and user data
        ↓
  App receives tokens
        ↓
  App stores tokens in secure storage
        ↓
  ✅ LOGIN SUCCESSFUL
  ↓
  App navigates to Home Screen
```

---

## Current Status

### Step-by-Step Completion

#### ✅ Phase 1: Backend OTP Generation
- Backend generates random 6-digit OTP
- Stores OTP in memory cache (5-minute expiry)
- Returns verificationId to app
- **Status**: COMPLETE ✅

#### ✅ Phase 2: SMS Service Integration
- SMS service created with 4 providers
- OTP handler updated to call SMS service
- Twilio integration code ready
- **Status**: COMPLETE ✅

#### ⏳ Phase 3: SMS Provider Configuration (Your Turn)
- Choose SMS provider (Twilio recommended)
- Get API credentials
- Update `backend/.env`
- Restart backend
- **Status**: WAITING FOR YOU → This is what we'll do next

#### ⏳ Phase 4: Testing
- Test OTP flow with real SMS
- Verify email/notifications work
- Test edge cases (expired OTP, wrong code, etc.)
- **Status**: WAITING FOR SMS SETUP

---

## How to Enable Real SMS

### Quick Path: Twilio (5 minutes)

1. **Create Account**
   - Go to: https://www.twilio.com/try-twilio
   - Sign up with email
   - Verify email
   - Get free $15 credit (lasts 30 days)

2. **Get Credentials**
   - In Twilio Console → Account → API Keys
   - Copy **Account SID** (AC...)
   - Copy **Auth Token** (...)
   - Get a **Phone Number** (Phone Numbers section)

3. **Update Backend Config**
   ```
   File: pulsemateconnect21/backend/.env
   
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Restart Backend**
   - In backend terminal (ID 53)
   - Type: `rs`
   - Wait for restart message

5. **Test on Phone**
   - Send OTP
   - Check your SMS inbox
   - SMS from Twilio with OTP code arrives ✅

### Documentation

For detailed setup: See `TWILIO-SMS-SETUP.md`
For quick version: See `TWILIO-QUICK-START.md`

---

## Testing Without SMS Setup

You can test the entire OTP flow right now without Twilio:

1. **Send OTP from app**
   ```
   Phone app → Send OTP
   Backend → Generates code
   ```

2. **Find OTP in Backend Console**
   ```
   Look at Terminal ID 53
   You'll see: [BACKEND-OTP] SMS sent to +917022818878, Code: 123456
   ```

3. **Copy Code and Enter in App**
   ```
   Copy: 123456
   Paste in app's OTP field
   Click Verify
   ```

4. **Complete Login**
   ```
   Backend verifies code
   App receives token
   ✅ Login successful
   ```

This works great for **development and testing**. When you're ready for **real users**, set up Twilio (5 minutes).

---

## Environment Variables Explained

### Current Setup (Mock)
```env
SMS_PROVIDER=mock
```
- **Behavior**: OTP logged to console only
- **SMS Sent**: ❌ No
- **Good For**: Development, testing
- **Cost**: Free

### After Twilio Setup
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```
- **Behavior**: Real SMS sent via Twilio
- **SMS Sent**: ✅ Yes
- **Good For**: Testing with real users, early production
- **Cost**: $0.01 per SMS (trial: free $15 credit)

### Alternative: MSG91 (Better for India)
```env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=xxxxxxxxxxxxxxxxxxxxxxx
MSG91_TEMPLATE_ID=xxxxxxxxxxxxxxxxxxxxxxx
MSG91_SENDER_ID=PULSE
```
- **Behavior**: SMS via MSG91 API
- **SMS Sent**: ✅ Yes
- **Good For**: Production in India
- **Cost**: ~₹0.50 per SMS

---

## Files in This Feature

### Code Files
```
backend/src/routes/auth.routes.js       ← OTP handler (UPDATED)
backend/src/services/sms.service.js     ← SMS service (ready to use)
src/config/firebase.js                  ← App OTP client (ready)
src/screens/LoginScreen.tsx             ← Login UI (ready)
src/screens/OtpScreen.tsx               ← OTP input UI (ready)
```

### Configuration
```
backend/.env                            ← SMS provider settings
app.json                                ← API URL (set to local)
```

### Documentation (Created Today)
```
TWILIO-SMS-SETUP.md                     ← Full setup guide
TWILIO-QUICK-START.md                   ← 2-minute quick start
SMS-INTEGRATION-COMPLETE.md             ← What was changed
OTP-SMS-WORKFLOW-GUIDE.md               ← This file
BACKEND-OTP-TESTING-READY.md            ← Earlier guide
LOCAL-TESTING-GUIDE.md                  ← Earlier guide
```

---

## Complete Testing Scenarios

### Scenario 1: Test with Mock SMS (Right Now ✅)
```
Time: ~2 minutes
Steps:
  1. Open phone app
  2. Enter: +917022818878
  3. Click "Send OTP"
  4. Check backend console for code
  5. Copy code, enter in app
  6. Click "Verify"
  7. Login successful ✅
Result: Everything works, SMS just logs to console
```

### Scenario 2: Test with Twilio SMS (After Setup)
```
Time: ~10 minutes (5 min setup + 5 min testing)
Steps:
  1. Create Twilio account
  2. Get 3 credentials
  3. Update .env
  4. Restart backend
  5. Open phone app
  6. Enter: +917022818878
  7. Click "Send OTP"
  8. **SMS arrives in inbox** ✅
  9. Read code from SMS
  10. Enter in app
  11. Click "Verify"
  12. Login successful ✅
Result: Real SMS working
```

### Scenario 3: Edge Case Testing
```
Wrong Code:
  1. Send OTP → Get code 123456
  2. Enter wrong code: 654321
  3. Error message: "Invalid OTP"
  4. Can resend and try again

Expired OTP:
  1. Send OTP
  2. Wait 5+ minutes
  3. Try to verify
  4. Error message: "OTP expired"
  5. Must send new OTP

Resend OTP:
  1. Send OTP → Code: 123456
  2. Send OTP again → Code: 789012
  3. Old code becomes invalid
  4. New code works
```

---

## Deploying to Production

### When Ready for Real Users

1. **Set up paid Twilio account**
   - Or use MSG91 for India

2. **Update backend `.env` for production**
   ```env
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=...
   ```

3. **Update app for production**
   ```
   app.json:
   - Change apiUrl to production server
   - Build release APK/AAB
   ```

4. **Deploy backend to production**
   ```
   Update server running at:
   https://api.pulsemateconnect.in
   ```

5. **Submit to Google Play Store**
   ```
   Build and submit release APK/AAB
   ```

---

## Quick Reference

### OTP Endpoints
- **Send**: `POST /api/auth/patient/send-otp-expo`
- **Verify**: `POST /api/auth/patient/verify-otp-expo`

### OTP Settings
- **Length**: 6 digits
- **Validity**: 5 minutes
- **Max Attempts**: 5 (via rate limiting)
- **Rate Limit**: 3 requests per minute

### SMS Providers
- **mock** (current): Console only
- **twilio**: International
- **msg91**: India
- **2factor**: Budget

---

## Your Next Step

**You have 2 choices:**

### Choice 1: Continue Testing with Mock (Now)
- Keep SMS_PROVIDER=mock
- Test OTP flow works
- Find codes in backend console
- Perfectly fine for development

### Choice 2: Enable Real SMS (Recommended)
1. Go to: https://www.twilio.com/try-twilio
2. Sign up (2 minutes)
3. Copy 3 credentials
4. Update backend/.env (1 minute)
5. Restart backend (10 seconds)
6. Test with real SMS (2 minutes)
7. **Total: ~5 minutes** ✅

**I recommend Choice 2** — You'll have real SMS working in 5 minutes and it's much better for testing with real users!

Which path will you take? 🚀
