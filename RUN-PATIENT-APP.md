# 📱 How to Run the Patient Mobile App

## Prerequisites
- ✅ Node.js installed
- ✅ Android Studio installed
- ✅ Android SDK configured
- ✅ Emulator or physical device ready

## Option 1: Using Expo (Recommended)

### Step 1: Start Metro Bundler
```bash
npm start
```

### Step 2: Press 'a' for Android
When Metro Bundler starts, press **'a'** to open on Android device/emulator

Or manually run:
```bash
npm run android
```

## Option 2: Using Android Studio

### Step 1: Open Android Studio
1. Open Android Studio
2. Tools → Device Manager
3. Start an emulator (PulseMatePixel35 or PulseMatePixel35c)

### Step 2: Run the App
Once emulator is running:
```bash
npx expo run:android
```

## Option 3: Physical Device

### Step 1: Enable Developer Options on Your Phone
1. Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back to Settings → Developer Options
4. Enable "USB Debugging"

### Step 2: Connect Device
1. Connect phone via USB
2. Check connection: `adb devices`
3. Run app: `npm run android`

## Troubleshooting

### Emulator Not Starting
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd PulseMatePixel35
```

### SDK Path Issues
Set environment variable:
```bash
# Windows (PowerShell)
$env:ANDROID_HOME="C:\Users\shubh\AppData\Local\Android\Sdk"
```

### Metro Bundler Issues
```bash
# Clear cache and restart
npm start -- --reset-cache
```

### Build Errors
```bash
# Clean and rebuild
cd android
.\gradlew clean
cd ..
npm run android
```

## Backend Connection

Make sure the backend is running:
- Backend URL: http://localhost:5000
- Check in `app.json` or environment settings

For emulator to access localhost:
- Use `10.0.2.2:5000` instead of `localhost:5000`
- Or use your computer's IP address

## Test User Accounts

### Patient Login
- Mobile: 9999999999 (test number)
- OTP: 123456 (test OTP)

OR

- Mobile: 8888888888
- OTP: 123456

## Common Commands

```bash
# Start Metro Bundler
npm start

# Run on Android
npm run android

# Run on Android with specific device
npm run android -- --device="emulator-5554"

# View logs
npx react-native log-android

# Check connected devices
adb devices
```

## Environment Variables

Check your `.env` or `app.json` for:
- API_URL / BACKEND_URL
- Firebase configuration
- Other service keys

## Notes

- First build may take 5-10 minutes
- Emulator requires hardware acceleration (Intel HAXM or Hyper-V)
- For physical device, both phone and computer must be on same network for hot reload

## Quick Start (One Command)

```bash
# This will start metro bundler and open on Android
npm start
# Then press 'a' when prompted
```

---

**Need Help?**
- Check Metro Bundler output for errors
- Check `adb logcat` for Android logs
- Ensure backend is running on port 5000
