# Running PulseMate App on Port 8081 via USB

## ✅ Current Status

- **Expo Dev Server:** Starting on port 8081
- **Device Connected:** 9b90e608 (via USB)
- **Metro Bundler:** Initializing...

---

## 📱 Your Device Connection

```
Device ID: 9b90e608
Connection: USB
Status: Connected ✅
```

---

## 🚀 What's Happening Now

1. **Expo Dev Server is starting** on `http://localhost:8081`
2. **Metro Bundler is initializing** (this takes 30-60 seconds)
3. **App will automatically open** on your USB-connected device

**Wait for the Metro Bundler to complete...**

You'll see messages like:
```
Metro waiting on exp://...
Logs for your project will appear below.
```

---

## 📋 Commands Being Run

```bash
# Check USB device connection
adb devices

# Start Expo on port 8081 and deploy to Android device
npx expo start --port 8081 --android
```

---

## 🔧 If App Doesn't Open Automatically

### Option 1: Manual ADB Port Forwarding
```bash
adb -s 9b90e608 reverse tcp:8081 tcp:8081
adb -s 9b90e608 reverse tcp:5000 tcp:5000
```

### Option 2: Launch from Expo CLI
Once Metro Bundler is ready, press **'a'** in the Expo terminal to launch on Android device.

### Option 3: Open from Device
If you have Expo Go installed:
1. Open Expo Go app on your device
2. Connect to development server
3. It should auto-detect the server at `http://localhost:8081`

---

## ✅ Testing Firebase Phone Auth

Once the app opens, you can test the new Firebase Phone Auth fix:

### 1. Enter a Real Phone Number
- Any valid Indian mobile: `9876543210` (without country code)
- App adds `+91` prefix automatically

### 2. Click "Send OTP"
- **IMPORTANT:** With the new fix, a REAL SMS will be sent!
- Wait 10-30 seconds for SMS delivery

### 3. Enter OTP from SMS
- Check your phone for the SMS
- Enter the 6-digit code

### 4. Verify and Login
- Should login successfully ✅

---

## 📊 Expected Console Output

### When App Starts:
```
[Auth] Firebase initialized successfully
[Auth] Mode: Development
[Login2Factor] Firebase Auth ready
```

### When Sending OTP:
```
[Login2Factor] Sending OTP via Firebase to +919876543210
[Auth] Sending OTP to: +919876543210
[Auth] ✓ SMS OTP sent successfully to +919876543210
```

### When Verifying OTP:
```
[Otp2Factor] Verifying OTP with Firebase
[Auth] ✓ OTP verified successfully, user signed in
[Auth] ✓ Login successful
```

---

## 🐛 Troubleshooting

### Metro Bundler Stuck?
```bash
# Stop the process (in your terminal with Expo, press Ctrl+C)
# Then clear cache and restart:
npx expo start --port 8081 --android --clear
```

### Device Not Detected?
```bash
adb kill-server
adb start-server
adb devices
```

### App Not Opening?
```bash
# Check if Expo is running on device:
adb shell pm list packages | findstr expo

# Or manually install if needed:
npx expo install
```

### Port 8081 Already in Use?
```bash
# Check what's using port 8081:
netstat -ano | findstr :8081

# Kill the process (replace PID with actual process ID):
taskkill /PID <PID> /F

# Or use a different port:
npx expo start --port 8082 --android
```

---

## 📱 Backend Connection

The app is configured to connect to:
- **Development API:** `http://10.31.245.219:5000/api`

Make sure your backend is running on port 5000.

---

## 🔥 Firebase Configuration Status

### ✅ Code Fixed
- [x] FirebaseRecaptchaVerifierModal installed and configured
- [x] appVerifier properly passed to signInWithPhoneNumber()
- [x] Test phone numbers removed
- [x] Production-ready code

### ⚠️ Firebase Console (REQUIRED)
- [ ] **Add SHA-1 fingerprint** to Firebase Console
- [ ] **Add SHA-256 fingerprint** to Firebase Console
- [ ] **Download updated google-services.json**
- [ ] **Rebuild app**

**Without SHA fingerprints, you'll get `auth/invalid-app-credential` error!**

See: `FIREBASE-PHONE-AUTH-FIXED.md` for SHA fingerprint setup.

---

## 🎯 Quick Commands

**Check device:**
```bash
adb devices
```

**Port forwarding (if needed):**
```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000
```

**Reload app:**
```bash
# In Expo terminal, press: r
```

**Clear cache and restart:**
```bash
npx expo start --port 8081 --android --clear
```

---

## 📍 Current Location

- **Project:** `c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21`
- **Port:** 8081
- **Device:** 9b90e608 (USB)
- **Platform:** Android

---

## ⏰ Wait Time

**Normal startup time:** 30-60 seconds

The Metro Bundler needs to:
1. Initialize JavaScript bundler
2. Start development server
3. Connect to device via ADB
4. Build JavaScript bundle
5. Install/update app on device
6. Launch app

**Be patient! The first start can take up to 2 minutes.**

---

**Status:** 🟡 Starting...
**Last Updated:** January 29, 2026

Check the Expo terminal window for real-time progress!
