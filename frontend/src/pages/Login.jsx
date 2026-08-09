/**
 * Login Page — PulseMate Connect Web
 *
 * Firebase Phone Authentication with invisible reCAPTCHA.
 *
 * Flow:
 *   1. User enters phone number
 *   2. Setup invisible reCAPTCHA
 *   3. Send OTP via Firebase SDK
 *   4. User enters OTP
 *   5. Verify OTP with Firebase
 *   6. Get Firebase ID token
 *   7. Send to backend for verification
 *   8. Receive JWT and save to store
 *   9. Redirect to home
 *
 * @module pages/Login
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  setupRecaptcha,
  clearRecaptcha,
  sendOtpToPhone,
  verifyOtp as verifyFirebaseOtp,
  signOutFirebase,
} from '../config/firebase';
import { loginWithFirebase } from '../services/api';
import useAuthStore from '../stores/authStore';

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth, isAuthenticated } = useAuthStore();

  // ── State ────────────────────────────────────────────────────────────────
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'name'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSentAt, setOtpSentAt] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Effects ──────────────────────────────────────────────────────────────

  // Note: PublicRoute wrapper handles authenticated user redirect automatically
  // No manual redirect needed here - it would conflict with role-based routing

  // Show session expired message
  useEffect(() => {
    if (searchParams.get('session') === 'expired') {
      setError('Your session has expired. Please login again.');
    }
  }, [searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  /**
   * Format phone number as user types
   */
  const handlePhoneChange = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = digits.slice(0, 10);
    
    setPhone(limited);
    setError('');
  };

  /**
   * Format OTP as user types
   */
  const handleOtpChange = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 6 digits
    const limited = digits.slice(0, 6);
    
    setOtp(limited);
    setError('');
  };

  /**
   * Send OTP via Firebase
   */
  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate phone number
      if (phone.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      if (!phone.startsWith('6') && !phone.startsWith('7') && 
          !phone.startsWith('8') && !phone.startsWith('9')) {
        throw new Error('Invalid Indian mobile number');
      }

      // Setup reCAPTCHA
      const appVerifier = setupRecaptcha('recaptcha-container');

      // Send OTP
      const fullPhone = `+91${phone}`;
      const result = await sendOtpToPhone(fullPhone, appVerifier);

      // Save confirmation result for OTP verification
      setConfirmationResult(result);
      setOtpSentAt(Date.now());
      setResendCooldown(60); // 60 seconds cooldown
      setStep('otp');

      console.log('[Login] OTP sent successfully to', fullPhone);
    } catch (err) {
      console.error('[Login] Send OTP error:', err);
      setError(err.message);
      clearRecaptcha(); // Reset reCAPTCHA on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setLoading(true);
      setError('');
      setOtp(''); // Clear OTP input

      // Clear previous reCAPTCHA
      clearRecaptcha();

      // Setup new reCAPTCHA
      const appVerifier = setupRecaptcha('recaptcha-container');

      // Resend OTP
      const fullPhone = `+91${phone}`;
      const result = await sendOtpToPhone(fullPhone, appVerifier);

      setConfirmationResult(result);
      setOtpSentAt(Date.now());
      setResendCooldown(60);

      console.log('[Login] OTP resent successfully');
    } catch (err) {
      console.error('[Login] Resend OTP error:', err);
      setError(err.message);
      clearRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP and login
   */
  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate OTP
      if (otp.length !== 6) {
        throw new Error('Please enter the 6-digit OTP');
      }

      if (!confirmationResult) {
        throw new Error('Session expired. Please start over.');
      }

      // Step 1: Verify OTP with Firebase and get ID token
      console.log('[Login] Verifying OTP with Firebase...');
      const firebaseIdToken = await verifyFirebaseOtp(confirmationResult, otp);

      // Step 2: Send Firebase ID token to backend
      console.log('[Login] Sending Firebase token to backend...');
      const authData = await loginWithFirebase(firebaseIdToken, name);

      // Step 3: Check if this is a new user
      if (authData.user.isNewUser) {
        // New user - show name input
        setStep('name');
        return;
      }

      // Step 4: Save to store
      setAuth(authData.user, authData.accessToken);
      
      console.log('[Login] Login successful - PublicRoute will handle redirect');
      
      // PublicRoute wrapper will automatically redirect to /patient/home
      // No manual navigation needed - removes race condition
    } catch (err) {
      console.error('[Login] Verify OTP error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete registration with name
   */
  const handleCompleteName = async () => {
    try {
      setLoading(true);
      setError('');

      if (!name.trim()) {
        throw new Error('Please enter your name');
      }

      // Re-verify with name
      const firebaseIdToken = await verifyFirebaseOtp(confirmationResult, otp);
      const authData = await loginWithFirebase(firebaseIdToken, name.trim());

      setAuth(authData.user, authData.accessToken);
      
      console.log('[Login] Registration completed - PublicRoute will handle redirect');
      
      // PublicRoute wrapper will automatically redirect to /patient/home
      // No manual navigation needed - removes race condition
    } catch (err) {
      console.error('[Login] Complete name error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Go back to phone step
   */
  const handleBack = () => {
    setOtp('');
    setError('');
    setStep('phone');
    clearRecaptcha();
    signOutFirebase(); // Clean up Firebase session
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      if (step === 'phone' && phone.length === 10) {
        handleSendOtp();
      } else if (step === 'otp' && otp.length === 6) {
        handleVerifyOtp();
      } else if (step === 'name' && name.trim()) {
        handleCompleteName();
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo & Title */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">PulseMate Connect</h1>
            <p className="mt-2 text-gray-600">
              {step === 'phone' && 'Enter your mobile number'}
              {step === 'otp' && 'Enter verification code'}
              {step === 'name' && 'Complete your profile'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Phone Step */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={phone.length !== 10 || loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                We'll send you a verification code via SMS
              </p>
            </div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg text-center tracking-widest"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-900"
                  disabled={loading}
                >
                  ← Change number
                </button>

                {resendCooldown > 0 ? (
                  <span className="text-gray-500">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Name Step (for new users) */}
          {step === 'name' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                ✓ Phone verified successfully!
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                onClick={handleCompleteName}
                disabled={!name.trim() || loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Completing...' : 'Complete Registration'}
              </button>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${step === 'phone' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'otp' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'name' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secured by Firebase Authentication</span>
          </div>
        </div>

        {/* reCAPTCHA Container (invisible) */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
