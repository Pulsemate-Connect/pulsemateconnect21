/**
 * PRODUCTION FIREBASE PHONE AUTHENTICATION
 * Using React Native Firebase (Native Modules)
 * 
 * ✅ Works in Production Android APK/AAB
 * ✅ No reCAPTCHA popup (uses Play Integrity)
 * ✅ Automatic SMS retrieval
 * ✅ Native performance
 * 
 * Installation: @react-native-firebase/app and @react-native-firebase/auth
 * These are NATIVE modules that integrate with Android properly
 */

// Note: React Native Firebase is imported ONLY when actually used
// This prevents build errors if the native modules aren't linked yet

let auth = null;
let isInitialized = false;

/**
 * Lazy initialization of Firebase Auth
 * Only imports React Native Firebase when actually needed
 */
const getFirebaseAuth = async () => {
  if (isInitialized && auth) {
    return auth;
  }

  try {
    console.log('[Firebase Production] Initializing React Native Firebase Auth...');
    
    // Dynamic import to prevent build errors
    const firebaseAuth = require('@react-native-firebase/auth').default;
    
    auth = firebaseAuth();
    isInitialized = true;
    
    console.log('[Firebase Production] ✅ React Native Firebase Auth initialized');
    console.log('[Firebase Production] Auth instance:', typeof auth);
    
    return auth;
  } catch (error) {
    console.error('[Firebase Production] ❌ Failed to initialize:', error);
    throw new Error(`Firebase Auth initialization failed: ${error.message}`);
  }
};

/**
 * Initialize Firebase Phone Authentication
 */
export const initializeFirebaseAuth = async () => {
  try {
    console.log('[Firebase Production] Starting initialization...');
    
    const authInstance = await getFirebaseAuth();
    
    console.log('[Firebase Production] ✅ Ready for Phone Authentication');
    console.log('[Firebase Production] Current user:', authInstance.currentUser?.uid || 'None');
    
    return authInstance;
  } catch (error) {
    console.error('[Firebase Production] ❌ Initialization error:', error);
    throw error;
  }
};

/**
 * Send OTP to phone number using Firebase Phone Authentication
 * 
 * @param {string} phoneNumber - Phone in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<{confirmation, phoneNumber, verificationId, timestamp}>}
 */
export const sendOtpToPhone = async (phoneNumber) => {
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - FIREBASE PHONE AUTH (PRODUCTION)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 📞 Phone: ${phoneNumber}
║ 🔥 Method: React Native Firebase (Native)
║ 🔐 Security: Play Integrity (No reCAPTCHA)
║ 📦 Platform: Android Production
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate phone number format
  if (!phoneNumber || !/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
    throw new Error('Invalid phone number. Use E.164 format: +91XXXXXXXXXX');
  }

  try {
    const authInstance = await getFirebaseAuth();
    
    console.log('[Firebase Production] Calling signInWithPhoneNumber...');
    console.log('[Firebase Production] Phone:', phoneNumber);
    
    // Call Firebase Phone Authentication
    // This uses Play Integrity (no reCAPTCHA needed on Android)
    const confirmation = await authInstance.signInWithPhoneNumber(phoneNumber);
    
    console.log('[Firebase Production] ✅ OTP sent successfully');
    console.log('[Firebase Production] Verification ID:', confirmation.verificationId);
    console.log('[Firebase Production] SMS should arrive in 10-30 seconds');

    return {
      confirmation,
      confirmationResult: confirmation, // For compatibility
      phoneNumber,
      verificationId: confirmation.verificationId,
      timestamp,
    };
  } catch (error) {
    console.error('[Firebase Production] ❌ Failed to send OTP:', error);
    console.error('[Firebase Production] Error code:', error.code);
    console.error('[Firebase Production] Error message:', error.message);
    
    // Format user-friendly error messages
    throw formatFirebaseError(error);
  }
};

/**
 * Verify OTP code
 * 
 * @param {object} confirmation - Confirmation result from sendOtpToPhone
 * @param {string} code - 6-digit OTP code
 * @param {number} sentTimestamp - When OTP was sent (optional)
 * @returns {Promise<{user, idToken, phoneNumber}>}
 */
