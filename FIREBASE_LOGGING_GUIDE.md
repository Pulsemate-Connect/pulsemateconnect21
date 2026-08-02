# Firebase Phone Authentication - Production Logging Guide

## Overview

This document explains the comprehensive logging system implemented for Firebase Phone Authentication and how to retrieve logs from a Play Store-installed production app.

## What Was Added

### ✅ Complete Logging Coverage

We've added detailed logging to **every step** of the Firebase Phone Authentication flow:

1. **Firebase Initialization** (firebase.js + all screens)
   - Environment detection (Expo Go / Development Build / Play Store Production)
   - Package name logging
   - Platform and version information
   - Success/failure with timing information

2. **Send OTP Flow** (LoginScreen.jsx, Login2FactorScreen.jsx)
   - Button press timestamp
   - Phone number validation
   - Firebase Auth readiness check
   - RecaptchaVerifier creation (if applicable)
   - signInWithPhoneNumber() call details
   - Success with verification ID
   - Complete error details with stack traces

3. **OTP Verification Flow** (OtpScreen.jsx, Otp2FactorScreen.jsx)
   - Screen mount with parameters validation
   - Time elapsed since OTP sent (timeout warnings)
   - OTP code format validation
   - verifyPhoneOtp() call details
   - Firebase token retrieval
   - Backend authentication
   - Complete error details with stack traces

4. **OTP Resend Flow** (All OTP screens)
   - Resend button press
   - New OTP request details
   - Updated verification ID
   - Complete error details

### ✅ Every Log Entry Contains

- **Timestamp** (ISO format)
- **Platform** (Android/iOS with version)
- **Environment** (Expo Go / Development Build / Play Store Production)
- **Package Name** (in.pulsemateconnect.patient)
- **Build Type** (appOwnership)
- **Development Mode** (__DEV__ flag)
- **Expo SDK Version**
- **App Version & Build Number**

### ✅ Error Logging Includes

- **error.name** (Error class name)
- **error.code** (Firebase error code)
- **error.message** (Human-readable message)
- **error.stack** (Full stack trace)
- **Full error object** (JSON serialized)
- **Contextual information** (what was being attempted)
- **Timing information** (how long before failure)

## Log Format

All logs use a consistent boxed format for easy identification:

```
╔═══════════════════════════════════════════════════════════════════════════════
║ 🚀 [Component] ACTION DESCRIPTION
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: 2026-08-02T10:30:45.123Z
║ 📱 Platform: android 34
║ 🌍 Environment: PLAY_STORE_PRODUCTION
║ 🆔 Package: in.pulsemateconnect.patient
║ ...additional details...
╚═══════════════════════════════════════════════════════════════════════════════
```

## Where Logs Are Written

### Development (Expo Go / Development Build)

Logs are written to:
- **React Native Debugger Console** (if connected)
- **Metro Bundler Console** (terminal running `npx expo start`)
- **Logcat** (Android)
- **Chrome DevTools** (when Remote JS Debugging is enabled)

### Production (Play Store Build)

Logs are written to:
- **Android Logcat** - This is the ONLY place logs persist in production builds
- Logs are NOT uploaded to any cloud service by default
- console.log/console.error write to Android system logs

## How to Retrieve Logs from Play Store-Installed App

### Method 1: USB Debugging (Most Reliable)

**Requirements:**
- Physical Android device with USB debugging enabled
- Android Debug Bridge (adb) installed on computer
- USB cable

**Steps:**

1. **Enable USB Debugging on the Phone:**
   ```
   Settings → About Phone → Tap "Build Number" 7 times
   Settings → System → Developer Options → Enable "USB Debugging"
   ```

2. **Connect Phone to Computer via USB**
   - Accept "Allow USB debugging?" prompt on phone

3. **Verify Connection:**
   ```bash
   adb devices
   ```
   Should show your device listed.

4. **Clear Old Logs (Optional):**
   ```bash
   adb logcat -c
   ```

5. **Start the App and Capture Logs:**
   ```bash
   adb logcat | findstr /i "firebase auth loginscreen otpscreen login2factor otp2factor"
   ```

