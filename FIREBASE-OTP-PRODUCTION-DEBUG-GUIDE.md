# 🔍 Firebase Phone Authentication: Production Debugging Guide

## 📋 Current Configuration Analysis

### ✅ What's Configured Correctly:

1. **Package Name:** `in.pulsemateconnect.patient` ✅
   - Matches in `app.json`, `google-services.json`, and Firebase Console

2. **google-services.json:** Present and correct ✅
   - Location: `android/app/google-services.json`
   - Contains production keystore SHA-1: `0b84891144b1b8dbc49b4d05edaa83770f30434f`

3. **Firebase Config:** Correct ✅
   - API Key: `AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc`
   - Project ID: `pulsemateconnect`

4. **EAS Configuration:** Properly set up ✅
   - Development profile exists
   - Production uses local credentials
   - google-services.json referenced correctly

### ⚠️ Critical Finding:

**Your production build uses LOCAL CREDENTIALS (`credentialsSource: "local"`)**

This means:
- Production AAB is signed with the keystore specified in `credentials.json`
- SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
- This SHA-1 **IS** registered in `google-services.json` ✅

**But development build uses DEBUG KEYSTORE (different SHA-1!)**

This is likely why OTP doesn't work in development builds!

---

## 🎯 Why OTP Works in Expo Go But Fails in Builds

### Expo Go (Works ✅)
- Uses `expo-firebase-recaptcha` with reCAPTCHA modal
- Firebase Web SDK doesn't require SHA fingerprints
- **Verifier:** reCAPTCHA v2 (browser-based)

### Development Build (Fails ❌)
- Signed with **debug.keystore** (different SHA-1)
- Debug SHA-1 is NOT in `google-services.json`
- Firebase rejects the request → No OTP

### Production Build AAB (Should Work ✅)
- Signed with **production keystore** (SHA-1 IS registered)
- SafetyNet attestation should work
- **If fails:** Configuration issue or Firebase Console mismatch

---

## 🔧 Solution: Add Debug SHA-1 to Firebase Console

### Step 1: Generate Debug Build SHA-1

**Option A: From debug.keystore file**
```bash
cd android\app
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Option B: Use default Expo debug SHA-1**

Expo's default debug keystore SHA-1:
```
SHA1: 4D:F5:83:93:29:93:FD:70:60:B1:FA:97:7F:D4:D4:EC:1B:3B:54:CE
SHA256: 01:AC:F8:D7:CF:73:9F:95:AB:0C:38:1A:E7:14:F1:A5:E4:8A:F8:11:DF:F0:84:64:5E:FC:A1:5A:50:3A:88:D8
```

### Step 2: Add Debug SHA to Firebase Console

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Scroll to "Your apps" → Android app (`in.pulsemateconnect.patient`)
3. Click "Add fingerprint"
4. Add the debug SHA-1 (from Step 1)
5. Click "Save"

### Step 3: Download Updated google-services.json

1. After adding SHA-1, click "Download google-services.json"
2. Replace `android/app/google-services.json` with the new file
3. **Important:** This file will now have MULTIPLE SHA-1 entries:
   - Production SHA-1: `0b84891144...`
   - Debug SHA-1: `4df583...` (or your custom debug SHA)

### Step 4: Build Development APK

```bash
npx eas build --platform android --profile development --local
```

---

## 🚀 EAS Development Build: Step-by-Step Guide

### What is an EAS Development Build?

An EAS Development Build is:
- ✅ A standalone APK (not Expo Go)
- ✅ Signed with debug keystore
- ✅ Includes native code (Firebase, etc.)
- ✅ Supports live reload via USB/WiFi
- ✅ Uses your app's exact production configuration

**Benefits:**
- Test Firebase Phone Auth with debug SHA
- Test native modules outside Expo Go
- Fast iteration with live reload
- Exact replica of production (except signature)

---

### Prerequisites

1. **Install EAS CLI** (if not already):
```bash
npm install -g eas-cli
```

2. **Login to EAS**:
```bash
eas login
```

3. **Enable USB Debugging on your phone**

4. **Install ADB** (Android Debug Bridge)

---

### Build Development APK

**Option 1: Cloud Build (Recommended)**
```bash
npx eas build --platform android --profile development
```

**Option 2: Local Build (Faster, requires Android SDK)**
```bash
npx eas build --platform android --profile development --local
```

**Wait time:**
- Cloud: ~10-15 minutes
- Local: ~5-10 minutes (first time)

**Output:**
- APK download URL
- Or local file: `build-XXXXXXXXXX.apk`

---

### Install APK via USB

**Step 1: Verify USB Connection**
```bash
adb devices
```

**Expected output:**
```
List of devices attached
abc123def456    device
```

If no devices, enable USB Debugging on your phone.

**Step 2: Install APK**

**Option A: Via ADB command**
```bash
adb install -r path\to\build-XXXXXXXXXX.apk
```

**Option B: Use install script**
```bash
.\install-dev-apk.bat
```

**Step 3: Launch App**

**Manual:**
- Find "PulseMate Connect" in app drawer
- Tap to open

**Via ADB:**
```bash
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
```

---

## 📱 Testing Firebase OTP in Development Build

### Step 1: Start Metro Bundler

In project directory:
```bash
npx expo start --dev-client
```

**Important:** The `--dev-client` flag tells Metro to connect to your development build (not Expo Go)

### Step 2: Connect Development Build

**Option A: Automatic (USB)**
- App should connect automatically when Metro starts

**Option B: Manual**
- Open app
- Shake device
- Tap "Enter URL manually"
- Enter: `http://YOUR_IP:8081`

