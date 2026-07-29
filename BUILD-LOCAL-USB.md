# Build AAB Locally with EAS Build

## Prerequisites

1. **Install Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and ensure it's running (check system tray for Docker icon)

2. **Install EAS CLI** (if not already installed)
   ```cmd
   npm install -g eas-cli
   ```

3. **Login to EAS**
   ```cmd
   eas login
   ```

## Build Commands

### Option 1: Build Production AAB Locally
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
eas build --platform android --profile production --local
```

### Option 2: Build Preview APK Locally (for testing)
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
eas build --platform android --profile preview --local
```

## What Happens During Local Build

1. EAS creates a Docker container with build environment
2. Downloads all dependencies inside the container
3. Uses your remote credentials from EAS servers (keystore, etc.)
4. Builds the AAB/APK
5. Outputs the file to your local machine

## Output Location

After successful build, the AAB will be saved in the current directory:
- Production: `build-<timestamp>.aab`
- The exact filename will be shown in the console output

## Advantages of Local Build

✅ Faster build times (no upload/download)
✅ No build minutes consumed from EAS quota
✅ Can test on USB device immediately after build
✅ Full control over the build process
✅ Can use local files without committing to git

## Troubleshooting

### Docker Not Running
```
Error: Docker is not running
```
**Solution:** Start Docker Desktop from Windows start menu

### Insufficient Memory
```
Error: Out of memory
```
**Solution:** Increase Docker memory in Docker Desktop settings (Settings → Resources → Memory)

### Build Fails
```
Error: Build failed
```
**Solution:** Check the build logs for specific errors. Common issues:
- Missing dependencies in package.json
- Gradle configuration issues
- Keystore/signing problems

## Install on USB Device

After building locally:

1. **For APK (preview build):**
   ```cmd
   adb install build-<timestamp>.apk
   ```

2. **For AAB (production build):**
   - You cannot directly install AAB files
   - Either:
     - Upload to Play Store (internal testing track)
     - Convert to APK using bundletool:
       ```cmd
       java -jar bundletool.jar build-apks --bundle=build.aab --output=build.apks --mode=universal
       ```

## Quick Commands

```cmd
# Check if Docker is running
docker --version

# Check if device is connected
adb devices

# Build and install (preview APK)
eas build --platform android --profile preview --local
adb install build-*.apk

# Build production AAB
eas build --platform android --profile production --local
```

## Notes

- Local builds still use remote credentials (keystore) from EAS
- Make sure you have enough disk space (~5-10 GB free)
- First build will take longer as Docker downloads base images
- Subsequent builds will be faster
