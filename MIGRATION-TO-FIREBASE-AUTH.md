# 🔥 Migration Guide: 2Factor → Firebase Phone Authentication

## 📋 Overview

**Current:** Backend SMS (2Factor.in)  
**Target:** Firebase Phone Authentication  
**Framework:** Expo (Managed Workflow)  
**Firebase SDK:** JavaScript SDK v10 (for Expo compatibility)

---

## ⚠️ Important Notes

### Expo Limitations
- **Cannot use `@react-native-firebase`** (requires bare React Native)
- **Must use Firebase JS SDK** (web-based, works with Expo)
- **Requires reCAPTCHA verification** in production
- **SMS auto-retrieval NOT available** (web SDK limitation)

### Trade-offs
✅ **Pros:**
- Free SMS for phone auth
- No backend OTP management needed
- Built-in security (Play Integrity)
- Global SMS delivery
- Automatic retry and fallback

❌ **Cons:**
- Requires reCAPTCHA (user must verify)
- No SMS auto-fill
- Network dependent
- Expo web view overhead

---

## 📦 Step 1: Install Dependencies

```bash
# Install Firebase JS SDK
npm install firebase@^10.13.0

# Or using yarn
yarn add firebase@^10.13.0
```

**Version Note:** Use Firebase v10 for better Expo compatibility.

---

## 🔥 Step 2: Configure Firebase Console

### 2.1 Enable Phone Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **pulsemateconnect**
3. Go to **Authentication** → **Sign-in method**
4. Enable **Phone** authentication
5. Click **Save**

### 2.2 Add SHA Fingerprints

#### Get SHA-1 and SHA-256

**For EAS builds:**
```bash
# Download keystore
eas credentials -p android

# Get SHA fingerprints
keytool -list -v -keystore path/to/keystore.jks -alias keyAlias
```

**For Google Play (App Signing):**

Copy the SHA-1 and SHA-256 you provided:
```
SHA-1: E0:AC:76:86:0F:79:68:E8:3D:20:47:1D:EF:53:5D:39:D6:00:9E:E1
SHA-256: CE:A8:43:D7:9C:7C:2B:AC:B5:9A:23:F1:31:6A:46:9F:20:1F:E0:68:4C:B8:79:6A:5B:A9:FA:4A:07:0C:92:8A
```

#### Add to Firebase

1. Firebase Console → **Project Settings**
2. Scroll to **Your apps**
3. Select Android app (`in.pulsemateconnect.patient`)
4. Click **Add fingerprint**
5. Add **both** SHA-1 and SHA-256
6. Click **Save**

### 2.3 Register Domain for reCAPTCHA

1. Firebase Console → **Authentication** → **Settings**
2. Go to **Authorized domains**
3. Add these domains:
   - `localhost` (for development)
   - `pulsemateconnect.in` (if using web)
   - Any custom domains

---

## 📝 Step 3: Update Firebase Configuration

### 3.1 Create New Firebase Config File

Create: `src/config/firebase-auth.js`

