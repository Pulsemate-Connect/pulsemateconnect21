# 🧪 PulseMate Connect - Testing Guide

## ✅ Build Status: SUCCESS
**Build ID:** 88120141-b9db-4ac9-8af5-7d21e9c1ca5b  
**Build Date:** August 2, 2026  
**Build Type:** APK (Production)  
**Status:** ✅ **INSTALLED ON EMULATOR**

---

## 📱 App Installation

### Current Installation
- **Package Name:** `in.pulsemateconnect.patient`
- **Installed On:** Android Emulator (emulator-5554)
- **Installation Status:** ✅ Success

### Reinstall if Needed
```bash
# Download latest build
eas build:download --id 88120141-b9db-4ac9-8af5-7d21e9c1ca5b

# Install on emulator
adb install "C:\Users\shubh\AppData\Local\Temp\eas-cli-nodejs\eas-build-run-cache\31fca56b-a99e-4219-bb3f-600d8b0c86b7_88120141-b9db-4ac9-8af5-7d21e9c1ca5b.apk"

# Launch app
adb shell monkey -p in.pulsemateconnect.patient 1
```

---

## 🧪 Test OTP Authentication

### Step 1: Open App
The app is already installed and can be launched from the emulator.

### Step 2: Monitor Logs
Run this command in a **separate terminal**:
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
test-otp-flow.bat
```

This will show real-time logs for:
- Authentication events
- Firebase initialization
- OTP send/verify operations
- Backend API calls
- Any errors

### Step 3: Test Login Flow

1. **Enter Phone Number:** `+917022818878` (or any valid number)
2. **Tap "Send OTP"**
3. **Watch the logs** for:
   - ✅ Backend API call to `/auth/patient/send-otp`
   - ❌ Network errors (if backend is unreachable)
   - ✅ OTP sent successfully

### Step 4: Enter OTP
If OTP is received, enter it and verify login works.

---

## 🔍 What to Check in Logs

### ✅ Success Indicators
```
[Login2Factor] FIREBASE INITIALIZATION SUCCESS
[Login2Factor] CALLING sendOtpToPhone
[Backend SMS] Sending OTP to +917022818878
[Backend SMS] OTP sent successfully
```

### ❌ Error Indicators
```
ERROR: Network Error
ERROR: Backend API unreachable
ERROR: Request timed out after 30000ms
```

---

## 🌐 Backend API Requirements

The app now uses **Backend SMS Service** instead of Firebase.

### Required Endpoints

#### 1. Send OTP
```
POST https://api.pulsemateconnect.in/api/auth/patient/send-otp
Content-Type: application/json

{
  "phoneNumber": "+917022818878"
}

Response:
{
  "requestId": "unique-request-id",
  "message": "OTP sent successfully"
}
```

#### 2. Verify OTP
```
POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp
Content-Type: application/json

{
  "requestId": "unique-request-id",
  "otp": "123456"
}

Response:
{
  "success": true,
  "token": "jwt-token",
  "user": { ... }
}
```

---

## 🔧 Troubleshooting

### Issue: Network Error
**Symptom:** `AxiosError: Network Error` with code `ERR_NETWORK`

**Possible Causes:**
1. Backend server is not running
2. Emulator cannot reach `api.pulsemateconnect.in`
3. API endpoints don't exist yet
4. Firewall blocking requests

**Solutions:**

#### Option A: Use Physical Device
Physical devices have better network access than emulators.

```bash
# Check connected devices
adb devices

# Install on physical device
adb -s <device-id> install pulsemate-latest.apk
```

#### Option B: Fix Emulator Network
```bash
# Check if emulator can reach backend
adb shell ping api.pulsemateconnect.in

# If ping fails, configure network or use localhost tunnel
```

#### Option C: Test Backend Endpoints
```bash
# Test from your PC
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"+917022818878\"}"
```

### Issue: App Crashes on Launch
**Check logs:**
```bash
adb logcat | findstr "FATAL"
```

### Issue: OTP Not Received
**Check:**
1. Backend server logs
2. SMS service (Twilio/AWS SNS) configuration
3. Phone number format (+91XXXXXXXXXX)

---

## 📊 Test Results Log

| Test Case | Status | Notes |
|-----------|--------|-------|
| App Installation | ✅ Pass | Installed successfully |
| App Launch | ✅ Pass | Opens without crashes |
| Firebase Initialization | ✅ Pass | No Firebase errors (removed) |
| UI Rendering | ⏳ Pending | Check if login screen appears |
| Send OTP Button | ⏳ Pending | Test phone number entry |
| Backend API Call | ⏳ Pending | Test network connectivity |
| OTP Verification | ⏳ Pending | Test OTP entry and verification |

---

## 📝 Next Steps

1. **Run `test-otp-flow.bat`** to start monitoring logs
2. **Open the app** on emulator
3. **Enter phone number** and tap "Send OTP"
4. **Check logs** for success or errors
5. **If network error:**
   - Verify backend server is running
   - Test API endpoints exist
   - Consider testing on physical device

---

## 📞 Support

If you encounter any issues:
1. Check the logs using `test-otp-flow.bat`
2. Share the error messages
3. Verify backend server status
4. Test on physical device if emulator has network issues

---

**Last Updated:** August 2, 2026  
**Build Version:** 88120141-b9db-4ac9-8af5-7d21e9c1ca5b
