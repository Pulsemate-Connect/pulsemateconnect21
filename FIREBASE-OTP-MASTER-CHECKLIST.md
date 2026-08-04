# ✅ Firebase OTP: Master Debugging Checklist

## 🎯 Use This Checklist To Diagnose OTP Issues

Work through each section systematically. Check off items as you verify them.

---

## 📱 Section 1: Package Name Verification

**Requirement:** Package name must match EXACTLY everywhere

### Check app.json:
```bash
type app.json | findstr "package"
```
- [ ] Shows: `"package": "in.pulsemateconnect.patient"`

### Check Firebase Console:
1. [ ] Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. [ ] Android app shows: `in.pulsemateconnect.patient`

### Check google-services.json:
```bash
type android\app\google-services.json | findstr "package_name"
```
- [ ] Shows: `"package_name": "in.pulsemateconnect.patient"`

### Check AndroidManifest.xml (if exists):
```bash
type android\app\src\main\AndroidManifest.xml | findstr "package"
```
- [ ] Shows: `package="in.pulsemateconnect.patient"`

**✅ ALL FOUR MUST MATCH!**

---

## 🔐 Section 2: SHA-1 Fingerprint Verification

**Requirement:** SHA-1 of your build MUST be registered in Firebase

### For Development Build (Debug):

**Step 1: Get debug SHA-1**
```bash
.\get-debug-sha1.bat
```
- [ ] Note down the SHA1 value

**Step 2: Verify in Firebase Console**
1. [ ] Go to Firebase Console → Settings → General
2. [ ] Scroll to Android app
3. [ ] Check "SHA certificate fingerprints" section
4. [ ] Confirm your debug SHA-1 is listed

**If NOT listed:**
- [ ] Click "Add fingerprint"
- [ ] Paste debug SHA-1
- [ ] Click "Save"
- [ ] Download new google-services.json
- [ ] Replace `android\app\google-services.json`

### For Production Build:

