# 📦 Build AAB Files — Test + Production

**Version:** 1.3.7 (versionCode: 83)  
**Date:** February 9, 2025  
**Status:** Ready to build

---

## 🎯 Two AAB Files Needed

1. **Test AAB** — For local installation and testing (internal distribution)
2. **Production AAB** — For Google Play Console upload (public release)

Both use the same codebase but different distribution channels.

---

## ✅ Pre-Build Checklist

Before building, verify:

- [ ] **Internet connection** — EAS Build runs on cloud servers
- [ ] **Logged into EAS** — Run `npx eas-cli login`
- [ ] **No uncommitted changes** — Commit all code changes first
- [ ] **Version numbers correct** — Check `app.json` version: `1.3.7` and versionCode: `83`
- [ ] **Backend is live** — https://api.pulsemateconnect.in/api/health should return 200 OK
- [ ] **Keystore configured** — EAS should have your signing credentials stored

---

## 📋 Build Commands

### Option A: Build Both at Once (Recommended)

```bash
# Build test AAB + production AAB simultaneously
npx eas-cli build --platform android --profile test-aab --non-interactive
npx eas-cli build --platform android --profile production --non-interactive
```

### Option B: Build One at a Time

**1. Test AAB (for local testing):**
```bash
npx eas-cli build --platform android --profile test-aab
```

**2. Production AAB (for Play Store):**
```bash
npx eas-cli build --platform android --profile production
```

---

## ⏱️ Build Timeline

- **Queue time:** 1-5 minutes (depends on EAS Build queue)
- **Build time:** 10-15 minutes per AAB
- **Total time:** ~20-30 minutes for both AABs

---

## 📥 Download & Install

### Test AAB — Local Installation

After test AAB build completes:

1. **Download AAB from EAS:**
   ```bash
   # Get build URL from EAS CLI output or dashboard
   # Example: https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds/xyz
   ```

2. **Convert AAB to APK using bundletool:**
   ```bash
   # Download bundletool if not installed
   # https://github.com/google/bundletool/releases
   
   # Convert AAB to universal APK
   java -jar bundletool.jar build-apks ^
     --bundle=pulsemate-test.aab ^
     --output=pulsemate-test.apks ^
     --mode=universal
   
   # Extract APK from APKS
   unzip pulsemate-test.apks -d output
   # Install universal.apk from output folder
   ```

3. **Install on device:**
   ```bash
   adb install output\universal.apk
   ```

**OR USE THE SIMPLER APK PROFILE:**
```bash
# Build APK directly (easier for testing)
npx eas-cli build --platform android --profile apk
# This gives you an APK that can be directly installed
```

---

### Production AAB — Play Store Upload

After production AAB build completes:

1. **Download from EAS Dashboard:**
   - Go to: https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds
   - Find the production build
   - Click "Download" → Save as `pulsemate-v1.3.7-production.aab`

2. **Upload to Play Console:**
   - Go to: https://play.google.com/console
   - Select "PulseMate Connect" app
   - Navigate to: **Release** → **Production** → **Create new release**
   - Upload: `pulsemate-v1.3.7-production.aab`
   - Fill release notes and submit

---

## 🔍 Verify AAB Files

### Check AAB Metadata
```bash
# Install bundletool first
# https://github.com/google/bundletool/releases

# Dump AAB info
java -jar bundletool.jar dump manifest --bundle=pulsemate-v1.3.7-production.aab

# Expected output should show:
# - package="in.pulsemateconnect.patient"
# - android:versionCode="83"
# - android:versionName="1.3.7"
```

### Check File Size
- **Test AAB:** ~40-60 MB (typical)
- **Production AAB:** ~40-60 MB (same size, different distribution)

---

## 🚨 Common Issues & Solutions

### Issue 1: Build fails with "Credentials not found"

**Solution:**
```bash
# Configure credentials
npx eas-cli credentials

# Or let EAS auto-generate new keystore
npx eas-cli build --platform android --profile production --clear-credentials
```

---

### Issue 2: "Version code already exists in Play Console"

**Solution:**
```bash
# Increment versionCode in app.json
# Change: "versionCode": 83 → "versionCode": 84
# Then rebuild
```

---

### Issue 3: AAB won't install on device

**Reason:** AAB files cannot be directly installed. They must be:
- Converted to APK using bundletool (for local testing)
- OR uploaded to Play Store (Play Store converts AAB → APK automatically)

**Solution:**
```bash
# Use APK profile for local testing instead
npx eas-cli build --platform android --profile apk
# APK can be installed directly via adb or file manager
```

---

### Issue 4: Build stuck in queue

**Solution:**
- Wait 5-10 minutes (EAS Build queue can be busy)
- Check EAS status: https://status.expo.dev
- If stuck > 30 minutes, cancel and rebuild:
  ```bash
  npx eas-cli build:cancel
  npx eas-cli build --platform android --profile production
  ```

---

## 📊 Build Profiles Comparison

| Profile       | Output | Distribution | Use Case                    |
|---------------|--------|--------------|------------------------------|
| `apk`         | APK    | Internal     | Quick testing, direct install |
| `test-aab`    | AAB    | Internal     | Testing AAB format locally    |
| `production`  | AAB    | Store        | Play Store release           |

---

## 🎬 Complete Build Workflow

### Step-by-Step Process

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Book Appointment button positioning fix + splash screen"
git push origin main

# 2. Login to EAS
npx eas-cli login

# 3. Build test AAB (optional, for local AAB testing)
npx eas-cli build --platform android --profile test-aab

# 4. Build production AAB (required for Play Store)
npx eas-cli build --platform android --profile production

# 5. Wait for builds to complete (~15 min each)
# Monitor progress: https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds

# 6. Download production AAB
# From EAS dashboard or use CLI:
npx eas-cli build:list

# 7. Upload to Play Store
# Manual upload via Play Console
# OR automated submission:
npx eas-cli submit --platform android --profile production
```

---

## 🚀 Quick Commands Reference

```bash
# Build test AAB
npx eas-cli build -p android --profile test-aab

# Build production AAB
npx eas-cli build -p android --profile production

# Build APK (easier for testing)
npx eas-cli build -p android --profile apk

# Check build status
npx eas-cli build:list

# Download latest build
npx eas-cli build:download

# Submit to Play Store
npx eas-cli submit -p android --profile production

# View build logs
npx eas-cli build:view
```

---

## 📝 After Build Checklist

- [ ] Production AAB downloaded successfully
- [ ] AAB file size is reasonable (~40-60 MB)
- [ ] Version code is 83 (or incremented if updating)
- [ ] Package name is `in.pulsemateconnect.patient`
- [ ] Upload to Play Console completed
- [ ] Release notes added
- [ ] Internal testing completed (if using test AAB)
- [ ] Production release submitted for review

---

## 🎯 Recommended Approach

**For fastest testing:**
```bash
npx eas-cli build -p android --profile apk
# Direct APK install on device
```

**For Play Store upload:**
```bash
npx eas-cli build -p android --profile production
# Download AAB → Upload to Play Console
```

**Skip test-aab profile** unless you specifically need to test AAB format locally.

---

## 📚 Additional Resources

- **EAS Build Documentation:** https://docs.expo.dev/build/introduction/
- **Bundletool Guide:** https://developer.android.com/studio/command-line/bundletool
- **Play Console:** https://play.google.com/console
- **EAS Dashboard:** https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app

---

**Ready to build?** Run the commands above and monitor progress in the EAS dashboard!
