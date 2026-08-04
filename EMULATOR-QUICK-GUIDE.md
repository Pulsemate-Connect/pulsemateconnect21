# 🚀 PulseMate Connect - Emulator Quick Guide

## Prerequisites

Before running on emulator, ensure you have:

1. **Android Studio** installed
   - Download: https://developer.android.com/studio

2. **At least one Android Virtual Device (AVD)** created
   - Open Android Studio → Tools → Device Manager → Create Device

3. **APK file** built
   - File: `pulsemateconnect-v1.3.4-71-rnfirebase.apk`

## Quick Start (Easiest Method)

### Option 1: Automated Setup (Recommended)

Just run this script - it does everything automatically:

```bash
EMULATOR-COMPLETE-SETUP.bat
```

**What it does:**
- ✅ Checks Android SDK installation
- ✅ Lists available emulators
- ✅ Starts emulator if not running
- ✅ Waits for emulator to boot
- ✅ Installs the APK
- ✅ Launches the app
- ✅ Shows live logs

### Option 2: Manual Steps

If you prefer manual control:

#### Step 1: Start Emulator
```bash
# List available emulators
emulator -list-avds

# Start specific emulator (replace with your AVD name)
emulator -avd Pixel_5_API_33
```

#### Step 2: Install APK
```bash
# Wait for emulator to fully boot, then:
adb install -r pulsemateconnect-v1.3.4-71-rnfirebase.apk
```

#### Step 3: Launch App
```bash
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
```

#### Step 4: View Logs
```bash
adb logcat -s ReactNativeJS:V
```

## Troubleshooting

### Problem: "ADB not found"

**Solution:**
1. Install Android Studio
2. Go to: Settings → Appearance & Behavior → System Settings → Android SDK
3. Click "SDK Tools" tab
4. Install "Android SDK Platform-Tools"
5. Add to PATH:
   ```
   C:\Users\<YourUsername>\AppData\Local\Android\Sdk\platform-tools
   ```

### Problem: "No emulators found"

**Solution:**
1. Open Android Studio
2. Tools → Device Manager
3. Click "Create Device"
4. Select device (e.g., Pixel 5)
5. Download system image (Android 13+ recommended)
6. Click Finish

### Problem: "Installation failed: INSTALL_FAILED_INSUFFICIENT_STORAGE"

**Solution:**
1. Open Android Studio → Device Manager
2. Click ⋮ menu on your emulator
3. Click "Wipe Data"
4. Or create new emulator with more storage

### Problem: "Emulator is slow"

**Solution:**
1. Open Android Studio → Device Manager
2. Click ⋮ menu → Edit
3. Under "Emulated Performance":
   - Graphics: Hardware - GLES 2.0
   - Boot option: Cold boot
4. Increase RAM allocation (4GB recommended)

### Problem: App crashes on startup

**Solution:**
1. Check logs:
   ```bash
   adb logcat -s ReactNativeJS:V AndroidRuntime:E
   ```
2. Clear app data:
   ```bash
   adb shell pm clear in.pulsemateconnect.patient
   ```
3. Reinstall:
   ```bash
   adb uninstall in.pulsemateconnect.patient
   adb install pulsemateconnect-v1.3.4-71-rnfirebase.apk
   ```

## Useful Commands Reference

### App Management
```bash
# Install APK (replace existing)
adb install -r <apk-file>

# Uninstall app
adb uninstall in.pulsemateconnect.patient

# Clear app data and cache
adb shell pm clear in.pulsemateconnect.patient

# Launch app
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

# Force stop app
adb shell am force-stop in.pulsemateconnect.patient
```

### Logging & Debugging
```bash
# View React Native logs only
adb logcat -s ReactNativeJS:V

# View all errors
adb logcat *:E

# View specific tag
adb logcat -s Firebase:V

# Save logs to file
adb logcat > logs.txt

# Clear log buffer
adb logcat -c
```

### Device Control
```bash
# List connected devices
adb devices

# Take screenshot
adb exec-out screencap -p > screenshot.png

# Record screen (stop with Ctrl+C)
adb shell screenrecord /sdcard/recording.mp4

# Restart ADB server
adb kill-server
adb start-server

# Open keyboard
adb shell input keyevent 66

# Simulate back button
adb shell input keyevent 4
```

### Network Testing
```bash
# Check network connectivity
adb shell ping -c 4 8.8.8.8

# Test API endpoint
adb shell ping -c 4 api.pulsemateconnect.in

# View network traffic
adb shell netstat
```

## Performance Tips

### For Faster Emulator

1. **Use Hardware Acceleration**
   - Ensure Intel HAXM or Hyper-V is enabled
   - Android Studio → Settings → Appearance → System Settings → Android SDK → SDK Tools
   - Install "Intel x86 Emulator Accelerator (HAXM installer)"

2. **Optimize Emulator Settings**
   ```
   RAM: 4GB
   Graphics: Hardware - GLES 2.0
   Multi-Core CPU: 4 cores
   ```

3. **Use Pixel Devices**
   - Pixel 4, 5, or 6 have good performance
   - Avoid tablets (slower)

### For Better Development Experience

1. **Enable USB Debugging Features**
   ```bash
   # Enable developer options in emulator:
   # Settings → About emulated device → Tap "Build number" 7 times
   ```

2. **Hot Reload**
   - Shake device (Ctrl+M in emulator)
   - Enable "Fast Refresh"

## Next Steps

Once the app is running on emulator:

1. **Test Phone Authentication**
   - Use Firebase test phone numbers
   - Or configure backend 2Factor SMS

2. **Test Key Features**
   - Doctor search
   - Appointment booking
   - Queue management

3. **Monitor Logs**
   - Watch for errors in logcat
   - Check network requests

4. **Test Different Scenarios**
   - Airplane mode
   - Poor network conditions
   - Different Android versions

## Support

If you encounter issues:

1. Check logs: `adb logcat -s ReactNativeJS:V`
2. Clear app data: `adb shell pm clear in.pulsemateconnect.patient`
3. Restart emulator
4. Check backend status: `https://api.pulsemateconnect.in/health`

---

**Created:** 2026-08-04
**Last Updated:** 2026-08-04
