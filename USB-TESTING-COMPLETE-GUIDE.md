# USB Testing - Complete Guide

## STEP 1: Fix Path Length Issue (REQUIRED FIRST!)

Your build is currently failing due to Windows 260-character path limit.

### Quick Fix - Move Project:
```cmd
cd C:\Users\shubh\Desktop
move pulsemateconnect123\pulsemateconnect21 C:\pm
cd C:\pm
```

---

## STEP 2: Prepare Your Android Device

### Enable Developer Options:
1. Go to **Settings** > **About Phone**
2. Tap **Build Number** 7 times
3. Developer options will be enabled

### Enable USB Debugging:
1. Go to **Settings** > **Developer Options**
2. Enable **USB Debugging**
3. Enable **Install via USB** (if available)

---

## STEP 3: Connect Device via USB

1. **Connect your phone** to PC with USB cable
2. **On your phone**: Allow USB debugging when prompted
3. **Check connection:**
   ```cmd
   adb devices
   ```
   You should see your device listed

### If device not showing:
```cmd
adb kill-server
adb start-server
adb devices
```

---

## STEP 4: Build and Deploy to USB Device

### Option A: Using Expo (Recommended)
```cmd
cd C:\pm
npx expo run:android
```

This will:
- Build the debug APK
- Automatically install on connected USB device
- Launch the app

### Option B: Manual Build + Install
```cmd
cd C:\pm
cd android
gradlew clean
gradlew assembleDebug
cd ..
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

---

## STEP 5: Start Metro Bundler

In a **separate terminal**:
```cmd
cd C:\pm
npx expo start
```

The app on your phone will connect to Metro via USB automatically.

---

## TROUBLESHOOTING

### "device unauthorized"
- Check your phone screen for USB debugging prompt
- Tap "Allow" and check "Always allow from this computer"

### "no devices found"
```cmd
adb kill-server
adb start-server
adb devices
```

### Metro not connecting
```cmd
adb reverse tcp:8081 tcp:8081
npx expo start
```

### App crashes on launch
Check logs:
```cmd
adb logcat | findstr "PulseMate"
```

---

## QUICK REFERENCE

**Check device:** `adb devices`
**Install APK:** `adb install -r path\to\app.apk`
**View logs:** `adb logcat`
**Clear app data:** `adb shell pm clear com.pulsemateconnect`
**Uninstall:** `adb uninstall com.pulsemateconnect`

---

## FIRST: MOVE YOUR PROJECT!

Before testing, fix the path issue:
```cmd
cd C:\Users\shubh\Desktop
move pulsemateconnect123\pulsemateconnect21 C:\pm
cd C:\pm
npx expo run:android
```

Your phone will automatically be detected if connected via USB!