### Step 3: Test OTP Flow

1. **Enter phone number** → Tap "Send OTP"
2. **Watch logs** in Metro bundler terminal
3. **Expected behavior:**
   - reCAPTCHA modal appears (or invisible verification)
   - OTP sent successfully
   - SMS received on phone

### Step 4: View Logcat Logs

**Open new terminal and run:**
```bash
adb logcat -s "ReactNativeJS:V" "Auth:V" "Firebase:V"
```

**Or filter for errors:**
```bash
adb logcat | findstr /i "firebase auth otp"
```

**Save logs to file:**
```bash
adb logcat > firebase-debug.log
```

---

## 🐛 Debugging Checklist

### Verification Step 1: SHA Fingerprints

**Check your build SHA-1:**
```bash
# For development build (debug.keystore)
keytool -list -v -keystore android\app\debug.keystore -alias androiddebugkey -storepass android -keypass android | findstr "SHA1"

# For production keystore (from credentials.json)
keytool -list -v -keystore path\to\keystore.jks -alias YOUR_ALIAS -storepass YOUR_PASSWORD | findstr "SHA1"
```

**Verify in Firebase Console:**
1. Go to Firebase Console → Project Settings → General
2. Find Android app → SHA certificate fingerprints
3. Confirm ALL your SHA-1s are listed:
   - Production SHA-1
   - Debug SHA-1
   - EAS Build SHA-1 (if different)

**Common Issue:**
- ❌ SHA-1 in build doesn't match any in Firebase Console
- ✅ Add the missing SHA-1 to Firebase Console

---

### Verification Step 2: Package Name

**Check app.json:**
```json
"android": {
  "package": "in.pulsemateconnect.patient"  ← Must match Firebase
}
```

**Check Firebase Console:**
- Android app → Package name: `in.pulsemateconnect.patient`

**Check google-services.json:**
```json
"android_client_info": {
  "package_name": "in.pulsemateconnect.patient"  ← Must match app.json
}
```

**All three MUST match exactly!**

---

### Verification Step 3: google-services.json

**Check file location:**
```
android/app/google-services.json  ← Must be here
```

**Check app.json references it:**
```json
"android": {
  "googleServicesFile": "./google-services.json"  ← Points to root copy
}
```

**Verify it's up-to-date:**
- Download latest from Firebase Console
- Check it has your SHA-1 fingerprints
- Confirm package name matches

---

### Verification Step 4: Firebase Console Settings

**Enable Phone Authentication:**
1. Firebase Console → Authentication → Sign-in method
2. Find "Phone" provider
3. Ensure it's **ENABLED** ✅

