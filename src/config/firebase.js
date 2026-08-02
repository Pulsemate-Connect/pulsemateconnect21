/**
 * Firebase Phone Authentication — PulseMate Connect (Expo)
 * 
 * Production Implementation with Firebase JavaScript SDK v10 (Optimized)
 * =======================================================================
 * ✅ Uses Firebase JavaScript SDK v10.12.5 (stable, smaller bundle)
 * ✅ Sends REAL SMS OTP to ANY valid phone number
 * ✅ Works on production Android builds
 * ✅ Works with EAS Build
 * ✅ Optimized imports to reduce bundle size
 * ✅ Detailed error logging for production debugging
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPhoneNumber } from 'firebase/auth';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from '../api/axios';
import { firebaseConfig } from './firebaseConfig';

let firebaseApp = null;
let firebaseAuth = null;

/**
 * Get detailed environment information for logging
 */
const getEnvironmentInfo = () => {
  const buildType = Constants.appOwnership || 'unknown';
  const isExpoGo = buildType === 'expo';
  const isStandalone = buildType === 'standalone';
  const isDev = __DEV__;
  
  let environment = 'UNKNOWN';
  if (isExpoGo) {
    environment = 'EXPO_GO';
  } else if (isStandalone && !isDev) {
    environment = 'PLAY_STORE_PRODUCTION';
  } else if (isStandalone && isDev) {
    environment = 'DEVELOPMENT_BUILD';
  } else if (isDev) {
    environment = 'DEVELOPMENT';
  } else {
    environment = 'PRODUCTION_BUILD';
  }
  
  return {
    environment,
    buildType,
    isExpoGo,
    isStandalone,
    isDevelopment: isDev,
    platform: Platform.OS,
    platformVersion: Platform.Version,
    expoVersion: Constants.expoVersion || 'N/A',
    expoSdkVersion: Constants.manifest?.sdkVersion || Constants.expoConfig?.sdkVersion || 'N/A',
    appVersion: Constants.manifest?.version || Constants.expoConfig?.version || 'N/A',
    nativeAppVersion: Constants.nativeAppVersion || 'N/A',
    nativeBuildVersion: Constants.nativeBuildVersion || 'N/A',
    deviceName: Constants.deviceName || 'N/A',
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

/**
 * Enhanced error logging with full details
 */
const logError = (context, error, additionalInfo = {}) => {
  const timestamp = new Date().toISOString();
  const env = getEnvironmentInfo();
  
  console.error(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 FIREBASE ERROR - ${context}
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${timestamp}
║ 🌍 Environment: ${env.environment}
║ 📦 Build Type: ${env.buildType}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 🆔 Package: ${env.packageName}
║ 📦 App Version: ${env.appVersion} (Build: ${env.nativeBuildVersion})
║ 🔧 Expo SDK: ${env.expoSdkVersion}
║ 🖥️  Device: ${env.deviceName}
║ 
║ ❌ ERROR DETAILS:
║ ├─ Name: ${error.name || 'N/A'}
║ ├─ Code: ${error.code || 'N/A'}
║ ├─ Message: ${error.message || 'N/A'}
║ 
║ 📚 Stack Trace:
${error.stack ? error.stack.split('\n').map(line => '║    ' + line).join('\n') : '║    N/A'}
║ 
║ 🔍 Full Error Object:
${JSON.stringify(error, Object.getOwnPropertyNames(error), 2).split('\n').map(line => '║    ' + line).join('\n')}
${Object.keys(additionalInfo).length > 0 ? `║ 
║ 📋 Additional Info:
${JSON.stringify(additionalInfo, null, 2).split('\n').map(line => '║    ' + line).join('\n')}` : ''}
╚═══════════════════════════════════════════════════════════════════════════════
`);
};

/**
 * Enhanced success logging
 */
const logSuccess = (context, details = {}) => {
  const timestamp = new Date().toISOString();
  const env = getEnvironmentInfo();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE SUCCESS - ${context}
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${timestamp}
║ 🌍 Environment: ${env.environment}
║ 📦 Build Type: ${env.buildType}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 🆔 Package: ${env.packageName}
║ 📦 App Version: ${env.appVersion} (Build: ${env.nativeBuildVersion})
${Object.keys(details).length > 0 ? `║ 
║ 📋 Details:
${JSON.stringify(details, null, 2).split('\n').map(line => '║    ' + line).join('\n')}` : ''}
╚═══════════════════════════════════════════════════════════════════════════════
`);
};

/**
 * Initialize Firebase Auth (call once at app start)
 */
export const initializeFirebaseAuth = async () => {
  if (firebaseAuth) return firebaseAuth;
  
  const env = getEnvironmentInfo();
  
  try {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔧 FIREBASE INITIALIZATION STARTING
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Build Type: ${env.buildType}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 🆔 Package: ${env.packageName}
║ 📦 App Version: ${env.appVersion}
║ 🏗️  Build Version: ${env.nativeBuildVersion}
║ 🔧 Expo SDK: ${env.expoSdkVersion}
║ 🔧 Expo Version: ${env.expoVersion}
║ 🖥️  Device: ${env.deviceName}
║ 
║ � Firebase Config Check:
║ ├─ Config Loaded: ${firebaseConfig ? 'YES' : 'NO'}
║ ├─ API Key Present: ${firebaseConfig?.apiKey ? 'YES' : 'NO'}
║ ├─ Project ID: ${firebaseConfig?.projectId || 'MISSING'}
║ ├─ Auth Domain: ${firebaseConfig?.authDomain || 'MISSING'}
║ ├─ App ID: ${firebaseConfig?.appId || 'MISSING'}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    // Initialize Firebase app if not already initialized
    if (getApps().length === 0) {
      console.log('[Auth] 🔄 Initializing new Firebase app...');
      firebaseApp = initializeApp(firebaseConfig);
      console.log('[Auth] ✅ Firebase app initialized successfully');
    } else {
      firebaseApp = getApps()[0];
      console.log('[Auth] ♻️  Using existing Firebase app');
    }
    
    console.log('[Auth] 📱 Firebase App Name:', firebaseApp?.name || 'UNKNOWN');
    
    // Get Auth instance
    console.log('[Auth] 🔐 Getting Firebase Auth instance...');
    firebaseAuth = getAuth(firebaseApp);
    console.log('[Auth] ✅ Firebase Auth instance obtained');
    
    const currentUser = firebaseAuth?.currentUser;
    console.log('[Auth] � Current User:', currentUser ? currentUser.uid : 'None (not logged in)');
    
    logSuccess('FIREBASE INITIALIZATION', {
      appName: firebaseApp?.name,
      hasAuth: !!firebaseAuth,
      currentUser: currentUser ? currentUser.uid : null,
      environment: env.environment,
      packageName: env.packageName
    });
    
    return firebaseAuth;
  } catch (error) {
    logError('FIREBASE INITIALIZATION', error, {
      firebaseConfigPresent: !!firebaseConfig,
      appsLength: getApps().length,
      environment: env.environment,
      packageName: env.packageName
    });
    
    let detailedMessage = `Firebase initialization failed.\n\n`;
    detailedMessage += `Environment: ${env.environment}\n`;
    detailedMessage += `Package: ${env.packageName}\n`;
    detailedMessage += `Error: ${error.message || 'Unknown error'}\n`;
    if (error.code) detailedMessage += `Code: ${error.code}\n`;
    if (!__DEV__) {
      detailedMessage += `\nPlease check:\n`;
      detailedMessage += `1. Internet connection\n`;
      detailedMessage += `2. Firebase configuration\n`;
      detailedMessage += `3. google-services.json file\n`;
    }
    
    throw new Error(detailedMessage);
  }
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  if (!firebaseAuth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebaseAuth() first.');
  }
  return firebaseAuth;
};

/**
 * Send OTP via Firebase Phone Authentication
 * 
 * Automatically creates invisible reCAPTCHA verifier when none provided
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @param {RecaptchaVerifier|null} recaptchaVerifier - From FirebaseRecaptchaVerifierModal.current (or null for auto)
 * @returns {Promise<{confirmationResult, phoneNumber, verificationId, timestamp}>}
 */
export const sendOtpToPhone = async (phoneNumber, recaptchaVerifier) => {
  const env = getEnvironmentInfo();
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - STARTING
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Build Type: ${env.buildType}
║ 🆔 Package: ${env.packageName}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 
║ 📞 Phone Number: ${phoneNumber}
║ 🔐 RecaptchaVerifier Provided: ${recaptchaVerifier ? 'YES' : 'NO'}
║ 🔐 RecaptchaVerifier Type: ${recaptchaVerifier?.constructor?.name || 'N/A'}
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    const error = new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
    logError('SEND OTP - VALIDATION', error, {
      phoneNumber,
      phoneNumberLength: phoneNumber?.length,
      environment: env.environment
    });
    throw error;
  }

  try {
    const auth = getFirebaseAuth();
    console.log('[Auth] ✅ Firebase Auth instance retrieved');
    console.log('[Auth] 🔑 Auth state:', auth ? 'READY' : 'NOT_READY');
    
    // If no recaptcha verifier provided, create an invisible one
    let verifier = recaptchaVerifier;
    if (!verifier) {
      console.log('[Auth] 🔐 No verifier provided, creating invisible reCAPTCHA...');
      console.log('[Auth] 🌍 Environment for verifier:', env.environment);
      console.log('[Auth] � Platform for verifier:', env.platform);
      
      try {
        // Import RecaptchaVerifier dynamically
        const { RecaptchaVerifier } = await import('firebase/auth');
        console.log('[Auth] ✅ RecaptchaVerifier imported successfully');
        
        // Create invisible reCAPTCHA (will use native Play Integrity on Android)
        console.log('[Auth] 🔐 Creating RecaptchaVerifier with container: recaptcha-container');
        verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (response) => {
            console.log('[Auth] ✅ reCAPTCHA callback triggered');
            console.log('[Auth] 📝 Response present:', response ? 'YES' : 'NO');
            console.log('[Auth] 📝 Response length:', response?.length || 0);
          },
          'expired-callback': () => {
            console.warn('[Auth] ⚠️  reCAPTCHA expired - will need to retry');
          }
        });
        console.log('[Auth] ✅ RecaptchaVerifier created successfully');
        console.log('[Auth] 🔐 Verifier type:', verifier?.constructor?.name);
        console.log('[Auth] 🔐 Verifier has render:', typeof verifier?.render);
      } catch (verifierError) {
        logError('RECAPTCHA VERIFIER CREATION', verifierError, {
          environment: env.environment,
          platform: env.platform,
          packageName: env.packageName
        });
        throw verifierError;
      }
    } else {
      console.log('[Auth] 🔐 Using provided reCAPTCHA verifier');
      console.log('[Auth] 🔐 Verifier type:', verifier?.constructor?.name);
    }
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🚀 CALLING signInWithPhoneNumber
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 📱 Phone: ${phoneNumber}
║ 🔐 Verifier: ${verifier?.constructor?.name || 'NONE'}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 🔧 Auth ready: ${auth ? 'YES' : 'NO'}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    
    const verificationId = confirmationResult?.verificationId || 'unknown';
    
    logSuccess('SEND OTP - signInWithPhoneNumber SUCCESS', {
      phoneNumber,
      verificationId,
      hasConfirmationResult: !!confirmationResult,
      confirmationResultType: typeof confirmationResult,
      hasConfirmMethod: typeof confirmationResult?.confirm === 'function',
      environment: env.environment,
      packageName: env.packageName,
      timeTaken: `${Date.now() - timestamp}ms`
    });

    return {
      confirmationResult,
      phoneNumber,
      verificationId,
      timestamp,
    };
  } catch (error) {
    logError('SEND OTP - signInWithPhoneNumber FAILED', error, {
      phoneNumber,
      hasRecaptchaVerifier: !!recaptchaVerifier,
      verifierType: recaptchaVerifier?.constructor?.name,
      environment: env.environment,
      packageName: env.packageName,
      platform: env.platform,
      platformVersion: env.platformVersion,
      expoSdkVersion: env.expoSdkVersion,
      timeSinceStart: `${Date.now() - timestamp}ms`
    });

    // Provide user-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again in 15 minutes.');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please contact support.');
    } else if (error.code === 'auth/invalid-app-credential') {
      throw new Error('App verification failed. SHA-256 not registered or incorrect.');
    } else if (error.code === 'auth/app-not-authorized') {
      throw new Error('App not authorized. Please add SHA-256 to Firebase Console.');
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA verification failed. Please try again.');
    }

    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};

