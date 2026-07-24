# ✅ Backend OTP Testing — READY TO GO!

## Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| Backend Server | ✅ Running | Port 5000 on `http://10.130.140.219:5000` |
| OTP Send Endpoint | ✅ Working | `POST /api/auth/patient/send-otp-expo` |
| OTP Verify Endpoint | ✅ Working | `POST /api/auth/patient/verify-otp-expo` |
| Expo App | ✅ Ready | Updated to use local backend |
| Firebase Config | ✅ Ready | Uses backend OTP instead of Firebase Phone Auth |

---

## What's Been Done ✅

1. **Backend Started**: Running with `npm run dev` at `http://10.130.140.219:5000`
2. **OTP Endpoints Verified**: Both send and verify endpoints tested and working
3. **App Configuration Updated**: `app.json` now points to local backend for development
4. **Test Successful**: 
   - Sent OTP to `+917022818878` → Generated code `187593` ✅
   - Verified OTP with code → Got valid token ✅

---

## How to Test on Your Phone

### Prerequisites
- ✅ Same WiFi network (phone + computer)
- ✅ Backend running (Terminal ID 53)
- ✅ Expo running (Terminal ID 52 or 49)

### Step-by-Step

#### 1. **Reload the Expo App**
   - In Expo terminal, press `r` to reload the app
   - OR scan the QR code again on your phone
   - Wait for "Firebase Auth ready" message

#### 2. **Go to Login Screen**
   - App should load the login screen
   - No authentication errors should appear

#### 3. **Enter Phone Number**
   - Phone input field: `+917022818878`
   - Click "Send OTP" button

#### 4. **Watch Backend Console**
   - Check Terminal ID 53 (backend)
   - You'll see: `[BACKEND-OTP] Phone: +917022818878, Code: XXXXXX`
   - **Copy the 6-digit code**

#### 5. **Enter OTP in App**
   - In the OTP input screen
   - Paste the 6-digit code
   - Click "Verify OTP"

#### 6. **Success!**
   - Should see login completed
   - Taken to home screen
   - Authentication successful ✅

---

## Current OTP Flow (Development)

```
Phone App                Backend                Database
    |                       |                        |
    |--"Send OTP"---------->|                        |
    |   +917022818878       | Generate OTP (random)  |
    |                       | Store in memory (5min) |
    |<--verificationId------|                        |
    |                       |                        |
    | (User enters OTP)     |                        |
    |                       |                        |
    |--"Verify OTP"-------->|                        |
    |   verificationId      | Check cache            |
    |   code: 123456        | Validate               |
    |                       | Generate mock token    |
    |<--idToken-------------|                        |
    |                       |                        |
    | (Backend login with idToken)                   |
    |--firebase-phone-login-->|                      |
    |   firebaseIdToken       |                      |--Query DB
    |                         | Create/Find user     |
    |                         |<--User data----------|
    |<--accessToken, user-----|                      |
    |   (Login successful)                           |
```

---

## Important Notes

### OTP Codes
- Generated **per request** (not sent via SMS yet)
- **Valid for 5 minutes**
- Can be found in backend console logs
- Format: 6-digit random number

### Production Setup (Later)
To send **real SMS**, update `backend/.env`:
```
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

Then restart backend (type 'rs' in backend terminal).

### Testing Multiple Users
You can test with any phone number:
- `+917022818878` ✅ Tested
- `+919876543210` (Try any valid format)
- `+1234567890` (International numbers work too)

---

## API Endpoints (Testing)

### Send OTP
```bash
curl -X POST http://10.130.140.219:5000/api/auth/patient/send-otp-expo \
  -H "Content-Type: application/json" \
  -d '{"phone":"+917022818878"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "+917022818878_1784902785267",
    "phone": "+917022818878"
  },
  "message": "OTP sent successfully"
}
```

### Verify OTP
```bash
curl -X POST http://10.130.140.219:5000/api/auth/patient/verify-otp-expo \
  -H "Content-Type: application/json" \
  -d '{"verificationId":"+917022818878_1784902785267","code":"187593"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "idToken": "mock-token-+917022818878",
    "phone": "+917022818878"
  },
  "message": "OTP verified"
}
```

---

## Files Modified

- **`app.json`**: Updated `apiUrl` from production to local backend
  - Before: `"apiUrl": "https://api.pulsemateconnect.in/api"`
  - After: `"apiUrl": "http://10.130.140.219:5000/api"`

- **`src/config/firebase.js`**: Already uses backend OTP (no changes needed)

- **`backend/src/routes/auth.routes.js`**: OTP endpoints already defined (no changes needed)

---

## Troubleshooting

### ❌ Still getting 404 errors?
1. Check app was reloaded after config change (press 'r' in Expo terminal)
2. Verify phone is on same WiFi as computer
3. Check firewall isn't blocking port 5000

### ❌ OTP code not showing in backend console?
1. Backend terminal ID 53 should have recent POST logs
2. If no logs, backend might have crashed (check output)
3. Try sending OTP again

### ❌ Verify OTP fails?
1. Check the code hasn't expired (5 minutes)
2. Make sure code is exactly 6 digits
3. Copy from console carefully (no spaces)

### ❌ Network unreachable?
1. `ipconfig` on your computer to get IP
2. Update app.json with correct IP
3. Reload Expo app

---

## Next Steps

1. **Test on phone** ← You are here
2. Test all login scenarios (valid phone, invalid, timeout, etc.)
3. Add real SMS provider (Twilio/AWS SNS)
4. Test on multiple devices
5. Deploy backend to production server
6. Update app.json to production API URL
7. Build release APK/AAB

---

## Live Testing Session

**When you're ready to test:**
1. Confirm backend is running (check Terminal ID 53)
2. Reload Expo app
3. Enter `+917022818878` in login
4. Send OTP
5. Find code in backend terminal
6. Enter code in app
7. Report success/error here

Backend is waiting and ready! 🚀
