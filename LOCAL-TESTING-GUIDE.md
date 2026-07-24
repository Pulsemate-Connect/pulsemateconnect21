# Local Testing Guide — Backend OTP Flow

## Current Status ✅

- **Backend Server**: Running at `http://10.130.140.219:5000`
- **Expo Server**: Running at `exp://10.130.140.219:8081`
- **app.json Updated**: Using local backend API for development

## Testing OTP Flow on Physical Phone

### Step 1: Restart Expo App
The app configuration has been updated to use the local backend. You need to refresh the Expo app:

1. On your Android phone with Expo Go app open
2. Scan the QR code from the Expo terminal again (or press 'r' in terminal to reload)
3. Wait for the app to reload and show "Firebase Auth ready"

### Step 2: Enter Phone Number
1. Go to the Login screen
2. Enter your phone number: `+917022818878`
3. Click "Send OTP"

### Step 3: Check Backend Console
Look at the backend terminal (running `npm run dev`). You should see:

```
[BACKEND-OTP] Phone: +917022818878, Code: 123456
```

The OTP code will be printed to the backend console (not sent via SMS yet, since SMS provider is mocked).

### Step 4: Enter OTP in App
1. Copy the 6-digit OTP from the backend console
2. Enter it in the app's "Enter OTP" field
3. Click "Verify OTP"

### Step 5: Expected Outcome
✅ **Success**: You should see login completed and be taken to the home screen
❌ **Error**: Check the Expo terminal for error messages

---

## Troubleshooting

### Issue: Route not found (404)
**Cause**: App is still pointing to production API
**Solution**: 
1. Check that `app.json` has `"apiUrl": "http://10.130.140.219:5000/api"`
2. In Expo terminal, press 'r' to reload
3. Make sure you're on the same WiFi network as your computer

### Issue: Cannot connect to backend
**Cause**: Backend not running or network unreachable
**Solution**:
1. Check backend is running: Terminal ID 53 should show "PulseMate API running on port 5000"
2. Ensure phone and computer are on **same WiFi network**
3. Try pinging from phone (if possible):
   - Open terminal on your computer
   - Run: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Find the local IP address (usually `10.x.x.x` or `192.168.x.x`)

### Issue: OTP shows in console but not sent via SMS
**Expected behavior for now**: OTP only logs to console until SMS provider is configured
**Configuration in `backend/.env`**:
- `SMS_PROVIDER=mock` ← This is why SMS isn't sent
- To send real SMS, change to `SMS_PROVIDER=twilio` and add Twilio credentials

---

## Next Steps

### Option 1: Continue Testing (Console OTP)
Keep using the console OTP method for now:
1. Click "Send OTP" in app
2. Check backend console for code
3. Enter code in app

### Option 2: Configure Real SMS (Twilio)
To get actual SMS delivery:
1. Create Twilio account at https://www.twilio.com
2. Get your account SID, auth token, and phone number
3. Update `backend/.env`:
   ```
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   SMS_PROVIDER=twilio
   ```
4. Restart backend: Type 'rs' in the backend terminal
5. SMS will now be sent to the phone number

---

## Files Changed
- `app.json`: Updated `apiUrl` to local backend (was `https://api.pulsemateconnect.in/api`)
- No other changes needed — backend already has OTP endpoints implemented

## Quick Reference: Backend OTP Endpoints

### Send OTP
```
POST http://10.130.140.219:5000/api/auth/patient/send-otp-expo
Body: { "phone": "+917022818878" }
Response: { "verificationId": "...", "phone": "..." }
```

### Verify OTP
```
POST http://10.130.140.219:5000/api/auth/patient/verify-otp-expo
Body: { "verificationId": "...", "code": "123456" }
Response: { "idToken": "...", "phone": "..." }
```

---

## Testing Checklist

- [ ] Backend running (Terminal ID 53)
- [ ] Expo running with updated app.json
- [ ] Phone connected to same WiFi as computer
- [ ] App reloaded after config change
- [ ] Can enter phone number in login screen
- [ ] "Send OTP" button doesn't show 404 error
- [ ] OTP code appears in backend console
- [ ] Can enter OTP in app
- [ ] Login successful after verification

---

## Backend Console Example Output

When you send OTP, you'll see in the backend terminal:
```
[BACKEND-OTP] Phone: +917022818878, Code: 689850
2026-07-24 19:52:15 [debug]: POST /auth/patient/send-otp-expo
```

This confirms the endpoint is working!
