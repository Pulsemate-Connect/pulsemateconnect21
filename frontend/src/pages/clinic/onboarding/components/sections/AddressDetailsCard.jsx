import React from 'react';
import FormInput from '../shared/FormInput';
import FormSelect from '../shared/FormSelect';
import { INDIAN_STATES } from '../../../../../utils/constants/clinicTypes';

const AddressDetailsCard = ({ register, errors, watch, autoFilledFields = {} }) => {
  // Convert state names to select options
  const stateOptions = INDIAN_STATES.map(state => ({
    value: state,
    label: state,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Add more address details
        </h2>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* 3 Left + 3 Right Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column - 3 Fields */}
          <div className="space-y-5">
            {/* Shop no. / building no. (optional) */}
            <FormInput
              name="addressLine1"
              placeholder="Shop no. / building no. (optional)"
              register={register}
              watch={watch}
              error={errors?.addressLine1?.message}
              showLabel={false}
            />

            {/* Area / Sector / Locality* */}
            <FormInput
              name="locality"
              placeholder="Area / Sector / Locality"
              required
              register={register}
              watch={watch}
              error={errors?.locality?.message}
              showLabel={false}
            />

            {/* Landmark (Optional) */}
            <FormInput
              name="landmark"
              placeholder="Landmark (Optional)"
              register={register}
              watch={watch}
              error={errors?.landmark?.message}
              showLabel={false}
            />
          </div>

          {/* Right Column - 3 Fields */}
          <div className="space-y-5">
            {/* Floor / tower (optional) */}
            <FormInput
              name="addressLine2"
              placeholder="Floor / tower (optional)"
              register={register}
              watch={watch}
              error={errors?.addressLine2?.message}
              showLabel={false}
            />

            {/* City */}
            <FormInput
              name="city"
              placeholder="City"
              required
              register={register}
              watch={watch}
              error={errors?.city?.message}
              showLabel={false}
              readOnly={autoFilledFields.city}
            />

            {/* Pincode */}
            <FormInput
              name="pincode"
              type="tel"
              placeholder="Pincode"
              maxLength={6}
              required
              register={register}
              watch={watch}
              error={errors?.pincode?.message}
              showLabel={false}
              readOnly={autoFilledFields.pincode}
            />
          </div>
        </div>

        {/* Full Width Field Below */}
        <FormSelect
          name="state"
          options={stateOptions}
          placeholder="State"
          required
          register={register}
          error={errors?.state?.message}
          showLabel={false}
          disabled={autoFilledFields.state}
        />
      </div>

      {/* Important Note */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 mb-1">
              Please verify your address
            </p>
            <p className="text-sm text-amber-700">
              Make sure your clinic address is accurate. Patients will use this information to find your clinic. 
              Incorrect addresses may lead to patient complaints and affect your clinic's rating.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressDetailsCard;