**SafetyNet Configuration (for production):**
1. Firebase Console → Authentication → Settings
2. Scroll to "App Verification" → "Android SafetyNet"
3. Ensure **ENABLED** (default)

**Test Mode (optional for debugging):**
1. Authentication → Settings → Phone numbers for testing
2. Add a test phone number: `+910000000000` → OTP: `123456`
3. Use this for testing without SMS costs

---

### Verification Step 5: Permissions

**Check AndroidManifest.xml has:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**Your app.json already has:**
```json
"permissions": [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE"
]
```

✅ **Correct!**

---

### Verification Step 6: Build Configuration

**Check build.gradle has Google Services:**
```gradle
// android/app/build.gradle (last line)
apply plugin: 'com.google.gms.google-services'
```

**Check project build.gradle has classpath:**
```gradle
// android/build.gradle
dependencies {
  classpath 'com.google.gms:google-services:4.4.1'
}
```

✅ **Already verified - your config is correct!**

---

## 🚨 Common Issues & Solutions

### Issue 1: "auth/app-not-authorized"

**Cause:** SHA-1 fingerprint not registered in Firebase Console

**Solution:**
1. Get SHA-1 from your build keystore
2. Add to Firebase Console
3. Download new google-services.json
4. Rebuild app

---

### Issue 2: "auth/invalid-phone-number"

**Cause:** Phone number format incorrect

**Solution:**
- Use E.164 format: `+919876543210`
- Include country code
- No spaces or special characters

---

### Issue 3: "Failed to initialize reCAPTCHA Enterprise config"

**This is a WARNING, not an error!**

Firebase tries reCAPTCHA Enterprise first, then falls back to reCAPTCHA v2 or SafetyNet.

