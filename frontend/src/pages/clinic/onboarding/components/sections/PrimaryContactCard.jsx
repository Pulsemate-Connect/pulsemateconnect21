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
            name="primaryContactPhone"
            type="tel"
            placeholder="Primary Contact Number"
            prefix="+91"
            maxLength={10}
            required
            register={register}
            watch={watch}
            error={errors?.primaryContactPhone?.message}
            helpText="This number will be displayed to patients on your clinic profile"
            showLabel={false}
          />
        )}
      </div>
    </div>
  );
};

export default PrimaryContactCard;
