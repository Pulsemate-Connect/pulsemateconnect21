# Simple Solution - Build from Current Directory

## The Real Issue

The Firebase reCAPTCHA error happens during Metro JavaScript bundling, not Gradle compilation. We need to either:
1. Remove `expo-firebase-recaptcha` imports from code, OR
2. Build a "release" AAB that bypasses Metro bundling issues

## Simplest Solution - Try Building from Here First

```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21\android
gradlew.bat bundleRelease
```

If that works, the AAB will be at:
```
android\app\build\outputs\bundle\release\app-release.aab
```

## Why This Might Work

Gradle release builds sometimes skip the Metro bundler checks that development builds perform. The Firebase code will be bundled but the broken import might be tree-shaken out if it's not actually used in the production build.

## If That Fails

Then we need to manually fix the files. I'll create a PowerShell script to do this properly.

## Manual Fix (if needed)

1. Edit `src/screens/LoginScreen.jsx`:
   - Change line 19: `import { initializeFirebaseAuth, sendOtpToPhone } from '../config/firebase';`
   - To: `import { initializeFirebaseAuth, sendOtpToPhone } from '../config/firebase-production';`
   - Delete lines 17-18 (FirebaseRecaptchaVerifierModal and firebaseConfig imports)
   - Delete lines 71-72 (recaptchaVerifier ref)
   - Delete lines 119-123 (FirebaseRecaptchaVerifierModal component)
   - Delete lines 137-141 (recaptchaVerifier validation)
   - Change line 150: Remove `, recaptchaVerifier.current` parameter

2. Do the same for `src/screens/Login2FactorScreen.jsx`

3. Then build

