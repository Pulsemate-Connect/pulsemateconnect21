# 🔥 Firebase Phone Authentication Setup

## Architecture

You're now using **Firebase Phone Auth with a hybrid approach**:

```
App (React Native/Expo)
    ↓
  User enters phone: +917022818878
    ↓
  App calls: POST /api/auth/patient/firebase-send-otp
    ↓
Backend (Node.js + Firebase Admin SDK)
    ├─ Generate 6-digit OTP
    ├─ Store in cache (5-min expiry)
    ├─ Send SMS via Twilio/MSG91/2Factor
    └─ Return sessionInfo
    ↓
  User receives SMS (or checks console if mocked)
    ↓
  User enters OTP code
    ↓
  App calls: POST /api/auth/patient/firebase-verify-otp
    ↓
Backend
    ├─ Verify OTP code
    ├─ Create Firebase Custom Token (Admin SDK)
    └─ Return customToken
    ↓
  App signs in with customToken using signInWithCustomToken()
    ↓
  Firebase Authentication completes
    ↓
  App calls: POST /auth/patient/firebase-phone-login
    ↓
Backend
    ├─ Create/find user in database
    ├─ Generate JWT tokens
    └─ Return accessToken
    ↓
  ✅ Login Complete — User in Home Screen
```

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Firebase Config | ✅ | Already set up in project |
| Backend Endpoints | ✅ | Both send-otp and verify-otp created |
| SMS Service | ✅ | Ready (currently mock) |
| Firebase Admin SDK | ✅ | Already initialized in backend |
| Custom Token Generation | ✅ | Code added to verify endpoint |

---

## Testing Firebase Phone Auth

### Step 1: Ensure Backend is Running
- Terminal ID 53 should show "PulseMate API running"
- Check by visiting: `http://10.130.140.219:5000/health`
- Should return: `{"status":"ok",...}`

### Step 2: Reload Expo App
- In Expo terminal, press `r` to reload
- Wait for "Firebase Auth ready" message
- App should connect to backend at `http://10.130.140.219:5000/api`

### Step 3: Send OTP
1. On your phone in the app
2. Go to Login screen
3. Enter phone: `+917022818878`
4. Click "Send OTP"
5. Wait for response

### Step 4: Check Backend Console
Look for logs in Terminal ID 53:
```
[FIREBASE-OTP] SMS sent to +917022818878, Code: 123456
```

Or if SMS mocked:
```
[SMS-MOCK] Sent to +917022818878 (mock SMS, for testing only)
```

### Step 5: Enter OTP in App
1. Find the 6-digit code from:
   - Backend console (if mocked)
   - Your SMS inbox (if Twilio configured)
2. Enter code in app's OTP field
3. Click "Verify OTP"

### Step 6: Check Backend for Custom Token
Look for:
```
[FIREBASE] Custom token generated for +917022818878
```

### Step 7: Verify Firebase Signs In
Check app console for:
```
[Firebase] OTP verified successfully
[Firebase] Backend authentication successful
```

### Step 8: Login Complete ✅
App navigates to Home screen and user is logged in

---

## Key Endpoints

### 1. Send OTP (Firebase)
```
POST http://10.130.140.219:5000/api/auth/patient/firebase-send-otp

Request:
{
  "phone": "+917022818878"
}

Response:
{
  "success": true,
  "data": {
    "sessionInfo": "+917022818878_1784903542210",
    "phone": "+917022818878"
  }
}
```

### 2. Verify OTP (Firebase)
```
POST http://10.130.140.219:5000/api/auth/patient/firebase-verify-otp

Request:
{
  "sessionInfo": "+917022818878_1784903542210",
  "code": "123456",
  "phoneNumber": "+917022818878"
}

Response:
{
  "success": true,
  "data": {
    "customToken": "eyJhbGc...",
    "phone": "+917022818878"
  }
}
```

### 3. Login with Firebase Token
```
POST http://10.130.140.219:5000/api/auth/patient/firebase-phone-login

Request:
{
  "firebaseIdToken": "customToken...",
  "name": "John Doe" (optional)
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "user": { ... }
  }
}
```

---

## SMS Configuration (Optional)

Current setting: `SMS_PROVIDER=mock` (logs to console)

To enable **real SMS delivery**, configure Twilio in `backend/.env`:

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

Then restart backend (type `rs` in terminal).

See `TWILIO-QUICK-START.md` for detailed setup.

---

## Flow Summary

1. **User enters phone number**
   - Validates E.164 format (+91...)