**Step 1: Verify production SHA-1**
Your production SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`

**Step 2: Check Firebase Console**
- [ ] Production SHA-1 is listed in Firebase Console
- [ ] SHA-1 in google-services.json matches:
  ```json
  "certificate_hash": "0b84891144b1b8dbc49b4d05edaa83770f30434f"
  ```

**✅ SHA-1 of YOUR build MUST be in Firebase Console!**

---

## 🔥 Section 3: Firebase Configuration

### Check Firebase Console Settings:

1. [ ] **Authentication Enabled:**
   - Firebase Console → Authentication → Sign-in method
   - "Phone" provider is **ENABLED** (toggle is green)

2. [ ] **App Registration:**
   - Firebase Console → Project Settings → General
   - Android app exists with correct package name

3. [ ] **google-services.json Downloaded:**
   - [ ] File exists at: `android\app\google-services.json`
   - [ ] File is up-to-date (download fresh if unsure)
   - [ ] File contains your SHA-1 fingerprints

4. [ ] **API Key Valid:**
   - [ ] `firebaseConfig.js` has correct API key: `AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc`

---

## 📦 Section 4: Build Configuration

### Check EAS Configuration:

```bash
type eas.json
```

**Verify:**
- [ ] `development` profile exists
- [ ] `production` profile has `credentialsSource: "local"`
- [ ] `android.googleServicesFile` points to correct file in app.json

### Check Build Files:

```bash
dir android\app\google-services.json
```
- [ ] File exists (not missing)

```bash
dir credentials.json
```
- [ ] File exists (for production builds)

### Check Gradle Configuration:

```bash
type android\build.gradle | findstr "google-services"
```
- [ ] Shows: `classpath 'com.google.gms:google-services:4.4.1'` (or similar)

```bash
type android\app\build.gradle | findstr "google-services"
```
- [ ] Last line shows: `apply plugin: 'com.google.gms.google-services'`

**✅ All build configuration correct!**

---

## 📱 Section 5: Phone Number Format

### Check Phone Number Input:

**Requirement:** Phone number must be in E.164 format

- [ ] **Correct format:** `+919876543210`
  - Starts with `+`
  - Country code (91 for India)
  - Area code + number
  - NO spaces, hyphens, or parentheses

- [ ] **Incorrect formats:**
  - ❌ `9876543210` (missing +91)
  - ❌ `+91 98765 43210` (has spaces)
  - ❌ `+91-9876543210` (has hyphen)
  - ❌ `(+91) 9876543210` (has parentheses)

**✅ Use only +[country code][number]**

---

## 🔌 Section 6: Network & Permissions

### Check Permissions:

```bash
type app.json | findstr "INTERNET"
```
- [ ] Shows: `"android.permission.INTERNET"`
- [ ] Shows: `"android.permission.ACCESS_NETWORK_STATE"`

### Check Network:

- [ ] Device has internet connection
- [ ] WiFi or mobile data is ON
- [ ] No firewall blocking Firebase
- [ ] No VPN interfering with Google services

### Check Google Play Services:

- [ ] Google Play Services installed on device
- [ ] Google Play Services up to date
- [ ] Device is NOT rooted (SafetyNet fails on rooted devices)

**✅ Network and services ready!**

---

## 🧪 Section 7: Testing Procedure

### Development Testing (Expo Go):

```bash
npx expo start
```

**Verify:**
- [ ] App loads in Expo Go
- [ ] Login screen appears
- [ ] "Send OTP" button is enabled
- [ ] Tap "Send OTP"
- [ ] reCAPTCHA modal appears
- [ ] Solve reCAPTCHA (if visible)
- [ ] Check console for logs:
  ```
  [Auth] 📱 Sending OTP to: +91XXXXXXXXXX
  [Auth] ✅ OTP sent successfully
  ```
- [ ] OTP SMS received on phone
- [ ] Enter OTP code
- [ ] Login successful

**If this works:** Firebase config is correct ✅

---

### Development APK Testing:

**Step 1: Build**
```bash
.\build-dev-apk.bat
```
- [ ] Build completes successfully
- [ ] APK download URL provided

**Step 2: Install**
```bash
.\install-dev-apk.bat
```
- [ ] APK installs successfully
- [ ] App icon appears on phone

**Step 3: Start Metro**
```bash
npx expo start --dev-client
```
- [ ] Metro bundler starts
- [ ] QR code appears (ignore it)

**Step 4: Open App**
- [ ] Open "PulseMate Connect" on phone
- [ ] App connects to Metro automatically
- [ ] Login screen loads

**Step 5: Test OTP**
- [ ] Enter phone number
- [ ] Tap "Send OTP"
- [ ] reCAPTCHA modal appears (normal for development)
- [ ] OTP SMS received
- [ ] Enter OTP
- [ ] Login successful

**Step 6: Check Logs**
```bash
.\view-firebase-logs.bat
```
- [ ] See: `[Auth] ✅ OTP sent successfully`
- [ ] NO errors about auth/app-not-authorized

**If this works:** Debug SHA-1 is correct ✅

---

### Production AAB Testing:

**Step 1: Build**
```bash
.\build-aab-auto-version.bat
```
- [ ] Build completes
- [ ] AAB download URL provided

**Step 2: Upload to Play Store**
- [ ] Login to Google Play Console
- [ ] Go to Internal Testing track
- [ ] Upload AAB file
- [ ] Submit for review (auto-approved)

**Step 3: Download from Play Store**
- [ ] Join internal testing (if not already)
- [ ] Download app from Play Store
- [ ] Install completes

**Step 4: Test OTP**
- [ ] Open app
- [ ] Enter phone number
- [ ] Tap "Send OTP"
- [ ] **NO reCAPTCHA modal** (SafetyNet is silent)
- [ ] OTP SMS received within 5-10 seconds
- [ ] Enter OTP
- [ ] Login successful

**If this works:** Production build is perfect ✅

---

## 🐛 Section 8: Error Diagnosis

### Error: "auth/app-not-authorized"

**Cause:** SHA-1 fingerprint not registered in Firebase

**Fix:**
1. [ ] Get SHA-1 of your build (debug or production)
2. [ ] Add to Firebase Console
3. [ ] Download new google-services.json
4. [ ] Replace `android\app\google-services.json`
5. [ ] Rebuild app
6. [ ] Test again

---

### Error: "auth/invalid-phone-number"

**Cause:** Phone number format incorrect

**Fix:**
1. [ ] Use E.164 format: `+919876543210`
2. [ ] Include country code
3. [ ] Remove spaces, hyphens, parentheses
4. [ ] Test again

---

### Error: "auth/too-many-requests"

**Cause:** Too many OTP requests to same number

**Fix:**
1. [ ] Wait 15-30 minutes
2. [ ] Or use Firebase test phone number:
   - Firebase Console → Authentication → Settings
   - Phone numbers for testing
   - Add: `+919999999999` → Code: `123456`
3. [ ] Test again

---

### Error: "Failed to initialize reCAPTCHA Enterprise config"

**This is a WARNING, not an error!**

**Explanation:**
- Firebase tries reCAPTCHA Enterprise first
- Falls back to reCAPTCHA v2 or SafetyNet
- Message is informational only

**Fix:**
- [ ] Ignore this message
- [ ] Check if OTP actually arrives
- [ ] If OTP arrives → Everything is working ✅
- [ ] If OTP doesn't arrive → Problem is elsewhere (check SHA-1)

---

### Error: No OTP SMS received

**Possible causes:**

1. [ ] **SHA-1 issue**
   - Check Firebase Console has correct SHA-1
   - Download fresh google-services.json
   - Rebuild

2. [ ] **Firebase quota exceeded**
   - Check Firebase Console → Authentication → Usage
   - May need to upgrade plan or wait

3. [ ] **Phone number blocked**
   - Check Firebase Console → Authentication → Users
   - Phone number may be banned (too many failed attempts)

4. [ ] **Wrong phone number format**
   - Must be E.164: `+919876543210`
   - No spaces or special characters

5. [ ] **Network issue**
   - Check internet connection
   - Try different network (WiFi vs mobile data)

6. [ ] **Google Play Services issue**
   - Update Google Play Services
   - Restart device

---

## 📊 Section 9: Build Comparison Matrix

| Aspect | Expo Go | Development APK | Production AAB |
|--------|---------|-----------------|----------------|
| **Signature** | Expo's key | Debug key | Production key |
| **SHA-1** | Not needed | Debug SHA-1 | Production SHA-1 |
| **Live Reload** | ✅ Yes | ✅ Yes | ❌ No |
| **OTP Method** | reCAPTCHA modal | reCAPTCHA modal | SafetyNet (silent) |
| **Install** | Expo Go app | USB | Play Store |
| **Speed** | Instant | ~10 min build | ~10 min build |
| **Testing** | Fast iteration | Near-production | Exact production |

---

## ✅ Final Verification

### Before Publishing to Play Store:

- [ ] **Expo Go test:** OTP works ✅
- [ ] **Development APK test:** OTP works ✅
- [ ] **Production AAB test (Internal Testing):** OTP works ✅
- [ ] **All SHA-1s registered in Firebase** ✅
- [ ] **google-services.json is up-to-date** ✅
- [ ] **Package name matches everywhere** ✅
- [ ] **Phone Authentication enabled in Firebase** ✅
- [ ] **No console errors** ✅
- [ ] **OTP arrives within 10 seconds** ✅

**ALL CHECKED? → Safe to publish! 🚀**

---

## 🎯 Quick Diagnostic Commands

### Check Configuration:
```bash
# Package name
type app.json | findstr "package"

