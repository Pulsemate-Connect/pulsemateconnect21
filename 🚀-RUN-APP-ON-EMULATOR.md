# 🚀 Run PulseMate Connect on Android Emulator

**Quick Start:** Just run `QUICK-START-ANDROID.bat`

---

## 📱 METHOD 1: Quick Start (Easiest)

### One-Click Start:
```bash
QUICK-START-ANDROID.bat
```

**What it does:**
1. ✅ Checks for connected devices/emulators
2. ✅ Starts Metro Bundler
3. ✅ Builds and installs app on Android
4. ✅ Opens app automatically

---

## 🎯 METHOD 2: Step-by-Step Manual

### Step 1: Start Android Emulator

**Option A: Using Android Studio**
1. Open Android Studio
2. Click "Tools" → "Device Manager"
3. Click ▶️ button next to any emulator
4. Wait for emulator to boot (~30 seconds)

**Option B: Using Command Line**
```bash
# List available emulators
emulator -list-avds

# Start specific emulator (replace with your AVD name)
emulator @Pixel_5_API_30

# Or use any emulator from the list:
# emulator @Pixel_3_API_29
# emulator @Pixel_4_API_31
```

### Step 2: Verify Emulator Connection
```bash
adb devices
```
**Expected output:**
```
List of devices attached
emulator-5554   device
```

### Step 3: Start Metro Bundler
```bash
npm start
```
**Or:**
```bash
npx react-native start
```

**Keep this terminal open!**

### Step 4: Build and Install App (New Terminal)
```bash
npx react-native run-android
```

**Or use Expo:**
```bash
npm start
# Then press 'a' for Android
```

---

## 🔧 METHOD 3: Full Development Environment

### Complete Setup:
```bash
START-DEV-ENVIRONMENT.bat
```

**Features:**
- ✅ Checks Android SDK
- ✅ Lists available emulators
- ✅ Starts emulator if needed
- ✅ Manages Metro Bundler
- ✅ Interactive prompts

---

## 🐛 TROUBLESHOOTING

### "adb not found"
**Solution:**
```bash
# Add to PATH (replace USERNAME with yours):
set PATH=%PATH%;C:\Users\USERNAME\AppData\Local\Android\Sdk\platform-tools
```

### "No emulators available"
**Solution:**
1. Open Android Studio
2. Tools → Device Manager → Create Device
3. Choose Pixel 5 with API 30 (recommended)
4. Download system image if prompted
5. Finish setup

### Metro already running on port 8081
**Solution:**
```bash
# Kill existing Metro process
npx react-native start --reset-cache

# Or kill manually:
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### "Command failed: gradlew.bat installDebug"
**Solution:**
```bash
cd android
.\gradlew clean
cd ..
npx react-native run-android
```

### App builds but crashes immediately
**Solution:**
```bash
# Clear caches
npx react-native start --reset-cache

# Rebuild
cd android
.\gradlew clean
cd ..
npx react-native run-android
```

### "SDK location not found"
**Solution:**
Create `android/local.properties`:
```properties
sdk.dir=C:\\Users\\USERNAME\\AppData\\Local\\Android\\Sdk
```

---

## 🧪 TESTING THE OTP FIX

Once the app is running:

### Test 1: Normal Login
1. Enter phone number: `+91-XXXXXXXXXX`
2. Tap "Send OTP"
3. **Check Metro Bundler logs:**
   ```
   [MessageCentral] 📱 Sending 6-digit OTP to: +91XXXXXXXXXX
   [MessageCentral] ✅ OTP sent successfully
   ```
4. Enter the OTP you received via SMS
5. **Expected:** ✅ Login successful

### Test 2: Rate Limiting
1. Request OTP 5 times quickly
2. Try 6th request
3. **Expected:** ❌ "Too many OTP requests. Please try again after an hour."
4. **This is correct behavior** - rate limit working!

### Test 3: OTP Validation (Fixed!)
1. Request OTP
2. Enter correct OTP
3. **Check logs:**
   ```
   [MessageCentral] ├─ Method: GET (as per Message Central API)
   [MessageCentral] ✅ Validation API call successful
   [MessageCentral] 📥 HTTP Status: 200
   ```
4. **Expected:** ✅ No 401 errors, login succeeds

---

## 📊 DEVELOPMENT SHORTCUTS

### Metro Bundler Commands:
- **`r`** - Reload app
- **`d`** - Open developer menu
- **`i`** - Run on iOS (if available)
- **`a`** - Run on Android

### In-App Developer Menu:
1. **Shake device/emulator** (or press `Ctrl+M` in emulator)
2. Options:
   - Reload
   - Debug
   - Enable Hot Reload
   - Enable Live Reload
   - Toggle Inspector

### Clear Everything (Nuclear Option):
```bash
# Clear all caches and reinstall
npm run clean
npm install
cd android
.\gradlew clean
cd ..
npx react-native start --reset-cache
# In new terminal:
npx react-native run-android
```

---

## 📱 EMULATOR SHORTCUTS

### Control Emulator:
- **Rotate:** `Ctrl + ←/→`
- **Back button:** `ESC`
- **Home button:** `Home`
- **Menu:** `F2` or `Page Up`
- **Power:** `Power` button
- **Volume:** `Page Down/Up`

### Emulator Panel (Right side):
- 📱 Power
- 🔊 Volume
- 🔄 Rotate
- 📸 Screenshot
- ⚙️ Settings
- 📍 Location

---

## 🎯 QUICK COMMANDS REFERENCE

```bash
# Start everything
QUICK-START-ANDROID.bat

# Just Metro
npm start

# Just build
npx react-native run-android

# Reset everything
npm start -- --reset-cache

# Check devices
adb devices

# View logs
npx react-native log-android

# Kill Metro
# (Find PID and kill, or just Ctrl+C in Metro terminal)

# Uninstall app from emulator
adb uninstall in.pulsemateconnect.patient
```

---

## ✅ EXPECTED BEHAVIOR

### First Run (Fresh Install):
1. Metro Bundler starts → Shows "Metro running on port 8081"
2. Build starts → Gradle downloads dependencies (first time: 2-5 min)
3. App installs → APK installed on emulator
4. App launches → PulseMate Connect splash screen
5. Login screen → Enter phone number

### Subsequent Runs (After Changes):
1. Make code changes
2. Metro auto-reloads → Changes appear instantly (Hot Reload)
3. Or press `R` in Metro → Manual reload

### When OTP Fix is Working:
1. Enter phone number → No errors
2. Request OTP → SMS received (check production phone)
3. Enter OTP → Login successful
4. **No "Too many requests" in normal usage** ✅
5. **No 401 errors** ✅

---

## 🚀 YOU'RE READY!

Choose your method:
1. **🏃 Fast:** `QUICK-START-ANDROID.bat`
2. **🎛️ Control:** `START-DEV-ENVIRONMENT.bat`
3. **📝 Manual:** Follow Step-by-Step guide above

After starting, test the OTP login to verify the fixes are working!

---

**Status:** ✅ Scripts created, ready to run  
**Backend:** ✅ Deployed with OTP fixes  
**Frontend:** Ready to test

**Next:** Run the app and test OTP login! 🎉
