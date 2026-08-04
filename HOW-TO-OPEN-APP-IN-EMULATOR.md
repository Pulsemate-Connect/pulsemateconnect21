# 📱 How to Open PulseMate Connect in Android Emulator

## ✅ Current Status

Your app is **ALREADY BUILT and INSTALLED** on the emulator!

- **Build ID:** 88120141-b9db-4ac9-8af5-7d21e9c1ca5b
- **Package Name:** `in.pulsemateconnect.patient`
- **Status:** ✅ Installed (ready to launch)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start Android Emulator

**Option A: Using Android Studio**
1. Open Android Studio
2. Click on "Device Manager" (phone icon in top right)
3. Click the ▶️ play button next to any emulator
4. Wait for the emulator to fully boot (you'll see the home screen)

**Option B: Using Command Line**
```bash
emulator -avd <your_emulator_name>
```

### Step 2: Launch the App

Once the emulator is running, double-click:
```
launch-app-on-emulator.bat
```

This script will:
- Check if emulator is connected
- Verify the app is installed
- Launch PulseMate Connect

**OR run manually:**
```bash
adb shell monkey -p in.pulsemateconnect.patient 1
```

### Step 3: Monitor Logs (Optional)

To see authentication logs while testing, open a **separate terminal** and run:
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
test-otp-flow.bat
```

---

## 📋 About AAB vs APK Files

### ❌ **AAB (Android App Bundle) - Cannot Install Directly**

Your question was about opening the AAB file in the emulator. Here's the issue:

**AAB files are NOT installable directly.** They are for uploading to Google Play Store.

- ❌ Cannot install AAB on emulator directly
- ❌ Cannot install AAB on physical devices directly
- ✅ Google Play Store uses AAB to generate optimized APKs

**AAB Location:**
```
c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\pulsemate-latest.aab
Build ID: 57bcc91b-3268-47de-a2d9-bff60c74ca8d
```

### ✅ **APK - Can Install Directly**

I already built an **APK version** for you, which CAN be installed on emulators and devices.

**APK Location:**
```
C:\Users\shubh\AppData\Local\Temp\eas-cli-nodejs\eas-build-run-cache\
31fca56b-a99e-4219-bb3f-600d8b0c86b7_88120141-b9db-4ac9-8af5-7d21e9c1ca5b.apk
Build ID: 88120141-b9db-4ac9-8af5-7d21e9c1ca5b
```

**Status:** ✅ **ALREADY INSTALLED on emulator-5554**

---

## 🔧 If You Want to Convert AAB to APK

If you really need to convert the AAB to APK manually, you need `bundletool`:

### 1. Download Bundletool
```bash
# Download from:
https://github.com/google/bundletool/releases/latest

# Save as bundletool.jar
```

### 2. Convert AAB to APK
```bash
java -jar bundletool.jar build-apks ^
  --bundle=pulsemate-latest.aab ^
  --output=pulsemate.apks ^
  --mode=universal

# Extract the universal APK
java -jar bundletool.jar extract-apks ^
  --apks=pulsemate.apks ^
  --output-dir=output ^
  --device-id=<your-device-id>
```

**BUT YOU DON'T NEED TO DO THIS!** I already built an APK for you.

---

## 🎯 What You Should Do Now

### Option 1: Use the Installed App (RECOMMENDED)

The app is **already installed**. Just:

1. ✅ Start your Android emulator
2. ✅ Run `launch-app-on-emulator.bat`
3. ✅ Test the app!

### Option 2: Reinstall from APK

If you want to reinstall:

```bash
# 1. Start emulator

# 2. Uninstall old version
adb uninstall in.pulsemateconnect.patient

# 3. Install fresh
adb install "C:\Users\shubh\AppData\Local\Temp\eas-cli-nodejs\eas-build-run-cache\31fca56b-a99e-4219-bb3f-600d8b0c86b7_88120141-b9db-4ac9-8af5-7d21e9c1ca5b.apk"

# 4. Launch
adb shell monkey -p in.pulsemateconnect.patient 1
```

### Option 3: Build New APK from Scratch

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Build APK
eas build --platform android --profile apk --non-interactive

# Wait for build to complete...

# Download
eas build:download --id <build-id>

# Install
adb install <path-to-apk>
```

---

## 📊 File Comparison

| File Type | Use Case | Can Install? | Location |
|-----------|----------|--------------|----------|
| **AAB** | Upload to Play Store | ❌ No | `pulsemate-latest.aab` (49 MB) |
| **APK** | Testing on devices/emulators | ✅ Yes | Already installed! |

---

## 🧪 Testing Checklist

Once you launch the app:

- [ ] **Start emulator** using Android Studio or command line
- [ ] **Launch app** using `launch-app-on-emulator.bat`
- [ ] **Verify app opens** and shows login screen
- [ ] **Start log monitoring** using `test-otp-flow.bat`
- [ ] **Enter phone number:** +917022818878
- [ ] **Tap "Send OTP"** button
- [ ] **Check logs** for Backend API call
- [ ] **Watch for errors** (likely "Network Error" if backend not ready)

---

## ⚠️ Common Issues

### Issue: "App not found" when launching

**Solution:**
```bash
# Check if installed
adb shell pm list packages | findstr pulse

# If not listed, reinstall
adb install <path-to-apk>
```

### Issue: "Network Error" when testing OTP

**This is expected!** Your app now uses Backend SMS service.

**What this means:**
- App tries to call: `https://api.pulsemateconnect.in/api/auth/patient/send-otp`
- Emulator cannot reach the backend (or endpoints don't exist yet)

**Solutions:**
1. Verify backend server is running
2. Test API endpoints with Postman/curl
3. Test on physical device (better network)
4. Implement backend endpoints if not done yet

---

## 📞 Quick Reference Commands

```bash
# Check devices
adb devices

# List installed packages
adb shell pm list packages | findstr pulse

# Launch app
adb shell monkey -p in.pulsemateconnect.patient 1

# Monitor logs
adb logcat | findstr "Auth"

# Uninstall
adb uninstall in.pulsemateconnect.patient

# Install APK
adb install <path-to-apk>

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

---

## 🎉 Summary

**You asked:** "How to open AAB file in Android emulator?"

**The answer:**
1. ❌ AAB files cannot be opened directly in emulators
2. ✅ I already built and installed an **APK** for you
3. ✅ Just **start your emulator** and run **`launch-app-on-emulator.bat`**

**Your app is ready to test! 🚀**

---

**Last Updated:** August 2, 2026, 4:30 PM  
**Installed App:** in.pulsemateconnect.patient  
**Status:** ✅ Ready to Launch
