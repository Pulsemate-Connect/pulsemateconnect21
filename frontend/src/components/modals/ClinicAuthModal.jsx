import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import axios from '../../api/axios';

const ClinicAuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  // View states: 'login' | 'signup' | 'emailLogin' | 'otp'
  const [view, setView] = useState(initialMode === 'register' ? 'signup' : 'login');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    otp: ['', '', '', '', '', ''],
    agreeTerms: false,
  });
  
  const [errors, setErrors] = useState({});
  const otpInputRefs = useRef([]);
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Close modal on Escape key and manage body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (view === 'otp' && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [view]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    // Validate mobile number (Indian format)
    if (view === 'login' || view === 'signup') {
      if (!formData.mobile || !/^[6-9]\d{9}$/.test(formData.mobile)) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      }
    }

    // Validate email
    if (view === 'emailLogin' || view === 'signup') {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Validate name for signup
    if (view === 'signup') {
      if (!formData.name || formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = 'You must agree to the Terms of Service';
      }
    }

    // Validate OTP
    if (view === 'otp') {
      const otpValue = formData.otp.join('');
      if (otpValue.length !== 6) {
        newErrors.otp = 'Please enter the complete 6-digit OTP';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post('/auth/send-otp', {
        mobile: formData.mobile,
        purpose: view === 'signup' ? 'VERIFY_MOBILE' : 'LOGIN',
      });
      
      setView('otp');
      setCountdown(30);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const newValue = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...formData.otp];
    newOtp[index] = newValue;
    setFormData({ ...formData, otp: newOtp });

    // Auto-focus next input
    if (newValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Clear error
    if (errors.otp) {
      setErrors({ ...errors, otp: '' });
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...formData.otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setFormData({ ...formData, otp: newOtp });
    
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleResendOTP = () => {
    if (countdown === 0) {
      setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
      handleSendOTP();
    }
  };

  const handleVerifyOTP = async () => {
    if (!validateForm()) return;

    const otpValue = formData.otp.join('');
    setLoading(true);
    
    try {
      const response = await axios.post('/auth/verify-otp', {
        mobile: formData.mobile,
        otp: otpValue,
      });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        if (user.role !== 'CLINIC_OWNER') {
          toast.error('This login is only for clinic owners');
          return;
        }

        storeLogin({ user, token });
        toast.success('Login successful!');
        onClose();
        navigate('/clinic/onboarding/step-1');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
      setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        otp: formData.otp.join(''),
        role: 'CLINIC_OWNER',
      });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        storeLogin({ user, token });
        toast.success('Registration successful!');
        onClose();
        navigate('/clinic/onboarding/step-1');
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setView('login');
    setFormData({ name: '', email: '', mobile: '', otp: ['', '', '', '', '', ''], agreeTerms: false });
    setErrors({});
    setCountdown(0);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.70)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white rounded-lg relative"
        style={{ 
          width: '30vw', 
          minWidth: '400px', 
          maxWidth: '600px', 
          maxHeight: 'calc(100vh - 2rem)',
          borderRadius: '8px'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute text-gray-600 hover:text-gray-900 transition-colors z-10"
          style={{ top: '24px', right: '24px' }}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="overflow-y-auto" style={{ padding: '32px', maxHeight: 'calc(100vh - 2rem)' }}>
          {/* LOGIN VIEW */}
          {view === 'login' && (
            <>
              <h2 style={{ fontSize: '32px', fontWeight: 400, color: '#555555', marginBottom: '32px', lineHeight: '1.2' }}>
                Login
              </h2>
              
              {/* Phone Input */}
              <div className="mb-6">
                <div 
                  className="flex items-center border rounded-md overflow-hidden"
                  style={{ height: '56px', borderColor: errors.mobile ? '#EF4444' : '#D5D5D5' }}
                >
                  <div className="flex items-center px-4 border-r h-full cursor-pointer" style={{ borderRightColor: '#D5D5D5' }}>
                    <span className="mr-2">🇮🇳</span>
                    <span className="text-base">+91</span>
                    <svg className="w-4 h-4 ml-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => {
                      setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) });
                      if (errors.mobile) setErrors({ ...errors, mobile: '' });
                    }}
                    placeholder="Phone"
                    className="flex-1 h-full px-4 outline-none text-base"
                    maxLength={10}
                  />
                </div>
                {errors.mobile && <p className="text-red-600 text-sm mt-1">{errors.mobile}</p>}
              </div>

              {/* Send OTP Button */}
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full rounded-md text-white font-medium mb-4"
                style={{ height: '52px', backgroundColor: '#2F73E8', fontSize: '17px', fontWeight: 500 }}
              >
                {loading ? 'Sending...' : 'Send One Time Password'}
              </button>

              {/* Divider */}
              <div className="flex items-center my-5">
                <div className="flex-1 border-t" style={{ borderColor: '#D5D5D5' }}></div>
                <span className="px-3 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t" style={{ borderColor: '#D5D5D5' }}></div>
              </div>

              {/* Continue with Email */}
              <button
                onClick={() => setView('emailLogin')}
                className="w-full flex items-center justify-center gap-3 border rounded-md hover:bg-gray-50 transition"
                style={{ height: '50px', borderColor: '#D5D5D5', fontSize: '17px' }}
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-800">Continue with Email</span>
              </button>

              {/* Footer Divider */}
              <div className="border-t my-6" style={{ borderColor: '#D5D5D5' }}></div>

              {/* Create Account Link */}
              <p className="text-center text-base">
                <span style={{ color: '#555555' }}>New to PulseMate Connect? </span>
                <button 
                  onClick={() => setView('signup')}
                  className="font-medium hover:underline"
                  style={{ color: '#2F73E8' }}
                >
                  Create account
                </button>
              </p>
            </>
          )}
          {/* EMAIL LOGIN VIEW */}
          {view === 'emailLogin' && (
            <>
              <h2 style={{ fontSize: '32px', fontWeight: 400, color: '#555555', marginBottom: '32px', lineHeight: '1.2' }}>
                Login with Email
              </h2>
              
              <div className="mb-6">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="Email address"
                  className="w-full px-4 border rounded-md outline-none"
                  style={{ height: '56px', borderColor: errors.email ? '#EF4444' : '#D5D5D5', fontSize: '16px' }}
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <button
                onClick={() => {/* Email login logic */}}
                disabled={loading}
                className="w-full rounded-md text-white font-medium mb-4"
                style={{ height: '52px', backgroundColor: '#2F73E8', fontSize: '17px', fontWeight: 500 }}
              >
                Continue
              </button>

              <button
                onClick={() => setView('login')}
                className="text-sm hover:underline"
                style={{ color: '#555555' }}
              >
                ← Back to login options
              </button>
            </>
          )}

          {/* SIGNUP VIEW */}
          {view === 'signup' && (
            <>
              <h2 style={{ fontSize: '32px', fontWeight: 400, color: '#555555', marginBottom: '32px', lineHeight: '1.2' }}>
                Create your clinic partner account
              </h2>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="Full name"
                  className="w-full px-4 border rounded-md outline-none"
                  style={{ height: '56px', borderColor: errors.name ? '#EF4444' : '#D5D5D5', fontSize: '16px' }}
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="mb-4">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="Email address"
                  className="w-full px-4 border rounded-md outline-none"
                  style={{ height: '56px', borderColor: errors.email ? '#EF4444' : '#D5D5D5', fontSize: '16px' }}
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="mb-4">
                <div 
                  className="flex items-center border rounded-md overflow-hidden"
                  style={{ height: '56px', borderColor: errors.mobile ? '#EF4444' : '#D5D5D5' }}
                >
                  <div className="flex items-center px-4 border-r h-full cursor-pointer" style={{ borderRightColor: '#D5D5D5' }}>
                    <span className="mr-2">🇮🇳</span>
                    <span className="text-base">+91</span>
                    <svg className="w-4 h-4 ml-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => {
                      setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) });
                      if (errors.mobile) setErrors({ ...errors, mobile: '' });
                    }}
                    placeholder="Phone number"
                    className="flex-1 h-full px-4 outline-none text-base"
                    maxLength={10}
                  />
                </div>
                {errors.mobile && <p className="text-red-600 text-sm mt-1">{errors.mobile}</p>}
              </div>

              <div className="mb-6">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => {
                      setFormData({ ...formData, agreeTerms: e.target.checked });
                      if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: '' });
                    }}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to PulseMate Connect's{' '}
                    <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                  </span>
                </label>
                {errors.agreeTerms && <p className="text-red-600 text-sm mt-1">{errors.agreeTerms}</p>}
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full rounded-md text-white font-medium mb-4"
                style={{ height: '52px', backgroundColor: '#2F73E8', fontSize: '17px', fontWeight: 500 }}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <p className="text-center text-base">
                <span style={{ color: '#555555' }}>Already have an account? </span>
                <button 
                  onClick={() => setView('login')}
                  className="font-medium hover:underline"
                  style={{ color: '#2F73E8' }}
                >
                  Login
                </button>
              </p>
            </>
          )}

          {/* OTP VERIFICATION VIEW */}
          {view === 'otp' && (
            <>
              <h2 style={{ fontSize: '32px', fontWeight: 400, color: '#555555', marginBottom: '12px', lineHeight: '1.2' }}>
                Verify your phone
              </h2>
              <p style={{ fontSize: '16px', color: '#666666', marginBottom: '32px' }}>
                We've sent a 6-digit OTP to <span style={{ fontWeight: 500, color: '#111111' }}>+91 {formData.mobile}</span>
              </p>

              <div className="flex gap-3 justify-center mb-6">
                {formData.otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    maxLength={1}
                    className="text-center border rounded-md outline-none"
                    style={{ width: '48px', height: '52px', fontSize: '20px', fontWeight: 500, borderColor: '#D5D5D5' }}
                  />
                ))}
              </div>
              {errors.otp && <p className="text-red-600 text-sm text-center mb-4">{errors.otp}</p>}

              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full rounded-md text-white font-medium mb-4"
                style={{ height: '52px', backgroundColor: '#2F73E8', fontSize: '17px', fontWeight: 500 }}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div className="text-center mb-4">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-600">
                    Didn't receive the code? <span className="text-gray-400">Resend in {countdown}s</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button onClick={handleResendOTP} className="font-medium hover:underline" style={{ color: '#2F73E8' }}>
                      Resend OTP
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicAuthModal;
