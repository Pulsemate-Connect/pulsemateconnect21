import React, { useState } from 'react';
import FormInput from '../shared/FormInput';
import useAuthStore from '../../../../../store/authStore';
import toast from 'react-hot-toast';
import OTPModal from '../modals/OTPModal';

const OwnerDetailsCard = ({ register, errors, watch, setValue, clearErrors }) => {
  const { user } = useAuthStore(); // Get authenticated user for email display
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [verifiedNumbers, setVerifiedNumbers] = useState(new Set()); // Track ALL verified numbers
  const [verificationId, setVerificationId] = useState(null); // Store verification ID from API
  
  const mobileValue = watch?.('ownerMobile');
  const mobileVerified = watch?.('mobileVerified');

  // Check if current number is in the verified set
  const isCurrentNumberVerified = mobileVerified && verifiedNumbers.has(mobileValue);

  // Restore verified numbers from localStorage on mount
  React.useEffect(() => {
    const checkVerificationStatus = async () => {
      // DON'T restore from localStorage - always start fresh for mobile verification
      // This ensures users must verify their mobile number each time they register
      
      // If we have a mobile value, check database only if user is editing existing onboarding data
      // For new registrations, always require fresh verification
      const isEditingExisting = localStorage.getItem('clinic_onboarding_editing_mode') === 'true';
      
      if (isEditingExisting && mobileValue && mobileValue.length === 10) {
        try {
          console.log('[OTP] Checking database for verification status:', mobileValue);
          const response = await fetch(`/api/auth/check-mobile-verification/${mobileValue}`);
          const data = await response.json();

          if (response.ok && data.data?.verified) {
            console.log('[OTP] Mobile verified in database!');
            setVerifiedNumbers(prev => {
              const newSet = new Set(prev);
              newSet.add(mobileValue);
              return newSet;
            });
            setValue('mobileVerified', true);
          }
        } catch (error) {
          console.error('[OTP] Failed to check verification from database:', error);
        }
      }
    };

    checkVerificationStatus();
  }, []); // Run only on mount

  // Smart verification management when mobile number changes
  React.useEffect(() => {
    if (verifiedNumbers.has(mobileValue)) {
      // Current number is in verified set → auto-verify
      if (!mobileVerified) {
        setValue('mobileVerified', true);
      }
    } else if (mobileVerified) {
      // Current number is NOT in verified set but form says verified → unverify
      setValue('mobileVerified', false);
    }
  }, [mobileValue, mobileVerified, verifiedNumbers, setValue]);

  const handleSendOTP = async () => {
    if (!mobileValue || mobileValue.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsVerifying(true);
    
    try {
      const phoneNumber = `+91${mobileValue}`;
      
      console.log('[OTP] Sending OTP request with phoneNumber:', phoneNumber);
      
      // Check if it's a test number
      const testNumbers = ['9999999999', '8888888888', '7777777777'];
      const isTestNumber = testNumbers.includes(mobileValue);
      
      if (isTestNumber) {
        // For test numbers, don't make API call - just show success
        console.log('[OTP] Test number detected - using test OTP: 123456');
        setTimeout(() => {
          setOtpSent(true);
          setShowOtpModal(true);
          setIsVerifying(false);
          toast.success('Test OTP sent! Use: 123456', {
            duration: 4000,
            position: 'top-center',
          });
        }, 500);
        return;
      }
      
      // For real numbers, call API
      console.log('[OTP] Calling API with payload:', { phoneNumber });
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          purpose: 'ONBOARDING', // ✅ FIX: Add purpose to skip login validation during onboarding
        }),
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      console.log('[OTP] Response status:', response.status);
      console.log('[OTP] Response content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        // Response is not JSON - likely an error page or empty response
        const text = await response.text();
        console.error('[OTP] Non-JSON response:', text);
        throw new Error('Server error: Invalid response format. Check backend logs.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      console.log('[OTP] Sent successfully:', data);
      
      // Store verification ID for later verification
      if (data.data?.verificationId) {
        setVerificationId(data.data.verificationId);
        console.log('[OTP] Stored verification ID:', data.data.verificationId);
      }
      
      setOtpSent(true);
      setShowOtpModal(true);
      setIsVerifying(false);
      toast.success('OTP sent to your mobile number!');
    } catch (error) {
      console.error('[OTP] Send error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const phoneNumber = `+91${mobileValue}`;
      
      // Check if it's a test number with test OTP
      const testNumbers = ['9999999999', '8888888888', '7777777777'];
      const isTestNumber = testNumbers.includes(mobileValue);
      const isTestOTP = otp === '123456';
      
      if (isTestNumber && isTestOTP) {
        // Test number with test OTP - verify immediately
        console.log('[OTP] Test verification successful');
        setValue('mobileVerified', true, { shouldValidate: true }); // ✅ FIX: Force validation to update
        clearErrors?.('mobileVerified'); // ✅ FIX: Explicitly clear the error
        
        // Add to verified numbers set
        setVerifiedNumbers(prev => {
          const newSet = new Set(prev);
          newSet.add(mobileValue);
          // Save to localStorage
          localStorage.setItem('clinic_onboarding_verified_numbers', JSON.stringify([...newSet]));
          return newSet;
        });
        
        setShowOtpModal(false);
        toast.success('Mobile number verified successfully!');
        return;
      }
      
      // For real numbers or non-test OTP, call API
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          otp: otp,
          verificationId: verificationId, // Include verification ID
          purpose: 'ONBOARDING', // ✅ FIX: Add purpose to skip login/user creation
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      console.log('[OTP] Verified successfully:', data);
      
      // On success:
      setValue('mobileVerified', true, { shouldValidate: true }); // ✅ FIX: Force validation to update
      clearErrors?.('mobileVerified'); // ✅ FIX: Explicitly clear the error
      
      // Add to verified numbers set
      setVerifiedNumbers(prev => {
        const newSet = new Set(prev);
        newSet.add(mobileValue);
        // Save to localStorage
        localStorage.setItem('clinic_onboarding_verified_numbers', JSON.stringify([...newSet]));
        return newSet;
      });
      
      setShowOtpModal(false);
      toast.success('Mobile number verified successfully!');
    } catch (error) {
      console.error('[OTP] Verify error:', error);
      toast.error(error.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
        {/* Card Header */}
        <div className="border-b border-gray-100 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Owner / administrator details
          </h2>
          <p className="text-sm text-gray-600">
            Your registration details have been pre-filled. Please verify and complete the mobile verification.
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Full Name */}
          <FormInput
            name="ownerName"
            placeholder="Full Name"
            required
            register={register}
            watch={watch}
            error={errors?.ownerName?.message}
            showLabel={false}
          />

          {/* Email Address - Read-only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                {...register('ownerEmail')}
                type="email"
                disabled={true}
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed focus:outline-none"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              This email is verified from your registration and cannot be changed
            </p>
          </div>

          {/* Mobile Number with Verification */}
          <div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <FormInput
                  name="ownerMobile"
                  type="tel"
                  placeholder="Mobile Number"
                  prefix="+91"
                  maxLength={10}
                  register={register}
                  watch={watch}
                  error={errors?.ownerMobile?.message}
                  className="flex-1"
                  showLabel={false}
                  required
                />
                {/* Green tick inside input when verified */}
                {isCurrentNumberVerified && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {!isCurrentNumberVerified && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={!mobileValue || mobileValue.length !== 10 || isVerifying}
                  className={`
                    px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                    ${
                      !mobileValue || mobileValue.length !== 10 || isVerifying
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  `}
                >
                  {isVerifying ? 'Sending...' : 'Send OTP'}
                </button>
              )}
            </div>
            
            {errors?.mobileVerified && !isCurrentNumberVerified && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.mobileVerified.message}
              </p>
            )}
            
            {isCurrentNumberVerified && (
              <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Mobile number verified successfully
              </p>
            )}
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <OTPModal
          mobileNumber={mobileValue}
          onVerify={handleVerifyOTP}
          onClose={() => setShowOtpModal(false)}
          onResend={handleSendOTP}
        />
      )}
    </>
  );
};

export default OwnerDetailsCard;
