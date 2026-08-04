# 🔴 FIX: "Initialization Error - undefined is not a function"

## 🔍 ROOT CAUSE

The error occurs because React Native Firebase native modules are not properly linked in the APK. This happens when:
1. The JavaScript code imports `@react-native-firebase/auth`
2. But the native Android modules weren't included in the build
3. So `auth()` returns `undefined`

## ✅ SOLUTION: Rebuild with Native Modules

### Option 1: Clean Rebuild (RECOMMENDED)

Run this PowerShell command:

```powershell
cd C:\pm\pulsemateconnect21
Remove-Item -Recurse -Force android\.gradle, android\app\build, android\build, node_modules\.cache
cd android
.\gradlew clean
.\gradlew assembleRelease
cd ..
adb uninstall in.pulsemateconnect.patient
adb install android\app\build\outputs\apk\release\app-release.apk
```

### Option 2: Use Clean Rebuild Batch File

Double-click: **`REBUILD-CLEAN.bat`**

---

## 🔧 ALTERNATIVE: Check Firebase Setup

### 1. Verify google-services.json

File: `C:\pm\pulsemateconnect21\android\app\google-services.json`

Should contain:
- `project_id`: "pulsemateconnect"
- `client_info` with package: "in.pulsemateconnect.patient"

###2. Verify Firebase is in android/app/build.gradle

File: `C:\pm\pulsemateconnect21\android\app\build.gradle`

Should have at bottom:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 3. Check if RNFirebase modules are included

Run:
```powershell
cd C:\pm\pulsemateconnect21\android
.\gradlew :app:dependencies | Select-String "firebase"
```

Should show:
- `com.google.firebase:firebase-auth`
- `com.google.firebase:firebase-bom`

---

## 🎯 QUICK FIX (TRY THIS FIRST)

```powershell
cd C:\pm\pulsemateconnect21
cd android
.\gradlew clean
.\gradlew assembleRelease --refresh-dependencies
cd ..
adb install -r android\app\build\outputs\apk\release\app-release.apk
```

Then test the app.

---

## ⚠️ IF STILL FAILS

The issue might be that Expo doesn't support React Native Firebase out of the box. You may need to:

1. Eject from Expo (use `npx expo prebuild`)
2. Or use Firebase JS SDK instead of React Native Firebase
3. Or use EAS Build (which supports native modules)

Let me know if the clean rebuild fixes it!
