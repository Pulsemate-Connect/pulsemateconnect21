import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { firebasePhoneLogin } from '../../api/auth.api';
import { initRecaptcha, sendOtpToPhone, verifyPhoneOtp, clearRecaptcha, forceResetRecaptcha } from '../../api/firebaseAuth';
import useAuthStore from '../../store/authStore';
import PulsemateLogo from '../../components/PulsemateLogo';

/* ── tiny SVG icons ─────────────────────────────────────────────────────── */
const IconCalendar = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconUsers = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconClipboard = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" />
  </svg>
);
const IconSend = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconShield = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconLock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconPhone = () => (
  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.38 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

/* ── Queue illustration ───────────────────────────────────────────────────── */
const QueueIllustration = () => (
  <div className="flex items-center justify-center gap-3 py-2">
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-8 h-8">
          <circle cx="20" cy="12" r="7" fill="#93C5FD" />
          <path d="M6 38c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#BFDBFE" />
          <rect x="22" y="18" width="10" height="14" rx="2" fill="#3B82F6" />
          <rect x="23" y="20" width="8" height="9" rx="1" fill="#EFF6FF" />
        </svg>
      </div>
    </div>
    <div className="text-gray-400 text-lg font-bold">→</div>
    <div className="bg-white rounded-2xl shadow-lg px-4 py-3 text-center border border-blue-100 min-w-[88px]">
      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Your Queue</p>
      <p className="text-3xl font-black text-gray-900 leading-none mt-0.5">#12</p>
      <p className="text-[9px] text-gray-400 mt-1">Estimated Wait</p>
      <p className="text-sm font-bold text-blue-600">25 min</p>
      <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full w-3/5 bg-green-400 rounded-full" />
      </div>
    </div>
    <div className="text-gray-400 text-lg font-bold">→</div>
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-8 h-8">
          <circle cx="20" cy="12" r="7" fill="#6EE7B7" />
          <path d="M6 38c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#A7F3D0" />
          <path d="M18 26 Q14 28 14 32 Q14 36 18 36 Q22 36 22 32" stroke="#10B981" strokeWidth="1.5" fill="none" />
          <circle cx="22" cy="32" r="2" fill="#10B981" />
          <path d="M22 26 L22 30" stroke="#10B981" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  </div>
);

/* ── Step indicator ──────────────────────────────────────────────────────── */
const StepIndicator = ({ current }) => {
  const steps = ['Enter Number', 'Get OTP', 'Verified'];
  return (
    <div className="flex items-center justify-center gap-1.5 mt-5">
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = current === idx;
        const done = current > idx;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {done ? <IconCheck /> : idx}
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-5 h-px ${current > idx ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Main page ───────────────────────────────────────────────────────────── */
const LoginPage = () => {
  const [step, setStep]                     = useState(1);
  const [mobile, setMobile]                 = useState('');
  const [otp, setOtp]                       = useState('');
  const [isLoading, setIsLoading]           = useState(false);
  const [countdown, setCountdown]           = useState(0);
  const [confirmationResult, setConfResult] = useState(null);

  const otpInputRef = useRef(null);

  const navigate    = useNavigate();
  const { setAuth } = useAuthStore();

  // Clean up reCAPTCHA only on unmount
  useEffect(() => {
    return () => { clearRecaptcha(); };
  }, []);

  // Web OTP API - Auto-read OTP from SMS
  useEffect(() => {
    if (step === 2 && 'OTPCredential' in window) {
      const abortController = new AbortController();
      navigator.credentials.get({ otp: { transport: ['sms'] }, signal: abortController.signal })
        .then(c => { if (c?.code) { setOtp(c.code); toast.success('OTP auto-filled from SMS'); } })
        .catch(() => {});
      return () => abortController.abort();
    }
  }, [step]);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
    }, 1000);
  };

  const normalisePhone = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10)                            return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (raw.trim().startsWith('+'))                      return raw.trim();
    return `+91${digits}`;
  };

  /* ── Step 1: send OTP via Firebase JS SDK ──────────────────────────────── */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!mobile.trim()) return toast.error('Enter your mobile number');
    setIsLoading(true);
    try {
      const phone  = normalisePhone(mobile);
      const result = await sendOtpToPhone(phone);
      setConfResult(result);
      setStep(2);
      startCountdown();
      toast.success('OTP sent to your mobile');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Step 2: verify OTP ─────────────────────────────────────────────────── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6)    return toast.error('Enter the 6-digit OTP');
    if (!confirmationResult) return toast.error('Session expired. Please resend OTP.');
    setIsLoading(true);
    try {
      const firebaseIdToken = await verifyPhoneOtp(confirmationResult, otp);
      const res             = await firebasePhoneLogin(firebaseIdToken);
      const { accessToken, user } = res.data.data;
      setStep(3);
      setTimeout(() => { setAuth(user, accessToken); navigate('/patient/home'); }, 600);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF4FF] flex flex-col items-center justify-start px-4 py-6 overflow-y-auto">

      <div className="w-full max-w-sm">

        {/* Top bar */}
        <div className="flex items-start justify-between mb-5">
          <PulsemateLogo size="md" theme="light" showTagline={false} />
          <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-green-100">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <IconShield />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-800 leading-none">Secure Login</p>
              <p className="text-[9px] text-gray-400 leading-none mt-0.5">256-bit SSL</p>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Healthcare Platform
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Book · Track · Connect</p>
        </div>

        {/* Feature chips */}
        <div className="flex gap-2 justify-center mb-5 flex-wrap">
          {[
            { icon: <IconCalendar />, label: 'Book',  sub: 'Appointments' },
            { icon: <IconUsers />,    label: 'Track', sub: 'Live Queue' },
            { icon: <IconClipboard />, label: 'Get',  sub: 'Prescriptions' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-blue-50">
              <div className="text-blue-500">{f.icon}</div>
              <div>
                <p className="text-[11px] font-bold text-gray-800 leading-none">{f.label}</p>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Hero illustration */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 px-4 py-4 mb-4">
          <QueueIllustration />
          <div className="text-center mt-3">
            <p className="font-black text-gray-900 text-base leading-tight">Skip the waiting room.</p>
            <p className="text-blue-600 font-bold text-sm mt-0.5">Book and track appointments in real time.</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-md border border-blue-50 px-5 py-5">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <IconPhone />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Enter Your Mobile Number</p>
                  <p className="text-[11px] text-gray-400 leading-tight">We'll send you a one-time password (OTP)</p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 cursor-default select-none flex-shrink-0">
                  <span className="text-base leading-none">🇮🇳</span>
                  <span className="text-sm font-semibold text-gray-700">+91</span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <input
                  type="tel"
                  autoFocus
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="98765 43210"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
                  required
                />
              </div>

              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <IconCheck />
                </div>
                <p className="text-[11px] text-green-600 font-medium">Verified by Firebase — no password needed</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-200"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <IconSend />}
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <StepIndicator current={1} />
            </form>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">OTP sent to</p>
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
                  className="text-[11px] text-blue-500 hover:text-blue-700 font-semibold underline"
                >
                  Change
                </button>
              </div>

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Enter 6-digit OTP</label>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="● ● ● ● ● ●"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-black tracking-[0.5em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white mb-4"
              />

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-200"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="text-center mt-3">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-400">Resend in <span className="font-bold text-gray-600">{countdown}s</span></p>
                ) : (
                  <button type="button" onClick={handleSendOtp} className="text-xs text-blue-600 font-semibold hover:text-blue-700">
                    Resend OTP
                  </button>
                )}
              </div>

              <StepIndicator current={2} />
            </form>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="font-black text-gray-900 text-base">Verified!</p>
              <p className="text-xs text-gray-400 mt-1">Redirecting you...</p>
              <StepIndicator current={3} />
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-5 mt-4 px-2">
          {[
            { icon: <IconShield />, label: 'Secure OTP Login' },
            { icon: <IconLock />,   label: 'No Password Required' },
            { icon: <IconUsers />,  label: 'Trusted by Clinics' },
          ].map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-1 flex-1">
              <div className="text-blue-400">{b.icon}</div>
              <p className="text-[10px] text-gray-500 font-medium text-center leading-tight">{b.label}</p>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div className="mt-4 bg-white rounded-2xl border border-blue-50 px-4 py-3 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <IconLock />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Your number is only used for authentication and is never shared with third parties.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1 flex-shrink-0">
            <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-green-700">OTP Verified</span>
          </div>
        </div>

        {/* Footer links */}
        <p className="text-center text-[11px] text-gray-400 mt-4 leading-relaxed px-2">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 font-semibold hover:underline">Terms &amp; Conditions</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-blue-600 font-semibold hover:underline">Privacy Policy</Link>
        </p>
        <div className="flex flex-col items-center gap-1 mt-4 pb-4">
          <p className="text-xs text-gray-400">
            Staff member?{' '}
            <Link to="/staff/login" className="text-blue-600 font-semibold hover:underline">Use staff login</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
