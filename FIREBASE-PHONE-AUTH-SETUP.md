# Firebase Phone Authentication Setup Guide

## 🚀 Quick Start

### Development Mode (Testing)
The app is now configured to work with test phone numbers in development mode.

**Test Phone Numbers:**
- `+917022818878` → OTP: `123456`
- `+919876543210` → OTP: `123456`

These numbers work on:
- ✅ Real Android devices
- ✅ Android emulators
- ✅ Expo Go
- ✅ Development builds

### Production Mode (Real SMS)
Real phone numbers will receive actual SMS OTPs via Firebase.

---

## 📋 What Was Fixed

### Problem
Firebase Phone Auth was failing with errors:
- `auth/argument-error`
- `reCAPTCHA Enterprise not configured`
- `This device/environment may not support Firebase Phone Auth`

### Solution
1. **Added `appVerificationDisabledForTesting`** in development mode
2. **Configured test phone numbers** for easy testing
3. **Device detection** to provide better error messages
4. **Automatic mode switching** between dev and production

---

## 🔧 Configuration Changes

### Updated Files
- `src/config/firebase.js` - Added dev mode, test numbers, device detection

### Key Changes

```javascript
// Automatically detects development vs production
const DEV_MODE = __DEV__;

// Test phone numbers for development
const TEST_PHONE_NUMBERS = {
  '+917022818878': '123456',
  '+919876543210': '123456',
};

// Enable test mode in development
if (DEV_MODE) {
  firebaseAuth.settings.appVerificationDisabledForTesting = true;
}
```

---

## 🧪 Testing Guide

### How to Test (Development)

1. **Start the app on USB device (port 8081):**
   ```bash
   npx expo start --port 8081
   ```

2. **On Login Screen:**
   - Enter test number: `7022818878` (without +91)
   - Click "Send OTP"
   - You'll see in console: "Using TEST phone number - OTP: 123456"

3. **On OTP Screen:**
   - Enter OTP: `123456`
   - Click "Verify"
   - Should login successfully

### Testing Real SMS (Production)

To test with real SMS on your device:

1. **Build a production APK/AAB** (not development build)
2. **Or set `DEV_MODE = false`** in `firebase.js`
3. Enter any real phone number
4. Real SMS will be sent via Firebase

---

## 🔐 Firebase Console Setup Required

### For Production (Real SMS)

You MUST configure these in Firebase Console:

#### 1. Enable Phone Authentication
- Go to: Firebase Console → Authentication → Sign-in method
- Enable "Phone" provider
- Click "Save"

#### 2. Add SHA-256 Certificate Fingerprint (Android)

**For Development Build:**
```bash
cd android
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**For Production Build (Release Keystore):**
```bash
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-alias
```

Copy the SHA-256 fingerprint and add it to Firebase Console:
- Go to: Project Settings → Your Apps → Android App
- Click "Add fingerprint"
- Paste SHA-256 fingerprint
- Click "Save"

#### 3. Download Updated `google-services.json`
- Go to: Project Settings → Your Apps → Android App
- Click "Download google-services.json"
- Replace the file in your project root

#### 4. Configure Test Phone Numbers in Firebase (Optional)

For numbers that should receive instant OTP without SMS:
- Go to: Firebase Console → Authentication → Settings → Phone
- Scroll to "Phone numbers for testing"
- Add: `+917022818878` → OTP: `123456`
- Add: `+919876543210` → OTP: `123456`

This makes these numbers work in BOTH dev and production without sending SMS.

#### 5. Enable reCAPTCHA Enterprise (Optional - for Web)

If you plan to support web platform:
- Go to: Google Cloud Console
- Enable "reCAPTCHA Enterprise API"
- Create a reCAPTCHA key
- Link it to your Firebase project

---

## 📱 Device Requirements

### Development Mode
- ✅ Any device or emulator
- ✅ Works with test phone numbers
- ✅ No SMS charges

### Production Mode (Real SMS)
- ✅ Real Android device (recommended)
- ✅ Android emulator with Google Play Services
- ⚠️ Emulators may not receive SMS (use test numbers)
- 💰 SMS charges apply (via Firebase/GCP billing)

---

## 🐛 Troubleshooting

### Error: "auth/argument-error"
**Cause:** reCAPTCHA verification is required but not configured.

**Solution:**
- Use test phone numbers in development
- Or add SHA-256 fingerprint to Firebase Console
- Or enable `appVerificationDisabledForTesting` (already done in dev mode)

### Error: "quota-exceeded"
**Cause:** Too many SMS requests.

**Solution:**
- Use test phone numbers
- Wait 15-30 minutes
- Increase quota in Firebase Console → Authentication → Settings → Phone → SMS quota

### Error: "invalid-app-credential"
**Cause:** App not properly registered in Firebase.

**Solution:**
- Add SHA-256 certificate fingerprint
- Download updated `google-services.json`
- Rebuild the app

### OTP Not Received (Real Numbers)
**Cause:** SMS delivery failed or blocked.

**Solution:**
- Check Firebase Console → Authentication → Usage (for delivery status)
- Verify phone number format (+91XXXXXXXXXX)
- Check SMS quota and billing
- Try test phone numbers instead

---

## 💡 Best Practices

### For Development
1. ✅ Always use test phone numbers
2. ✅ Keep `DEV_MODE = __DEV__` (auto-detects)
3. ✅ Don't waste SMS quota on testing
4. ✅ Test on real device when possible

### For Production
1. ✅ Add SHA-256 fingerprints for all keystores
2. ✅ Enable Firebase billing (for SMS)
3. ✅ Monitor SMS usage in Firebase Console
4. ✅ Set up SMS quota alerts
5. ✅ Keep test numbers in Firebase for demo accounts

---

## 📊 Current Configuration

### Firebase Project
- **Project ID:** pulsemateconnect
- **Auth Domain:** pulsemateconnect.firebaseapp.com
- **App ID:** 1:157620382332:web:e4156f49d8616a4ee6b7f9

### Test Phone Numbers (Dev Mode)
| Phone Number      | OTP    | Works On                    |
|-------------------|--------|-----------------------------|
| +917022818878     | 123456 | Emulator, Real Device, Expo |
| +919876543210     | 123456 | Emulator, Real Device, Expo |

### App Configuration
- **Dev Mode:** Enabled automatically in `__DEV__`
- **Test Verification:** Enabled in dev mode
- **Device Check:** Enabled
- **Platform:** React Native (Expo)

---

## 🎯 Next Steps

1. ✅ **Test with test phone numbers** - Verify the fix works
2. ⏭️ **Add SHA-256 fingerprint** - For production builds
3. ⏭️ **Enable Firebase billing** - For real SMS delivery
4. ⏭️ **Test on real device** - Verify SMS delivery
5. ⏭️ **Add more test numbers** - As needed for your team

---

## 📚 References

- [Firebase Phone Auth Docs](https://firebase.google.com/docs/auth/android/phone-auth)
- [Expo Firebase Setup](https://docs.expo.dev/guides/using-firebase/)
- [Firebase Test Phone Numbers](https://firebase.google.com/docs/auth/web/phone-auth#test-with-fictional-phone-numbers)
- [reCAPTCHA Enterprise](https://cloud.google.com/recaptcha-enterprise/docs/overview)

---

## 🆘 Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify test phone numbers are being used in dev mode
3. Check Firebase Console → Authentication → Usage
4. Review this guide's troubleshooting section
5. Check device is connected via USB (port 8081)

---

**Last Updated:** January 29, 2026
**Status:** ✅ Working in Development Mode
**Next:** Configure SHA-256 for Production