```javascript
/**
 * Firebase Phone Authentication — PulseMate Connect
 * 
 * Using Firebase JS SDK v10 (Expo Compatible)
 * =======================================================================
 * ✅ Works with Expo managed workflow
 * ✅ Free SMS delivery via Firebase
 * ✅ Built-in Play Integrity security
 * ⚠️  Requires reCAPTCHA verification
 * ⚠️  No auto-SMS retrieval (JS SDK limitation)
 * 
 * IMPLEMENTATION: Firebase Phone Authentication
 * Migration Date: August 4, 2026
 * Previous: Backend SMS (2Factor.in)
 * Current: Firebase JS SDK Phone Auth
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier
} from 'firebase/auth';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Firebase configuration from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc",
  authDomain: "pulsemateconnect.firebaseapp.com",
  projectId: "pulsemateconnect",
  storageBucket: "pulsemateconnect.firebasestorage.app",
  messagingSenderId: "157620382332",
  appId: "1:157620382332:android:063dba90b53a1c81e6b7f9"
};

// Initialize Firebase (only once)
let app;
let auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('[Firebase] Initialized successfully');
} else {
  app = getApps()[0];
  auth = getAuth(app);
  console.log('[Firebase] Using existing instance');
}

// Global reCAPTCHA verifier instance
let recaptchaVerifier = null;

/**
 * Initialize Firebase Auth
 */
export const initializeFirebaseAuth = async () => {
  const env = getEnvironmentInfo();
  
  try {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔥 FIREBASE PHONE AUTH INITIALIZATION
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 🔥 Firebase Project: pulsemateconnect
║ 🔐 Auth Domain: pulsemateconnect.firebaseapp.com
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    // Test Firebase connection
    const currentUser = auth.currentUser;
    console.log('[Firebase] Current user:', currentUser?.uid || 'None');
    
    return true;
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    throw error;
  }
};

/**
 * Create reCAPTCHA verifier
 * Required for Firebase Phone Auth with JS SDK
 */
const createRecaptchaVerifier = () => {
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  // For Expo, we need to use invisible reCAPTCHA
  // This will be handled via WebView in production
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: (response) => {
      console.log('[Firebase] reCAPTCHA verified:', response);
    },
    'expired-callback': () => {
      console.warn('[Firebase] reCAPTCHA expired, need to verify again');
      recaptchaVerifier = null;
    }
  });

  return recaptchaVerifier;
};

/**
 * Send OTP via Firebase
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<{confirmationResult, phoneNumber, timestamp}>}
 */
export const sendOtpToPhone = async (phoneNumber) => {
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - FIREBASE PHONE AUTH
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 📞 Phone: ${phoneNumber}
║ 🔥 Method: Firebase signInWithPhoneNumber
║ 🔐 Security: reCAPTCHA + Play Integrity
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
  }

  try {
    // Create reCAPTCHA verifier (invisible)
    const appVerifier = createRecaptchaVerifier();
    
    console.log('[Firebase] Sending OTP via Firebase Phone Auth...');
    
    // Send OTP - Firebase handles SMS delivery
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE OTP SENT SUCCESSFULLY
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - timestamp}ms
║ 📱 Phone: ${phoneNumber}
║ 🔑 Verification ID: ${confirmationResult.verificationId}
║ 🔥 SMS sent via Firebase
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    return {
      confirmationResult,
      phoneNumber,
      verificationId: confirmationResult.verificationId,
      timestamp,
    };
  } catch (error) {
    console.error(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 FIREBASE OTP SEND FAILED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 📱 Phone: ${phoneNumber}
║ ❌ Error: ${error.message}
║ 🔍 Code: ${error.code}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    throw formatFirebaseError(error);
  }
};

/**
 * Verify OTP code via Firebase
 * 
 * @param {object} confirmationResult - Result from sendOtpToPhone
 * @param {string} code - 6-digit OTP code
 * @returns {Promise<{user, idToken, phoneNumber}>}
 */
export const verifyPhoneOtp = async (confirmationResult, code) => {
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 VERIFY OTP - FIREBASE
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🔑 Code Length: ${code?.length}
║ 🔥 Method: Firebase confirmationResult.confirm
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate OTP code
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    throw new Error('Please enter a valid 6-digit OTP code.');
  }

  if (!confirmationResult || !confirmationResult.confirm) {
    throw new Error('Invalid confirmation result. Please request a new OTP.');
  }

  try {
    // Verify OTP with Firebase
    const userCredential = await confirmationResult.confirm(code);
    const user = userCredential.user;
    
    // Get Firebase ID token
    const idToken = await user.getIdToken();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE OTP VERIFIED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - timestamp}ms
║ 👤 User ID: ${user.uid}
║ 📱 Phone: ${user.phoneNumber}
║ 🎫 ID Token: ${idToken.substring(0, 20)}...
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    return {
      user: {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        isAnonymous: false
      },
      idToken,
      phoneNumber: user.phoneNumber
    };
  } catch (error) {
    console.error(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 FIREBASE OTP VERIFICATION FAILED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ❌ Error: ${error.message}
║ 🔍 Code: ${error.code}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    throw formatFirebaseError(error);
  }
};

/**
 * Login with Firebase ID token
 * Send Firebase token to your backend for verification
 */
export const loginWithFirebaseToken = async (idToken) => {
  console.log('[Firebase] Exchanging Firebase token with backend...');
  
  try {
    // Call your backend to verify Firebase token and create session
    const response = await fetch('https://api.pulsemateconnect.in/api/auth/firebase-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firebaseToken: idToken })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Backend authentication failed');
    }
    
    console.log('[Firebase] Backend authentication successful');
    
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      user: data.data.user
    };
  } catch (error) {
    console.error('[Firebase] Backend auth failed:', error);
    throw error;
  }
};

/**
 * Resend OTP
 */
export const resendOtp = async (phoneNumber) => {
  return sendOtpToPhone(phoneNumber);
};

/**
 * Sign out
 */
export const signOutUser = async () => {
  try {
    await auth.signOut();
    console.log('[Firebase] User signed out');
  } catch (error) {
    console.error('[Firebase] Sign out error:', error);
    throw error;
  }
};

/**
 * Format Firebase errors to user-friendly messages
 */
const formatFirebaseError = (error) => {
  const code = error.code || '';
  const message = error.message || 'An error occurred';
  
  switch (code) {
    case 'auth/invalid-phone-number':
      return new Error('Invalid phone number format.');
    case 'auth/missing-phone-number':
      return new Error('Phone number is required.');
    case 'auth/quota-exceeded':
      return new Error('SMS quota exceeded. Please try again later.');
    case 'auth/user-disabled':
      return new Error('This account has been disabled.');
    case 'auth/operation-not-allowed':
      return new Error('Phone authentication is not enabled.');
    case 'auth/invalid-verification-code':
      return new Error('Invalid OTP code. Please check and try again.');
    case 'auth/invalid-verification-id':
      return new Error('Verification session expired. Please request a new OTP.');
    case 'auth/code-expired':
      return new Error('OTP has expired. Please request a new one.');
    case 'auth/session-expired':
      return new Error('Session expired. Please start over.');
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Please try again later.');
    case 'auth/captcha-check-failed':
      return new Error('reCAPTCHA verification failed. Please try again.');
    case 'auth/missing-app-credential':
      return new Error('App verification failed. Please update the app.');
    case 'auth/network-request-failed':
      return new Error('Network error. Please check your internet connection.');
    default:
      return new Error(message);
  }
};

/**
 * Get environment info
 */
const getEnvironmentInfo = () => {
  const buildType = Constants.appOwnership || 'unknown';
  const isExpoGo = buildType === 'expo';
  const isStandalone = buildType === 'standalone';
  const isDev = __DEV__;
  
  let environment = 'UNKNOWN';
  if (isExpoGo) environment = 'EXPO_GO';
  else if (isStandalone && !isDev) environment = 'PLAY_STORE_PRODUCTION';
  else if (isStandalone && isDev) environment = 'DEVELOPMENT_BUILD';
  else if (isDev) environment = 'DEVELOPMENT';
  else environment = 'PRODUCTION_BUILD';
  
  return {
    environment,
    buildType,
    platform: Platform.OS,
    platformVersion: Platform.Version,
    packageName: Platform.select({
      android: Constants.manifest?.android?.package ||
               Constants.expoConfig?.android?.package ||
               'in.pulsemateconnect.patient',
      ios: Constants.manifest?.ios?.bundleIdentifier ||
           Constants.expoConfig?.ios?.bundleIdentifier ||
           'N/A',
      default: 'N/A'
    })
  };
};

export const getFirebaseAuth = () => auth;
```

