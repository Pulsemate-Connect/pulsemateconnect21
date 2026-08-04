# 🚀 How to Run App with Firebase Phone Auth

## ⚠️ CRITICAL WARNING

**The app WILL CRASH when you try to login** because:
- Frontend now uses Firebase Phone Auth ✅
- Backend doesn't have `/auth/firebase-login` endpoint yet ❌

**You can still run it to see the Firebase integration, but login won't work until backend is updated.**

---

## 📱 Option 1: Quick Test with Expo Dev Server (RECOMMENDED)

### What This Does:
- Runs latest code with Firebase changes
- Hot reload enabled (make changes and see instantly)
- Best for testing and development
- **No build required** (instant)

### Steps:

**1. Start Expo Dev Server:**
```bash
npm start
```

Or double-click: `RUN-FIREBASE-TEST.bat`

**2. Wait for QR code to appear**

**3. In the terminal, press `a` to open Android emulator**

Or manually open the app if it's already installed.

### What You'll See:

1. ✅ App opens successfully
2. ✅ Login screen appears with mobile input
3. ✅ RecaptchaContainer is rendered (invisible)
4. ✅ Enter mobile number works
5. ❌ **Tap "Send OTP" will fail** with error:
   - "Failed to authenticate with backend"
   - Network request failed
   - 404 Not Found (because `/auth/firebase-login` doesn't exist)

### Expected Console Logs:

```
[Firebase] Initialized successfully
[Firebase] Creating reCAPTCHA verifier...
[Firebase] Sending OTP via Firebase Phone Auth...
[Firebase] ✅ FIREBASE OTP SENT SUCCESSFULLY
[Firebase] Phone: +91XXXXXXXXXX
[Firebase] Verification ID: xxxxx

[Firebase] Calling backend for token exchange...
[Firebase] ❌ Backend auth failed: Request failed with status code 404
```

---

## 📱 Option 2: Build New EAS Build (Production-Like)

### What This Does:
- Creates standalone APK with Firebase
- Production environment
- Matches Play Store build
- Takes ~10-15 minutes

### Steps:

**1. Start Build:**
```bash
eas build --platform android --profile preview
```

Or double-click: `BUILD-FIREBASE-APK.bat`

**2. Wait for Build (~10-15 minutes)**

Monitor at: https://expo.dev/accounts/pulsemateconnecttt/projects/pulsemate-app/builds

**3. Install When Complete:**
```bash
eas build:run -p android --latest
```

Or double-click: `INSTALL-NOW.bat` (after build completes)

### What You'll See:

Same as Option 1 - login will fail because backend isn't ready.

---

## 🔍 How to Test Firebase Integration

Even though login won't work, you can verify Firebase is integrated:

### 1. Check Firebase Initialization

**Look for this in logs:**
```
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔥 FIREBASE PHONE AUTH INITIALIZATION
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: 2026-08-04T...
║ 🌍 Environment: EXPO_GO / DEVELOPMENT_BUILD
║ 📦 Package: in.pulsemateconnect.patient
║ 📱 Platform: android 35
║ 🔥 Firebase Project: pulsemateconnect
║ 🔐 Auth Domain: pulsemateconnect.firebaseapp.com
║ 🔑 API Key: AIzaSyA2PXJxyIZpYOG...
╚═══════════════════════════════════════════════════════════════════════════════
[Firebase] ✅ Firebase Phone Auth ready
```

### 2. Test Send OTP Flow

**Enter mobile: +919876543210**  
**Tap "Send OTP"**

**Expected logs:**
```
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - FIREBASE PHONE AUTH
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: 2026-08-04T...
║ 📞 Phone: +919876543210
║ 🔥 Method: Firebase signInWithPhoneNumber
║ 🔐 Security: reCAPTCHA + Play Integrity
╚═══════════════════════════════════════════════════════════════════════════════

[Firebase] Creating reCAPTCHA verifier...
[Firebase] Sending OTP via Firebase Phone Auth...
```

### 3. Check for reCAPTCHA

**You may see:**
- Invisible reCAPTCHA (no UI)
- Or a checkbox "I'm not a robot"
- Or image selection challenge

**This is normal!** Firebase requires reCAPTCHA for security.

### 4. Check Firebase Console

Go to: https://console.firebase.google.com/project/pulsemateconnect/authentication/users

**If everything works, you'll see:**
- New user created with phone number
- Firebase UID generated
- SMS sent count increased

**BUT:** This will only work after:
1. ✅ Phone Auth enabled in Firebase Console
2. ✅ SHA-1/SHA-256 added to Firebase Console
3. ✅ Backend updated with firebase-admin

---

## 📊 Viewing Logs

### Option 1: View All Logs
```bash
adb logcat -s ReactNativeJS:V
```

### Option 2: View Only Firebase Logs
```bash
adb logcat -s ReactNativeJS:V | findstr "[Firebase]"
```

### Option 3: View Only Errors
```bash
adb logcat -s ReactNativeJS:V | findstr "ERROR"
```

---

## ✅ What Should Work Now

- ✅ App starts successfully
- ✅ Firebase initializes
- ✅ Login screen renders
- ✅ RecaptchaContainer present
- ✅ Mobile number input works
- ✅ Firebase config loaded
- ✅ Import statements correct
- ✅ No syntax errors
- ✅ No module not found errors

## ❌ What Won't Work Yet

- ❌ Sending OTP (Firebase will work, but backend exchange fails)
- ❌ Verifying OTP
- ❌ Login/Signup
- ❌ Any authenticated features

---

## 🔧 To Make It Fully Work

**You MUST complete backend changes from `NEXT-STEPS.md`:**

1. Install firebase-admin in backend
2. Create firebase-admin.js config
3. Create firebase-auth.controller.js
4. Add /firebase-login route
5. Add service account JSON to Render
6. Deploy backend

**Estimated time:** 1-2 hours

---

## 🎯 Quick Start Commands

### Run with Expo (Instant):
```bash
npm start
# Then press 'a' for Android
```

### Build New APK (10-15 min):
```bash
eas build --platform android --profile preview
# Then after build:
eas build:run -p android --latest
```

### View Logs:
```bash
adb logcat -s ReactNativeJS:V
```

### View Firebase Logs Only:
```bash
adb logcat -s ReactNativeJS:V | findstr "[Firebase]"
```

---

## 🐛 Troubleshooting

### Error: "Failed to authenticate with backend"
**Cause:** Backend doesn't have `/auth/firebase-login` endpoint yet  
**Fix:** This is expected. Complete backend changes.

### Error: "Module firebase not found"
**Cause:** Dependencies not installed  
**Fix:** Run `npm install`

### Error: "RecaptchaContainer is not defined"
**Cause:** Component not imported  
**Fix:** Already fixed in commit 57fa0ec

### reCAPTCHA Appears But OTP Not Sent
**Cause:** Firebase Phone Auth not enabled in Console  
**Fix:** Enable in Firebase Console (see NEXT-STEPS.md)

### SMS Not Received
**Cause:** SHA fingerprints not added to Firebase  
**Fix:** Add SHA-1 and SHA-256 to Firebase Console

---

## 📚 Related Files

- `RUN-FIREBASE-TEST.bat` - Quick dev server start
- `BUILD-FIREBASE-APK.bat` - Build new APK
- `INSTALL-NOW.bat` - Install latest build
- `NEXT-STEPS.md` - Complete backend setup guide
- `FIREBASE-MIGRATION-COMPLETE.md` - Migration status
- `src/config/firebase-auth.js` - Firebase implementation

---

**Current Status:** Frontend complete, backend pending  
**Next Action:** Run with Option 1 to see Firebase integration  
**After Testing:** Complete backend changes from NEXT-STEPS.md
