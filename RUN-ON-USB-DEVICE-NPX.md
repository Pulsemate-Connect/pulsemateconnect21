# Run App on USB Device - Complete Guide

## Device Status
✅ **Device Connected:** 9b90e608

## Method 1: Run with Expo (Recommended)

### Step 1: Start Metro Bundler
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
npx expo start
```

### Step 2: Press 'a' to run on Android device
- After Metro starts, press **'a'** in the terminal
- This will build and install the app on your USB device

## Method 2: Direct Android Build & Run

### Run directly on USB device:
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
npx expo run:android --device
```

This will:
1. Build the Android app
2. Install it on your USB device
3. Start the app automatically

## Method 3: Build APK and Install

### Build development APK:
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
npx expo run:android --variant debug
```

### Or build release APK:
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
npx expo run:android --variant release
```

## Method 4: Using React Native CLI

### Run with React Native directly:
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
npx react-native run-android --deviceId=9b90e608
```

## Useful Commands

### Check connected devices:
```cmd
adb devices
```

### Install existing APK:
```cmd
adb -s 9b90e608 install app-debug.apk
```

### View device logs:
```cmd
adb -s 9b90e608 logcat | findstr "ReactNativeJS"
```

### Reverse port (for development server):
```cmd
adb -s 9b90e608 reverse tcp:8081 tcp:8081
```

### Uninstall app:
```cmd
adb -s 9b90e608 uninstall com.shubhamskkk.pulsemateapp
```

### Clear app data:
```cmd
adb -s 9b90e608 shell pm clear com.shubhamskkk.pulsemateapp
```

## Troubleshooting

### Device Not Authorized
```
Error: device unauthorized
```
**Solution:** Check your phone screen for USB debugging authorization popup

### Build Failed - Clean and Rebuild
```cmd
cd android
gradlew clean
cd ..
npx expo run:android --device
```

### Metro Bundler Port Conflict
```cmd
npx expo start --port 8082
```

### App Crashes - View Logs
```cmd
adb -s 9b90e608 logcat *:E
```

## Development Workflow

### 1. Fast Refresh (Recommended)
```cmd
# Terminal 1 - Start Metro
npx expo start

# Terminal 2 - Run on device
npx expo run:android --device
```

Now you can edit code and see changes instantly!

### 2. Production-like Build
```cmd
npx expo run:android --variant release --device
```

### 3. Build and Test Locally
```cmd
# Build APK
cd android
gradlew assembleDebug

# Install on device
adb -s 9b90e608 install app/build/outputs/apk/debug/app-debug.apk
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npx expo start` | Start Metro bundler |
| `npx expo run:android --device` | Build & run on USB device |
| `npx expo run:android --variant release` | Build release version |
| `adb devices` | List connected devices |
| `adb install <apk>` | Install APK manually |
| `adb logcat` | View device logs |

## Notes

- **First build takes longer** (~5-10 minutes) as it downloads dependencies
- **Subsequent builds are faster** (~1-2 minutes)
- **Hot reload works** - Edit code and see changes instantly
- **Keep device screen on** during development to prevent disconnection
- **USB debugging must be enabled** on your device

## Your Device Info
- Device ID: `9b90e608`
- Status: Connected
- Package Name: `com.shubhamskkk.pulsemateapp`
