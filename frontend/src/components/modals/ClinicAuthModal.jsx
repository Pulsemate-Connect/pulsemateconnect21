import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import axios from '../../api/axios';

const ClinicAuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  // View states: 'login' | 'signup' | 'otp'
  const [view, setView] = useState(initialMode === 'register' ? 'signup' : 'login');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [loginMethod, setLoginMethod] = useState('mobile'); // 'mobile' or 'email'
  
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

  const handleCloseAttempt = () => {
    // If in OTP view, show confirmation dialog
    if (view === 'otp') {
      setShowExitConfirm(true);
    } else {
      // Otherwise close directly
      onClose();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onClose();
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate for login view
    if (view === 'login') {
      if (loginMethod === 'mobile') {
        if (!formData.mobile || !/^[6-9]\d{9}$/.test(formData.mobile)) {
          newErrors.mobile = 'Please enter a valid 10-digit mobile number';
        }
      } else if (loginMethod === 'email') {
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
      }
    }

    // Validate email and name for signup
    if (view === 'signup') {
      if (!formData.name || formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
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

  // Mobile OTP for LOGIN
  const handleSendMobileOTP = async (skipValidation = false) => {
    if (!skipValidation && !validateForm()) return;

    setLoading(true);
    try {
      // First, check if mobile is registered
      const checkResponse = await axios.get(`/auth/check-user-exists?mobile=${formData.mobile}`);
      
      if (!checkResponse.data.data.exists) {
        toast.error('Mobile number not registered. Please create an account first.');
        setLoading(false);
        return;
      }

      // Check if user status is PENDING (allow login to see pending dashboard)
      const userStatus = checkResponse.data.data.status;
      if (userStatus === 'PENDING') {
        console.log('[Login] User has PENDING status, will show pending dashboard after login');
      }

      const response = await axios.post('/auth/send-otp', {
        phoneNumber: formData.mobile, // Backend expects 'phoneNumber'
        purpose: 'LOGIN',
      });
      
      // Check if test mode and show OTP to user
      if (response.data.data._testMode && response.data.data._testOtp) {
        toast.success(`TEST MODE: Your OTP is ${response.data.data._testOtp}`, {
          duration: 10000,
        });
      } else {
        toast.success('OTP sent successfully to your mobile!');
      }
      
      setView('otp');
      setCountdown(60); // 1 minute countdown
    } catch (error) {
      console.error('Send Mobile OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Email OTP for SIGNUP
  const handleSendEmailOTP = async (skipValidation = false) => {
    if (!skipValidation && !validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post('/auth/register-email-otp/send', {
        email: formData.email,
        name: formData.name,
      });
      
      // Check if test mode
      if (response.data.data._testMode && response.data.data._testOtp) {
        toast.success(`TEST MODE: Your OTP is ${response.data.data._testOtp}`, {
          duration: 10000,
        });
      } else {
        toast.success('OTP sent successfully! Check your email.');
      }
      
      setView('otp');
      setCountdown(60); // 1 minute countdown
    } catch (error) {
      console.error('Send Email OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Email OTP for LOGIN
  const handleSendEmailLoginOTP = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      // First, check if email is registered
      const checkResponse = await axios.get(`/auth/check-user-exists?email=${formData.email}`);
      
      if (!checkResponse.data.data.exists) {
        toast.error('Email not registered. Please create an account first.');
        setLoading(false);
        return;
      }

      // Check if user status is PENDING (allow login to see pending dashboard)
      const userStatus = checkResponse.data.data.status;
      if (userStatus === 'PENDING') {
        console.log('[Login] User has PENDING status, will show pending dashboard after login');
      }

      const response = await axios.post('/auth/register-email-otp/send', {
        email: formData.email,
        name: '', // Not needed for login
      });
      
      if (response.data.data._testMode && response.data.data._testOtp) {
        toast.success(`TEST MODE: Your OTP is ${response.data.data._testOtp}`, {
          duration: 10000,
        });
      } else {
        toast.success('OTP sent to your email!');
      }
      
      setView('otp');
      setCountdown(60);
    } catch (error) {
      console.error('Send Email Login OTP error:', error);
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

  const handleResendOTP = async () => {
    console.log('[ClinicAuthModal] Resend OTP clicked, countdown:', countdown);
    console.log('[ClinicAuthModal] formData.mobile:', formData.mobile);
    console.log('[ClinicAuthModal] formData.email:', formData.email);
    console.log('[ClinicAuthModal] loginMethod:', loginMethod);
    
    if (countdown === 0) {
      setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
      
      try {
        // For login: check loginMethod
        if (formData.mobile && loginMethod === 'mobile') {
          console.log('[ClinicAuthModal] Resending mobile OTP...');
          await handleSendMobileOTP(true); // Skip validation
          console.log('[ClinicAuthModal] Mobile OTP resent successfully');
        } else if (formData.email && loginMethod === 'email') {
          console.log('[ClinicAuthModal] Resending email login OTP...');
          await handleSendEmailLoginOTP(); // Already has validation inside
          console.log('[ClinicAuthModal] Email login OTP resent successfully');
        } else if (formData.email) {
          // Signup flow - email with name
          console.log('[ClinicAuthModal] Resending email signup OTP...');
          await handleSendEmailOTP(true); // Skip validation
          console.log('[ClinicAuthModal] Email signup OTP resent successfully');
        } else {
          console.error('[ClinicAuthModal] No mobile or email found for resend');
          toast.error('Unable to resend OTP. Please start over.');
        }
      } catch (error) {
        console.error('[ClinicAuthModal] Resend OTP error:', error);
        toast.error('Failed to resend OTP. Please try again.');
      }
    } else {
      console.log('[ClinicAuthModal] Countdown not zero yet:', countdown);
    }
  };

  // Verify Mobile OTP (for login)
  const handleVerifyMobileOTP = async () => {
    if (!validateForm()) return;

    const otpValue = formData.otp.join('');
    setLoading(true);
    
    try {
      const response = await axios.post('/auth/verify-otp', {
        phoneNumber: formData.mobile, // Backend expects 'phoneNumber'
        otp: otpValue,
      });
      
      if (response.data.success) {
        // Check if we got login tokens (existing user)
        if (response.data.data.accessToken && response.data.data.user) {
          const { user, accessToken: token } = response.data.data;
          
          storeLogin({ user, token });
          
          // Check user status for redirect
          if (user.status === 'PENDING') {
            toast.success('Login successful! Your application is pending approval.');
            onClose();
            
            // Redirect to pending dashboard
            setTimeout(() => {
              window.location.href = '/clinic/dashboard/pending';
            }, 500);
          } else {
            toast.success('Login successful!');
            onClose();
            
            // Redirect to clinic onboarding or dashboard
            setTimeout(() => {
              window.location.href = '/clinic/onboarding/step-1';
            }, 500);
          }
        } else {
          // Just verification (new registration)
          toast.success('Mobile verified successfully!');
          // Keep on same screen for now
        }
      }
    } catch (error) {
      console.error('Verify Mobile OTP error:', error);
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
      setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Verify Email OTP (for signup)
  const handleVerifyEmailOTP = async () => {
    if (!validateForm()) return;

    const otpValue = formData.otp.join('');
    setLoading(true);
    
    try {
      const response = await axios.post('/auth/register-email-otp/verify', {
        email: formData.email,
        otp: otpValue,
        name: formData.name,
        role: 'CLINIC_OWNER',
      });
      
      if (response.data.success) {
        const { user, accessToken: token } = response.data.data;
        
        storeLogin({ user, token });
        
        // Check user status for redirect
        if (user.status === 'PENDING') {
          toast.success('Login successful! Your application is pending approval.');
          onClose();
          
          // Redirect to pending dashboard
          setTimeout(() => {
            window.location.href = '/clinic/dashboard/pending';
          }, 500);
        } else {
          toast.success('Registration successful!');
          onClose();
          
          // Redirect to clinic onboarding
          setTimeout(() => {
            window.location.href = '/clinic/onboarding/step-1';
          }, 500);
        }
      }
    } catch (error) {
      console.error('Verify Email OTP error:', error);
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
      setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => e.target === e.currentTarget && handleCloseAttempt()}
    >
      <div 
        className="bg-white rounded-lg relative"
        style={{ 
          width: '560px', 
          maxWidth: '90vw', 
          maxHeight: 'calc(100vh - 2rem)',
          borderRadius: '10px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleCloseAttempt}
          className="absolute text-gray-600 hover:text-gray-900 transition-colors z-10"
          style={{ top: '24px', right: '24px' }}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.60)', 
              borderRadius: '10px' 
            }}
          >
            <div 
              className="bg-white mx-4"
              style={{ 
                width: '420px',
                maxWidth: '90vw',
                padding: '40px 32px',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: '#1F2937', 
                marginBottom: '32px',
                textAlign: 'center',
                lineHeight: '1.5',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}>
                Are you sure you want to terminate the verification?
              </h3>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCancelExit}
                  className="rounded-lg transition-all"
                  style={{ 
                    backgroundColor: '#E5E7EB',
                    color: '#374151',
                    fontSize: '16px',
                    fontWeight: 600,
                    height: '48px',
                    paddingLeft: '48px',
                    paddingRight: '48px',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: '110px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#D1D5DB'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#E5E7EB'}
                >
                  No
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="rounded-lg transition-all"
                  style={{ 
                    backgroundColor: '#2F73E8',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 600,
                    height: '48px',
                    paddingLeft: '48px',
                    paddingRight: '48px',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: '110px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1E5FD8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2F73E8'}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-y-auto" style={{ padding: '32px', maxHeight: 'calc(100vh - 2rem)' }}>
          {/* LOGIN VIEW - Email or Mobile OTP */}
          {view === 'login' && (
            <>
              <h2 style={{ fontSize: '32px', fontWeight: 400, color: '#555555', marginBottom: '32px', lineHeight: '1.2' }}>
                Login
              </h2>
              
              {/* Phone Input Card */}
              {loginMethod === 'mobile' && (
                <div className="mb-6">
                  <div 
                    className="flex items-center border rounded-lg overflow-hidden"
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
              )}

              {/* Email Input Card */}
              {loginMethod === 'email' && (
                <div className="mb-6">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="Email"
                    className="w-full px-4 border rounded-lg outline-none"
                    style={{ height: '56px', borderColor: errors.email ? '#EF4444' : '#D5D5D5', fontSize: '16px' }}
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>
              )}

              {/* Send OTP Button */}
              <button
                onClick={loginMethod === 'mobile' ? handleSendMobileOTP : handleSendEmailLoginOTP}
                disabled={loading}
                className="w-full rounded-lg text-white font-medium mb-6 transition-all"
                style={{ 
                  height: '52px', 
                  backgroundColor: '#2F73E8', 
                  fontSize: '17px', 
                  fontWeight: 500 
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1E5FD8')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2F73E8')}
              >
                {loading ? 'Sending...' : 'Send One Time Password'}
              </button>

              {/* Divider with "or" */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t" style={{ borderColor: '#D5D5D5' }}></div>
                <span className="px-4 text-gray-500 text-sm">or</span>
                <div className="flex-1 border-t" style={{ borderColor: '#D5D5D5' }}></div>
              </div>

              {/* Toggle Login Method Button */}
              <button
                onClick={() => setLoginMethod(loginMethod === 'mobile' ? 'email' : 'mobile')}
                className="w-full border rounded-lg flex items-center justify-center gap-3 mb-6 transition-all"
                style={{ 
                  height: '52px', 
                  borderColor: '#D5D5D5',
                  backgroundColor: '#FFFFFF'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFFFF'}
              >
                {loginMethod === 'mobile' ? (
                  <>
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="font-medium" style={{ color: '#374151', fontSize: '16px' }}>Continue with Email</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '20px' }}>📱</span>
                    <span className="font-medium" style={{ color: '#374151', fontSize: '16px' }}>Continue with Mobile</span>
                  </>
                )}
              </button>

              {/* Create Account Link */}
              <div className="text-center">
                <span style={{ color: '#6B7280', fontSize: '15px' }}>New to PulseMate Connect? </span>
                <button 
                  onClick={() => setView('signup')}
                  className="font-medium hover:underline"
                  style={{ color: '#EF4444', fontSize: '15px' }}
                >
                  Create account
                </button>
              </div>
            </>
          )}

          {/* SIGNUP VIEW - Email OTP */}
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
                onClick={handleSendEmailOTP}
                disabled={loading}
                className="w-full rounded-md text-white font-medium mb-4"
                style={{ height: '52px', backgroundColor: '#2F73E8', fontSize: '17px', fontWeight: 500 }}
              >
                {loading ? 'Sending...' : 'Continue'}
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
              <h2 style={{ fontSize: '34px', fontWeight: 600, color: '#1F2937', marginBottom: '16px', lineHeight: '1.2', textAlign: 'center' }}>
                OTP Verification
              </h2>
              <p style={{ fontSize: '17px', color: '#6B7280', marginBottom: '32px', textAlign: 'center', lineHeight: '1.6' }}>
                {formData.mobile ? (
                  <>Verification code has been sent to your registered mobile number <span style={{ fontWeight: 600, color: '#111827' }}>+91 {formData.mobile.slice(0, 2)}******{formData.mobile.slice(-2)}</span>. Please enter the OTP below to continue your clinic registration. Valid for 10 minutes.</>
                ) : (
                  <>Verification code has been sent to your registered email, <span style={{ fontWeight: 600, color: '#111827' }}>{formData.email.slice(0, 2)}{'*'.repeat(Math.max(0, formData.email.indexOf('@') - 2))}{formData.email.slice(formData.email.indexOf('@'))}</span>. Please enter the OTP below to complete your clinic partner registration. Valid for 10 minutes.</>
                )}
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
                    className="text-center border-2 rounded-lg outline-none transition-all"
                    style={{ 
                      width: '70px', 
                      height: '60px', 
                      fontSize: '24px', 
                      fontWeight: 600, 
                      borderColor: digit ? '#2F73E8' : '#D1D5DB',
                      backgroundColor: digit ? '#EFF6FF' : '#FFFFFF'
                    }}
                  />
                ))}
              </div>
              {errors.otp && <p className="text-red-600 text-sm text-center mb-4">{errors.otp}</p>}

              <button
                onClick={() => {
                  // For login: check loginMethod (mobile or email)
                  // For signup: always use email
                  if (formData.mobile && loginMethod === 'mobile') {
                    handleVerifyMobileOTP();
                  } else {
                    handleVerifyEmailOTP();
                  }
                }}
                disabled={loading}
                className="w-full rounded-lg text-white font-semibold mb-6 transition-all hover:opacity-90"
                style={{ height: '56px', backgroundColor: '#2F73E8', fontSize: '17px', fontWeight: 600 }}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div className="text-center mb-4" style={{ fontSize: '36px', fontWeight: 600, color: '#1F2937', letterSpacing: '0.02em' }}>
                {Math.floor(countdown / 60).toString().padStart(2, '0')}:{(countdown % 60).toString().padStart(2, '0')}
              </div>

              <div className="text-center mb-6">
                {countdown > 0 ? (
                  <p style={{ fontSize: '18px', color: '#6B7280' }}>
                    Not received OTP? <span style={{ color: '#9CA3AF', fontWeight: 500 }}>Resend in {countdown}s</span>
                  </p>
                ) : (
                  <p style={{ fontSize: '18px', color: '#6B7280' }}>
                    Not received OTP?{' '}
                    <button 
                      onClick={handleResendOTP} 
                      className="font-semibold hover:underline transition-all"
                      style={{ color: '#2F73E8' }}
                    >
                      Resend Now
                    </button>
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  // Return to appropriate view based on method
                  if (formData.mobile && loginMethod === 'mobile') {
                    setView('login');
                  } else if (formData.email && loginMethod === 'email') {
                    setView('login');
                  } else {
                    setView('signup');
                  }
                  setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
                }}
                className="text-base hover:underline block mx-auto transition-all"
                style={{ color: '#6B7280' }}
              >
                ← Change {formData.mobile && loginMethod === 'mobile' ? 'phone number' : 'email'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicAuthModal;
