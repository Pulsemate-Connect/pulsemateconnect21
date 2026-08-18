/**
 * OTP Helper
 * Handles OTP generation, verification, and test mode operations
 */

const config = require('../config/test.config');

class OTPHelper {
  constructor() {
    this.otpStore = new Map(); // mobile/email => {otp, expiresAt, attempts}
  }

  /**
   * Get test OTP code
   */
  getTestOTP() {
    return config.otp.testOtpCode;
  }

  /**
   * Check if test mode is enabled
   */
  isTestMode() {
    return config.otp.testMode;
  }

  /**
   * Generate OTP for testing
   */
  generateOTP(identifier) {
    if (this.isTestMode()) {
      // In test mode, always return test OTP
      return this.getTestOTP();
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiry
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);
    this.otpStore.set(identifier, {
      otp,
      expiresAt,
      attempts: 0,
      used: false,
    });
    
    return otp;
  }

  /**
   * Verify OTP
   */
  verifyOTP(identifier, otp) {
    if (this.isTestMode() && otp === this.getTestOTP()) {
      return { success: true, message: 'OTP verified (test mode)' };
    }
    
    const stored = this.otpStore.get(identifier);
    
    if (!stored) {
      return { success: false, message: 'OTP not found' };
    }
    
    if (stored.used) {
      return { success: false, message: 'OTP already used' };
    }
    
    if (new Date() > stored.expiresAt) {
      return { success: false, message: 'OTP expired' };
    }
    
    if (stored.attempts >= config.otp.maxAttempts) {
      return { success: false, message: 'Max attempts exceeded' };
    }
    
    stored.attempts++;
    
    if (stored.otp === otp) {
      stored.used = true;
      return { success: true, message: 'OTP verified' };
    }
    
    return { success: false, message: 'Invalid OTP' };
  }

  /**
   * Check if OTP is expired
   */
  isExpired(identifier) {
    const stored = this.otpStore.get(identifier);
    if (!stored) return true;
    
    return new Date() > stored.expiresAt;
  }

  /**
   * Check if OTP is used
   */
  isUsed(identifier) {
    const stored = this.otpStore.get(identifier);
    if (!stored) return false;
    
    return stored.used;
  }

  /**
   * Clear OTP
   */
  clearOTP(identifier) {
    this.otpStore.delete(identifier);
  }

  /**
   * Clear all OTPs
   */
  clearAll() {
    this.otpStore.clear();
  }

  /**
   * Get test scenarios for OTP testing
   */
  getTestScenarios(identifier) {
    const validOTP = this.isTestMode() ? this.getTestOTP() : this.generateOTP(identifier);
    
    return {
      valid: validOTP,
      invalid: '000000',
      expired: validOTP, // Will be marked as expired by manipulating time
      reused: validOTP,  // Will be marked as used after first verification
      wrongLength: '123',
      nonNumeric: 'abcdef',
      empty: '',
    };
  }
}

module.exports = OTPHelper;
