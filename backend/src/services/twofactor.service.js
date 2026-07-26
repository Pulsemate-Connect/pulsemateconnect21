/**
 * 2Factor SMS OTP Service
 * 
 * Documentation: https://2factor.in/docs/
 * Cost-effective SMS OTP service for India
 */

const axios = require('axios');
const logger = require('../config/logger');

const API_KEY = process.env.TWOFACTOR_API_KEY;
const BASE_URL = 'https://2factor.in/API/V1';

// Auto-generated OTPs are 6 digits, valid for 5 minutes
const OTP_VALIDITY_MINS = 5;

/**
 * Send OTP using 2Factor API
 * 
 * @param {string} mobile - Mobile number (10 digits or with +91)
 * @returns {Promise<{ sessionId: string, otp?: string }>}
 */
const sendOtp = async (mobile) => {
  if (!API_KEY) {
    throw new Error('2Factor API key not configured');
  }

  // Normalize mobile number (remove +91, keep 10 digits)
  const normalizedMobile = mobile.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

  if (normalizedMobile.length !== 10) {
    throw new Error('Invalid mobile number format');
  }

  try {
    logger.info(`[2Factor] Sending OTP to ${normalizedMobile}`);

    // 2Factor API sends auto-generated OTP using your template
    // Using template name: PULSEM (as configured in 2Factor dashboard)
    const response = await axios.get(`${BASE_URL}/${API_KEY}/SMS/${normalizedMobile}/AUTOGEN/PULSEM`);

    if (response.data.Status === 'Success') {
      logger.info(`[2Factor] OTP sent successfully. Session: ${response.data.Details}`);
      
      return {
        sessionId: response.data.Details, // Session ID for verification
        message: 'OTP sent successfully',
      };
    } else {
      logger.error(`[2Factor] Failed to send OTP: ${response.data.Details}`);
      throw new Error(response.data.Details || 'Failed to send OTP');
    }
  } catch (error) {
    logger.error(`[2Factor] Error sending OTP:`, error.message);
    
    if (error.response?.data) {
      logger.error(`[2Factor] API Response:`, error.response.data);
      throw new Error(error.response.data.Details || 'Failed to send OTP');
    }
    
    throw error;
  }
};

/**
 * Verify OTP using 2Factor API
 * 
 * @param {string} sessionId - Session ID from sendOtp response
 * @param {string} otp - 6-digit OTP entered by user
 * @returns {Promise<boolean>}
 */
const verifyOtp = async (sessionId, otp) => {
  if (!API_KEY) {
    throw new Error('2Factor API key not configured');
  }

  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    throw new Error('Invalid OTP format. Must be 6 digits.');
  }

  try {
    logger.info(`[2Factor] Verifying OTP for session ${sessionId}`);

    const response = await axios.get(`${BASE_URL}/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`);

    if (response.data.Status === 'Success' && response.data.Details === 'OTP Matched') {
      logger.info(`[2Factor] OTP verified successfully`);
      return true;
    } else {
      logger.warn(`[2Factor] OTP verification failed: ${response.data.Details}`);
      throw new Error(response.data.Details || 'Invalid OTP');
    }
  } catch (error) {
    logger.error(`[2Factor] Error verifying OTP:`, error.message);
    
    if (error.response?.data) {
      const details = error.response.data.Details;
      
      // Map 2Factor error messages to user-friendly messages
      if (details === 'OTP Mismatch') {
        throw new Error('Invalid OTP. Please check and try again.');
      } else if (details === 'OTP Expired') {
        throw new Error('OTP has expired. Please request a new one.');
      } else {
        throw new Error(details || 'OTP verification failed');
      }
    }
    
    throw error;
  }
};

/**
 * Send custom OTP (for development/testing)
 * 
 * @param {string} mobile - Mobile number
 * @param {string} otp - Custom OTP to send
 * @returns {Promise<{ sessionId: string }>}
 */
const sendCustomOtp = async (mobile, otp) => {
  if (!API_KEY) {
    throw new Error('2Factor API key not configured');
  }

  const normalizedMobile = mobile.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

  try {
    logger.info(`[2Factor] Sending custom OTP to ${normalizedMobile}`);

    const response = await axios.get(`${BASE_URL}/${API_KEY}/SMS/${normalizedMobile}/${otp}/PULSEM`);

    if (response.data.Status === 'Success') {
      return {
        sessionId: response.data.Details,
        message: 'OTP sent successfully',
      };
    } else {
      throw new Error(response.data.Details || 'Failed to send OTP');
    }
  } catch (error) {
    logger.error(`[2Factor] Error sending custom OTP:`, error.message);
    throw error;
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  sendCustomOtp,
};
