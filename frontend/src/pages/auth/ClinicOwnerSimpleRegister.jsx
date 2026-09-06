import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  sendClinicOwnerEmailVerification, 
  verifyClinicOwnerEmailOtp,
  verifyClinicOwnerFirebasePhone 
} from '../../api/auth.api';
import { sendOtpToPhone, clearRecaptcha } from '../../api/firebaseAuth';

const ClinicOwnerSimpleRegister = () => {
  const navigate = useNavigate();
  
  // Form state
  const [step, setStep] = useState(1); // 1: Email, 2: Email OTP, 3: Mobile, 4: Mobile OTP
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emailOtp: '',
    mobile: '',
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  // Verification states
  const [tempToken, setTempToken] = useState(null);
  const [firebaseConfirmResult, setFirebaseConfirmResult] = useState(null);
  const [countdown, setCountdown] = useState(0);
  
  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Clear Firebase reCAPTCHA when mobile changes
  useEffect(() => {
    if (step === 3) {
      clearRecaptcha();
      setFirebaseConfirmResult(null);
    }
  }, [formData.mobile, step]);

  // Step 1: Send Email OTP
  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSendingOtp(true);
    
    try {
      await sendClinicOwnerEmailVerification(formData.email, formData.name);
      toast.success('OTP sent to your email!');
      setStep(2);
      setCountdown(60);
    } catch (error) {
      console.error('Send email OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify Email OTP
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    
    if (!formData.emailOtp || formData.emailOtp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await verifyClinicOwnerEmailOtp(formData.email, formData.emailOtp, formData.name);
      
      if (response.data?.tempToken) {
        setTempToken(response.data.tempToken);
        toast.success('Email verified successfully!');
        setStep(3);
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verify email OTP error:', error);
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Send Mobile OTP
  const handleSendMobileOtp = async (e) => {
    e.preventDefault();
    
    if (!formData.mobile || formData.mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSendingOtp(true);
    
    try {
      const phoneNumber = `+91${formData.mobile}`;
      const confirmResult = await sendOtpToPhone(phoneNumber);
      setFirebaseConfirmResult(confirmResult);
      toast.success('OTP sent to your mobile!');
      setStep(4);
      setCountdown(60);
    } catch (error) {
      console.error('Send mobile OTP error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 4: Verify Mobile OTP
  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    
    const mobileOtp = e.target.mobileOtp.value;
    
    if (!mobileOtp || mobileOtp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    
    try {
      // Verify with Firebase
      const firebaseResult = await firebaseConfirmResult.confirm(mobileOtp);
      const firebaseIdToken = await firebaseResult.user.getIdToken();
      
      // Link mobile to user account
      await verifyClinicOwnerFirebasePhone(firebaseIdToken, tempToken);
      
      toast.success('Registration successful! Redirecting to onboarding...');
      
      // Redirect to Step 1 of clinic onboarding
      setTimeout(() => {
        navigate('/clinic/onboarding/step-1');
      }, 1500);
    } catch (error) {
      console.error('Verify mobile OTP error:', error);
      toast.error(error.response?.data?.message || error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render based on current step
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PulseMate</h1>
          <p className="text-gray-600 mt-2">Clinic Partner Registration</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Email', 'Verify Email', 'Mobile', 'Verify Mobile'].map((label, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step > index + 1 
                    ? 'bg-green-500 text-white' 
                    : step === index + 1 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > index + 1 ? '✓' : index + 1}
                </div>
                <span className="text-xs mt-2 text-gray-600 hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="h-1 bg-gray-200 rounded">
              <div 
                className="h-1 bg-blue-600 rounded transition-all duration-300"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 1: Email & Name */}
          {step === 1 && (
            <form onSubmit={handleSendEmailOtp}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Let's get started</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingOtp ? 'Sending OTP...' : 'Send OTP to Email'}
              </button>

              <p className="text-sm text-gray-600 text-center mt-4">
                Already have an account?{' '}
                <a href="/clinic-owner/login" className="text-blue-600 hover:underline font-medium">
                  Login here
                </a>
              </p>
            </form>
          )}

          {/* Step 2: Email OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyEmailOtp}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-blue-600 hover:underline text-sm mb-4"
              >
                ← Back
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
              <p className="text-gray-600 mb-6">
                We sent a 6-digit code to <strong>{formData.email}</strong>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={formData.emailOtp}
                  onChange={(e) => setFormData({ ...formData, emailOtp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || formData.emailOtp.length !== 6}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="text-center mt-4">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">Resend OTP in {countdown}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={isSendingOtp}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Step 3: Mobile Number Entry */}
          {step === 3 && (
            <form onSubmit={handleSendMobileOtp}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Email Verified</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your mobile</h2>
              <p className="text-gray-600 mb-6">
                Enter your mobile number to receive OTP
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-700 font-medium">
                    +91
                  </span>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="9999999999"
                    maxLength={10}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* reCAPTCHA container */}
              <div id="recaptcha-container" className="mt-4"></div>

              <button
                type="submit"
                disabled={isSendingOtp || formData.mobile.length !== 10}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingOtp ? 'Sending OTP...' : 'Send OTP to Mobile'}
              </button>
            </form>
          )}

          {/* Step 4: Mobile OTP Verification */}
          {step === 4 && (
            <form onSubmit={handleVerifyMobileOtp}>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-blue-600 hover:underline text-sm mb-4"
              >
                ← Back
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify mobile OTP</h2>
              <p className="text-gray-600 mb-6">
                We sent a 6-digit code to <strong>+91{formData.mobile}</strong>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  name="mobileOtp"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Complete Registration'}
              </button>

              <div className="text-center mt-4">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">Resend OTP in {countdown}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    disabled={isSendingOtp}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By registering, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default ClinicOwnerSimpleRegister;