6. **Save to File:**
   ```bash
   adb logcat > firebase-auth-logs.txt
   ```
   Then press Ctrl+C after reproducing the issue.

7. **Filter for Specific Tags:**
   ```bash
   adb logcat ReactNativeJS:V *:S
   ```

### Method 2: Logcat Reader App (No Computer Required)

**Steps:**

1. **Install a Logcat Reader App from Play Store:**
   - "Logcat Reader" by darshanparajuli
   - "MatLog" by Plüm
   - "CatLog" by Nolan Lawson

2. **Grant Logcat Permission:**
   ```bash
   # On computer with adb:
   adb shell pm grant com.dp.logcatapp android.permission.READ_LOGS
   ```

3. **Open the App and Filter:**
   - Search for: `ReactNativeJS` or `firebase` or `Auth`
   - Set priority to "Verbose" or "Debug"

4. **Reproduce the Issue** in your app

5. **Save/Share Logs:**
   - Most apps have a "Save" or "Share" button
   - Send logs via email or save to file

### Method 3: Remote Logging Service (Recommended for Production)

For ongoing production monitoring, integrate a crash reporting service:

#### Option A: Firebase Crashlytics (Recommended)

Already have Firebase setup, so adding Crashlytics is straightforward:

```javascript
// Install
npm install @react-native-firebase/crashlytics

// In firebase.js, add:
import crashlytics from '@react-native-firebase/crashlytics';

// Replace console.error with:
const logError = (context, error, additionalInfo = {}) => {
  // ... existing console logging ...
  
  // Also send to Crashlytics
  crashlytics().log(`${context}: ${error.message}`);
  crashlytics().setAttributes(additionalInfo);
  crashlytics().recordError(error);
};
```

#### Option B: Sentry

```javascript
// Install
npm install @sentry/react-native

// Initialize
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  enableNative: true,
});

// In logError function:
Sentry.captureException(error, {
  contexts: { context, additionalInfo }
});
```

## What Each Log File Contains

### firebase.js
- Firebase initialization (getEnvironmentInfo)
- sendOtpToPhone (complete flow)
- verifyPhoneOtp (complete flow)
- loginWithFirebaseToken (backend authentication)
- resendOtp (complete flow)
- All errors with full details

### LoginScreen.jsx
- Firebase initialization on mount
- Send OTP button press
- Navigation to OTP screen

### OtpScreen.jsx
- OTP verification flow
- OTP resend flow
- Success/error handling

### Login2FactorScreen.jsx
- Firebase initialization on mount
- Send OTP with invisible reCAPTCHA
- Navigation to OTP screen

### Otp2FactorScreen.jsx
- Screen mount with parameter validation
- Time elapsed warnings
- OTP verification flow
- OTP resend flow

## Example: Capturing a Production Error

Let's say a user reports "OTP verification fails on Play Store version."

**Step-by-Step:**

1. **User installs app from Play Store**

2. **Enable USB debugging on their phone**

3. **Connect to computer and run:**
   ```bash
   adb logcat -c
   adb logcat > production-error-log.txt
   ```

4. **User reproduces the error:**
   - Opens app
   - Enters phone number
   - Taps "Send OTP"
   - Enters OTP code
   - Taps "Verify"
   - Error occurs

5. **Stop logging (Ctrl+C)**

6. **Search the log file for:**
   ```
   FIREBASE ERROR
   SEND OTP
   VERIFY OTP
   auth/
   ```

7. **You'll find entries like:**
   ```
   ╔═══════════════════════════════════════════════════════════════════════════════
   ║ 🔴 FIREBASE ERROR - SEND OTP - signInWithPhoneNumber FAILED
   ╠═══════════════════════════════════════════════════════════════════════════════
   ║ ⏰ Timestamp: 2026-08-02T14:30:45.123Z
   ║ 🌍 Environment: PLAY_STORE_PRODUCTION
   ║ 📦 Package: in.pulsemateconnect.patient
   ║ 
   ║ ❌ ERROR DETAILS:
   ║ ├─ Code: auth/invalid-app-credential
   ║ ├─ Message: App verification failed. SHA-256 not registered.
   ║ ...
   ```