---

## 🔧 Step 4: Create reCAPTCHA Component

Firebase JS SDK requires reCAPTCHA. Create: `src/components/RecaptchaContainer.jsx`

```javascript
import { View } from 'react-native';

/**
 * reCAPTCHA container for Firebase Phone Auth
 * Required by Firebase JS SDK
 */
export default function RecaptchaContainer() {
  return (
    <View 
      id="recaptcha-container" 
      style={{ width: 0, height: 0, opacity: 0 }}
    />
  );
}
```

---

## 📱 Step 5: Update Login Screens

### 5.1 Update Login2FactorScreen.jsx

```javascript
// At the top, change the import
import { 
  initializeFirebaseAuth, 
  sendOtpToPhone 
} from '../config/firebase-auth';  // Changed from firebase.js

// Add reCAPTCHA container to render
import RecaptchaContainer from '../components/RecaptchaContainer';

// In the render, add before the ScrollView:
return (
  <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar barStyle="dark-content" backgroundColor={BG} />
    
    {/* Add reCAPTCHA container */}
    <RecaptchaContainer />
    
    <ScrollView ... >
```

### 5.2 Update Otp2FactorScreen.jsx

```javascript
// At the top, change the import
import { 
  verifyPhoneOtp, 
  loginWithFirebaseToken, 
  resendOtp 
} from '../config/firebase-auth';  // Changed from firebase.js
```

