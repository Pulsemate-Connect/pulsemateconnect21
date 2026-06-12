# Unified Firebase OTP Solution for Web & Mobile App

## 🎯 Objective
Use **Firebase Phone Authentication** to send the **SAME OTP** to both the mobile app and web platform, eliminating the need for separate custom OTP systems.

## Current Architecture Analysis

### ✅ What's Already Working

**Web (Frontend)**:
- Firebase JS SDK configured (`firebaseAuth.js`)
- RecaptchaVerifier for web verification
- OTP send/verify flow implemented
- Firebase ID token sent to backend

**Mobile App**:
- React Native with Expo
- Firebase package installed
- Ready for Firebase Phone Auth integration

**Backend**:
- Firebase Admin SDK configured
- `verifyFirebaseToken()` method available
- `firebase-phone-verification.repository.js` for storing verification records
- Endpoints for clinic owner & doctor Firebase phone verification


### ⚠️ What Needs to Be Done

**Patient Login Flow**:
- Currently uses custom OTP service (`otp.service.js`)
- Need to migrate to Firebase Phone Auth
- Both web and app should use Firebase

**SMS Format**:
- Firebase automatically sends OTP via SMS
- For Web OTP API auto-fill, we need custom SMS templates
- Firebase doesn't support custom SMS templates by default

---

## 🏗️ Implementation Plan

### Phase 1: Backend - Add Patient Firebase Phone Login

Create a new endpoint that accepts Firebase ID tokens from both web and mobile app.


#### Step 1.1: Add Patient Firebase Phone Login Endpoint

**File**: `backend/src/controllers/auth.controller.js`

Add this new handler:

```javascript
/**
 * POST /api/auth/patient/firebase-phone-login
 *
 * Patient login using Firebase Phone Auth (supports both web & mobile app).
 * Frontend (web/app) performs OTP via Firebase, sends the Firebase ID token here.
 * Backend verifies the token, extracts phone, creates/logs in patient.
 */
const patientFirebasePhoneLoginHandler = async (req, res, next) => {
  try {
    const { firebaseIdToken, name } = req.body;

    // ── 1. Verify Firebase token ───────────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseIdToken);
    } catch (firebaseError) {
      if (firebaseError.status === 503) {
        return sendError(res, 'Firebase Auth is not configured. Contact support.', 503);
      }
      return sendError(res, 'Invalid or expired Firebase token. Please try again.', 401);
    }

    // ── 2. Extract phone from trusted token ─────────────────────────────────
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return sendError(res, 'No phone number in Firebase token. Use Phone Auth provider.', 400);
    }
    const mobile = normalizeMobileNumber(rawPhone);
    if (!mobile || !/^\+[1-9]\d{9,14}$/.test(mobile)) {
      return sendError(res, 'Invalid phone number format in Firebase token.', 400);
    }

    // ── 3. Find or create patient ─────────────────────────────────────────
    let user = await prisma.user.findUnique({
      where: { mobile },
      include: baseUserInclude,
    });

    let isNewUser = false;
    if (!user) {
      // Create new patient
      user = await prisma.user.create({
        data: {
          mobile,
          name: name || null,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          firebaseUid: decoded.uid,
          authProvider: 'FIREBASE_PHONE',
          patientProfile: { create: {} },
        },
        include: baseUserInclude,
      });
      isNewUser = true;

    } else if (user.role !== 'PATIENT') {
      return sendError(res, 'This phone belongs to a staff account. Use staff login.', 403);
    } else {
      // Existing patient - update login time and name if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          lastLoginAt: new Date(),
          firebaseUid: decoded.uid,
          authProvider: 'FIREBASE_PHONE',
          ...(name && !user.name ? { name } : {}),
        },
        include: baseUserInclude,
      });
    }

    // ── 4. Issue JWT tokens ───────────────────────────────────────────────
    const tokens = await issueAuthTokens(res, user, req);
    
    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'PATIENT_REGISTERED_FIREBASE' : 'PATIENT_LOGIN_FIREBASE',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        user: { ...toAuthUser(user), isNewUser },
      },
      isNewUser ? 'Patient account created successfully' : 'Login successful'
    );
  } catch (error) {
    next(error);
  }
};
```