# Firebase config
type src\config\firebaseConfig.js

# google-services.json exists
dir android\app\google-services.json

# SHA-1 in google-services.json
type android\app\google-services.json | findstr "certificate_hash"
```

### Get SHA-1:
```bash
# Debug keystore
.\get-debug-sha1.bat

# Production keystore (from credentials.json)
keytool -list -v -keystore path\to\your\keystore.jks -alias YOUR_ALIAS
```

### Test Builds:
```bash
# Expo Go
npx expo start

# Development APK
.\build-dev-apk.bat
.\install-dev-apk.bat
npx expo start --dev-client

# Production AAB
.\build-aab-auto-version.bat
```

### Debug Logs:
```bash
# View Firebase logs
.\view-firebase-logs.bat

# View all logs
adb logcat

# Clear logs
adb logcat -c
```

---

## 📚 Related Documentation

- **Quick Start:** `PRODUCTION-OTP-TESTING-QUICK-START.md`
- **Full Debug Guide:** `FIREBASE-OTP-PRODUCTION-DEBUG-GUIDE.md`
- **All Fixes Summary:** `SUMMARY-ALL-FIXES.md`
- **Version Management:** `VERSION-TRACKER.md`

---

**Last Updated:** 2026-08-01  
**Your Package:** `in.pulsemateconnect.patient`  
**Your Firebase Project:** `pulsemateconnect`  
**Your Production SHA-1:** `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`

**Status:** Ready for systematic testing! ✅
