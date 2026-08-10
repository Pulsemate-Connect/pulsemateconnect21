import React, { useState } from 'react';
import FormInput from '../shared/FormInput';

const OwnerDetailsCard = ({ register, errors, watch, setValue }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  
  const mobileValue = watch?.('ownerMobile');
  const mobileVerified = watch?.('mobileVerified');

  const handleSendOTP = async () => {
    if (!mobileValue || mobileValue.length !== 10) {
      return;
    }

    setIsVerifying(true);
    
    try {
      // TODO: Call API to send OTP
      // await sendOTP(mobileValue);
      
      setTimeout(() => {
        setOtpSent(true);
        setShowOtpModal(true);
        setIsVerifying(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to send OTP:', error);
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = (otp) => {
    // TODO: Verify OTP with API
    console.log('Verifying OTP:', otp);
    
    // On success:
    setValue('mobileVerified', true);
    setShowOtpModal(false);
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
            We'll use these details for clinic-related communication.
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Full Name */}
          <FormInput
            label="Full Name"
            name="ownerName"
            placeholder="Enter full name"
            required
            register={register}
            error={errors?.ownerName?.message}
          />

          {/* Email Address */}
          <FormInput
            label="Email Address"
            name="ownerEmail"
            type="email"
            placeholder="Enter email address"
            required
            register={register}
            error={errors?.ownerEmail?.message}
            helpText="We'll send important updates and notifications to this email"
          />

          {/* Mobile Number with Verification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mobile Number
              <span className="text-red-500 ml-1">*</span>
            </label>
            
            <div className="flex gap-3">
              <FormInput
                name="ownerMobile"
                type="tel"
                placeholder="Enter mobile number"
                prefix="+91"
                maxLength={10}
                register={register}
                error={errors?.ownerMobile?.message}
                disabled={mobileVerified}
                className="flex-1"
              />
              
              {!mobileVerified ? (
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
                  {isVerifying ? 'Sending...' : 'Verify'}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl border border-green-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
            </div>
            
            {errors?.mobileVerified && !mobileVerified && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.mobileVerified.message}
              </p>
            )}
            
            {mobileVerified && (
              <p className="mt-1.5 text-xs text-green-600">
                ✓ Mobile number verified successfully
              </p>
            )}
          </div>
        </div>
      </div>

      {/* OTP Modal - Will create separately */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Verify Mobile Number
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Enter the 6-digit OTP sent to +91 {mobileValue}
            </p>
            
            {/* OTP Input - simplified for now */}
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-widest"
              onChange={(e) => {
                if (e.target.value.length === 6) {
                  handleVerifyOTP(e.target.value);
                }
              }}
            />
            
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="mt-4 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OwnerDetailsCard;