#### Step 1.2: Add Route for Patient Firebase Login

**File**: `backend/src/routes/auth.routes.js`

Add this route:

```javascript
router.post('/patient/firebase-phone-login', patientFirebasePhoneLoginHandler);
```

Export the handler in `auth.controller.js`:

```javascript
module.exports = {
  // ... existing exports
  patientFirebasePhoneLoginHandler,
};
```

---

### Phase 2: Mobile App - Implement Firebase Phone Auth


#### Step 2.1: Create Firebase Config

**File**: `PulseMateApp/src/config/firebase.js`

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Use same Firebase project as web
const firebaseConfig = {
  apiKey: "AIzaSyDrZ9d0zKBLI_Pm-c9o1DAV5q4ldE1I9Nw",
  authDomain: "pulsemateconnect.firebaseapp.com",
  projectId: "pulsemateconnect",
  messagingSenderId: "157620382332",
  appId: "1:157620382332:android:YOUR_ANDROID_APP_ID", // Get from Firebase Console
  // For iOS: appId: "1:157620382332:ios:YOUR_IOS_APP_ID"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

export const auth = getAuth(app);
export default app;
```

**Important**: Register your React Native app in Firebase Console:
1. Go to Firebase Console → Project Settings
2. Add Android app (use package name from `app.json`)
3. Add iOS app (use bundle ID from `app.json`)
4. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)


#### Step 2.2: Create Firebase Auth Service

**File**: `PulseMateApp/src/api/firebaseAuth.js`

```javascript
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Send OTP to phone via Firebase (mobile uses native reCAPTCHA)
 * 
 * @param {string} phoneNumber - E.164 format (e.g., "+917022818878")
 * @returns {Promise<string>} - verificationId to use in verifyOtp
 */
export const sendOtpToPhone = async (phoneNumber) => {
  try {
    const phoneProvider = new PhoneAuthProvider(auth);
    
    // On mobile, reCAPTCHA is handled automatically by Firebase
    const verificationId = await phoneProvider.verifyPhoneNumber(
      phoneNumber,
      // For React Native, we don't need a reCAPTCHA verifier
      // Firebase handles it natively
    );
    
    return verificationId;
  } catch (error) {
    throw new Error(getErrorMessage(error.code));
  }
};

/**
 * Verify OTP and get Firebase ID token
 * 
 * @param {string} verificationId - From sendOtpToPhone
 * @param {string} code - 6-digit OTP entered by user
 * @returns {Promise<string>} - Firebase ID token to send to backend
 */
export const verifyOtp = async (verificationId, code) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await signInWithCredential(auth, credential);
    const idToken = await userCredential.user.getIdToken();
    return idToken;
  } catch (error) {
    throw new Error(getErrorMessage(error.code));
  }
};

const getErrorMessage = (code) => {
  const errors = {
    'auth/invalid-phone-number': 'Invalid phone number format',
    'auth/too-many-requests': 'Too many attempts. Try again later',
    'auth/invalid-verification-code': 'Invalid OTP. Please check the code',
    'auth/code-expired': 'OTP expired. Request a new one',
    'auth/session-expired': 'Session expired. Request a new OTP',
    'auth/quota-exceeded': 'SMS quota exceeded. Try again later',
  };
  return errors[code] || `Authentication error: ${code}`;
};
```


#### Step 2.3: Update API Service

**File**: `PulseMateApp/src/api/auth.js` (or wherever you have auth API calls)

```javascript
import axios from './axios'; // Your configured axios instance

