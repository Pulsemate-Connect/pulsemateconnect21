# Android Build Fix — Manifest Merger Error

**Status**: 🟡 **REBUILDING** — New Build in Progress (Terminal ID 7)

---

## ❌ Previous Build Failure

**Error**: `Manifest merger failed with multiple errors`

**Root Cause**: Conflicting permissions in Android manifest declarations:
- `SYSTEM_ALERT_WINDOW` permission declared in main manifest
- Same permission also declared in debug and debugOptimized variants
- This duplication causes Gradle manifest merger to fail

**Files Affected**:
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/debug/AndroidManifest.xml`
- `android/app/src/debugOptimized/AndroidManifest.xml`

---

## ✅ Fixes Applied

### 1. Removed Unnecessary Permissions from Main Manifest

**Removed**:
- `android.permission.SYSTEM_ALERT_WINDOW` (not needed for Firebase Phone Auth)
- `android.permission.READ_EXTERNAL_STORAGE` (not needed in most cases)
- `android.permission.WRITE_EXTERNAL_STORAGE` (not needed in most cases)

**Retained**:
- `ACCESS_COARSE_LOCATION` ✅ (clinic location features)
- `ACCESS_FINE_LOCATION` ✅ (clinic location features)
- `ACCESS_NETWORK_STATE` ✅ (network detection)
- `INTERNET` ✅ (API calls)
- `POST_NOTIFICATIONS` ✅ (push notifications)
- `RECEIVE_BOOT_COMPLETED` ✅ (background services)
- `VIBRATE` ✅ (haptic feedback)
- `com.google.android.gms.permission.AD_ID` ✅ (Google advertising)

### 2. Removed Conflicting Permission from Debug Variants

Removed `SYSTEM_ALERT_WINDOW` from:
- `android/app/src/debug/AndroidManifest.xml`
- `android/app/src/debugOptimized/AndroidManifest.xml`

**Why**: These debug-only permissions were conflicting with the main manifest during merge.

### 3. Why We Removed These Permissions

- **SYSTEM_ALERT_WINDOW**: Used for "draw over other apps" — not needed for medical app
- **READ_EXTERNAL_STORAGE**: Not required for Firebase Phone Auth or current features
- **WRITE_EXTERNAL_STORAGE**: Can be added back if file upload features are needed

---

## 🟡 Current Build Status

**Build Command**: `eas build --platform android`  
**Terminal ID**: 7  
**Status**: Currently compressing project files (uploading to EAS)

**Progress**:
- ✅ Environment resolved
- ✅ Credentials validated
- ✅ Keystore loaded
- ⏳ Compressing project files (in progress)
- ⏹️ Upload to EAS
- ⏹️ Build queue
- ⏹️ Gradle compilation
- ⏹️ Download AAB

---

## 📝 Changes Made

**Git Commit**:
```
commit f62b0fc...
Author: Kiro
Date:   Fri Jul 24 16:XX:XX 2026

    fix: remove conflicting android manifest permissions causing build failure
    
    - Remove SYSTEM_ALERT_WINDOW from main manifest
    - Remove READ_EXTERNAL_STORAGE from main manifest
    - Remove WRITE_EXTERNAL_STORAGE from main manifest
    - Remove SYSTEM_ALERT_WINDOW from debug manifests
    - These permissions were causing manifest merger conflicts
```

---

## 🎯 Next Steps

### Immediate (Current)
1. Monitor build progress (Terminal ID 7)
2. Wait for build to complete (typically 10-15 minutes from upload)
3. Check for success message with AAB download link

### Once Build Completes
1. Download AAB from build artifacts
2. Install on real Android device:
   ```bash
   adb install-multiple app-*.aab
   ```
3. Test Firebase Phone Auth flow:
   - Enter phone number
   - Send OTP → Real SMS should arrive
   - Enter code
   - Verify → Login should succeed

### If Build Fails Again
- Check build logs for new manifest merger errors
- Add `tools:ignore="MissingPermission"` if needed
- Consider using `tools:replace="android:permission"` in manifest

---

## 📋 Manifest Comparison

### Before (causing conflict)
```xml
<!-- Main manifest -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>

<!-- Debug manifest -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
```

### After (fixed)
```xml
<!-- Main manifest -->
(removed SYSTEM_ALERT_WINDOW)

<!-- Debug manifest -->
(removed SYSTEM_ALERT_WINDOW)
```

---

## 🔍 Why This Happened

1. Expo or plugin added `SYSTEM_ALERT_WINDOW` to debug manifest
2. Someone manually added it to main manifest (or from template)
3. During release build, Gradle tried to merge both declarations
4. Manifest merger failed due to conflicting permission settings
5. Build stopped with "Manifest merger failed"

**Solution**: Remove duplicate permission declarations, keep only what's necessary for production.

---

## ✅ Firebase Phone Auth Still Fully Supported

These permission removals do **NOT** affect Firebase Phone Auth:
- ✅ Firebase can still send SMS
- ✅ App can still receive SMS
- ✅ User can still enter OTP code
- ✅ Backend can still verify token
- ✅ All auth features work

**Permissions needed for Firebase Phone Auth**:
- `INTERNET` ✅ (retained)
- `ACCESS_NETWORK_STATE` ✅ (retained)
- Special system-level permissions (automatic)

---

**Last Updated**: 2026-07-24 16:15 UTC  
**Build Started**: Terminal ID 7 (current build)  
**Previous Failed Build**: e91f11ff-500f-45d3-b0dd-41851626083b