/**
 * Verify OTP code and complete phone authentication
 */
export const verifyPhoneOtp = async (confirmResult, code, sentTimestamp = null) => {
  const env = getEnvironmentInfo();
  const verifyTimestamp = Date.now();
  const timeSinceSent = sentTimestamp ? (verifyTimestamp - sentTimestamp) / 1000 : 'unknown';
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 VERIFY OTP - STARTING
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(verifyTimestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 
║ 🔑 Code Length: ${code?.length || 0}
║ 🔑 Code Format: ${/^\d{6}$/.test(code) ? 'VALID' : 'INVALID'}
║ ⏱️  Time Since OTP Sent: ${timeSinceSent} seconds
║ 📋 Has ConfirmResult: ${!!confirmResult}
║ 📋 ConfirmResult Type: ${typeof confirmResult}
║ 📋 Has Confirm Method: ${typeof confirmResult?.confirm === 'function'}
╚═══════════════════════════════════════════════════════════════════════════════
`);

  if (!confirmResult) {
    const error = new Error('No OTP request found. Please send OTP first.');
    logError('VERIFY OTP - NO CONFIRM RESULT', error, {
      environment: env.environment,
      packageName: env.packageName
    });
    throw error;
  }

  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    const error = new Error('Please enter a valid 6-digit OTP code.');
    logError('VERIFY OTP - INVALID CODE FORMAT', error, {
      codeLength: code?.length,
      codeProvided: !!code,
      environment: env.environment
    });
    throw error;
  }

  try {
    console.log('[Auth] 🔑 Calling confirmResult.confirm()...');
    console.log('[Auth] ⏱️  Time elapsed since OTP sent:', timeSinceSent, 'seconds');
    
    const userCredential = await confirmResult.confirm(code);
    
    console.log('[Auth] ✅ OTP verification successful');
    console.log('[Auth] 👤 User UID:', userCredential.user?.uid);
    console.log('[Auth] 📱 Phone Number:', userCredential.user?.phoneNumber);

    console.log('[Auth] 🎫 Getting Firebase ID token...');
    const idToken = await userCredential.user.getIdToken();
    console.log('[Auth] ✅ Firebase ID token obtained');
    console.log('[Auth] 🎫 Token length:', idToken?.length || 0);

    logSuccess('VERIFY OTP - COMPLETE', {
      userUid: userCredential.user?.uid,
      phoneNumber: userCredential.user?.phoneNumber,
      hasIdToken: !!idToken,
      idTokenLength: idToken?.length,
      timeSinceSent: `${timeSinceSent}s`,
      totalVerificationTime: `${Date.now() - verifyTimestamp}ms`,
      environment: env.environment,
      packageName: env.packageName
    });

    return {
      user: userCredential.user,
      idToken,
      phoneNumber: userCredential.user.phoneNumber,
    };
  } catch (error) {
    logError('VERIFY OTP - CONFIRM FAILED', error, {
      codeLength: code?.length,
      timeSinceSent: `${timeSinceSent}s`,
      environment: env.environment,
      packageName: env.packageName,
      hasConfirmResult: !!confirmResult,
      confirmResultType: typeof confirmResult
    });

    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP code. Please check and try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP code expired. Please request a new one.');
    }

    throw new Error(error.message || 'OTP verification failed');
  }
};

/**
 * Send Firebase ID token to backend for session creation
 */
export const loginWithFirebaseToken = async (idToken, name = null) => {
  const env = getEnvironmentInfo();
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔄 BACKEND LOGIN - STARTING
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 
║ 🎫 Has ID Token: ${!!idToken}
║ 🎫 Token Length: ${idToken?.length || 0}
║ 👤 Name Provided: ${name || 'N/A'}
╚═══════════════════════════════════════════════════════════════════════════════
`);

  if (!idToken) {
    const error = new Error('Firebase ID token is required.');
    logError('BACKEND LOGIN - NO TOKEN', error, {
      environment: env.environment
    });
    throw error;
  }

  try {
    console.log('[Auth] 🔄 Sending login request to backend...');
    console.log('[Auth] 🌐 API endpoint: /auth/patient/firebase-phone-login');

    const res = await api.post('/auth/patient/firebase-phone-login', {
      firebaseIdToken: idToken,
      name: name && name.trim().length >= 2 ? name.trim() : 'Patient',
    });

    const data = res.data?.data ?? res.data;

    if (!data?.accessToken || !data?.user) {
      const error = new Error('Session creation failed: Invalid server response');
      logError('BACKEND LOGIN - INVALID RESPONSE', error, {
        hasData: !!data,
        hasAccessToken: !!data?.accessToken,
        hasUser: !!data?.user,
        responseData: JSON.stringify(data),
        environment: env.environment
      });
      throw error;
    }

    logSuccess('BACKEND LOGIN - SUCCESS', {
      hasAccessToken: !!data.accessToken,
      hasRefreshToken: !!data.refreshToken,
      userId: data.user?.id,
      userRole: data.user?.role,
      environment: env.environment,
      timeTaken: `${Date.now() - timestamp}ms`
    });

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: data.user,
    };
  } catch (err) {
    logError('BACKEND LOGIN - REQUEST FAILED', err, {
      errorCode: err.code,
      errorResponse: err.response?.data,
      errorStatus: err.response?.status,
      environment: env.environment,
      packageName: env.packageName
    });
    
    if (err.code === 'ECONNREFUSED') {
      throw new Error('Cannot reach server. Please check your internet connection.');
    } else if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }

    throw new Error(err.message || 'Login failed. Please try again.');
  }
};

/**
 * Resend OTP to the same phone number
 */
export const resendOtp = async (phoneNumber, recaptchaVerifier) => {
  return sendOtpToPhone(phoneNumber, recaptchaVerifier);
};

/**
 * Sign out current user from Firebase
 */
export const signOutUser = async () => {
  try {
    const auth = getFirebaseAuth();
    await auth.signOut();
    console.log('[Auth] ✅ User signed out');
  } catch (error) {
    console.error('[Auth] ❌ Sign out error:', error.message);
    throw error;
  }
};
