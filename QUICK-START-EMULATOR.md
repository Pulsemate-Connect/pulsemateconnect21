# 🚀 Quick Start: Run Patient App on Emulator

## ⚡ Super Quick Method (Recommended)

### 1️⃣ Start Emulator
Open **Command Prompt** or **PowerShell** in project folder and run:
```bash
emulator -avd PulseMatePixel35
```

Wait 30-60 seconds for emulator to fully boot (you'll see Android home screen)

### 2️⃣ Run the App
In a **new terminal** in the same project folder:
```bash
npm run android
```

**That's it!** The app will build, install, and launch automatically.

---

## 📋 Detailed Steps

### Option A: Using Command Line (Fastest)

#### Terminal 1 - Start Emulator:
```bash
cd "C:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
emulator -avd PulseMatePixel35
```

#### Terminal 2 - Run App:
```bash
cd "C:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
npm run android
```

---

### Option B: Using Android Studio

#### 1. Start Emulator via Android Studio:
- Open **Android Studio**
- Click **More Actions** → **Virtual Device Manager**
- Find **PulseMatePixel35**
- Click the **▶ Play** button
- Wait for emulator to boot

#### 2. Run the App:
```bash
npm run android
```

---

## 🔍 Verify Emulator is Running

Check if emulator is detected:
```bash
adb devices
```

You should see:
```
List of devices attached
emulator-5554    device
```

---

## 🧪 Test Login Credentials

Once the app launches:

**Patient Account:**
- Mobile: `9999999999`
- OTP: `123456`

OR

- Mobile: `8888888888`
- OTP: `123456`

---

## 🛠️ Troubleshooting

### Emulator Not Starting
```bash
# List available emulators
emulator -list-avds

# Try the other emulator
emulator -avd PulseMatePixel35c
```

### "No devices/emulators found"
1. Make sure emulator is fully booted (home screen visible)
2. Check: `adb devices`
3. If no devices shown, restart adb: `adb kill-server && adb start-server`

### Build Errors
```bash
# Clean build
cd android
.\gradlew clean
cd ..
npm run android
```

### Metro Bundler Issues
If you see bundler errors:
```bash
# Clear cache
npm start -- --reset-cache
```

Then in another terminal:
```bash
npm run android
```

### "ANDROID_HOME not set"
Set environment variable:
```powershell
$env:ANDROID_HOME="C:\Users\shubh\AppData\Local\Android\Sdk"
$env:PATH="$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\platform-tools;$env:PATH"
```

---

## 📱 App Features to Test

### 1. Patient Dashboard
- View doctor listings
- Search by specialization
- Filter by location

### 2. Book Appointment
- Select doctor
- Choose date/time slot
- Confirm booking

### 3. Live Queue
- View queue position
- Real-time updates
- Estimated wait time

### 4. Profile Management
- Update personal info
- Medical history
- Appointment history

---

## ⚙️ Backend Connection

**Make sure backend is running!**

Check in another terminal:
```bash
cd backend
npm start
```

Backend should be running on: `http://localhost:5000`

### For Emulator to Connect:
The app is configured to connect to backend via:
- **Localhost** for Metro Bundler
- **10.0.2.2:5000** for Android emulator

This is already configured in your app.

---

## 🔥 Hot Reload

Changes you make to the code will auto-reload:
- **JavaScript changes**: Instant reload
- **Native code changes**: Need to rebuild with `npm run android`

---

## 📦 Build Info

- **Build Type**: Development APK
- **Emulator**: PulseMatePixel35 (Android 35)
- **Metro Bundler**: Auto-starts with `npm run android`

---

## 🎯 Quick Commands Reference

```bash
# Start emulator
emulator -avd PulseMatePixel35

# Run app on Android
npm run android

# Start metro bundler only
npm start

# View Android logs
npx react-native log-android

# Check devices
adb devices

# Install specific APK
adb install path/to/app.apk

# Uninstall app
adb uninstall com.pulsemateconnect.pulsemateapp
```

---

## ✅ Pre-flight Checklist

Before running, make sure:
- ✅ Node.js installed
- ✅ Android Studio installed
- ✅ Android SDK configured
- ✅ Emulator available
- ✅ Backend server running (port 5000)
- ✅ In project root directory

---

**First build will take 5-10 minutes. Subsequent builds are much faster!**

Good luck! 🚀