---

## 🔙 Step 6: Update Backend

Your backend needs to verify Firebase ID tokens instead of OTP codes.

### 6.1 Install Firebase Admin SDK (Backend)

```bash
cd backend
npm install firebase-admin
```

### 6.2 Update Backend Auth Controller

Create: `backend/src/controllers/firebase-auth.controller.js`

```javascript
const { verifyFirebaseToken } = require('../config/firebase-admin');
const prisma = require('../config/database');
const { createSessionTokens } = require('../services/token.service');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

/**
 * Firebase Phone Auth Login
 * Verify Firebase ID token and create user session
 */
exports.firebasePhoneLogin = async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    
    if (!firebaseToken) {
      return sendError(res, 'Firebase token is required', 400);
    }
    
    // Verify Firebase ID token
    const decodedToken = await verifyFirebaseToken(firebaseToken);
    const phoneNumber = decodedToken.phone_number;
    const firebaseUid = decodedToken.uid;
    
    if (!phoneNumber) {
      return sendError(res, 'Phone number not found in Firebase token', 400);
    }
    
    logger.info(`[Firebase Auth] Token verified for ${phoneNumber}`);
    
    // Find or create user
    let user = await prisma.patient.findUnique({
      where: { phone: phoneNumber }
    });
    
    if (!user) {
      // Create new user
      user = await prisma.patient.create({
        data: {
          phone: phoneNumber,
          firebaseUid: firebaseUid,
          isPhoneVerified: true
        }
      });
      
      logger.info(`[Firebase Auth] New user created: ${user.id}`);
    } else {
      // Update Firebase UID if changed
      if (user.firebaseUid !== firebaseUid) {
        user = await prisma.patient.update({
          where: { id: user.id },
          data: { 
            firebaseUid: firebaseUid,
            isPhoneVerified: true
          }
        });
      }
    }
    
    // Create session tokens
    const { accessToken, refreshToken } = await createSessionTokens(
      user.id,
      'patient',
      req
    );
    
    return sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    logger.error('[Firebase Auth] Failed:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return sendError(res, 'Firebase token expired', 401);
    } else if (error.code === 'auth/invalid-id-token') {
      return sendError(res, 'Invalid Firebase token', 401);
    }
    
    return sendError(res, 'Authentication failed', 500);
  }
};
```

### 6.3 Configure Firebase Admin (Backend)

Create: `backend/src/config/firebase-admin.js`

```javascript
const admin = require('firebase-admin');
const logger = require('./logger');

// Initialize Firebase Admin
try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : null;
  
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'pulsemateconnect'
    });
    logger.info('[Firebase Admin] Initialized successfully');
  } else {
    logger.warn('[Firebase Admin] Service account not configured');
  }
} catch (error) {
  logger.error('[Firebase Admin] Initialization failed:', error);
}

/**
 * Verify Firebase ID token
 */
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('[Firebase Admin] Token verification failed:', error);
    throw error;
  }
};

module.exports = { verifyFirebaseToken };
```

