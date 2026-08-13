import React, { useState, useRef, useEffect } from 'react';

const OTPModal = ({ mobileNumber, onVerify, onClose, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60); // 60 seconds = 1 minute
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, go to previous box
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
    // Handle left/right arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      pastedData.split('').forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);

      // Focus the next empty box or last box
      const nextEmptyIndex = newOtp.findIndex((val, idx) => idx >= pastedData.length && !val);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }

      // Auto-submit if all 6 digits are pasted
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };

  const handleVerify = async (otpValue) => {
    setIsVerifying(true);
    await onVerify(otpValue);
    setIsVerifying(false);
  };

  const handleResend = () => {
    if (!canResend) return;
    
    // Reset timer and OTP
    setResendTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    
    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    // Call parent's resend handler
    if (onResend) {
      onResend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Verify Mobile Number
        </h3>
        <p className="text-sm text-gray-600 mb-8">
          Enter the 6-digit OTP sent to <span className="font-medium text-gray-900">+91 {mobileNumber}</span>
        </p>

        {/* 6-Box OTP Input */}
        <div className="flex gap-3 justify-center mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isVerifying}
              className={`
                w-12 h-14 text-center text-2xl font-semibold
                border-2 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-all duration-200
                ${digit ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
                ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
          ))}
        </div>

        {/* Manual Verify Button (optional, since auto-submit works) */}
        <button
          type="button"
          onClick={() => handleVerify(otp.join(''))}
          disabled={otp.some(d => !d) || isVerifying}
          className={`
            w-full py-3 rounded-xl font-semibold transition-all duration-200
            ${
              otp.some(d => !d) || isVerifying
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isVerifying ? 'Verifying...' : 'Verify OTP'}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={isVerifying}
          className="mt-3 w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          Cancel
        </button>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive OTP?{' '}
            <button
              type="button"
              disabled={!canResend}
              className={`font-medium transition-colors ${
                canResend 
                  ? 'text-blue-600 hover:text-blue-700 cursor-pointer' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              onClick={handleResend}
            >
              Resend
            </button>
            {!canResend && (
              <span className="text-gray-500">
                {' '}(in {resendTimer}s)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