## Common Production Issues You Can Now Debug

With these logs, you can identify:

1. **SHA-256 Fingerprint Issues**
   - Error code: `auth/invalid-app-credential` or `auth/app-not-authorized`
   - Log will show: Environment = PLAY_STORE_PRODUCTION

2. **OTP Expiry Issues**
   - Log will show: Time elapsed = 125 seconds (> 120 second timeout)
   - Warning messages about timeout

3. **Network Issues**
   - Error codes: `ECONNREFUSED`, `ETIMEDOUT`
   - Backend request failures

4. **Firebase Config Issues**
   - Logs show: "Config Loaded: NO" or "API Key Present: NO"

5. **Package Name Mismatches**
   - Logs show actual package name used
   - Compare with Firebase Console configuration

## Automated Log Collection (Optional)

Create a script to automatically collect logs:

```batch
@echo off
REM capture-firebase-logs.bat

echo Clearing old logs...
adb logcat -c

echo Starting log capture (press Ctrl+C to stop)...
echo Logs will be saved to: firebase-auth-logs-%date%-%time::=%.txt

adb logcat -v time | findstr /i "firebase auth loginscreen otpscreen login2factor otp2factor ReactNativeJS" > firebase-auth-logs-%date%-%time::=%.txt

echo Done! Logs saved.
pause
```

Save as `capture-firebase-logs.bat` and run it before reproducing the issue.

## Logs Retention

**Android System Logs (Logcat):**
- **Rotation**: Logs rotate when they reach ~256KB per buffer
- **Buffers**: main, system, events, radio, crash
- **Retention**: Usually a few hours to days depending on log volume
- **Recommendation**: Capture logs immediately after reproducing the issue

**Important:** Android does not persist logs across reboots. Always capture logs from the same session where the error occurred.

## Privacy & Security Notes

1. **No Sensitive Data Logged:**
   - OTP codes are masked with asterisks
   - Firebase ID tokens are logged by length only, not full value
   - Phone numbers are logged (required for debugging)

2. **Production Logs:**
   - Only accessible via adb (requires physical device access)
   - Not uploaded to any server by default
   - User must explicitly enable USB debugging

3. **For Enhanced Privacy:**
   - Remove phone numbers from logs before sharing
   - Use redaction: `phoneNumber.replace(/\d{5}/, '*****')`

## Troubleshooting Log Capture

### "adb: command not found"

Install Android SDK Platform Tools:
- Windows: https://developer.android.com/tools/releases/platform-tools
- Mac: `brew install android-platform-tools`
- Linux: `sudo apt install adb`

### "no devices/emulators found"

1. Check USB cable (try different cable/port)
2. Verify USB debugging is enabled
3. Accept "Allow USB debugging" prompt on phone
4. Try `adb kill-server` then `adb start-server`

### "permission denied"

On Linux/Mac:
```bash
sudo adb devices
```

Or add udev rules for your device.

### Logs Too Verbose

Filter more aggressively:
```bash
adb logcat ReactNativeJS:D *:S
```

Only shows React Native debug logs and above, suppresses all others.

## Summary

✅ **Every step** of Firebase Phone Auth is now logged
✅ **Every error** includes full details (code, message, stack, object)
✅ **Environment information** included in every log
✅ **Production logs** retrievable via adb logcat
✅ **No code changes needed** - logging is passive and doesn't affect functionality

With these logs, you can:
- Identify the exact step where production auth fails
- See the actual Firebase error codes
- Determine if it's a configuration issue, network issue, or timeout
- Compare development vs production behavior
- Provide Firebase support with detailed error information

**Next Steps:**
1. Test the app in production build
2. Reproduce any authentication issues
3. Capture logs using methods above
4. Analyze logs to identify root cause
5. Optional: Integrate Firebase Crashlytics or Sentry for automatic remote logging