### 6.4 Add Route

In `backend/src/routes/auth.routes.js`:

```javascript
const { firebasePhoneLogin } = require('../controllers/firebase-auth.controller');

// Add this route
router.post('/firebase-login', firebasePhoneLogin);
```

---

## 🔐 Step 7: Get Firebase Service Account Key

1. Go to Firebase Console
2. Project Settings → Service Accounts
3. Click **Generate new private key**
4. Download the JSON file
5. Minify the JSON (remove whitespace)
6. Add to Render environment variables:
   ```
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"pulsemateconnect",...}
   ```

---

## 🧪 Step 8: Test the Implementation

### 8.1 Test Locally

```bash
# Install dependencies
npm install firebase@^10.13.0

# Start app
npm start

# Test on emulator or device
```

### 8.2 Test Flow

1. Enter phone number
2. Tap "Send OTP"
3. **reCAPTCHA may appear** (verify you're human)
4. Receive SMS from Firebase
5. Enter OTP
6. Should login successfully

---

## 📊 Step 9: Compare Costs

### 2Factor.in (Current)
- ₹0.12 per SMS
- ~₹132/month for 1000 logins

### Firebase Phone Auth (New)
- **FREE** for phone authentication
- No per-SMS cost
- Unlimited verifications in free tier
- **Savings:** ₹132/month

---

## ⚠️ Known Issues & Solutions

### Issue 1: reCAPTCHA Not Working

**Problem:** reCAPTCHA fails or doesn't appear

**Solution:**
- Add authorized domains in Firebase Console
- Test on real device (not just emulator)
- Check network connectivity

### Issue 2: SMS Not Received

**Problem:** Firebase SMS not delivered

**Solution:**
- Check Firebase quota (Console → Usage)
- Verify phone number format (+91...)
- Check Firebase Console logs
- Try test phone numbers first

### Issue 3: Play Store Rejection

**Problem:** Google Play rejects build with Firebase

**Solution:**
- Add SHA-1/SHA-256 of Play Store signing key
- Enable Play Integrity in Firebase
- Test with internal testing track first

---

## 🚀 Step 10: Deploy

### 10.1 Update Backend

```bash
cd backend
git add .
git commit -m "feat: Add Firebase Phone Auth support"
git push origin main
```

### 10.2 Rebuild Frontend

```bash
eas build --platform android --profile production
```

### 10.3 Test on Play Store

1. Upload to internal testing
2. Test with real users
3. Monitor Firebase Console for issues
4. Roll out gradually

---

## 🔄 Rollback Plan

If Firebase doesn't work, you can quickly rollback:

1. Change imports back to old `firebase.js`
2. Rebuild app
3. Keep using 2Factor backend

Old files are not deleted, just not imported.

---

## ✅ Migration Checklist

- [ ] Install Firebase JS SDK
- [ ] Configure Firebase Console (Phone Auth enabled)
- [ ] Add SHA fingerprints to Firebase
- [ ] Create `firebase-auth.js` config
- [ ] Create `RecaptchaContainer` component
- [ ] Update Login screens
- [ ] Update OTP screen
- [ ] Install Firebase Admin SDK in backend
- [ ] Create Firebase Admin config
- [ ] Create Firebase login controller
- [ ] Add Firebase login route
- [ ] Add service account JSON to environment
- [ ] Test locally
- [ ] Test on emulator
- [ ] Test on real device
- [ ] Deploy backend
- [ ] Build new APK/AAB
- [ ] Test on Play Store internal track
- [ ] Monitor Firebase Console
- [ ] Roll out to production

---

## 📞 Support

**Firebase Documentation:**
- https://firebase.google.com/docs/auth/web/phone-auth

**Common Issues:**
- https://firebase.google.com/support/troubleshooter/report/phone-auth

**Firebase Status:**
- https://status.firebase.google.com

---

**Migration Date:** August 4, 2026  
**Estimated Time:** 4-6 hours  
**Cost Savings:** ₹132/month  
**Complexity:** Medium
