# 📱 Run on USB Device - Quick Guide

**Purpose:** Test Firebase Phone Auth on your real Android device via USB

---

## 🔌 **STEP 1: Connect Your Device** (2 minutes)

### Enable USB Debugging on Your Phone:

1. **Open Settings** on your Android phone
2. **Go to "About phone"**
3. **Tap "Build number" 7 times** (enables Developer mode)
4. **Go back to Settings**
5. **Open "Developer options"** (or "System" → "Developer options")
6. **Enable "USB debugging"**
7. **Connect your phone to PC via USB cable**
8. **On phone, tap "Allow" when prompted for USB debugging**

---

## ✅ **STEP 2: Verify Device Connection** (1 minute)

Run this command:

```bash
adb devices
```

**Expected output:**
```
List of devices attached
abc123xyz        device
```

If you see your device listed, you're ready!

**If no devices shown:**
- Make sure USB debugging is enabled
- Try a different USB cable
- Try a different USB port
- Check if device is in "File Transfer" mode (not "Charging only")

---

## 🚀 **STEP 3: Run the App** (5 minutes)

### Option A: Run with Expo (Development)

```bash
# Start Expo dev server
npx expo start

# When menu appears, press 'a' for Android
# Or scan QR code with Expo Go app
```

**⚠️ WARNING:** Expo Go won't work with Firebase Phone Auth! You need a development build.

---

### Option B: Build and Install Development APK (Recommended)

```bash
# Clean and prebuild
npx expo prebuild --platform android --clean

# Build and install on device
cd android
./gradlew installDebug

# Or install and run:
./gradlew installDebug && adb shell am start -n in.pulsemateconnect.patient/.MainActivity
```

**This will:**
1. Build the APK
2. Install on your connected device
3. Launch the app

**Time:** 5-10 minutes for first build

---

### Option C: Quick Run (Fastest)

```bash
# Run directly on connected device
npx expo run:android
```

This will:
- ✅ Build the app
- ✅ Install on device
- ✅ Start Metro bundler
- ✅ Launch app automatically

**Time:** 3-5 minutes

---

## 🧪 **STEP 4: Test Firebase Phone Auth** (3 minutes)

Once the app is running on your device:

1. **Open the app** (should launch automatically)
2. **Go to Login screen**
3. **Enter your phone number** (+91XXXXXXXXXX)
4. **Tap "Send OTP"**
5. **Check your phone for SMS** (wait 5-30 seconds)
6. **Enter the 6-digit code**
7. **Tap "Verify"**

**Expected Result:** ✅ Login successful!

---

## 🐛 **TROUBLESHOOTING**

### Issue: adb devices shows no devices

**Solutions:**
```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices

# Check if device is in File Transfer mode
# On phone: Pull down notification shade → Tap USB connection → Select "File Transfer"
```

### Issue: Device shows "unauthorized"

**Solution:**
- Disconnect and reconnect USB cable
- On phone, tap "Always allow from this computer"
- Tap "OK"
- Run `adb devices` again

### Issue: "auth/app-not-authorized"

**Cause:** SHA certificates not added to Firebase Console

**Solution:**
1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Add SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
3. Add SHA-256: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
4. Rebuild and reinstall app

### Issue: Build fails with path length error

**Solution:** Use WSL or build with EAS instead:
```bash
eas build --platform android --profile development --local
```

### Issue: App crashes on launch

**Check logs:**
```bash
adb logcat | grep -i "pulsemateconnect"
```

---

## 📋 **QUICK COMMANDS**

### Connect Device:
```bash
adb devices
```

### Install APK:
```bash
adb install app-debug.apk
```

### Uninstall App:
```bash
adb uninstall in.pulsemateconnect.patient
```

### View Logs:
```bash
adb logcat | grep -E "ReactNative|Firebase|Auth"
```

### Clear App Data:
```bash
adb shell pm clear in.pulsemateconnect.patient
```

### Restart App:
```bash
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
```

---

## ⚡ **FASTEST METHOD (Use This!)**

```bash
# 1. Make sure device is connected
adb devices

# 2. Run app (builds and installs automatically)
npx expo run:android
```

**That's it!** The app will build, install, and launch on your device.

---

## 🎯 **COMPLETE WORKFLOW**

### First Time Setup:

```bash
# 1. Connect phone via USB
# 2. Enable USB debugging on phone
# 3. Verify connection
adb devices

# 4. Add SHA certificates to Firebase Console (IMPORTANT!)
# Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
# Add SHA-1 and SHA-256 (see FIREBASE-COMPLETE-STATUS.md)

# 5. Run app
npx expo run:android

# 6. Wait for build (3-5 minutes first time)
# 7. App launches automatically
# 8. Test Firebase Phone Auth
```

### Subsequent Runs:

```bash
# Quick rebuild and run
npx expo run:android

# Or just start Metro and reload
npx expo start
# Press 'a' for Android
```

---

## 📊 **EXPECTED RESULTS**

### Successful Connection:
```
$ adb devices
List of devices attached
RF8M12345AB     device
```

### Successful Build:
```
> Task :app:installDebug
Installing APK 'app-debug.apk' on 'Pixel 6 - 13' for :app:debug
Installed on 1 device.

BUILD SUCCESSFUL in 3m 45s
```

### Successful Launch:
```
Starting: Intent { cmp=in.pulsemateconnect.patient/.MainActivity }
```

### Successful Firebase Auth:
- App opens
- Login screen visible
- Enter phone number
- Tap "Send OTP"
- SMS received on device ✅
- Enter OTP
- Login successful ✅

---

## ⚠️ **IMPORTANT REMINDERS**

1. **MUST add SHA certificates to Firebase Console first**
   - Without this, you'll get "auth/app-not-authorized" error

2. **Development build required**
   - Expo Go won't work with Firebase Phone Auth
   - Must use `expo run:android` or build APK

3. **Real device required**
   - Emulator won't work for production Firebase Phone Auth
   - Must use actual Android phone with SIM

4. **Google Play Services required**
   - Your device must have Google Play Services installed
   - Most phones have this by default

---

## 🚀 **START NOW**

**Copy and paste these commands:**

```bash
# 1. Check device connection
adb devices

# 2. Run app
npx expo run:android
```

**Then test Firebase Phone Auth!**

---

## 📞 **NEED HELP?**

### Device Not Detected:
- Check USB cable
- Enable USB debugging
- Allow USB debugging on phone
- Try `adb kill-server && adb start-server`

### Build Fails:
- Check error message
- Try `npx expo prebuild --clean`
- Or use EAS: `eas build --platform android --profile development`

### Firebase Auth Fails:
- Verify SHA certificates added to Firebase
- Check Firebase Phone Auth is enabled
- Check device has internet connection
- Check device has Google Play Services

---

**Quick Start:** `adb devices` → `npx expo run:android` → Test login! 🚀

**Estimated Time:** 10 minutes total (5 min build + 5 min test)