export const patientLoginFirebase = async (firebaseIdToken, name = null) => {
  const response = await axios.post('/auth/patient/firebase-phone-login', {
    firebaseIdToken,
    ...(name && { name }),
  });
  return response.data;
};
```

#### Step 2.4: Update Login Screen

**File**: `PulseMateApp/src/screens/auth/LoginScreen.js` (example)

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { sendOtpToPhone, verifyOtp } from '../../api/firebaseAuth';
import { patientLoginFirebase } from '../../api/auth';

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      // Format phone to E.164 (e.g., "+917022818878")
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const vid = await sendOtpToPhone(formattedPhone);
      setVerificationId(vid);
      Alert.alert('Success', 'OTP sent to your phone');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      // 1. Verify OTP with Firebase and get ID token
      const firebaseIdToken = await verifyOtp(verificationId, otp);
      
      // 2. Send Firebase token to our backend
      const response = await patientLoginFirebase(firebaseIdToken);
      
      // 3. Store JWT token and navigate to app
      // await AsyncStorage.setItem('accessToken', response.data.accessToken);
      // navigation.navigate('Home');
      
      Alert.alert('Success', 'Login successful!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>Login with Phone</Text>
      
      {!verificationId ? (
        <>
          <TextInput
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Button title="Send OTP" onPress={handleSendOtp} disabled={loading} />
        </>
      ) : (
        <>
          <TextInput
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button title="Verify OTP" onPress={handleVerifyOtp} disabled={loading} />
        </>
      )}
    </View>
  );
};

export default LoginScreen;
```

---


### Phase 3: Web - Update to Use Unified Backend Endpoint

Your web app is already using Firebase! Just need to update the API endpoint.

#### Step 3.1: Update Web Auth API

**File**: `frontend/src/api/auth.api.js`

The `firebasePhoneLogin` function is already there! Just ensure it's being used in the login page.

Update if needed:

```javascript
export const firebasePhoneLogin = (firebaseIdToken, name = undefined) =>
  api.post('/auth/patient/firebase-phone-login', { 
    firebaseIdToken, 
    ...(name ? { name } : {}) 
  });
```

---

### Phase 4: Web OTP Auto-Fill Support

Firebase default SMS doesn't include the Web OTP format. You have two options:


#### Option A: Use Firebase Default SMS (Recommended for MVP)

**Pros**:
- ✅ Works out of the box
- ✅ No additional setup
- ✅ Same OTP for web and mobile

**Cons**:
- ❌ No Web OTP auto-fill support
- ❌ Users must manually type OTP on web

**Firebase SMS Format**:
```
Your verification code is: 123456

For PulseMate Connect
```

Users can still copy-paste, but no auto-fill.

---

#### Option B: Custom SMS with Twilio/MSG91 (For Web OTP Auto-Fill)

**Pros**:
- ✅ Web OTP auto-fill works
- ✅ Custom branding
- ✅ Better UX on web

**Cons**:
- ❌ Requires Twilio/MSG91 setup
- ❌ Additional cost
- ❌ More complex: Firebase for app, custom SMS for web


**Implementation**:

1. **Keep Firebase for mobile app** (native SMS sending)
2. **Add custom SMS service for web** with Web OTP format:

```javascript
// backend/src/services/sms.service.js
const sendWebOtpSms = async (mobile, otp) => {
  const smsBody = `Your PulseMate OTP is: ${otp}. Valid for 5 minutes.

