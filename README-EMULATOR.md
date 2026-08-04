# 📱 EAS Build - Emulator Installation Guide

## Current Status

**Build File:** `pulsemateconnect-v1.3.4-71-rnfirebase.apk` ✓  
**Emulator:** PulseMatePixel35 (Starting...)  
**Status:** Waiting for emulator to complete boot

---

## 🎯 What You Need to Do

### Look for the Android Emulator Window

An Android emulator window should be opening/open on your screen. It will go through these stages:

```
1. ⬛ Black screen            → Wait...
2. 🤖 Android logo            → Wait...
3. 🔄 "Android" + animation   → Wait...
4. 🏠 Home screen (apps)      → READY! ✓
```

**Boot time:** Usually 2-3 minutes (first boot can take up to 5 minutes)

---

## ✅ Once You See the Home Screen

### Option 1: Quick Install (Recommended)
Double-click this file:
```
OPEN-EAS-APP-NOW.bat
```

### Option 2: Command Line
Open PowerShell/CMD in this folder and run:
```bash
adb install -r pulsemateconnect-v1.3.4-71-rnfirebase.apk
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
```

---

## 🔍 Check if Emulator is Ready

Run this command:
```bash
adb devices
```

**What to look for:**
- ✅ **READY:** `emulator-5554    device`
- ⏳ **NOT READY:** `emulator-5554    offline` or empty list

---

## 🚨 Troubleshooting

### Problem: Emulator window doesn't appear

**Solution:**
```bash
# Start manually
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator.exe -avd PulseMatePixel35
```

### Problem: Emulator shows black screen for a long time

**Solution:**
- This is normal on first boot
- Wait 5 minutes
- If still black, restart your computer and try again

### Problem: "adb: device offline"

**Solution:**
```bash
adb kill-server
adb start-server
adb devices
```

### Problem: Installation fails with "INSTALL_FAILED_INSUFFICIENT_STORAGE"

**Solution:**
1. Open Android Studio
2. Go to Device Manager
3. Click ⋮ menu on emulator
4. Select "Wipe Data"
5. Start emulator again

### Problem: Installation fails with "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**Solution:**
```bash
# Completely remove old version
adb uninstall in.pulsemateconnect.patient

# Install fresh
adb install pulsemateconnect-v1.3.4-71-rnfirebase.apk
```

---

## 📊 What Happens After Install

1. **App launches automatically**
2. You'll see **PulseMate Connect splash screen**
3. Then **login screen with phone input**
4. You can **test the OTP issue** we were investigating

---

## 🧪 Testing the OTP Fix

Once the app opens:

1. Enter phone number: `9876543210`
2. Tap "Send OTP"
3. Check if the "Mobile number is required" error still appears

The backend has been updated with:
- ✓ Validation middleware added
- ✓ Debug logging enabled
- ✓ Phone number normalization

---

## 📝 View App Logs

To see what's happening in the app:

```bash
# React Native logs only
adb logcat -s ReactNativeJS:V

# All logs
adb logcat

# Save to file
adb logcat > app-logs.txt
```

---

## 🛠️ Useful Commands

```bash
# Check connection
adb devices

# Install app
adb install -r pulsemateconnect-v1.3.4-71-rnfirebase.apk

# Launch app
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

# Uninstall app
adb uninstall in.pulsemateconnect.patient

# Clear app data
adb shell pm clear in.pulsemateconnect.patient

# Take screenshot
adb exec-out screencap -p > screenshot.png

# Restart emulator
adb reboot
```

---

## ⏱️ Expected Timeline

- **Now:** Emulator booting
- **2-3 min:** Home screen appears
- **30 sec:** Install app using script
- **5 sec:** App launches
- **Ready:** Test OTP flow!

---

## 💡 Tips

- ✅ Keep emulator window visible (don't minimize)
- ✅ First boot is always slower
- ✅ Subsequent boots are much faster
- ✅ Keep this README open for reference

---

**Next Step:** Wait for home screen → Run `OPEN-EAS-APP-NOW.bat`

**Created:** 2026-08-04  
**Build:** v1.3.4-71 (React Native Firebase)
