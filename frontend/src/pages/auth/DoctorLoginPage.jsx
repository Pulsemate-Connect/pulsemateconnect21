import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Mail, Smartphone, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

const DoctorLoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [loginMethod, setLoginMethod] = useState('mobile'); // 'mobile' or 'email'
  const [step, setStep] = useState('input'); // 'input' or 'verify'
  
  // Input fields
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // Loading states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (loginMethod === 'mobile') {
      if (mobile.length !== 10) {
        toast.error('Please enter a valid 10-digit mobile number');
        return;
      }
    } else {
      if (!email.trim() || !email.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    try {
      setSendingOtp(true);
      
      if (loginMethod === 'mobile') {
        await api.post('/auth/doctor/send-mobile-otp', { mobile: `+91${mobile}` });
        toast.success('OTP sent to your mobile number');
      } else {
        await api.post('/auth/doctor/send-email-otp', { email });
        toast.success('OTP sent to your email address');
      }
      
      setStep('verify');
    } catch (err) {
      console.error('Error sending OTP:', err);
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyingOtp(true);
      
      let response;
      if (loginMethod === 'mobile') {
        response = await api.post('/auth/doctor/verify-mobile-otp', {
          mobile: `+91${mobile}`,
          otp,
        });
      } else {
        response = await api.post('/auth/doctor/verify-email-otp', {
          email,
          otp,
        });
      }
      
      const { accessToken, refreshToken, user } = response.data.data;
      
      // Store tokens and user data using authStore
      setAuth(user, accessToken, refreshToken);
      
      toast.success('Login successful! Welcome back, Dr. ' + user.name);
      
      // Small delay to ensure state is persisted before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect to doctor dashboard
      navigate('/doctor/dashboard', { replace: true });
    } catch (err) {
      console.error('Error verifying OTP:', err);
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleBackToInput = () => {
    setStep('input');
    setOtp('');
  };

  const handleChangeMethod = () => {
    setLoginMethod(loginMethod === 'mobile' ? 'email' : 'mobile');
    setStep('input');
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🩺 Doctor Login</h1>
          <p className="text-gray-600">Login to access your PulseMate dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Method Toggle */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setLoginMethod('mobile')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                loginMethod === 'mobile'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                loginMethod === 'email'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>

          {step === 'input' ? (
            /* Step 1: Enter Mobile/Email */
            <form onSubmit={handleSendOtp} className="space-y-6">
              {loginMethod === 'mobile' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      maxLength="10"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    We'll send a 6-digit OTP to this number
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    We'll send a 6-digit OTP to this email
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Enter OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={handleBackToInput}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <p className="text-sm text-gray-600">
                    OTP sent to{' '}
                    <span className="font-medium">
                      {loginMethod === 'mobile' ? `+91${mobile}` : email}
                    </span>
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg text-center text-3xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength="6"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  Resend OTP
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || otp.length !== 6}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p className="mb-2">
              Don't have an account?{' '}
              <button onClick={() => navigate('/')} className="text-blue-600 hover:underline font-medium">
                Contact your clinic
              </button>
            </p>
            <p>
              Not a doctor?{' '}
              <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-medium">
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLoginPage;
