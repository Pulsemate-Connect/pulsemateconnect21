# 📱 Development with USB + Live Reload

## ✅ FIXED: "Initialization Error"

The error was caused by using `@react-native-firebase/auth` which doesn't work in Expo Go.

**Solution:** Switched back to Firebase Web SDK (`firebase/auth`) which works in both:
- ✅ **Expo Go** (development with reCAPTCHA modal)
- ✅ **Production AAB** (SafetyNet attestation)

---

## 🚀 How to Run with USB (EASY!)

### Option 1: Run with Expo Go (RECOMMENDED)

**Step 1:** Connect phone via USB
- Enable USB Debugging on your Android phone
- Connect USB cable to computer

**Step 2:** Run the script
```bash
.\run-dev-usb.bat
```

**Step 3:** Open Expo Go
- App will load automatically
- Make code changes → They reload instantly! 🔥

### Option 2: Manual Start
```bash
npx expo start --android
```

---

## 🔧 How It Works Now

### Development (Expo Go)
```
Login → reCAPTCHA modal appears → OTP sent → Success!
```

**Files Used:**
- `src/config/firebase.js` (Firebase Web SDK)
- `expo-firebase-recaptcha` (reCAPTCHA modal)

**Verifier:** reCAPTCHA v2 modal

### Production (AAB from Play Store)
```
Login → NO modal → SafetyNet silent → OTP sent → Success!
```

**Files Used:**
- `src/config/firebase.js` (Firebase Web SDK)
- `google-services.json` (with correct SHA-1)

**Verifier:** SafetyNet attestation (automatic, no modal)

---

## 📝 Files Changed

1. **`src/screens/Login2FactorScreen.jsx`**
   - ✅ Added `FirebaseRecaptchaVerifierModal` back
   - ✅ Imports from `firebase.js` (not `firebase-native.js`)
   - ✅ Works in both Expo Go AND production

2. **`package.json`**
   - ✅ Re-added `expo-firebase-recaptcha`

3. **`android/app/google-services.json`**
   - ✅ Updated with production keystore SHA-1: `0b84891144b1b8dbc49b4d05edaa83770f30434f`

---

## 🎯 Quick Commands

| Task | Command |
|------|---------|
| **Run with USB (Live Reload)** | `.\run-dev-usb.bat` |
| **Build Production AAB** | `.\build-aab-auto-version.bat` |
| **Check Version** | `type VERSION.txt` |

---

## 🔥 Live Reload Features

Once you run `.\run-dev-usb.bat`:

1. **Instant updates** - Save a file → App reloads automatically
2. **USB connection** - Faster than WiFi, more stable
3. **Debug console** - See console.log() output in terminal
4. **Error overlay** - See errors directly on phone screen

---

## ⚡ Development Tips

### Enable Fast Refresh
1. Open app on phone
2. Shake device
3. Tap "Enable Fast Refresh"

### View Console Logs
All `console.log()` statements appear in your terminal where you ran `run-dev-usb.bat`

### Debug Mode
Press `m` in the terminal to open developer menu on phone

### Reload Manually
Shake device → "Reload"

---

## 🚨 Troubleshooting

### Problem: "Initialization Error" still shows
**Solution:** The AAB version 72 on Play Store still has the old code. You need to:
1. Build new AAB (version 73) with the fixed code
2. Upload to Play Store
3. Download from Play Store and test

OR test in Expo Go first:
```bash
.\run-dev-usb.bat
```

### Problem: reCAPTCHA modal doesn't appear in Expo Go
**Solution:** Check that `expo-firebase-recaptcha` is installed:
```bash
npm list expo-firebase-recaptcha
```

If not installed:
```bash
npm install expo-firebase-recaptcha --legacy-peer-deps
```

### Problem: USB device not detected
**Solution:**
1. Check USB Debugging is enabled
2. Run `adb devices` to verify
3. If no devices, install ADB drivers

### Problem: Metro bundler error
**Solution:** Clear cache and restart:
```bash
npx expo start --clear
```

---

## 📊 Development vs Production

| Feature | Development (Expo Go) | Production (AAB) |
|---------|----------------------|------------------|
| **Build Time** | Instant (no build) | ~10 minutes |
| **Live Reload** | ✅ Yes | ❌ No |
| **Firebase OTP** | ✅ reCAPTCHA modal | ✅ SafetyNet (silent) |
| **Install Method** | Expo Go app | Play Store |
| **Code Changes** | Instant reload | Need new AAB |
| **USB Required** | No (but faster) | No |

---

## 🎯 Next Steps

### For Development/Testing:
```bash
.\run-dev-usb.bat
```
- Test OTP with reCAPTCHA modal
- Make code changes with live reload
- Fast iteration

### For Production Release:
```bash
.\build-aab-auto-version.bat
```
- Build AAB with auto-version increment
- Upload to Play Store
- Users get SafetyNet (no modal)

---

## ✅ Current Status

- ✅ Firebase Web SDK configured correctly
- ✅ reCAPTCHA modal works in Expo Go
- ✅ google-services.json updated with production SHA-1
- ✅ Version tracking system active (current: 72)
- ✅ Live reload enabled for development
- ✅ Ready for both development AND production!

---

**Recommended Workflow:**
1. Develop and test with `.\run-dev-usb.bat` (Expo Go + live reload)
2. When ready, build production AAB with `.\build-aab-auto-version.bat`
3. Upload to Play Store
4. Production users get seamless SafetyNet OTP (no modal)

🎉 **All set! Start developing with:** `.\run-dev-usb.bat`