2. **App calls firebase-send-otp**
   - Backend generates 6-digit code
   - Stores in cache (5 min expiry)
   - Sends SMS (or mocks)
   - Returns sessionInfo

3. **User receives SMS and enters code**
   - User copies OTP from SMS or console
   - Enters in app's OTP field

4. **App calls firebase-verify-otp**
   - Backend validates code
   - Creates Firebase Custom Token
   - Returns customToken

5. **App calls signInWithCustomToken()**
   - Firebase client SDK signs in user
   - Firebase stores auth state

6. **App sends customToken to backend**
   - Backend creates/finds user in database
   - Generates JWT tokens
   - Returns accessToken and user data

7. **App stores tokens and navigates to home**
   - ✅ Login complete
   - User can now use the app

---

## Files Modified

### App Side
- `src/config/firebase.js` — Updated to use Firebase Admin SDK OTP approach

### Backend Side
- `backend/src/routes/auth.routes.js` — Added 2 new endpoints:
  - `/patient/firebase-send-otp`
  - `/patient/firebase-verify-otp`

### Configuration
- `app.json` — Still using local backend for development

---

## Advantages of This Approach

✅ **No reCAPTCHA Issues** — Backend uses Firebase Admin SDK (no UI verification needed)
✅ **Works in React Native/Expo** — No DOM requirements
✅ **Real Firebase Security** — Leverages Firebase infrastructure
✅ **Customizable** — Control OTP generation and SMS provider
✅ **Scalable** — Can swap SMS provider easily (Twilio → MSG91, etc.)
✅ **Testable** — Mock SMS for development, real SMS for production

---

## Troubleshooting

### Issue: "firebase-send-otp: 404 not found"
**Solution**: 
1. Check backend is running (Terminal ID 53)
2. Reload Expo app (press 'r')
3. Verify app.json has local API URL

### Issue: "OTP expired" error
**Cause**: 5-minute timeout exceeded
**Solution**: Resend OTP and verify within 5 minutes

### Issue: "Custom token generation error"
**Cause**: Firebase Admin SDK initialization issue
**Solution**: 
1. Check Firebase credentials in `backend/.env`
2. Restart backend
3. Try again

### Issue: SMS not received
**Current**: SMS is mocked (logs to console)
**Solution**: Set up Twilio to enable real SMS (see `TWILIO-QUICK-START.md`)

---

## Next Steps

1. **Test Current Setup**
   - Send OTP → Check console for code
   - Verify OTP → Should work
   - Login → Should complete

2. **Enable Real SMS (Optional)**
   - Set up Twilio (5 minutes)
   - Update `backend/.env`
   - Restart backend
   - Test with real SMS

3. **Test Edge Cases**
   - Wrong OTP code
   - Expired OTP (after 5 min)
   - Resend OTP
   - Multiple users

4. **Prepare for Production**
   - Update app.json to production API URL
   - Use paid Twilio account (vs. trial)
   - Deploy backend to production server
   - Build release APK/AAB
   - Submit to Play Store

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Phone App                             │
│                 (React Native/Expo)                     │
│                                                         │
│  import { signInWithCustomToken } from 'firebase/auth' │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP API
                 ↓
┌─────────────────────────────────────────────────────────┐
│               Backend Server                            │
│             (Node.js + Express)                        │
│                                                         │
│  POST /firebase-send-otp                              │
│    ├─ Generate OTP                                     │
│    ├─ Cache with expiry                               │
│    └─ Send SMS                                         │
│                                                         │
│  POST /firebase-verify-otp                            │
│    ├─ Verify OTP                                       │
│    ├─ Create Firebase Custom Token                    │
│    └─ Return customToken                              │
│                                                         │
│  POST /firebase-phone-login                           │
│    ├─ Create/find user                                │
│    ├─ Generate JWT                                    │
│    └─ Return accessToken                              │
└────────────────┬────────────────────────────────────────┘
                 │
      ┌──────────┼──────────┐
      ↓          ↓          ↓
   ┌──────┐  ┌──────┐  ┌──────┐
   │ SMS  │  │Cache │  │ DB   │
   │      │  │  5m  │  │      │
   └──────┘  └──────┘  └──────┘
```

---

## Summary

You're now using **proper Firebase Phone Authentication** with:
- ✅ Backend-driven OTP generation (avoids reCAPTCHA)
- ✅ Firebase Custom Token for secure authentication
- ✅ Support for real SMS via Twilio/MSG91/2Factor
- ✅ Development mode with console-based OTP

Ready to test? Follow the **Testing Firebase Phone Auth** section above! 🚀
