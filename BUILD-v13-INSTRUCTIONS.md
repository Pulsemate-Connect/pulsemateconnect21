# Build Instructions - PulseMate Connect v1.0.8 (Build 13)

## ✅ Pre-Build Checklist

- [x] Branding updated to "PulseMate Connect"
- [x] Version bumped to 1.0.8
- [x] Version code bumped to 13
- [x] Icons verified and ready
- [x] Notification titles updated
- [x] Source code branding updated
- [x] All changes committed to feature/fixes-and-improvements branch

---

## 🔧 Build Production AAB

### Option 1: Using Gradle (Recommended)

```bash
cd c:\Users\shubh\Desktop\pulsemate123\android
.\gradlew clean
.\gradlew bundleRelease
```

**Output Location:**
```
android\app\build\outputs\bundle\release\app-release.aab
```

### Option 2: Using Expo

```bash
cd c:\Users\shubh\Desktop\pulsemate123
npx expo run:android --variant release
```

---

## 📱 Test Build Before Upload

### Install on Device

```bash
# Use bundletool to create universal APK from AAB
bundletool build-apks --bundle=android\app\build\outputs\bundle\release\app-release.aab --output=app.apks --mode=universal

# Install on connected device
bundletool install-apks --apks=app.apks
```

### Verify Checklist

Launch the app and verify:

- [ ] **Launcher Icon:** Shows PulseMate logo (not Android robot)
- [ ] **App Name:** Shows "PulseMate Connect" (not package name)
- [ ] **Splash Screen:** Displays "PulseMate Connect" with logo
- [ ] **Welcome Screen:** Shows "PulseMate Connect - Healthcare Platform"
- [ ] **Login Screen:** Shows "PulseMate Connect" branding
- [ ] **Notifications:** App name shows as "PulseMate Connect"
- [ ] **Recent Apps:** Shows "PulseMate Connect"
- [ ] **Settings → Apps:** Shows "PulseMate Connect"

---

## 🚀 Upload to Play Store

### 1. Log into Google Play Console
https://play.google.com/console

### 2. Navigate to App
- Select: **PulseMate Connect**
- Package: `in.pulsemateconnect.patient`

### 3. Create New Release

Go to: **Production** → **Create new release**

**Version Details:**
- Version Name: `1.0.8`
- Version Code: `13`
- Upload AAB: `app-release.aab`

### 4. Release Notes

```
Version 1.0.8

Improvements:
✓ Updated branding to "PulseMate Connect" across all screens
✓ Enhanced notification display with proper app name
✓ Fixed session availability API for real-time booking updates
✓ Improved app icon and splash screen consistency
✓ Performance optimizations and bug fixes

What's Fixed:
- App now consistently displays "PulseMate Connect" in launcher and notifications
- Session booking flow improvements
- Updated payment gateway branding
```

### 5. Review and Publish

- [ ] Review all release details
- [ ] Confirm target: Production
- [ ] Click "Review Release"
- [ ] Click "Start Rollout to Production"

---

## 📊 Build Information

| Property | Value |
|----------|-------|
| **App Name** | PulseMate Connect |
| **Package ID** | in.pulsemateconnect.patient |
| **Version Name** | 1.0.8 |
| **Version Code** | 13 |
| **Min SDK** | 21 (Android 5.0) |
| **Target SDK** | 34 (Android 14) |
| **Build Type** | Release |
| **Signing** | EAS Production Keystore |

---

## 🎨 Branding Verification

**User-Facing Name:** PulseMate Connect  
**Internal Package:** in.pulsemateconnect.patient

The package name remains `in.pulsemateconnect.patient` for Google Play Store continuity, but all user-facing elements display **"PulseMate Connect"**.

---

## 🐛 Troubleshooting

### Build Fails with "Duplicate Class" Error
```bash
cd android
.\gradlew clean
.\gradlew --stop
.\gradlew bundleRelease
```

### Icons Not Updating
```bash
# Clear cache
cd android
.\gradlew clean
rd /s /q app\build
cd ..
npx react-native start --reset-cache
```

### Version Mismatch
Check all three locations match:
1. `app.json` → `version: "1.0.8"` and `versionCode: 13`
2. `android/app/build.gradle` → `versionCode 13` and `versionName "1.0.8"`
3. Both should match exactly

---

## ✅ Post-Upload Checklist

After uploading to Play Store:

- [ ] Verify Play Store listing shows "PulseMate Connect"
- [ ] Verify app icon displays correctly in Play Store
- [ ] Test internal testing track first
- [ ] Promote to production after verification
- [ ] Monitor for crashes in Play Console
- [ ] Update release notes with correct date

---

## 📞 Support

If you encounter issues during build or upload:

1. Check `BRANDING-FIX-COMPLETE.md` for detailed changes
2. Review Play Store rejection reasons (if any)
3. Verify signing configuration in `android/app/build.gradle`
4. Ensure keystore file exists: `@shubhamskkk__pulsemate-app.jks`

---

**Build Date:** June 28, 2026  
**Branch:** feature/fixes-and-improvements  
**Commit:** c824070  
**Status:** Ready for Production Build ✅
