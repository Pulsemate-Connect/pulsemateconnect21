# 🛠️ EAS Build Instructions - Generate AAB File

## Issue Encountered
Local npm install is having file locking issues due to Android build cache files. The best approach is to use **EAS Build Remote** which handles all this automatically.

## ✅ Recommended Solution: Use EAS Build Dashboard

Instead of running locally, use the remote EAS Build service which will:
1. Handle all dependencies and caching automatically
2. Compile in the cloud with proper resources
3. Generate the AAB file ready for Google Play

### Steps:

#### 1. **Online Method (Recommended)**
Go directly to EAS Dashboard:
```
https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/builds
```

Click **"New Build"** → Select **Android** → Select **Production** profile

Or use Web Command:
```bash
eas build --platform android --profile production
```

#### 2. **Alternative: Command Line**
If you want to use CLI but avoid local file conflicts:

**Option A: Close All IDEs/Editors**
- Close VSCode, Android Studio, any file explorer windows
- This releases the file locks
- Then run: `npm install && eas build --platform android --profile production`

**Option B: Use a New Terminal/PowerShell Window**
- Open fresh PowerShell
- Navigate to project: `cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21`
- Run: `eas build --platform android --profile production`

#### 3. **Manual Node Modules Cleanup (Advanced)**
If above doesn't work, manually remove the problematic package:
```bash
# Close everything first!
$env:SYSTEMROOT\System32\taskkill.exe /IM code.exe /F 2>$null
$env:SYSTEMROOT\System32\taskkill.exe /IM explorer.exe /F 2>$null

# Wait 5 seconds
Start-Sleep -Seconds 5

# Now remove
Remove-Item -Path "c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21\node_modules" -Recurse -Force

# Reinstall
npm install

# Build
eas build --platform android --profile production
```

## 📱 What Will Happen During EAS Build

1. **Queue** - Build added to queue (usually immediate)
2. **Preparing** - Environment setup (~2 min)
3. **Installing** - npm dependencies (~ 3 min)
4. **Building** - Expo/React Native compilation (~5 min)
5. **Gradle** - Android compilation with your fixed `google-services.json` ✅ (~10 min)
6. **Bundling** - Creating AAB file (~ 2 min)
7. **Uploading** - Transferring to your account (~1 min)

**Total Time: 15-30 minutes**

## 📥 Download Your AAB

Once build completes:

1. **Via Dashboard**
   - Go to https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app
   - Find the completed build
   - Click "Download" next to the AAB artifact

2. **Via CLI**
   - CLI will provide artifact URL after build completes
   - Direct download link to your AAB

3. **File Naming**
   - Expected: `pulsemate-v1.2.2-production.aab` (or version you set)
   - Size: 50-150 MB (normal for React Native)

## 🎯 Next: Submit to Google Play

Once you have the AAB file:

### Option 1: Manual Upload
1. Log in to Google Play Console
2. Select your app
3. Left menu → Releases → Production
4. Click "Create new release"
5. Upload the AAB file
6. Add release notes
7. Review and publish

### Option 2: Automated with EAS
```bash
eas submit --platform android --path /path/to/aab/file
```

## ✅ Build Prerequisites

Your project is ready:
- ✅ Firebase config fixed (`google-services.json`)
- ✅ Phone auth implemented (web SDK)
- ✅ Dependencies in package.json
- ✅ Version configured (1.2.2)
- ✅ EAS project linked

## 🚀 Quick Start

**Right now:**
1. Go to https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/builds
2. Click **New Build**
3. Select: **Android** → **Production**
4. Wait 15-30 minutes
5. Download AAB
6. Submit to Google Play!

---

**Recommended:** Use the web dashboard method to avoid local file locking issues.
