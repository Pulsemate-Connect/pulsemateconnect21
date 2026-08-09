# 📋 Message Central OTP Testing Checklist

## Prerequisites

### ✅ Backend (Already Done)
- [x] Message Central service implemented
- [x] Backend endpoints: `/auth/patient/send-otp` and `/auth/patient/verify-otp`
- [x] Local `.env` has correct credentials
- [ ] **Render environment variables MUST BE FIXED** (see `FIX-RENDER-ENV-VARS-NOW.md`)

### ✅ Frontend (Already Done)
- [x] Firebase packages removed
- [x] Message Central service created
- [x] All screens updated to use Message Central
- [x] Production backend URL configured: `https://api.pulsemateconnect.in`

---

## 🔴 STEP 1: Fix Render Environment Variables

**CRITICAL:** Backend currently returns "Failed to generate authentication token"

**Action Required:**
1. Open [Render Dashboard](https://dashboard.render.com)
2. Navigate to `pulsemate-backend` → **Environment** tab
3. Update these variables:
   ```
   MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
   MESSAGE_CENTRAL_PASSWORD=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
   MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com
   ```
4. Delete `MESSAGE_CENTRAL_AUTH_KEY` if it exists
5. Click **Save Changes**
6. Wait for deployment (1-2 minutes)
7. Check logs for "Service is live"

**See:** `FIX-RENDER-ENV-VARS-NOW.md` for detailed instructions

---

## 🟡 STEP 2: Restart Android Emulator

The emulator disconnected due to build path length issue (Windows limitation).

### Option A: Reconnect Emulator
```bash
# Check emulator status
adb devices

# If emulator is running but offline, restart adb
adb kill-server
adb start-server
adb devices
```

### Option B: Restart Emulator from Android Studio
1. Open **Android Studio**
2. Go to **Device Manager** (right sidebar)
3. Click ▶️ on your emulator (PulseMatePixel35c or similar)
4. Wait for emulator to boot

### Option C: Use Physical Android Device
1. Enable **USB Debugging** on your phone
2. Connect via USB
3. Run `adb devices` to verify connection
4. Install APK: `adb install -r android\app\build\outputs\apk\debug\app-debug.apk`

---

## 🟢 STEP 3: Install & Launch App

### Install Latest APK
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

### Launch App
```bash
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
```

### Monitor Logs (Optional)
```bash
# In separate terminal
adb logcat -s ReactNativeJS:V *:E
```

---

## 🧪 STEP 4: Test OTP Flow

### 4.1 Send OTP
1. **Launch app** on emulator/device
2. **Enter mobile number**: `9876543210` (or your test number)
3. **Click "Send OTP" button**
4. **Expected result:**
   - Loading indicator shows
   - API call to `https://api.pulsemateconnect.in/api/auth/patient/send-otp`
   - Navigation to OTP verification screen
   - SMS received on the mobile number

### 4.2 Check Logs
```bash
# Console should show:
[MessageCentral Service] 🚀 Calling backend /auth/patient/send-otp...
[MessageCentral Service] ✅ OTP sent successfully
[Login2Factor] 🧭 Navigating to Otp2Factor screen...
```

### 4.3 Verify OTP
1. **Enter OTP** from SMS (6 digits)
2. **Click "Verify" button**
3. **Expected result:**
   - Loading indicator shows
   - API call to `https://api.pulsemateconnect.in/api/auth/patient/verify-otp`
   - JWT tokens received
   - Login successful
   - Navigate to home screen

### 4.4 Check Logs
```bash
# Console should show:
[MessageCentral Service] 🔐 Calling backend /auth/patient/verify-otp...
[MessageCentral Service] ✅ OTP verified successfully
[MessageCentral Service] 🎫 Has access token: true
```

---

## 🐛 Troubleshooting

### Issue: "Failed to generate authentication token"
**Cause:** Render environment variables are swapped
**Fix:** Complete STEP 1 (Fix Render Environment Variables)

### Issue: "Network error" or "Request timeout"
**Cause:** Backend not responding or network issue
**Fix:**
1. Check Render backend status: https://dashboard.render.com
2. Test backend directly: `curl https://api.pulsemateconnect.in/api/health`
3. Check your internet connection

### Issue: "No devices/emulators found"
**Cause:** Emulator disconnected or not running
**Fix:** Complete STEP 2 (Restart Android Emulator)

### Issue: "Invalid mobile number"
**Cause:** Phone number validation failed
**Fix:** Enter 10-digit number without +91 (e.g., `9876543210`)

### Issue: "OTP not received"
**Possible causes:**
1. Message Central account has no credits/balance
2. Message Central API rate limit reached
3. Phone number is invalid or blocked

**Fix:**
1. Login to Message Central: https://cpaas.messagecentral.com
2. Check account balance
3. Check SMS delivery logs
4. Try a different phone number

### Issue: "Invalid OTP"
**Cause:** Wrong OTP or OTP expired
**Fix:**
1. Check SMS for correct OTP
2. OTP expires in 60 seconds - request new one if expired
3. Click "Resend OTP" button

---

## 📊 Success Criteria

✅ All checkpoints must pass:

- [ ] Backend Render environment variables corrected
- [ ] Backend deploys successfully on Render
- [ ] Emulator/device connected (`adb devices` shows device)
- [ ] APK installed successfully
- [ ] App launches without crashes
- [ ] Send OTP button is clickable
- [ ] API call to `/auth/patient/send-otp` succeeds (HTTP 200)
- [ ] SMS received with 6-digit OTP
- [ ] OTP verification screen appears
- [ ] Verify OTP call succeeds (HTTP 200)
- [ ] JWT tokens saved in SecureStore
- [ ] User navigates to home screen
- [ ] No Firebase-related errors in logs

---

## 📱 Test Scenarios

### Scenario 1: New User Registration
1. Enter new mobile number (not in database)
2. Send OTP
3. Receive SMS
4. Enter OTP
5. **Expected:** New user account created, logged in

### Scenario 2: Existing User Login
1. Enter existing mobile number (already in database)
2. Send OTP
3. Receive SMS
4. Enter OTP
5. **Expected:** Existing user logged in

### Scenario 3: Resend OTP
1. Send OTP
2. Wait for SMS
3. Click "Resend OTP" button
4. **Expected:** New OTP sent, old OTP invalidated

### Scenario 4: Expired OTP
1. Send OTP
2. Wait 60+ seconds
3. Try to verify
4. **Expected:** "OTP expired" error

### Scenario 5: Wrong OTP
1. Send OTP
2. Enter incorrect code
3. **Expected:** "Invalid OTP" error

---

## 🔧 Quick Commands Reference

```bash
# Check devices
adb devices

# Install APK
adb install -r android\app\build\outputs\apk\debug\app-debug.apk

# Launch app
adb shell am force-stop in.pulsemateconnect.patient
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

# View logs
adb logcat -s ReactNativeJS:V *:E

# Clear logs
adb logcat -c

# Check Render backend
curl https://api.pulsemateconnect.in/api/health

# Test send OTP (replace with your number)
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+919876543210"}'
```

---

## 📝 Notes

- **Path Length Issue:** Gradle build fails due to Windows 260-character path limit. The folder "PulseMate Connect" with spaces causes long paths. This doesn't affect the existing APK.
- **Metro Bundler:** Running on port 8082 (Terminal ID: 40)
- **Backend:** Production at `https://api.pulsemateconnect.in`
- **Package:** `in.pulsemateconnect.patient`

---

## 🎯 Current Status

- ✅ Frontend code: Complete
- ✅ Backend code: Complete
- 🔴 Render environment: **NEEDS FIX** (swapped credentials)
- 🟡 Emulator: Disconnected (needs restart)
- 🟡 Testing: Blocked by backend and emulator issues

**Next Action:** Fix Render environment variables (STEP 1)
