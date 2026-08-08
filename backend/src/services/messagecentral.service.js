/**
 * Message Central VerifyNow OTP Service - DIAGNOSTIC MODE
 * 
 * Handles all interactions with Message Central API for OTP verification
 * Credentials are stored in environment variables and NEVER exposed to frontend
 * 
 * Enhanced with comprehensive diagnostics for debugging token generation issues
 */

const axios = require('axios');

const BASE_URL = process.env.MESSAGE_CENTRAL_BASE_URL || 'https://cpaas.messagecentral.com';
const CUSTOMER_ID = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;
const PASSWORD = process.env.MESSAGE_CENTRAL_PASSWORD;
const EMAIL = process.env.MESSAGE_CENTRAL_EMAIL;

// In-memory cache for auth tokens
// TODO: Use Redis in production for distributed systems
let authTokenCache = {
  token: null,
  expiresAt: null
};

/**
 * STEP 2: Inspect and validate environment variables
 */
function validateEnvironmentVariables() {
  const report = {
    customerId: {
      present: !!CUSTOMER_ID,
      length: CUSTOMER_ID?.length || 0,
      starts: CUSTOMER_ID?.substring(0, 10) || 'N/A',
      ends: CUSTOMER_ID?.substring(CUSTOMER_ID.length - 10) || 'N/A',
      containsSpaces: CUSTOMER_ID?.includes(' ') || false,
      containsNewlines: CUSTOMER_ID?.includes('\n') || CUSTOMER_ID?.includes('\r') || false,
      containsTabs: CUSTOMER_ID?.includes('\t') || false,
      containsQuotes: CUSTOMER_ID?.includes('"') || CUSTOMER_ID?.includes("'") || false,
      containsPeriods: CUSTOMER_ID?.includes('.') || false,
    },
    password: {
      present: !!PASSWORD,
      length: PASSWORD?.length || 0,
      starts: PASSWORD?.substring(0, 10) || 'N/A',
      ends: PASSWORD?.substring(PASSWORD.length - 10) || 'N/A',
      containsSpaces: PASSWORD?.includes(' ') || false,
      containsNewlines: PASSWORD?.includes('\n') || PASSWORD?.includes('\r') || false,
      containsTabs: PASSWORD?.includes('\t') || false,
      containsQuotes: PASSWORD?.includes('"') || PASSWORD?.includes("'") || false,
      containsPeriods: PASSWORD?.includes('.') || false,
    },
    baseUrl: {
      value: BASE_URL,
      valid: BASE_URL?.startsWith('http') || false,
    }
  };
  
  console.log('[MessageCentral] 📋 ENVIRONMENT VALIDATION REPORT:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}

/**
 * STEP 3: Determine credential type
 */
function detectCredentialType(credential) {
  if (!credential) {
    return { type: 'MISSING', valid: false, reason: 'Credential is null or undefined' };
  }
  
  // Check if it's a JWT (header.payload.signature)
  const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
  if (jwtPattern.test(credential)) {
    return {
      type: 'JWT',
      valid: false,
      reason: 'MESSAGE_CENTRAL_PASSWORD appears to be a JWT token (header.payload.signature format). Message Central API requires a different credential type. Please verify the correct authentication key from Message Central dashboard.',
      structure: 'JWT has 3 parts separated by dots',
      parts: credential.split('.').length
    };
  }
  
  // Check if it's Base64
  try {
    const decoded = Buffer.from(credential, 'base64');
    if (decoded.length > 0) {
      return {
        type: 'BASE64',
        valid: true,
        decodedLength: decoded.length,
        reason: 'Valid Base64 string'
      };
    }
  } catch (e) {
    // Not valid Base64
  }
  
  // Check if it contains only base64 characters but has periods
  const base64WithPeriods = /^[A-Za-z0-9+/=.]+$/;
  if (base64WithPeriods.test(credential) && credential.includes('.')) {
    return {
      type: 'BASE64_WITH_PERIODS',
      valid: false,
      reason: 'Contains periods which are not valid Base64 characters. This might be a JWT or incorrectly formatted key.',
    };
  }
  
  return {
    type: 'UNKNOWN',
    valid: false,
    reason: 'Credential format not recognized'
  };
}

/**
 * STEP 7: Validate Base64 encoding
 */
function validateBase64(key) {
  try {
    const decoded = Buffer.from(key, 'base64');
    console.log('[MessageCentral] ✅ Base64 validation passed');
    console.log('[MessageCentral] 📊 Decoded length:', decoded.length, 'bytes');
    return { valid: true, decoded };
  } catch (error) {
    console.error('[MessageCentral] ❌ Base64 validation failed:', error.message);
    return {
      valid: false,
      error: 'Configured Message Central key is not valid Base64.',
      details: error.message
    };
  }
}

/**
 * Generate Message Central Authentication Token
 * Token is cached for 24 hours to reduce API calls
 */
async function generateAuthToken() {
  console.log('[MessageCentral] ═══════════════════════════════════════════════════════');
  console.log('[MessageCentral] 🔍 DIAGNOSTIC MODE: Message Central Token Generation');
  console.log('[MessageCentral] ═══════════════════════════════════════════════════════');
  
  try {
    // Check cache first
    if (authTokenCache.token && authTokenCache.expiresAt > Date.now()) {
      console.log('[MessageCentral] ℹ️  Using cached auth token');
      return authTokenCache.token;
    }

    // STEP 2: Validate environment variables
    console.log('[MessageCentral] ');
    console.log('[MessageCentral] STEP 2: Environment Variable Validation');
    console.log('[MessageCentral] ───────────────────────────────────────');
    const envReport = validateEnvironmentVariables();
    
    if (!CUSTOMER_ID || !PASSWORD || !EMAIL) {
      throw new Error('❌ FATAL: MESSAGE_CENTRAL_CUSTOMER_ID, MESSAGE_CENTRAL_PASSWORD, or MESSAGE_CENTRAL_EMAIL not configured in environment variables');
    }

    // STEP 3: Detect credential type
    console.log('[MessageCentral] ');
    console.log('[MessageCentral] STEP 3: Credential Type Detection');
    console.log('[MessageCentral] ───────────────────────────────────────');
    const credentialType = detectCredentialType(PASSWORD);
    console.log('[MessageCentral] 🔍 Credential Analysis:', JSON.stringify(credentialType, null, 2));
    
    if (credentialType.type === 'JWT') {
      console.warn('[MessageCentral] ');
      console.warn('[MessageCentral] ⚠️ WARNING: JWT TOKEN DETECTED');
      console.warn('[MessageCentral] ═══════════════════════════════════════════════════════');
      console.warn('[MessageCentral] The MESSAGE_CENTRAL_PASSWORD appears to be a JWT token.');
      console.warn('[MessageCentral] JWT Format: header.payload.signature (3 parts separated by dots)');
      console.warn('[MessageCentral] ');
      console.warn('[MessageCentral] Message Central typically expects Base64 keys without periods.');
      console.warn('[MessageCentral] However, some Message Central JWT tokens labeled "API_KEY" may work.');
      console.warn('[MessageCentral] ');
      console.warn('[MessageCentral] ⏩ PROCEEDING TO TEST WITH MESSAGE CENTRAL API...');
      console.warn('[MessageCentral] ═══════════════════════════════════════════════════════');
      console.warn('[MessageCentral] ');
      // Don't throw error - let Message Central API decide if it's valid
    }
    
    if (!credentialType.valid && credentialType.type !== 'JWT') {
      throw new Error(`INVALID_CREDENTIAL: ${credentialType.reason}`);
    }
    
    if (credentialType.type === 'JWT') {
      console.log('[MessageCentral] ⚠️  JWT detected but proceeding to test with API');
    }

    // STEP 7: Validate Base64 (skip for JWT tokens - let API decide)
    console.log('[MessageCentral] ');
    console.log('[MessageCentral] STEP 7: Base64 Validation');
    console.log('[MessageCentral] ───────────────────────────────────────');
    if (credentialType.type !== 'JWT') {
      const base64Validation = validateBase64(PASSWORD);
      if (!base64Validation.valid) {
        throw new Error(`BASE64_INVALID: ${base64Validation.error} - ${base64Validation.details}`);
      }
    } else {
      console.log('[MessageCentral] ⏩ Skipping Base64 validation (JWT token detected)');
      console.log('[MessageCentral] 📋 Letting Message Central API validate the token format');
    }

    // STEP 4: Log outgoing request details
    console.log('[MessageCentral] ');
    console.log('[MessageCentral] STEP 4: Outgoing Request Details');
    console.log('[MessageCentral] ───────────────────────────────────────');
    const requestUrl = `${BASE_URL}/auth/v1/authentication/token`;
    const requestParams = {
      country: 'IN',
      customerId: CUSTOMER_ID,
      email: EMAIL?.substring(0, 3) + '***' + EMAIL?.substring(EMAIL.length - 10) || '[NOT SET]',
      key: PASSWORD?.substring(0, 10) + '...[REDACTED]...' + PASSWORD?.substring(PASSWORD.length - 10),
      scope: 'NEW'
    };
    console.log('[MessageCentral] 🌐 Method: GET');
    console.log('[MessageCentral] 🌐 URL:', requestUrl);
    console.log('[MessageCentral] 🌐 Params:', JSON.stringify(requestParams, null, 2));
    console.log('[MessageCentral] 🌐 Headers: { accept: "*/*" }');
    console.log('[MessageCentral] 🌐 Timeout: 10000ms');
    console.log('[MessageCentral] 🌐 Encoding: URLSearchParams (automatic via axios params)');

    // STEP 6: Verify request encoding
    console.log('[MessageCentral] ');
    console.log('[MessageCentral] STEP 6: Request Encoding Verification');
    console.log('[MessageCentral] ───────────────────────────────────────');
    console.log('[MessageCentral] ✅ Using axios params (automatic URL encoding)');
    console.log('[MessageCentral] ✅ This prevents manual encoding issues');
    
    console.log('[MessageCentral] ');
    console.log('[MessageCentral] 🚀 Sending request to Message Central API...');
    console.log('[MessageCentral] ');
    
    const response = await axios.get(requestUrl, {
      params: {
        country: 'IN',
        customerId: CUSTOMER_ID,
        email: EMAIL,
        key: PASSWORD,
        scope: 'NEW'
      },
      headers: {
        'accept': '*/*'
      },
      timeout: 10000
    });

    // STEP 5: Log complete response
    console.log('[MessageCentral] ');
    console.log('[MessageCentral] STEP 5: API Response Analysis');
    console.log('[MessageCentral] ───────────────────────────────────────');
    console.log('[MessageCentral] 📥 HTTP Status:', response.status, response.statusText);
    console.log('[MessageCentral] 📥 Response Code:', response.data.responseCode);
    console.log('[MessageCentral] 📥 Response Status:', response.data.status);
    console.log('[MessageCentral] 📥 Response Body:', JSON.stringify(response.data, null, 2));

    // Check for success (either responseCode: 200 OR status: 200)
    const isSuccess = response.data.responseCode === 200 || response.data.status === 200;
    
    if (!isSuccess && response.data.responseCode) {
      throw new Error(`API_ERROR: ${response.data.message || 'Unknown error'} (Code: ${response.data.responseCode})`);
    }

    // Get token from either data.authToken OR data.token
    const token = response.data.data?.authToken || response.data.token;
    
    if (!token) {
      throw new Error('API_ERROR: No authToken or token in response data');
    }
    
    // Cache token for 24 hours
    authTokenCache = {
      token,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };

    console.log('[MessageCentral] ');
    console.log('[MessageCentral] ✅✅✅ SUCCESS ✅✅✅');
    console.log('[MessageCentral] Auth token generated successfully');
    console.log('[MessageCentral] Token cached until:', new Date(authTokenCache.expiresAt).toISOString());
    console.log('[MessageCentral] ═══════════════════════════════════════════════════════');
    
    return token;
  } catch (error) {
    // STEP 5: Comprehensive error logging
    console.error('[MessageCentral] ');
    console.error('[MessageCentral] ❌❌❌ ERROR ❌❌❌');
    console.error('[MessageCentral] ═══════════════════════════════════════════════════════');
    console.error('[MessageCentral] Error Type:', error.constructor.name);
    console.error('[MessageCentral] Error Message:', error.message);
    
    if (error.response) {
      console.error('[MessageCentral] ');
      console.error('[MessageCentral] HTTP Response Error:');
      console.error('[MessageCentral] ├─ Status:', error.response.status);
      console.error('[MessageCentral] ├─ Status Text:', error.response.statusText);
      console.error('[MessageCentral] ├─ Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('[MessageCentral] └─ Body:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('[MessageCentral] ');
      console.error('[MessageCentral] No Response Received:');
      console.error('[MessageCentral] ├─ Request was sent but no response received');
      console.error('[MessageCentral] ├─ URL:', error.config?.url);
      console.error('[MessageCentral] ├─ Method:', error.config?.method);
      console.error('[MessageCentral] └─ Timeout:', error.config?.timeout, 'ms');
    } else if (error.code) {
      console.error('[MessageCentral] ');
      console.error('[MessageCentral] Axios Error:');
      console.error('[MessageCentral] ├─ Code:', error.code);
      console.error('[MessageCentral] └─ Message:', error.message);
    }
    
    console.error('[MessageCentral] ═══════════════════════════════════════════════════════');
    console.error('[MessageCentral] ');
    
    // Throw specific error message based on analysis
    if (error.message.includes('WRONG_CREDENTIAL_TYPE')) {
      throw error; // Already has detailed message
    }
    
    throw new Error(`Message Central Token Generation Failed: ${error.message}`);
  }
}

/**
 * Send OTP to mobile number
 * 
 * @param {string} mobileNumber - 10-digit mobile number (without country code)
 * @param {number} otpLength - Length of OTP (4-8 digits, default 6)
 * @returns {Promise<{verificationId: string, timeout: number, mobileNumber: string}>}
 */
async function sendOTP(mobileNumber, otpLength = 6) {
  try {
    // Clean mobile number (remove any non-digits, +91, etc.)
    const cleanNumber = mobileNumber.replace(/\D/g, '').replace(/^91/, '');
    
    if (cleanNumber.length !== 10) {
      throw new Error('Invalid mobile number. Must be 10 digits.');
    }
    
    console.log(`[MessageCentral] 📱 Sending ${otpLength}-digit OTP to: +91${cleanNumber}`);
    
    // Get auth token
    const authToken = await generateAuthToken();
    
    // Send OTP request with 3-minute (180 second) timeout
    const response = await axios.post(
      `${BASE_URL}/verification/v3/send`,
      null,
      {
        params: {
          countryCode: '91',
          customerId: CUSTOMER_ID,
          flowType: 'SMS',
          mobileNumber: cleanNumber,
          otpLength: otpLength,
          otpTimeout: 180  // Request 3-minute timeout (may not be supported by API)
        },
        headers: {
          'authToken': authToken
        },
        timeout: 15000
      }
    );

    if (response.data.responseCode !== 200) {
      console.error('[MessageCentral] ❌ Send OTP failed:', response.data);
      throw new Error(response.data.message || 'Failed to send OTP');
    }

    const { verificationId, timeout } = response.data.data;
    
    console.log('[MessageCentral] ✅ OTP sent successfully');
    console.log('[MessageCentral] 🔑 Verification ID:', verificationId);
    console.log('[MessageCentral] ⏰ Expires in:', timeout, 'seconds');

    return {
      verificationId,
      timeout: parseInt(timeout) || 60,
      mobileNumber: `+91${cleanNumber}`
    };
  } catch (error) {
    console.error('[MessageCentral] ❌ Send OTP error:', error.message);
    
    if (error.response?.data) {
      const errorData = error.response.data;
      console.error('[MessageCentral] Error response:', errorData);
      
      // Handle specific error codes
      if (errorData.responseCode === 506) {
        throw new Error('An OTP request already exists for this number. Please wait before requesting again.');
      } else if (errorData.responseCode === 511) {
        throw new Error('Invalid country code');
      } else if (errorData.responseCode === 800) {
        throw new Error('Maximum OTP limit reached. Please try again later.');
      }
      
      throw new Error(errorData.message || 'Failed to send OTP');
    }
    
    throw error;
  }
}

/**
 * Validate OTP code
 * 
 * @param {string} verificationId - Verification ID from sendOTP response
 * @param {string} code - OTP code entered by user
 * @returns {Promise<{success: boolean, mobileNumber: string, verificationStatus: string}>}
 */
async function validateOTP(verificationId, code) {
  try {
    // Validate inputs
    if (!verificationId || !code) {
      throw new Error('Verification ID and OTP code are required');
    }
    
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length < 4 || cleanCode.length > 8) {
      throw new Error('Invalid OTP length');
    }
    
    console.log(`[MessageCentral] 🔐 Validating OTP for verification ID: ${verificationId}`);
    console.log(`[MessageCentral] 📋 OTP Code: ${cleanCode}`);
    
    // Get auth token
    const authToken = await generateAuthToken();
    
    console.log(`[MessageCentral] 🔑 Auth token obtained, making validation request...`);
    console.log(`[MessageCentral] 🔍 VALIDATION REQUEST DETAILS:`);
    console.log(`[MessageCentral] ├─ Method: GET (as per Message Central API)`);
    console.log(`[MessageCentral] ├─ URL: ${BASE_URL}/verification/v3/validateOtp`);
    console.log(`[MessageCentral] ├─ Query Params: verificationId=${verificationId}, code=${cleanCode}`);
    console.log(`[MessageCentral] └─ Headers: { authToken: [REDACTED] }`);
    
    // Validate OTP - Message Central uses GET with query parameters!
    const response = await axios.get(
      `${BASE_URL}/verification/v3/validateOtp`,
      {
        params: {
          verificationId,
          code: cleanCode
        },
        headers: {
          'authToken': authToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('[MessageCentral] ✅ Validation API call successful');
    console.log('[MessageCentral] 📥 HTTP Status:', response.status);
    console.log('[MessageCentral] 📥 Response:', JSON.stringify(response.data, null, 2));

    if (response.data.responseCode !== 200) {
      const errorCode = response.data.responseCode;
      
      // Handle specific error codes
      if (errorCode === 702) {
        throw new Error('WRONG_OTP');
      } else if (errorCode === 705) {
        throw new Error('OTP_EXPIRED');
      } else if (errorCode === 703) {
        throw new Error('ALREADY_VERIFIED');
      } else if (errorCode === 700) {
        throw new Error('VERIFICATION_FAILED');
      } else if (errorCode === 505) {
        throw new Error('INVALID_VERIFICATION_ID');
      }
      
      throw new Error(response.data.message || 'OTP validation failed');
    }

    const { verificationStatus, mobileNumber } = response.data.data;
    
    if (verificationStatus !== 'VERIFICATION_COMPLETED') {
      throw new Error('OTP verification incomplete');
    }

    console.log('[MessageCentral] ✅ OTP validated successfully');
    console.log('[MessageCentral] 📱 Mobile:', mobileNumber);
    console.log('[MessageCentral] ✓ Status:', verificationStatus);

    return {
      success: true,
      mobileNumber: mobileNumber.startsWith('+91') ? mobileNumber : `+91${mobileNumber}`,
      verificationStatus
    };
  } catch (error) {
    console.error('[MessageCentral] ❌ OTP validation error:', error.message);
    console.error('[MessageCentral] Error type:', error.constructor.name);
    
    if (error.response) {
      console.error('[MessageCentral] 📥 HTTP Status:', error.response.status);
      console.error('[MessageCentral] 📥 Status Text:', error.response.statusText);
      console.error('[MessageCentral] 📥 Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('[MessageCentral] 📥 Response headers:', JSON.stringify(error.response.headers, null, 2));
    }
    
    // Return user-friendly errors
    if (error.message === 'WRONG_OTP') {
      throw new Error('Invalid OTP code. Please check and try again.');
    } else if (error.message === 'OTP_EXPIRED') {
      throw new Error('OTP has expired. Please request a new one.');
    } else if (error.message === 'ALREADY_VERIFIED') {
      throw new Error('This OTP has already been used.');
    } else if (error.message === 'INVALID_VERIFICATION_ID') {
      throw new Error('Invalid or expired verification session.');
    }
    
    if (error.response?.data) {
      const errorData = error.response.data;
      console.error('[MessageCentral] Error response:', errorData);
      throw new Error(errorData.message || 'Failed to validate OTP');
    }
    
    throw error;
  }
}

module.exports = {
  sendOTP,
  validateOTP,
  generateAuthToken
};
