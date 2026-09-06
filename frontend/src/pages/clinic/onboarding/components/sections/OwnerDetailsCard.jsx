import React from 'react';
import FormInput from '../shared/FormInput';
import useAuthStore from '../../../../../stores/authStore';

const OwnerDetailsCard = ({ register, errors, watch }) => {
  const { user } = useAuthStore(); // Get authenticated user for email and mobile

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Owner / Administrator Details
        </h2>
        <p className="text-sm text-gray-600">
          Your registration details are pre-filled and verified. These cannot be changed.
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

        {/* Email Address - Read-only (Verified) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
            <span className="text-green-600 ml-2 text-xs font-normal">✓ Verified</span>
          </label>
          <div className="relative">
            <input
              {...register('ownerEmail')}
              type="email"
              disabled={true}
              className="w-full px-4 py-2.5 text-gray-900 border border-green-200 rounded-xl bg-green-50/50 cursor-not-allowed focus:outline-none font-medium"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Email verified during registration
          </p>
        </div>

        {/* Mobile Number - Read-only (Verified) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Mobile Number
            <span className="text-green-600 ml-2 text-xs font-normal">✓ Verified</span>
          </label>
          <div className="relative">
            <input
              {...register('ownerMobile')}
              type="tel"
              disabled={true}
              value={user?.mobile || ''}
              className="w-full px-4 py-2.5 text-gray-900 border border-green-200 rounded-xl bg-green-50/50 cursor-not-allowed focus:outline-none font-mono font-medium"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Mobile verified during registration
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Verified Contact Information</p>
              <p className="text-xs text-blue-700 mt-1">
                Your email and mobile were verified during registration. If you need to change them, please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDetailsCard;
