/**
 * Backend Phone Authentication — PulseMate Connect
 * 
 * Backend SMS Implementation (No Firebase Dependency)
 * =======================================================================
 * ✅ Works in ALL environments (Development, Production, EAS builds)
 * ✅ Sends REAL SMS OTP via backend service
 * ✅ Full control over SMS delivery
 * ✅ No reCAPTCHA needed
 * ✅ No Firebase native module issues
 * 
 * IMPLEMENTATION: Backend SMS Service
 * Migration Date: 2026-08-02
 * Previous: React Native Firebase (Native) - Had compatibility issues
 * Current: Backend SMS API
 */

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
║ 🔴 BACKEND SMS ERROR - ${context}
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${timestamp}
║ 🌍 Environment: ${env.environment}
║ 📦 Build Type: ${env.buildType}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 🆔 Package: ${env.packageName}
║ 📦 App Version: ${env.appVersion} (Build: ${env.nativeBuildVersion})
║ 🔧 Expo SDK: ${env.expoSdkVersion}
║ 🖥️  Device: ${env.deviceName}
║ 🔥 Implementation: Backend SMS Service
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
║ ✅ BACKEND SMS SUCCESS - ${context}
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${timestamp}
║ 🌍 Environment: ${env.environment}
║ 📦 Build Type: ${env.buildType}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 🆔 Package: ${env.packageName}
║ 📦 App Version: ${env.appVersion} (Build: ${env.nativeBuildVersion})
║ 🔥 Implementation: Backend SMS Service
${Object.keys(details).length > 0 ? `║ 
║ 📋 Details:
${JSON.stringify(details, null, 2).split('\n').map(line => '║    ' + line).join('\n')}` : ''}
╚═══════════════════════════════════════════════════════════════════════════════
`);
};

/**
 * Initialize Backend SMS Auth (No Firebase needed)
 */
export const initializeFirebaseAuth = async () => {
  const env = getEnvironmentInfo();
  
  try {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔧 BACKEND SMS INITIALIZATION
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
║ 🔥 Implementation: Backend SMS Service (No Firebase)
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    console.log('[Auth] ✅ Backend SMS Auth ready');
    console.log('[Auth] 📡 Backend API:', api.defaults.baseURL);
    
    logSuccess('BACKEND SMS INITIALIZATION', {
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'Backend SMS Service',
      hasBackendAPI: !!api.defaults.baseURL
    });
    
    return true;
  } catch (error) {
    logError('BACKEND SMS INITIALIZATION', error, {
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'Backend SMS Service'
    });
    
    let detailedMessage = `Backend SMS initialization failed.\n\n`;
    detailedMessage += `Environment: ${env.environment}\n`;
    detailedMessage += `Package: ${env.packageName}\n`;
    detailedMessage += `Error: ${error.message || 'Unknown error'}\n`;
    
    throw new Error(detailedMessage);
  }
};

/**
 * Send OTP via Backend SMS Service
 * 
 * Calls your backend API to send SMS OTP
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<{requestId, phoneNumber, timestamp}>}
 */
export const sendOtpToPhone = async (phoneNumber) => {
  const env = getEnvironmentInfo();
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - STARTING (Backend SMS)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Build Type: ${env.buildType}
║ 🆔 Package: ${env.packageName}
║ 📱 Platform: ${env.platform} ${env.platformVersion}
║ 🔥 Implementation: Backend SMS Service
║ 
║ 📞 Phone Number: ${phoneNumber}
║ 🔐 Verification: Backend SMS (No Firebase)
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate phone number
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    const error = new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
    logError('SEND OTP - VALIDATION (Backend SMS)', error, {
      phoneNumber,
      phoneNumberLength: phoneNumber?.length,
      environment: env.environment
    });
    throw error;
  }

  try {
    console.log('[Auth] ✅ Using Backend SMS Service');
    console.log('[Auth] 📡 Calling backend API: /auth/patient/send-otp');
    
    // ═══════════════════════════════════════════════════════════════
    // DEBUGGING: Log request details
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 [API-DEBUG-1] Phone number being sent:', phoneNumber);
    console.log('🔍 [API-DEBUG-1] Request body:', JSON.stringify({ phone: phoneNumber }));
    console.log('🔍 [API-DEBUG-1] API base URL:', api.defaults.baseURL);
    console.log('🔍 [API-DEBUG-1] Full endpoint:', `${api.defaults.baseURL}/auth/patient/send-otp`);
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🚀 CALLING Backend API: /auth/patient/send-otp
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 📱 Phone: ${phoneNumber}
║ 🔐 Method: Backend SMS Service
║ 📦 Platform: ${env.platform} ${env.platformVersion}
║ 📤 Request Body: ${JSON.stringify({ phone: phoneNumber })}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    const response = await api.post('/auth/patient/send-otp', {
      phone: phoneNumber  // Backend expects 'phone', not 'phoneNumber'
    });
    
    // ═══════════════════════════════════════════════════════════════
    // DEBUGGING: Log response
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 [API-DEBUG-2] Response status:', response.status);
    console.log('🔍 [API-DEBUG-2] Response data:', JSON.stringify(response.data, null, 2));
    
    const data = response.data?.data ?? response.data;
    const requestId = data.requestId || data.verificationId || 'backend-request';
    
    logSuccess('SEND OTP - Backend API SUCCESS', {
      phoneNumber,
      requestId,
      hasRequestId: !!requestId,
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'Backend SMS Service',
      timeTaken: `${Date.now() - timestamp}ms`
    });

    return {
      confirmationResult: { requestId }, // For compatibility with existing code
      phoneNumber,
      verificationId: requestId,
      requestId: requestId,
      timestamp,
    };
  } catch (error) {
    // ═══════════════════════════════════════════════════════════════
    // DEBUGGING: Log error details
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 [API-DEBUG-3] API Error:', error);
    console.log('🔍 [API-DEBUG-3] Error response:', error.response?.data);
    console.log('🔍 [API-DEBUG-3] Error status:', error.response?.status);
    console.log('🔍 [API-DEBUG-3] Error message:', error.message);
    
    logError('SEND OTP - Backend API FAILED', error, {
      phoneNumber,
      environment: env.environment,
      packageName: env.packageName,
      platform: env.platform,
      platformVersion: env.platformVersion,
      expoSdkVersion: env.expoSdkVersion,
      implementation: 'Backend SMS Service',
      timeSinceStart: `${Date.now() - timestamp}ms`,
      errorResponse: error.response?.data
    });

    // Provide user-friendly error messages
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again in 15 minutes.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Invalid phone number format.');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
      throw new Error('Cannot reach server. Please check your internet connection.');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};

/**
 * Verify OTP code via Backend
 */
export const verifyPhoneOtp = async (confirmResult, code, sentTimestamp = null) => {
  const env = getEnvironmentInfo();
  const verifyTimestamp = Date.now();
  const timeSinceSent = sentTimestamp ? (verifyTimestamp - sentTimestamp) / 1000 : 'unknown';
  
  const requestId = confirmResult?.requestId || confirmResult?.verificationId || 'backend-request';
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 VERIFY OTP - STARTING (Backend SMS)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(verifyTimestamp).toISOString()}
║ 🌍 Environment: ${env.environment}
║ 📦 Package: ${env.packageName}
║ 🔥 Implementation: Backend SMS Service
║ 
║ 🔑 Code Length: ${code?.length || 0}
║ 🔑 Code Format: ${/^\d{6}$/.test(code) ? 'VALID' : 'INVALID'}
║ ⏱️  Time Since OTP Sent: ${timeSinceSent} seconds
║ 📋 Request ID: ${requestId}
╚═══════════════════════════════════════════════════════════════════════════════
`);

  if (!requestId) {
    const error = new Error('No OTP request found. Please send OTP first.');
    logError('VERIFY OTP - NO REQUEST ID (Backend SMS)', error, {
      environment: env.environment,
      packageName: env.packageName
    });
    throw error;
  }

  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    const error = new Error('Please enter a valid 6-digit OTP code.');
    logError('VERIFY OTP - INVALID CODE FORMAT (Backend SMS)', error, {
      codeLength: code?.length,
      codeProvided: !!code,
      environment: env.environment
    });
    throw error;
  }

  try {
    console.log('[Auth] 🔑 Calling backend API: /auth/patient/verify-otp');
    console.log('[Auth] ⏱️  Time elapsed since OTP sent:', timeSinceSent, 'seconds');
    
    const response = await api.post('/auth/patient/verify-otp', {
      requestId: requestId,
      otp: code
    });
    
    const data = response.data?.data ?? response.data;
    
    console.log('[Auth] ✅ OTP verification successful (Backend SMS)');
    console.log('[Auth] 👤 User:', data.user?.id || 'N/A');
    console.log('[Auth] 🎫 Token received:', !!data.accessToken);

    logSuccess('VERIFY OTP - COMPLETE (Backend SMS)', {
      userId: data.user?.id,
      phoneNumber: data.user?.phone,
      hasToken: !!data.accessToken,
      timeSinceSent: `${timeSinceSent}s`,
      totalVerificationTime: `${Date.now() - verifyTimestamp}ms`,
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'Backend SMS Service'
    });

    return {
      user: data.user,
      idToken: data.accessToken, // For compatibility
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      phoneNumber: data.user?.phone,
    };
  } catch (error) {
    logError('VERIFY OTP - Backend API FAILED', error, {
      codeLength: code?.length,
      timeSinceSent: `${timeSinceSent}s`,
      environment: env.environment,
      packageName: env.packageName,
      implementation: 'Backend SMS Service',
      errorResponse: error.response?.data
    });

    if (error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Invalid OTP code. Please check and try again.');
    } else if (error.response?.status === 410) {
      throw new Error('OTP code expired. Please request a new one.');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error.message || 'OTP verification failed');
  }
};

/**
 * Login with backend (already handled in verifyPhoneOtp)
 * This function is kept for compatibility
 */
export const loginWithFirebaseToken = async (idToken, name = null) => {
  // Already handled in verifyPhoneOtp
  // Backend returns accessToken + user directly
  return {
    accessToken: idToken,
    user: { name }
  };
};

/**
 * Resend OTP to the same phone number (Backend SMS)
 */
export const resendOtp = async (phoneNumber) => {
  return sendOtpToPhone(phoneNumber);
};

/**
 * Sign out current user (Clear local session)
 */
export const signOutUser = async () => {
  try {
    console.log('[Auth] ✅ User signed out (Backend SMS)');
    // Local sign out - clear tokens handled by auth context
  } catch (error) {
    console.error('[Auth] ❌ Sign out error (Backend SMS):', error.message);
    throw error;
  }
};

// Keep getFirebaseAuth for compatibility
export const getFirebaseAuth = () => {
  return null; // No Firebase auth instance
};
