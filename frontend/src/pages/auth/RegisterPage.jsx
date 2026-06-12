/**
 * RegisterPage — Patient sign-up via Firebase Phone Auth.
 *
 * Identical flow to LoginPage but with an optional name field on step 1.
 * The backend auto-creates a PATIENT account on first Firebase login,
 * so this page is functionally the same as logging in for the first time.
 *
 * Steps:
 *   1. Enter name + mobile  → Firebase sends OTP
 *   2. Enter OTP            → verifyPhoneOtp → gets Firebase ID token
 *                          → POST /api/auth/user/firebase-phone-login { firebaseIdToken, name }
 *   3. Success              → JWT stored → redirect to /patient/home
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { firebasePhoneLogin } from '../../api/auth.api';
import { initRecaptcha, sendOtpToPhone, verifyPhoneOtp, clearRecaptcha, forceResetRecaptcha } from '../../api/firebaseAuth';
import useAuthStore from '../../store/authStore';

/* ── Spinner ──────────────────────────────────────────────────────────────── */
const Spinner = () => (
  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/* ── Step dots ────────────────────────────────────────────────────────────── */
const StepDots = ({ current }) => (
  <div className="flex items-center justify-center gap-2 mt-5">
    {[1, 2, 3].map((n) => (
      <div
        key={n}
        className={`rounded-full transition-all ${
          n === current
            ? 'w-6 h-2 bg-primary-600'
            : n < current
            ? 'w-2 h-2 bg-green-500'
            : 'w-2 h-2 bg-gray-200'
        }`}
      />
    ))}
  </div>
);

const RegisterPage = () => {
  const [step, setStep]           = useState(1); // 1 = name+phone, 2 = OTP, 3 = success
  const [name, setName]           = useState('');
  const [mobile, setMobile]       = useState('');
  const [otp, setOtp]             = useState('');
  const [confirmationResult, setConfResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpInputRef = useRef(null);

  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  useEffect(() => {
    return () => { clearRecaptcha(); };
  }, []);

  /* normalise to E.164 +91XXXXXXXXXX */
  const normalise = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10)                          return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (raw.trim().startsWith('+'))                    return raw.trim();
    return `+91${digits}`;
  };

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  /* ── Step 1: send OTP via Firebase ───────────────────────────────────────── */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!mobile.trim()) return toast.error('Enter your mobile number');
    setIsLoading(true);
    try {
      const phone  = normalise(mobile);
      const result = await sendOtpToPhone(phone);
      setConfResult(result);
      setStep(2);
      startCountdown();
      toast.success('OTP sent via Firebase');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Step 2: verify OTP, get Firebase ID token, login with backend ────────── */
  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    if (!confirmationResult) return toast.error('Session expired. Please resend OTP.');
    setIsLoading(true);
    try {
      /* 1. Verify OTP with Firebase → get ID token */
      const firebaseIdToken = await verifyPhoneOtp(confirmationResult, otp);

      /* 2. Send ID token + optional name to our backend */
      const res = await firebasePhoneLogin(firebaseIdToken, name.trim() || undefined);
      const { accessToken, user } = res.data.data;

      setStep(3);

      /* brief success flash then redirect */
      setTimeout(() => {
        setAuth(user, accessToken);
        navigate('/patient/home');
      }, 700);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      {/* Invisible reCAPTCHA container — MUST always be in DOM */}
      <div id={recaptchaContainerId} style={{ position: 'absolute', bottom: 0, opacity: 0, pointerEvents: 'none' }} />      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center border border-blue-100">
            <svg viewBox="0 0 40 40" className="w-9 h-9">
              <rect width="40" height="40" rx="10" fill="#EFF6FF" />
              <path d="M20 8 L20 32 M8 20 L32 20" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
              <path d="M12 14 Q20 6 28 14 Q36 22 28 30 Q20 38 12 30 Q4 22 12 14Z"
                fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-7">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {step === 3 ? 'Welcome!' : 'Create account'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {step === 1 && 'Join PulseMate as a patient — no password needed.'}
              {step === 2 && 'Enter the OTP sent to your mobile.'}
              {step === 3 && 'Your account is ready.'}
            </p>
          </div>

          {/* ── Step 1: name + mobile ─────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">
                  Full name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
                  placeholder="Rahul Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="mobile">
                  Mobile number
                </label>
                <div className="flex gap-2">
                  {/* Country badge */}
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 select-none flex-shrink-0">
                    <span className="text-base">🇮🇳</span>
                    <span className="text-sm font-semibold text-gray-700">+91</span>
                  </div>
                  <input
                    id="mobile"
                    type="tel"
                    required
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>

              {/* Firebase badge */}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-xs text-green-600 font-medium">Verified by Firebase — no password needed</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Spinner /> : 'Send OTP'}
              </button>

              <StepDots current={1} />
            </form>
          )}

          {/* ── Step 2: OTP input ─────────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-4">
              {/* sent-to banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">OTP sent to</p>
                  <p className="text-sm font-bold text-blue-900">+91 {mobile}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { 
                    setStep(1); 
                    setOtp(''); 
                    setConfResult(null); 
                    clearRecaptcha();
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 font-semibold underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="otp">
                  Enter 6-digit OTP
                </label>
                <input
                  ref={otpInputRef}
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-3xl font-bold tracking-[0.5em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
                  placeholder="● ● ● ● ● ●"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Spinner /> : 'Create account'}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">
                    Resend in <span className="font-bold text-gray-600">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <StepDots current={2} />
            </form>
          )}

          {/* ── Step 3: success ───────────────────────────────────────────── */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-lg">Verified!</p>
              <p className="text-sm text-gray-500 mt-1">Redirecting to your dashboard...</p>
              <StepDots current={3} />
            </div>
          )}

        </div>

        {/* Footer links */}
        <div className="mt-5 text-center space-y-2">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Patient sign in
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            Applying as a{' '}
            <Link to="/register/doctor" className="font-semibold text-green-600 hover:text-green-700">
              Doctor
            </Link>
            {' '}or{' '}
            <Link to="/register/clinic-owner" className="font-semibold text-orange-600 hover:text-orange-700">
              Clinic Owner
            </Link>
            ?
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
