# 📦 Generate Fresh AAB File with EAS Build

## Prerequisites Check
Before building, ensure:

✅ Firebase configuration fixed (`google-services.json`)  
✅ Phone authentication is working (web SDK)  
✅ All dependencies installed  
✅ EAS CLI is installed  

## Step 1: Verify Your Build Configuration

Your current `eas.json` production profile:
```json
{
  "production": {
    "android": {
      "buildType": "app-bundle",
      "gradleCommand": ":app:bundleRelease",
      "credentialsSource": "remote"
    },
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

This will generate an AAB (app-bundle) for Google Play Store submission.

## Step 2: Update Version Numbers (Optional but Recommended)

**Current versions in files:**
- `app.json`: Version `1.2.2`, versionCode `41`
- `build.gradle`: versionCode `41`, versionName `1.2.2`

If you want to increment for a new build, update:

### Option A: Increment Patch Version (1.2.2 → 1.2.3)
Edit `app.json`:
```json
{
  "version": "1.2.3",
  "android": {
    "versionCode": 42
  }
}
```

Edit `android/app/build.gradle`:
```groovy
versionCode 42
versionName "1.2.3"
```

### Option B: Keep Current Version
Skip version updates - keep as 1.2.2

## Step 3: Generate AAB with EAS Build

### Clear Previous Build Cache
```bash
eas build --platform android --no-cache
```

### Or Standard Build
```bash
eas build --platform android
```

**Choose the production profile when prompted**, or specify directly:
```bash
eas build --platform android --profile production
```

## Step 4: Monitor Build Progress

The EAS Build will go through phases:
1. ✅ **Preparing** - Loading dependencies
2. ✅ **Building** - Running npm install
3. ✅ **Gradle Build** - Compiling Android code (NOW FIXED!)
4. ✅ **Bundling** - Creating AAB file
5. ✅ **Uploading** - Transferring artifacts

Expected time: **5-15 minutes** depending on cache and system load

## Step 5: Access Your New AAB

Once complete, you can:

1. **Download from EAS Dashboard**
   - Go to https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app
   - Navigate to Builds section
   - Download the AAB artifact

2. **Get Artifact URL from CLI**
   - EAS will provide a direct download link
   - Save this for Google Play submission

3. **File Location**
   - Downloaded file: `pulsemate-v1.2.2-production.aab` (example)
   - Or version you specified

## Step 6: Submit to Google Play

### Prerequisites
- Google Play Developer Account ($25 one-time)
- Service account key JSON file

### Upload AAB
1. Go to Google Play Console
2. Select your app: **PulseMate Connect**
3. Left menu → **Internal Testing** or **Production**
4. Click **Create new release**
5. Upload the AAB file
6. Add release notes
7. Review and publish

### Or Use EAS Submit (Automated)
```bash
eas submit --platform android --path <path-to-aab>
```

## Build Configuration Details

**Android Build Settings:**
- Gradle Command: `:app:bundleRelease`
- Build Type: Release (minified, optimized)
- Target SDK: 34 (Android 14)
- Min SDK: Determined by Expo SDK 54
- Architecture: arm64-v8a, armeabi-v7a, x86, x86_64

**Firebase Integration:**
- Web SDK: ✅ Active
- Phone Auth: ✅ Working
- Native Modules: ✅ None (clean)
- google-services.json: ✅ Fixed

## Troubleshooting

### If Build Fails at Gradle Phase
- Check EAS logs for specific error
- Verify `google-services.json` is properly formatted
- Confirm package name matches: `in.pulsemateconnect.patient`

### If Build Succeeds but AAB is Large
- Expected size: 50-150 MB (normal for React Native + Firebase)
- Google Play will optimize and serve smaller app based on device specs

### If Build Hangs
- EAS builds typically take 5-15 minutes
- Check network connection
- You can cancel and retry with `--no-cache`

## What's Included in Your AAB

✅ React Native app with Expo modules  
✅ Firebase web SDK for authentication  
✅ Phone authentication with SMS delivery  
✅ Location services (expo-location)  
✅ Push notifications (expo-notifications)  
✅ Secure storage (expo-secure-store)  
✅ Calendar picker (@react-native-community/datetimepicker)  
✅ All permissions as configured  

## Verification After Download

1. **File size** should be 50-150 MB
2. **File integrity** - can be verified on Google Play Console
3. **Version code** - should match what you set (41 or higher if updated)

---

## Quick Command Reference

```bash
# Standard production build
eas build --platform android --profile production

# Clean cache build
eas build --platform android --profile production --no-cache

# Check build status
eas build:list

# View build logs
eas build:view <build-id>
```

---
**Next Steps:**
1. Run `eas build --platform android --profile production`
2. Wait for completion (5-15 minutes)
3. Download AAB from EAS Dashboard
4. Submit to Google Play Console or use `eas submit`

**Good luck with your PulseMate Connect release! 🚀**