@pulsemate.com #${otp}`;
  
  // Use Twilio or MSG91 to send
  await twilioClient.messages.create({
    body: smsBody,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: mobile,
  });
};
```

3. **Backend logic**:
   - Detect if request is from web or mobile (via user-agent or explicit header)
   - For mobile: Use Firebase SMS
   - For web: Use custom SMS with Web OTP format

---


## 📋 Complete Implementation Checklist

### Backend Changes

- [ ] Add `patientFirebasePhoneLoginHandler` in `auth.controller.js`
- [ ] Add route `/auth/patient/firebase-phone-login` in `auth.routes.js`
- [ ] Export handler in `auth.controller.js`
- [ ] Test endpoint with Postman/Thunder Client

### Mobile App Changes

- [ ] Install Firebase: `expo install firebase`
- [ ] Create `PulseMateApp/src/config/firebase.js`
- [ ] Register Android app in Firebase Console
- [ ] Register iOS app in Firebase Console
- [ ] Download `google-services.json` and add to project
- [ ] Download `GoogleService-Info.plist` and add to project
- [ ] Create `PulseMateApp/src/api/firebaseAuth.js`
- [ ] Update login screen to use Firebase OTP
- [ ] Test on real device (OTP won't work on emulator without setup)

### Web Changes

- [ ] Verify `firebasePhoneLogin` API call exists in `auth.api.js`
- [ ] Update login page to call `/auth/patient/firebase-phone-login`
- [ ] Test Firebase OTP flow on web


### Firebase Console Setup

- [ ] Enable Phone Authentication in Firebase Console
- [ ] Add test phone numbers for development (Settings → Phone Auth)
- [ ] Set up SHA-1 certificate for Android app
- [ ] Configure APNs for iOS app
- [ ] Set up App Check (optional, for security)

### Testing

- [ ] Test patient registration on web with Firebase OTP
- [ ] Test patient login on web with Firebase OTP
- [ ] Test patient registration on mobile app
- [ ] Test patient login on mobile app
- [ ] Verify same OTP works on both platforms
- [ ] Test existing patient migration (custom OTP → Firebase)

---

## 🚀 Benefits of This Solution

1. **Unified Authentication**: Same Firebase OTP for web and mobile
2. **No Double OTP Systems**: Eliminates custom `otp.service.js` for patients
3. **Cost Effective**: Firebase includes free SMS quota
4. **Scalable**: Firebase handles SMS delivery globally
5. **Secure**: Firebase Admin SDK validates tokens server-side
6. **Better UX**: Native SMS integration on mobile


---

## 🔧 Troubleshooting

### Mobile App Issues

**Problem**: "No reCAPTCHA token provided"
- **Solution**: Make sure Firebase app is registered in console and config files are added

**Problem**: "This app is not authorized to use Firebase Authentication"
- **Solution**: Check SHA-1 certificate is added in Firebase Console (Android)

**Problem**: "SMS not received on device"
- **Solution**: Add test phone number in Firebase Console for development

### Web Issues

**Problem**: "reCAPTCHA has already been rendered"
- **Solution**: Call `forceResetRecaptcha()` before initializing
- Already handled in your `firebaseAuth.js`

**Problem**: "Firebase token verification failed"
- **Solution**: Check Firebase service account JSON is correct in `.env`

---

## 📌 Migration Strategy

### For Existing Users (Currently Using Custom OTP)

Users who signed up with custom OTP can seamlessly migrate to Firebase:

1. On next login, user enters phone number
2. System checks if user exists
3. Firebase sends OTP
4. After verification, update user record:
   - Set `firebaseUid = decoded.uid`
   - Set `authProvider = 'FIREBASE_PHONE'`
5. User is now migrated to Firebase auth

**No data loss, seamless transition!**

---

## 🎯 Recommended Approach

**Start with Option A (Firebase Default SMS)** for the following reasons:

1. ✅ Faster implementation (no Twilio/MSG91 setup)
2. ✅ Same OTP for web and mobile (your primary goal)
3. ✅ Works perfectly on mobile (auto-reads SMS)
4. ✅ Firebase free tier includes 10K SMS/month
5. ⚠️ Web users type OTP manually (acceptable tradeoff for MVP)

**Later, add Option B** if Web OTP auto-fill becomes a priority:
- Can be added incrementally
- Only affects web platform
- Mobile continues using Firebase natively

---

## 📚 Additional Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Admin SDK - Verify ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [React Native Firebase](https://rnfirebase.io/)
- [Web OTP API](https://web.dev/web-otp/)

---

## ✅ Summary

This solution gives you:
- **Same OTP** sent by Firebase to both web and mobile
- **Unified backend** endpoint for both platforms
- **Scalable** and **cost-effective** SMS delivery
- **Easy migration** path for existing users

Start with Firebase default SMS, then add Web OTP auto-fill later if needed!
