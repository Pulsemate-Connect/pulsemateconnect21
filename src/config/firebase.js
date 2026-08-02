/**
 * Firebase Phone Authentication — PulseMate Connect (React Native Firebase)
 * 
 * NATIVE Production Implementation with React Native Firebase
 * =======================================================================
 * ✅ Uses @react-native-firebase/auth (Native implementation)
 * ✅ Sends REAL SMS OTP to ANY valid phone number
 * ✅ Works on production Android builds
 * ✅ Works with EAS Build
 * ✅ Native Firebase integration (no web SDK)
 * ✅ Automatic Play Integrity verification (no reCAPTCHA needed)
 * ✅ Comprehensive production logging maintained
 * 
 * MIGRATION COMPLETE: 2026-08-02
 * Previous: Firebase JavaScript SDK v10.12.5
 * Current: React Native Firebase (Native)
 */

import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from '../api/axios';

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
║ 🔥 Firebase: React Native Firebase (Native)
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
║ 🔥 Firebase: React Native Firebase (Native)
${Object.keys(details).length > 0 ? `║ 
║ 📋 Details:
${JSON.stringify(details, null, 2).split('\n').map(line => '║    ' + line).join('\n')}` : ''}
╚═══════════════════════════════════════════════════════════════════════════════
`);
};

/**
 * Initialize Firebase Auth (React Native Firebase auto-initializes)
 */
export const initializeFirebaseAuth = async () => {
  const env = getEnvironmentInfo();
  
  try {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔧 FIREBASE INITIALIZATION STARTING (Native)
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
║ 🔥 Implementation: React Native Firebase (Native)
║ 
║ 📱 Firebase Native Check:
║ ├─ Auth Module: ${auth ? 'LOADED' : 'NOT_LOADED'}
║ ├─ Current User: ${auth().currentUser ? auth().currentUser.uid : 'None'}
║ ├─ App Name: ${auth().app.name || 'UNKNOWN'}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    // React Native Firebase auto-initializes from google-services.json
    const currentUser = auth().currentUser;
    console.log('[Auth] ✅ Firebase Native Auth ready');
    console.log('[Auth] 👤 Current User:', currentUser ? currentUser.uid : 'None (not logged in)');
    
    logSuccess('FIREBASE INITIALIZATION (Native)', {
      hasAuth: !!auth,
      currentUser: currentUser ? currentUser.uid : null,
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'React Native Firebase (Native)'
    });
    
    return auth;
  } catch (error) {
    logError('FIREBASE INITIALIZATION (Native)', error, {
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'React Native Firebase (Native)'
    });
    
    let detailedMessage = `Firebase initialization failed.\n\n`;
    detailedMessage += `Environment: ${env.environment}\n`;
    detailedMessage += `Package: ${env.packageName}\n`;
    detailedMessage += `Error: ${error.message || 'Unknown error'}\n`;
    if (error.code) detailedMessage += `Code: ${error.code}\n`;
    if (!__DEV__) {
      detailedMessage += `\nPlease check:\n`;
      detailedMessage += `1. Internet connection\n`;
      detailedMessage += `2. google-services.json file\n`;
      detailedMessage += `3. Firebase project configuration\n`;
    }
    
    throw new Error(detailedMessage);
  }
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  return auth;
};

/**
 * Send OTP via Firebase Native Phone Authentication
 * 
 * Uses native Firebase authentication - NO reCAPTCHA needed
 * Automatically uses Play Integrity API on Android
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<{confirmationResult, phoneNumber, verificationId, timestamp}>}
 */
export const sendOtpToPhone = async (phoneNumber) => {
  const env = getEnvironmentInfo();
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - STARTING (Native)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Build Type: ${env.buildType}
║ 🆔 Package: ${env.packageName}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 🔥 Implementation: React Native Firebase (Native)
║ 
║ 📞 Phone Number: ${phoneNumber}
║ 🔐 Verification: Native Play Integrity (No reCAPTCHA)
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    const error = new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
    logError('SEND OTP - VALIDATION (Native)', error, {
      phoneNumber,
      phoneNumberLength: phoneNumber?.length,
      environment: env.environment
    });
    throw error;
  }

  try {
    console.log('[Auth] ✅ Using React Native Firebase native auth');
    console.log('[Auth] 🔐 Native verification (Play Integrity API)');
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🚀 CALLING auth().signInWithPhoneNumber (Native)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 📱 Phone: ${phoneNumber}
║ 🔐 Method: Native Firebase Auth
║ 📦 Platform: ${env.platform} ${env.platformVersion}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    const confirmationResult = await auth().signInWithPhoneNumber(phoneNumber);
    
    const verificationId = confirmationResult?.verificationId || 'unknown';
    
    logSuccess('SEND OTP - signInWithPhoneNumber SUCCESS (Native)', {
      phoneNumber,
      verificationId,
      hasConfirmationResult: !!confirmationResult,
      confirmationResultType: typeof confirmationResult,
      hasConfirmMethod: typeof confirmationResult?.confirm === 'function',
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'React Native Firebase (Native)',
      timeTaken: `${Date.now() - timestamp}ms`
    });

    return {
      confirmationResult,
      phoneNumber,
      verificationId,
      timestamp,
    };
  } catch (error) {
    logError('SEND OTP - signInWithPhoneNumber FAILED (Native)', error, {
      phoneNumber,
      environment: env.environment,
      packageName: env.packageName,
      platform: env.platform,
      platformVersion: env.platformVersion,
      expoSdkVersion: env.expoSdkVersion,
      implementation: 'React Native Firebase (Native)',
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
    }

    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};

/**
 * Verify OTP code and complete phone authentication (Native)
 */
export const verifyPhoneOtp = async (confirmResult, code, sentTimestamp = null) => {
  const env = getEnvironmentInfo();
  const verifyTimestamp = Date.now();
  const timeSinceSent = sentTimestamp ? (verifyTimestamp - sentTimestamp) / 1000 : 'unknown';
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 VERIFY OTP - STARTING (Native)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(verifyTimestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 🔥 Implementation: React Native Firebase (Native)
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
    logError('VERIFY OTP - NO CONFIRM RESULT (Native)', error, {
      environment: env.environment,
      packageName: env.packageName
    });
    throw error;
  }

  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    const error = new Error('Please enter a valid 6-digit OTP code.');
    logError('VERIFY OTP - INVALID CODE FORMAT (Native)', error, {
      codeLength: code?.length,
      codeProvided: !!code,
      environment: env.environment
    });
    throw error;
  }

  try {
    console.log('[Auth] 🔑 Calling confirmResult.confirm() (Native)...');
    console.log('[Auth] ⏱️  Time elapsed since OTP sent:', timeSinceSent, 'seconds');
    
    const userCredential = await confirmResult.confirm(code);
    
    console.log('[Auth] ✅ OTP verification successful (Native)');
    console.log('[Auth] 👤 User UID:', userCredential.user?.uid);
    console.log('[Auth] 📱 Phone Number:', userCredential.user?.phoneNumber);

    console.log('[Auth] 🎫 Getting Firebase ID token (Native)...');
    const idToken = await userCredential.user.getIdToken();
    console.log('[Auth] ✅ Firebase ID token obtained (Native)');
    console.log('[Auth] 🎫 Token length:', idToken?.length || 0);

    logSuccess('VERIFY OTP - COMPLETE (Native)', {
      userUid: userCredential.user?.uid,
      phoneNumber: userCredential.user?.phoneNumber,
      hasIdToken: !!idToken,
      idTokenLength: idToken?.length,
      timeSinceSent: `${timeSinceSent}s`,
      totalVerificationTime: `${Date.now() - verifyTimestamp}ms`,
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'React Native Firebase (Native)'
    });

    return {
      user: userCredential.user,
      idToken,
      phoneNumber: userCredential.user.phoneNumber,
    };
  } catch (error) {
    logError('VERIFY OTP - CONFIRM FAILED (Native)', error, {
      codeLength: code?.length,
      timeSinceSent: `${timeSinceSent}s`,
      environment: env.environment,
      packageName: env.packageName,
      hasConfirmResult: !!confirmResult,
      confirmResultType: typeof confirmResult,
      implementation: 'React Native Firebase (Native)'
    });

    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP code. Please check and try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP code expired. Please request a new one.');
    } else if (error.code === 'auth/session-expired') {
      throw new Error('Session expired. Please request a new OTP.');
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
║ 🔄 BACKEND LOGIN - STARTING (Native Firebase)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 🔥 Implementation: React Native Firebase (Native)
║ 
║ 🎫 Has ID Token: ${!!idToken}
║ 🎫 Token Length: ${idToken?.length || 0}
║ 👤 Name Provided: ${name || 'N/A'}
╚═══════════════════════════════════════════════════════════════════════════════
`);

  if (!idToken) {
    const error = new Error('Firebase ID token is required.');
    logError('BACKEND LOGIN - NO TOKEN (Native)', error, {
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
      logError('BACKEND LOGIN - INVALID RESPONSE (Native)', error, {
        hasData: !!data,
        hasAccessToken: !!data?.accessToken,
        hasUser: !!data?.user,
        responseData: JSON.stringify(data),
        environment: env.environment
      });
      throw error;
    }

    logSuccess('BACKEND LOGIN - SUCCESS (Native)', {
      hasAccessToken: !!data.accessToken,
      hasRefreshToken: !!data.refreshToken,
      userId: data.user?.id,
      userRole: data.user?.role,
      environment: env.environment,
      implementation: 'React Native Firebase (Native)',
      timeTaken: `${Date.now() - timestamp}ms`
    });

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: data.user,
    };
  } catch (err) {
    logError('BACKEND LOGIN - REQUEST FAILED (Native)', err, {
      errorCode: err.code,
      errorResponse: err.response?.data,
      errorStatus: err.response?.status,
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'React Native Firebase (Native)'
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
 * Resend OTP to the same phone number (Native)
 */
export const resendOtp = async (phoneNumber) => {
  return sendOtpToPhone(phoneNumber);
};

/**
 * Sign out current user from Firebase (Native)
 */
export const signOutUser = async () => {
  try {
    await auth().signOut();
    console.log('[Auth] ✅ User signed out (Native)');
  } catch (error) {
    console.error('[Auth] ❌ Sign out error (Native):', error.message);
    throw error;
  }
};
