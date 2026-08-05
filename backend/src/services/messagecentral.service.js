/**
 * Message Central VerifyNow OTP Service
 * 
 * Handles all interactions with Message Central API for OTP verification
 * Credentials are stored in environment variables and NEVER exposed to frontend
 */

const axios = require('axios');

const BASE_URL = process.env.MESSAGE_CENTRAL_BASE_URL || 'https://cpaas.messagecentral.com';
const CUSTOMER_ID = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;
const PASSWORD = process.env.MESSAGE_CENTRAL_PASSWORD;

// In-memory cache for auth tokens
// TODO: Use Redis in production for distributed systems
let authTokenCache = {
  token: null,
  expiresAt: null
};

/**
 * Generate Message Central Authentication Token
 * Token is cached for 24 hours to reduce API calls
 */
async function generateAuthToken() {
  try {
    // Check cache first
    if (authTokenCache.token && authTokenCache.expiresAt > Date.now()) {
      console.log('[MessageCentral] ℹ️  Using cached auth token');
      return authTokenCache.token;
    }

    console.log('[MessageCentral] 🔑 Generating new auth token...');
    
    const response = await axios.get(`${BASE_URL}/auth/v1/authentication/token`, {
      params: {
        customerId: CUSTOMER_ID,
        key: PASSWORD,
        scope: 'NEW',
        country: '91',
        email: 'tech@pulsemateconnect.in'
      },
      headers: {
        'accept': '*/*'
      },
      timeout: 10000
    });

    if (response.data.responseCode !== 200) {
      throw new Error(`Token generation failed: ${response.data.message}`);
    }

    const token = response.data.data.authToken;
    
    // Cache token for 24 hours
    authTokenCache = {
      token,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };

    console.log('[MessageCentral] ✅ Auth token generated successfully');
    console.log('[MessageCentral] ⏰ Token cached until:', new Date(authTokenCache.expiresAt).toISOString());
    
    return token;
  } catch (error) {
    console.error('[MessageCentral] ❌ Token generation failed:', error.message);
    
    if (error.response) {
      console.error('[MessageCentral] Response:', error.response.data);
    }
    
    throw new Error('Failed to generate authentication token');
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
    
    // Send OTP request
    const response = await axios.post(
      `${BASE_URL}/verification/v3/send`,
      null,
      {
        params: {
          countryCode: '91',
          customerId: CUSTOMER_ID,
          flowType: 'SMS',
          mobileNumber: cleanNumber,
          otpLength: otpLength
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
    
    // Get auth token
    const authToken = await generateAuthToken();
    
    // Validate OTP
    const response = await axios.post(
      `${BASE_URL}/verification/v3/validateOtp`,
      null,
      {
        params: {
          verificationId,
          code: cleanCode
        },
        headers: {
          'authToken': authToken
        },
        timeout: 10000
      }
    );

    console.log('[MessageCentral] Response:', JSON.stringify(response.data, null, 2));

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