**Solution:**
- Ignore this message (it's informational)
- Check if OTP actually arrives
- If OTP doesn't arrive, the issue is elsewhere (SHA fingerprints)

---

### Issue 4: "auth/too-many-requests"

**Cause:** Too many SMS attempts to the same number

**Solution:**
- Wait 15-30 minutes
- Use test phone numbers in Firebase Console
- Check Firebase quota limits

---

### Issue 5: OTP works in Expo Go, fails in development build

**Cause:** Development build uses different signature than Expo Go

**Solution:**
1. Get debug keystore SHA-1
2. Add to Firebase Console
3. Download new google-services.json
4. Rebuild development APK

---

### Issue 6: OTP works in development, fails in production

**Cause:** Production keystore SHA-1 missing or incorrect

**Solution:**
1. Verify production keystore SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
2. Confirm it's in Firebase Console
3. Confirm it's in google-services.json:
   ```json
   "certificate_hash": "0b84891144b1b8dbc49b4d05edaa83770f30434f"
   ```
4. Download fresh google-services.json if unsure

---

### Issue 7: SafetyNet verification fails

**Cause:** Play Store version uses Play Integrity API

**Solution:**
- SafetyNet only works on apps downloaded from Play Store
- Internal testing track counts as "Play Store"
- Direct APK install won't have SafetyNet (uses reCAPTCHA instead)

---

## 📊 Build Type Comparison

| Feature | Expo Go | Development Build | Preview Build | Production AAB |
|---------|---------|-------------------|---------------|----------------|
| **Signature** | Expo's key | Debug keystore | Release keystore | Production keystore |
| **SHA-1 Required** | ❌ No | ✅ Yes (debug) | ✅ Yes (release) | ✅ Yes (production) |
| **Live Reload** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Firebase OTP** | ✅ reCAPTCHA | ✅ reCAPTCHA/SafetyNet | ✅ SafetyNet | ✅ SafetyNet |
| **Install Method** | Expo Go app | USB/ADB | USB/ADB | Play Store |
| **Build Time** | Instant | ~10 min | ~10 min | ~10 min |
| **File Type** | N/A | APK | APK | AAB |

---

## 🎯 Recommended Testing Workflow

### Phase 1: Development Testing (Current)
```bash
# Test with Expo Go (reCAPTCHA modal)
npx expo start
```
✅ **Status:** Works perfectly

### Phase 2: Development Build Testing (Next)
```bash
# 1. Add debug SHA-1 to Firebase Console
# 2. Download new google-services.json
# 3. Build development APK
npx eas build --platform android --profile development

# 4. Install via USB
adb install -r build-XXXXX.apk

# 5. Start Metro bundler
npx expo start --dev-client

# 6. Test OTP flow
```
✅ **Expected:** OTP arrives (uses debug SHA-1)

### Phase 3: Preview Build Testing
```bash
# Build preview APK (signed with release keystore)
npx eas build --platform android --profile preview

# Install and test (no live reload)
adb install -r build-XXXXX.apk
```
✅ **Expected:** OTP arrives (uses production SHA-1)

### Phase 4: Production AAB Testing
```bash
# Build production AAB
.\build-aab-auto-version.bat

# Upload to Play Store (Internal Testing track)
# Download from Play Store
# Test OTP
```
✅ **Expected:** OTP arrives with SafetyNet (silent, no modal)

---

## 🔍 Logcat Analysis

### View Firebase Auth Logs:
```bash
adb logcat -s FirebaseAuth:V
```

### View JavaScript Logs:
```bash
adb logcat -s ReactNativeJS:V
```

### View All Logs:
```bash
adb logcat
```

### Filter for OTP-related Logs:
```bash
adb logcat | findstr /i "sendOtpToPhone verifyPhoneOtp firebase auth otp"
```

### Common Log Messages:

**✅ Success:**
```
[Auth] ✅ OTP sent successfully
[Auth] 🔑 VerificationId: AM6...
```

**❌ SHA Fingerprint Error:**
```
[Auth] ❌ Send OTP error: auth/app-not-authorized
Firebase: Error (auth/app-not-authorized)
```

**❌ Phone Number Error:**
```
[Auth] ❌ Send OTP error: auth/invalid-phone-number
```

---

## 📝 Quick Command Reference

### Build Commands:
```bash
# Development APK (debug keystore, live reload)
npx eas build --platform android --profile development

# Preview APK (production keystore, no live reload)
npx eas build --platform android --profile preview

# Production AAB (for Play Store)
npx eas build --platform android --profile production
```

### ADB Commands:
```bash
# Check connected devices
adb devices

# Install APK
adb install -r path\to\app.apk

# Uninstall app
adb uninstall in.pulsemateconnect.patient

# Launch app
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

# View logs
adb logcat

# Clear logs
adb logcat -c

# Save logs to file
adb logcat > debug.log
```

### Keystore Commands:
```bash
# View debug keystore SHA-1
keytool -list -v -keystore android\app\debug.keystore -alias androiddebugkey -storepass android -keypass android

# View production keystore SHA-1
keytool -list -v -keystore path\to\production.jks -alias YOUR_ALIAS -storepass YOUR_PASSWORD
```

---

## ✅ Pre-Flight Checklist

Before building, verify:

- [ ] Package name matches everywhere: `in.pulsemateconnect.patient`
- [ ] Firebase Console has Phone Authentication **ENABLED**
- [ ] All SHA-1 fingerprints added to Firebase Console:
  - [ ] Production: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
  - [ ] Debug: (get from debug.keystore and add)
- [ ] google-services.json is up-to-date (download fresh after adding SHA)
- [ ] google-services.json is in `android/app/` folder
- [ ] `app.json` references correct file
- [ ] `credentials.json` has production keystore configured
- [ ] EAS CLI installed and logged in
- [ ] Phone connected via USB (for testing)
- [ ] USB Debugging enabled on phone

---

## 🎯 Next Steps

### Immediate Action:
1. **Get debug keystore SHA-1** (see commands above)
2. **Add to Firebase Console**
3. **Download new google-services.json**
4. **Replace `android/app/google-services.json`**
5. **Build development APK**
6. **Test OTP flow**

### If Still Fails:
1. **Check Logcat logs** for exact error
2. **Verify SHA-1 in Firebase Console** matches build
3. **Test with Firebase test phone number** (no SMS cost)
4. **Check Firebase quota** (may have hit limits)

---

**Created:** 2026-08-01  
**Your Production SHA-1:** `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`  
**Package Name:** `in.pulsemateconnect.patient`  
**Firebase Project:** `pulsemateconnect`
