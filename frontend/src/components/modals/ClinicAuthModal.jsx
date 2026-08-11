import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';

const ClinicAuthModal = ({ isOpen, onClose, initialMode = 'register' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [loginMethod, setLoginMethod] = useState('mobile'); // 'mobile' | 'email'
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    otp: '',
  });
  
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    if (mode === 'register') {
      if (!formData.name || formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Valid email is required';
      }
    }

    if (mode === 'login' && loginMethod === 'email') {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Valid email is required';
      }
    }

    if (mode === 'register' || loginMethod === 'mobile') {
      if (!formData.mobile || !/^[6-9]\d{9}$/.test(formData.mobile)) {
        newErrors.mobile = 'Valid 10-digit mobile number required';
      }
    }

    if (step === 'otp') {
      if (!formData.otp || formData.otp.length !== 6) {
        newErrors.otp = 'Enter 6-digit OTP';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        mobile: formData.mobile,
        purpose: mode === 'register' ? 'VERIFY_MOBILE' : 'LOGIN',
      };

      await api.post('/auth/send-otp', payload);
      
      setStep('otp');
      setCountdown(30);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (countdown === 0) {
      setFormData({ ...formData, otp: '' });
      handleSendOTP();
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        mobile: formData.mobile,
        otp: formData.otp,
      };

      const response = await api.post('/auth/verify-otp', payload);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Check if user is CLINIC_OWNER
        if (user.role !== 'CLINIC_OWNER') {
          toast.error('This login is only for clinic owners');
          return;
        }

        // Store auth data
        storeLogin({ user, token });
        
        toast.success('Login successful!');
        onClose();
        
        // Redirect to onboarding
        navigate('/clinic/onboarding/step-1');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        otp: formData.otp,
        role: 'CLINIC_OWNER',
      };

      const response = await api.post('/auth/register', payload);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store auth data
        storeLogin({ user, token });
        
        toast.success('Registration successful!');
        onClose();
        
        // Redirect to onboarding
        navigate('/clinic/onboarding/step-1');
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const resetModal = () => {
    setStep('input');
    setFormData({ name: '', email: '', mobile: '', otp: '' });
    setErrors({});
    setCountdown(0);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetModal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">PulseMate Connect</h2>
            <p className="text-sm text-gray-600 mt-1">Partner with us</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-4 font-semibold transition ${
              mode === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-4 font-semibold transition ${
              mode === 'register'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' ? (
            <>
              {/* Register Form */}
              {mode === 'register' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                </>
              )}

              {/* Login: Method Toggle */}
              {mode === 'login' && (
                <div className="mb-4">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setLoginMethod('mobile')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                        loginMethod === 'mobile'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Mobile
                    </button>
                    <button
                      onClick={() => setLoginMethod('email')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                        loginMethod === 'email'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Input */}
              {(mode === 'register' || loginMethod === 'mobile') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-lg text-gray-700">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                  {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                </div>
              )}

              {/* Email Input for Login */}
              {mode === 'login' && loginMethod === 'email' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              {/* OTP Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP *
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  We've sent a 6-digit OTP to +91 {formData.mobile}
                </p>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
                {errors.otp && <p className="text-red-500 text-sm mt-1 text-center">{errors.otp}</p>}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed mb-4"
              >
                {loading ? 'Verifying...' : mode === 'login' ? 'Verify & Login' : 'Verify & Register'}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-600">
                    Resend OTP in <span className="font-semibold">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={resetModal}
                className="w-full mt-4 text-sm text-gray-600 hover:text-gray-800"
              >
                ← Change mobile number
              </button>
            </>
          )}

          {/* Switch Mode Link */}
          <div className="mt-6 text-center text-sm">
            {mode === 'login' ? (
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button onClick={() => switchMode('register')} className="text-blue-600 font-medium hover:text-blue-700">
                  Register
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-blue-600 font-medium hover:text-blue-700">
                  Login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicAuthModal;
