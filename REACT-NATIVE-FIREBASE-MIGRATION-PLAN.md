# 🔥 React Native Firebase Migration - Complete Plan

**Migration Type:** Firebase JS SDK → React Native Firebase  
**Date:** August 4, 2026  
**Status:** IN PROGRESS

---

## 📋 Migration Checklist

### Phase 1: Remove Firebase JS SDK & 2Factor.in ✅
- [x] Remove `firebase` package
- [x] Remove `firebase-auth.js` (JS SDK implementation)
- [x] Remove `RecaptchaContainer.jsx` (not needed with native)
- [ ] Remove 2Factor.in service files
- [ ] Remove 2Factor.in backend endpoints
- [ ] Remove 2Factor.in environment variables

### Phase 2: Install React Native Firebase 🔄
- [ ] Install `@react-native-firebase/app`
- [ ] Install `@react-native-firebase/auth`
- [ ] Configure Android gradle files
- [ ] Rebuild native code

### Phase 3: Frontend Implementation 📱
- [ ] Create new `firebase-native.js` config
- [ ] Update `LoginScreen.jsx`
- [ ] Update `Login2FactorScreen.jsx`
- [ ] Update `Otp2FactorScreen.jsx`
- [ ] Remove all Firebase JS SDK imports
- [ ] Add proper error handling

### Phase 4: Backend Updates 🔧
- [ ] Keep Firebase Admin SDK (already installed)
- [ ] Update `/auth/patient/firebase-phone-login` endpoint
- [ ] Remove 2Factor endpoints
- [ ] Test token verification

### Phase 5: Testing ✅
- [ ] Test OTP sending
- [ ] Test OTP verification
- [ ] Test session creation
- [ ] Test on emulator
- [ ] Build development APK
- [ ] Build production AAB
- [ ] Test on real device

### Phase 6: Cleanup 🧹
- [ ] Remove unused dependencies
- [ ] Remove old documentation files
- [ ] Update README
- [ ] Git commit and push

---

## 🎯 Key Differences: JS SDK vs React Native Firebase

| Feature | Firebase JS SDK (Old) | React Native Firebase (New) |
|---------|----------------------|----------------------------|
| **Module Type** | Web SDK | Native Module |
| **reCAPTCHA** | Required | Not Required |
| **SMS Auto-fill** | No | Yes (Android SMS Retriever API) |
| **Performance** | Slower | Faster (native) |
| **Expo Compatibility** | Managed workflow | Development build only |
| **Bundle Size** | Larger | Smaller |

---

## 📝 Files to Create

1. `src/config/firebase-native.js` - React Native Firebase config
2. `REACT-NATIVE-FIREBASE-SETUP.md` - Setup documentation

---

## 📝 Files to Modify

### Frontend:
1. `package.json` - Dependencies
2. `android/build.gradle` - Project gradle
3. `android/app/build.gradle` - App gradle
4. `src/screens/LoginScreen.jsx`
5. `src/screens/Login2FactorScreen.jsx`
6. `src/screens/Otp2FactorScreen.jsx`

### Backend:
1. `backend/src/routes/auth.routes.js` - Remove 2Factor routes
2. `backend/src/controllers/auth.controller.js` - Remove 2Factor handlers

---

## 📝 Files to Delete

### Frontend:
1. `src/config/firebase-auth.js` (Firebase JS SDK)
2. `src/components/RecaptchaContainer.jsx`
3. All old Firebase documentation files

### Backend:
1. `backend/src/services/twofactor.service.js`
2. `backend/src/services/sms.service.js` (if 2Factor specific)

---

## 🔧 Implementation Details

### Step 1: Install React Native Firebase

```bash
npm install @react-native-firebase/app@latest
npm install @react-native-firebase/auth@latest
```

### Step 2: Configure Android

**android/build.gradle:**
```gradle
buildscript {
    dependencies {
        classpath('com.google.gms:google-services:4.4.0')
    }
}
```

**android/app/build.gradle:**
```gradle
apply plugin: 'com.google.gms.google-services'
```

### Step 3: Create Firebase Config

**src/config/firebase-native.js:**
```javascript
import auth from '@react-native-firebase/auth';

export const sendOtpToPhone = async (phoneNumber) => {
  const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
  return confirmation;
};

export const verifyPhoneOtp = async (confirmation, code) => {
  const credential = await confirmation.confirm(code);
  const idToken = await credential.user.getIdToken();
  return { idToken, user: credential.user };
};
```

### Step 4: Update Login Screens

Replace Firebase JS SDK imports with React Native Firebase:

```javascript
// OLD (Firebase JS SDK)
import { sendOtpToPhone } from '../config/firebase-auth';

// NEW (React Native Firebase)
import { sendOtpToPhone } from '../config/firebase-native';
```

---

## ⚠️ Breaking Changes

1. **No reCAPTCHA needed** - Native verification is automatic
2. **Different confirmation object** - React Native Firebase returns native confirmation
3. **Auto SMS retrieval** - Works automatically on Android
4. **Requires rebuild** - Native code changes require full rebuild

---

## 🎯 Success Criteria

- [ ] No Firebase JS SDK code remaining
- [ ] No 2Factor.in code remaining
- [ ] React Native Firebase working
- [ ] OTP sent via native Firebase
- [ ] OTP verified successfully
- [ ] Backend token verification working
- [ ] Session created correctly
- [ ] App works on emulator
- [ ] App works on real device
- [ ] Production build successful

---

## 📊 Estimated Timeline

- Phase 1 (Remove old): 30 minutes
- Phase 2 (Install new): 15 minutes
- Phase 3 (Frontend): 1 hour
- Phase 4 (Backend): 30 minutes
- Phase 5 (Testing): 1 hour
- Phase 6 (Cleanup): 30 minutes

**Total:** ~3-4 hours

---

## 🚨 Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Build failures | Keep backup of working code |
| Native module issues | Follow React Native Firebase docs exactly |
| SHA key issues | Use correct Play Store SHA keys |
| Testing delays | Test incrementally after each phase |

---

**Next Step:** Execute Phase 1 - Remove Firebase JS SDK & 2Factor.in

