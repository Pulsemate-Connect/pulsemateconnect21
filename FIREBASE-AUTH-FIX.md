# Firebase Auth "undefined is not a function" - Root Cause & Solution

## 🔴 Problem

**Error Message:**
```
Firebase initialization failed.
Error: undefined is not a function
```

## 🔍 Root Cause

The error `"undefined is not a function"` occurs because `@react-native-firebase/auth` is **NOT compatible with Expo managed workflow** when using EAS Build.

### Why This Happens:

1. **React Native Firebase requires native code** (Java/Kotlin for Android, Objective-C/Swift for iOS)
2. **Expo managed workflow** doesn't expose native code directly
3. **Adding plugins to app.json** is NOT enough - native code must be properly compiled
4. **EAS Build with remote credentials** doesn't properly link React Native Firebase modules

## ❌ What DOESN'T Work:

1. ❌ Just installing `@react-native-firebase/auth` package
2. ❌ Just adding plugin to `app.json`
3. ❌ Running `npx expo prebuild` alone
4. ❌ Using EAS Build with managed workflow

## ✅ Proper Solutions:

### Option 1: Use Expo Development Builds (Recommended for React Native Firebase)

```bash
# 1. Install expo-dev-client
npm install expo-dev-client

# 2. Prebuild to generate native folders
npx expo prebuild --clean

# 3. Build development client
eas build --profile development --platform android

# 4. Run locally
npx expo run:android
```

### Option 2: Switch to Firebase JS SDK (Web SDK) - EASIEST

This is what works with Expo managed workflow:

**Install:**
```bash
npm install firebase@10.12.5
```

**Configure (src/config/firebase.js):**
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... rest of config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
```

**Important:** Web SDK requires reCAPTCHA verification which **only works in Expo Go** or **web builds**, NOT in production Android APK/AAB.

### Option 3: Use Expo's Built-in Firebase Support

Wait for Expo to add native Firebase support (coming in future SDK versions).

## 📋 Current Project Status

**Package.json:**
- ✅ `@react-native-firebase/app": "^26.0.0"`
- ✅ `@react-native-firebase/auth": "^26.0.0"`

**app.json:**
- ✅ `"@react-native-firebase/app"` in plugins
- ✅ `"@react-native-firebase/auth"` in plugins

**Problem:**
- ❌ React Native Firebase doesn't work with Expo EAS managed builds
- ❌ Native linking fails in production builds

## 🎯 Recommended Action

**Choose ONE:**

###  A. Keep React Native Firebase (Requires Bare Workflow)

1. Commit current changes
2. Switch to bare workflow:
   ```bash
   npx expo prebuild
   ```
3. Build locally:
   ```bash
   npx expo run:android --variant release
   ```
4. Or use EAS with development profile

### B. Switch to Firebase JS SDK (Stays in Managed Workflow)

1. Uninstall React Native Firebase:
   ```bash
   npm uninstall @react-native-firebase/app @react-native-firebase/auth
   ```

2. Install Firebase JS SDK:
   ```bash
   npm install firebase@10.12.5
   ```

3. Update `src/config/firebase.js` to use JS SDK

4. **Note:** JS SDK phone auth only works in:
   - Expo Go (development)
   - Web builds
   - **NOT in production Android APK** (reCAPTCHA limitation)

## 💡 Best Solution for Your Use Case

Since you need **production Android phone authentication**, you have two options:

1. **Bare workflow** + React Native Firebase ✅ (SMS works in production)
2. **Backend phone verification** (your backend sends SMS, not Firebase)

React Native Firebase SMS authentication REQUIRES bare workflow or development builds.

## 📚 References

- [React Native Firebase Installation](https://rnfirebase.io/)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Firebase JS SDK Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth)