export const verifyPhoneOtp = async (confirmation, code, sentTimestamp = null) => {
  const timestamp = Date.now();
  const timeSinceSent = sentTimestamp ? (timestamp - sentTimestamp) / 1000 : 'unknown';
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 VERIFY OTP - FIREBASE PHONE AUTH (PRODUCTION)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🔑 Code Length: ${code?.length}
║ ⏱️  Time Since OTP Sent: ${timeSinceSent} seconds
║ 🔥 Method: React Native Firebase (Native)
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate OTP code
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    throw new Error('Please enter a valid 6-digit OTP code.');
  }

  if (!confirmation || !confirmation.confirm) {
    throw new Error('Invalid confirmation result. Please request a new OTP.');
  }

  try {
    console.log('[Firebase Production] Verifying OTP with Firebase...');
    
    // Verify OTP with Firebase
    const credential = await confirmation.confirm(code);
    const user = credential.user;
    
    console.log('[Firebase Production] ✅ OTP verified successfully');
    console.log('[Firebase Production] User UID:', user.uid);
    console.log('[Firebase Production] Phone:', user.phoneNumber);
    
    // Get Firebase ID token
    const idToken = await user.getIdToken();
    
    console.log('[Firebase Production] ✅ ID Token obtained');
    console.log('[Firebase Production] Token length:', idToken.length);

    return {
      user,
      idToken,
      phoneNumber: user.phoneNumber,
      uid: user.uid,
    };
  } catch (error) {
    console.error('[Firebase Production] ❌ OTP verification failed:', error);
    console.error('[Firebase Production] Error code:', error.code);
    console.error('[Firebase Production] Error message:', error.message);
    
    throw formatFirebaseError(error);
  }
};

/**
 * Exchange Firebase ID token for backend JWT tokens
 * 
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<{accessToken, refreshToken, user}>}
 */
export const loginWithFirebaseToken = async (idToken) => {
  console.log('[Firebase Production] Exchanging Firebase token with backend...');
  
  try {
    const api = require('../api/axios').default;
    
    const response = await api.post('/auth/patient/firebase-phone-login', {
      firebaseIdToken: idToken
    });
    
    const data = response.data?.data ?? response.data;
    
    console.log('[Firebase Production] ✅ Backend authentication successful');
    console.log('[Firebase Production] User ID:', data.user?.id);
    console.log('[Firebase Production] Has access token:', !!data.accessToken);
    console.log('[Firebase Production] Has refresh token:', !!data.refreshToken);
    
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    };
  } catch (error) {
    console.error('[Firebase Production] ❌ Backend auth failed:', error.message);
    throw new Error('Failed to authenticate with backend. Please try again.');
  }
};

/**
 * Resend OTP
 */
export const resendOtp = async (phoneNumber) => {
  console.log('[Firebase Production] Resending OTP...');
  return sendOtpToPhone(phoneNumber);
};

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  try {
    const authInstance = await getFirebaseAuth();
    await authInstance.signOut();
    console.log('[Firebase Production] ✅ User signed out');
  } catch (error) {
    console.error('[Firebase Production] ❌ Sign out error:', error);
    throw error;
  }
};

/**
 * Format Firebase errors to user-friendly messages
 */
const formatFirebaseError = (error) => {
  const code = error.code || '';
  const message = error.message || 'An error occurred';
  
  const errorMessages = {
    'auth/invalid-phone-number': 'Invalid phone number format.',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'Phone authentication is not enabled.',
    'auth/invalid-verification-code': 'Invalid OTP code. Please check and try again.',
    'auth/invalid-verification-id': 'Verification session expired. Please request a new OTP.',
    'auth/code-expired': 'OTP has expired. Please request a new one.',
    'auth/session-expired': 'Session expired. Please start over.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
  };
  
  const friendlyMessage = errorMessages[code] || message;
  const err = new Error(friendlyMessage);
  err.code = code;
  
  return err;
};

// Export auth getter for compatibility
export { getFirebaseAuth };
