import React, { useEffect } from 'react';
import FormCheckbox from '../shared/FormCheckbox';
import FormInput from '../shared/FormInput';

const PrimaryContactCard = ({ register, errors, watch, setValue }) => {
  const sameAsOwner = watch?.('sameAsOwner');
  const ownerMobile = watch?.('ownerMobile');

  // Auto-fill primary contact when "same as owner" is checked
  useEffect(() => {
    if (sameAsOwner && ownerMobile) {
      setValue('primaryContactPhone', ownerMobile);
    } else if (!sameAsOwner) {
      setValue('primaryContactPhone', '');
    }
  }, [sameAsOwner, ownerMobile, setValue]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Clinic's primary contact
        </h2>
        <p className="text-sm text-gray-600">
          Patients and PulseMate support may use this number for clinic-related communication.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Checkbox: Same as owner */}
        <FormCheckbox
          label="Same as owner mobile number"
          name="sameAsOwner"
          register={register}
          helpText="Use the owner's mobile number as the primary contact"
        />

        {/* Conditional Primary Contact Phone */}
        {!sameAsOwner && (
          <FormInput
            label="Primary Contact Number"
            name="primaryContactPhone"
            type="tel"
            placeholder="Enter phone number"
            prefix="+91"
            maxLength={10}
            required
            register={register}
            error={errors?.primaryContactPhone?.message}
            helpText="This number will be displayed to patients on your clinic profile"
          />
        )}

        {/* Info message when same as owner */}
        {sameAsOwner && ownerMobile && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Primary contact set
              </p>
              <p className="text-sm text-blue-700">
                Your clinic's primary contact number is: <span className="font-semibold">+91 {ownerMobile}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrimaryContactCard;
