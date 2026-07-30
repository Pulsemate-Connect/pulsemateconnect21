# Local AAB Build Guide (FREE)

## 🆓 Build AAB Locally Without EAS

This guide helps you build the production AAB file **locally on your computer for free**, bypassing EAS build quota limits.

---

## ✅ Prerequisites

### Required Software:
1. **Java JDK 17 or higher**
   - Download: https://adoptium.net/
   - Install and add to PATH

2. **Android SDK** (comes with Android Studio)
   - Download Android Studio: https://developer.android.com/studio
   - Or set ANDROID_HOME if already installed

3. **Node.js & npm** (already installed ✅)

---

## 🚀 Quick Build (Automated)

### Single Command:
```bash
build-aab-local.bat
```

This script will:
1. ✅ Check prerequisites (Java, Android SDK)
2. ✅ Create/check release keystore
3. ✅ Copy Firebase configuration
4. ✅ Pre-bundle JavaScript
5. ✅ Build production AAB
6. ✅ Show AAB file location

**Estimated time**: 10-15 minutes (first build)

---

## 📋 What the Script Does

### Step 1: Check Prerequisites
- Verifies Java JDK is installed
- Checks Android SDK location
- Validates ANDROID_HOME environment variable

### Step 2: Create Release Keystore
If keystore doesn't exist, creates new one with:
- **Alias**: pulsemate-key-alias
- **Password**: pulsemate2024
- **Validity**: 10000 days (~27 years)
- **Location**: android/app/pulsemate-release-key.keystore

**IMPORTANT**: After keystore creation, you'll see SHA-256 fingerprint.
**Copy this and add to Firebase Console!**

### Step 3: Copy Firebase Config
- Copies google-services.json to android/app/
- Required for Firebase Phone Auth to work

### Step 4: Pre-bundle JavaScript
- Runs `npx expo export:embed`
- Creates optimized JavaScript bundle
- Includes all assets and resources

### Step 5: Build AAB
- Runs `gradlew bundleRelease`
- Compiles native Android code
- Creates signed AAB file
- Output: android/app/build/outputs/bundle/release/app-release.aab

---

## 🔑 Keystore Information

### Default Credentials:
```
Keystore file: android/app/pulsemate-release-key.keystore
Store password: pulsemate2024
Key alias: pulsemate-key-alias
Key password: pulsemate2024
```

### ⚠️ CRITICAL: Firebase Configuration

After creating keystore, you MUST add SHA-256 fingerprint to Firebase:

1. The script will display SHA-256 fingerprint
2. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
3. Find your Android app (in.pulsemateconnect.patient)
4. Click "Add fingerprint"
5. Paste SHA-256 value

**Without this, Firebase Phone Auth will NOT work in production!**

---

## 📦 Build Output

### AAB File Location:
```
android\app\build\outputs\bundle\release\app-release.aab
```

### File Details:
- **Size**: ~40-60 MB
- **Format**: Android App Bundle (.aab)
- **Signed**: Yes (with release keystore)
- **Ready for**: Google Play Store upload

---

## 🎯 Advantages of Local Build

| Feature | Local Build | EAS Build |
|---------|-------------|-----------|
| **Cost** | FREE ✅ | Limited free, $29/mo for unlimited |
| **Speed** | 10-15 min | 10-15 min + queue time |
| **Control** | Full control | EAS managed |
| **Keystore** | Your own | EAS managed |
| **Internet** | Minimal | Full upload/download |
| **Quota** | Unlimited ✅ | Monthly limit |

---

## 🔧 Manual Build Steps (If Script Fails)

### 1. Create Keystore (if needed):
```bash
keytool -genkeypair -v -storetype PKCS12 ^
  -keystore android\app\pulsemate-release-key.keystore ^
  -alias pulsemate-key-alias ^
  -keyalg RSA -keysize 2048 -validity 10000 ^
  -storepass pulsemate2024 -keypass pulsemate2024 ^
  -dname "CN=PulseMate Connect, OU=Healthcare, O=PulseMate, L=Mumbai, S=Maharashtra, C=IN"
```

### 2. Get SHA-256 Fingerprint:
```bash
keytool -list -v -keystore android\app\pulsemate-release-key.keystore ^
  -alias pulsemate-key-alias -storepass pulsemate2024 | findstr "SHA256"
```

### 3. Copy Firebase Config:
```bash
copy google-services.json android\app\google-services.json
```

### 4. Pre-bundle JavaScript:
```bash
npx expo export:embed
```

### 5. Build AAB:
```bash
cd android
gradlew bundleRelease
cd ..
```

---

## 🐛 Troubleshooting

### Java Not Found
- Install Java JDK 17: https://adoptium.net/
- Add to PATH: C:\Program Files\Eclipse Adoptium\jdk-17\bin

### Android SDK Not Found
- Install Android Studio: https://developer.android.com/studio
- Or set ANDROID_HOME:
  ```
  set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
  ```

### Gradle Build Failed
- Clean and retry:
  ```bash
  cd android
  gradlew clean
  gradlew bundleRelease
  ```

### Out of Memory
- Edit android/gradle.properties:
  ```
  org.gradle.jvmargs=-Xmx4096m
  ```

### Firebase Auth Not Working
- Verify SHA-256 added to Firebase Console
- Check google-services.json in android/app/
- Ensure package name matches: in.pulsemateconnect.patient

---

## 📱 After Build Complete

### 1. Find Your AAB
Location: `android\app\build\outputs\bundle\release\app-release.aab`

### 2. Test Locally (Optional)
Convert AAB to APK for testing:
```bash
bundletool build-apks --bundle=app-release.aab --output=app-release.apks ^
  --ks=android\app\pulsemate-release-key.keystore ^
  --ks-pass=pass:pulsemate2024 ^
  --ks-key-alias=pulsemate-key-alias ^
  --key-pass=pass:pulsemate2024
```

### 3. Upload to Play Store
1. Go to: https://play.google.com/console
2. Select your app
3. Production → Create new release
4. Upload app-release.aab
5. Add release notes
6. Submit for review

---

## 🎉 Summary

### What You Get:
- ✅ Production AAB file (FREE)
- ✅ Your own keystore (you control it)
- ✅ Firebase OTP configured
- ✅ Ready for Play Store upload
- ✅ Unlimited builds (no quota)

### Build Time:
- First build: 10-15 minutes
- Subsequent builds: 5-8 minutes

### Important Files Created:
1. **AAB file**: android/app/build/outputs/bundle/release/app-release.aab
2. **Keystore**: android/app/pulsemate-release-key.keystore
3. **SHA-256**: Displayed after keystore creation

---

## 🔐 Security Notes

### Keep These Files Safe:
- ✅ pulsemate-release-key.keystore (backup this file!)
- ✅ Keystore passwords
- ❌ Don't commit keystore to git
- ❌ Don't share passwords publicly

### Firebase Configuration:
- SHA-256 must match your keystore
- Add to Firebase Console before testing
- Required for Phone Auth to work

---

## ⚡ Quick Reference

```bash
# Build AAB locally
build-aab-local.bat

# Output location
android\app\build\outputs\bundle\release\app-release.aab

# File size
~40-60 MB

# Ready for
Google Play Store upload
```

---

**Your AAB will be production-ready with Firebase OTP fully functional!** 🚀
