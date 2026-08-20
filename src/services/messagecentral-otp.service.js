/**
 * MESSAGE CENTRAL OTP SERVICE
 * 
 * ✅ Production-ready OTP authentication using Message Central
 * ✅ All SMS API calls happen on backend (credentials never exposed)
 * ✅ Proper error handling and user-friendly messages
 * ✅ Replaces Firebase Phone Authentication
 * 
 * This service calls backend endpoints that handle Message Central integration.
 * Backend validates OTP, manages rate limiting, and returns JWT tokens.
 */

import api from '../api/axios';

/**
 * Send OTP to mobile number
 * 
 * @param {string} mobileNumber - Phone number in E.164 format (+91XXXXXXXXXX)
 * @returns {Promise<{verificationId: string, expiresIn: number, message: string}>}
 */
export const sendOTP = async (mobileNumber) => {
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - MESSAGE CENTRAL (Backend API)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 📞 Phone: ${mobileNumber}
║ 🔐 Method: Backend API → Message Central
║ 🔒 Security: API credentials stored in backend only
║ ✨ Features: Rate limiting, validation, audit logging
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate phone number format
  if (!mobileNumber || !/^\+[1-9]\d{9,14}$/.test(mobileNumber)) {
    throw new Error('Invalid phone number. Use format: +91XXXXXXXXXX');
  }

  try {
    console.log('[MessageCentral Service] 🚀 Calling backend /auth/patient/send-otp...');
    console.log('[MessageCentral Service] 📱 Phone:', mobileNumber);
    
    // Backend expects 'phoneNumber' parameter
    const response = await api.post('/auth/patient/send-otp', {
      phoneNumber: mobileNumber
    });

    const data = response.data?.data ?? response.data;
    
    console.log('[MessageCentral Service] ✅ OTP sent successfully');
    console.log('[MessageCentral Service] 🔑 Verification ID:', data.verificationId);
    console.log('[MessageCentral Service] ⏰ Expires in:', data.expiresIn, 'seconds');
    console.log('[MessageCentral Service] ⏱️  Total time:', Date.now() - timestamp, 'ms');

    return {
      verificationId: data.verificationId,
      expiresIn: data.expiresIn || 60,
      message: data.message || 'OTP sent successfully',
      timestamp,
    };
  } catch (error) {
    console.error('[MessageCentral Service] ❌ Failed to send OTP');
    console.error('[MessageCentral Service] Error:', error.message);
    console.error('[MessageCentral Service] Status:', error.response?.status);
    console.error('[MessageCentral Service] Data:', error.response?.data);
    
    // Extract user-friendly error message
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error
      || error.message 
      || 'Failed to send OTP. Please try again.';
    
    throw new Error(errorMessage);
  }
};

/**
 * Verify OTP code and authenticate user
 * 
 * @param {string} verificationId - Verification ID from sendOTP response
 * @param {string} otp - 6-digit OTP code entered by user
 * @param {string} mobileNumber - Phone number (for validation)
 * @param {string} name - Optional user name for new registrations
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
export const verifyOTP = async (verificationId, otp, mobileNumber, name = null) => {
  const timestamp = Date.now();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 VERIFY OTP - MESSAGE CENTRAL (Backend API)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(timestamp).toISOString()}
║ 🔑 Verification ID: ${verificationId}
║ 🔢 OTP Length: ${otp?.length}
║ 📞 Phone: ${mobileNumber}
╚═══════════════════════════════════════════════════════════════════════════════
`);

  // Validate inputs
  if (!verificationId) {
    throw new Error('Verification ID is required.');
  }
  
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    throw new Error('Please enter a valid 6-digit OTP code.');
  }

  if (!mobileNumber) {
    throw new Error('Mobile number is required.');
  }

  try {
    console.log('[MessageCentral Service] 🔐 Calling backend /auth/patient/verify-otp...');
    
    // Backend expects 'phoneNumber' parameter (not 'mobileNumber')
    const requestBody = {
      phoneNumber: mobileNumber,
      otp,
      verificationId
    };
    
    if (name) {
      requestBody.name = name;
    }
    
    const response = await api.post('/auth/patient/verify-otp', requestBody);

    const data = response.data?.data ?? response.data;
    
    console.log('[MessageCentral Service] ✅ OTP verified successfully');
    console.log('[MessageCentral Service] 👤 User ID:', data.user?.id);
    console.log('[MessageCentral Service] 🎫 Has access token:', !!data.accessToken);
    console.log('[MessageCentral Service] 🔄 Has refresh token:', !!data.refreshToken);
    console.log('[MessageCentral Service] ⏱️  Total time:', Date.now() - timestamp, 'ms');

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  } catch (error) {
    console.error('[MessageCentral Service] ❌ OTP verification failed');
    console.error('[MessageCentral Service] Error:', error.message);
    console.error('[MessageCentral Service] Status:', error.response?.status);
    console.error('[MessageCentral Service] Data:', error.response?.data);
    
    // Extract user-friendly error message
    let errorMessage = error.response?.data?.message 
      || error.response?.data?.error
      || error.message;
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      errorMessage = 'Invalid or expired OTP. Please try again.';
    } else if (error.response?.status === 429) {
      errorMessage = 'Too many attempts. Please wait a few minutes and try again.';
    } else if (!errorMessage) {
      errorMessage = 'Verification failed. Please try again.';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Resend OTP (same as sending OTP)
 * 
 * @param {string} mobileNumber - Phone number in E.164 format
 * @returns {Promise<{verificationId: string, expiresIn: number, message: string}>}
 */
export const resendOTP = async (mobileNumber) => {
  console.log('[MessageCentral Service] 🔄 Resending OTP...');
  return sendOTP(mobileNumber);
};

/**
 * Format Firebase errors to user-friendly messages
 * (Kept for backward compatibility during migration)
 */
const formatError = (error) => {
  const message = error.message || 'An error occurred';
  
  // Common error patterns
  if (message.includes('network') || message.includes('timeout')) {
    return 'Network error. Please check your internet connection.';
  }
  
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please try again later.';
  }
  
  if (message.includes('invalid') || message.includes('expired')) {
    return 'Invalid or expired OTP. Please request a new one.';
  }
  
  return message;
};

export default {
  sendOTP,
  verifyOTP,
  resendOTP,
};
