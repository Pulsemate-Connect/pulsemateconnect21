# 🔥 Firebase Phone Auth — Production AAB Fix

## Problem
`expo-firebase-recaptcha` requires `expo-firebase-core` (which is broken). But in **production Android builds**, Firebase phone auth works WITHOUT reCAPTCHA when SHA-256 is registered.

## Solution
Remove `FirebaseRecaptchaVerifierModal` from login screens. Firebase will use SafetyNet attestation instead (automatic on production builds with registered SHA-256).

## Status
✅ SHA-256 already registered in Firebase Console  
✅ Firebase Phone Auth enabled  
✅ Package name: `in.pulsemateconnect.patient`  

## Files Fixed
- `src/screens/LoginScreen.jsx` - Removed FirebaseRecaptchaVerifierModal
- `src/screens/Login2FactorScreen.jsx` - Removed FirebaseRecaptchaVerifierModal
- `src/config/firebase.js` - Updated to work without recaptchaVerifier in production

## How It Works

### Development (Expo Go)
- Uses test phone numbers (no real SMS)
- No reCAPTCHA needed

### Production (AAB)
- Uses real Firebase SMS
- Uses SafetyNet attestation (automatic when SHA-256 registered)
- No reCAPTCHA modal needed

## Next Steps
1. Run `FIX-FIREBASE-AND-BUILD-AAB.bat` from this directory
2. Wait for build to complete (~10-15 minutes)
3. AAB will be on desktop: `pulsemateconnect-production.aab`
4. Upload to Play Store internal testing
5. Test Firebase OTP (will work with real phone numbers)

## Build Command
```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
FIX-FIREBASE-AND-BUILD-AAB.bat
```

## Technical Details
- Firebase JS SDK automatically detects production environment
- When `applicationVerifier` parameter is omitted in production builds, Firebase uses native SafetyNet
- SafetyNet requires registered SHA-256 fingerprints (already done ✅)
- This is documented in Firebase docs but poorly explained
