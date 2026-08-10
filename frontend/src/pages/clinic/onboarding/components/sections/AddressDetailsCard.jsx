import React from 'react';
import FormInput from '../shared/FormInput';
import FormSelect from '../shared/FormSelect';
import { INDIAN_STATES } from '../../../../../utils/constants/clinicTypes';

const AddressDetailsCard = ({ register, errors }) => {
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
        <p className="text-sm text-gray-600">
          Provide complete address information for your clinic.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Address Line 1 */}
        <FormInput
          label="Address Line 1"
          name="addressLine1"
          placeholder="Building / clinic number, street"
          required
          register={register}
          error={errors?.addressLine1?.message}
          helpText="e.g., Shop No. 12, MG Road"
        />

        {/* Address Line 2 */}
        <FormInput
          label="Address Line 2"
          name="addressLine2"
          placeholder="Area / locality"
          required
          register={register}
          error={errors?.addressLine2?.message}
          helpText="e.g., Koramangala 4th Block"
        />

        {/* Landmark (Optional) */}
        <FormInput
          label="Landmark"
          name="landmark"
          placeholder="Nearby landmark (optional)"
          register={register}
          error={errors?.landmark?.message}
          helpText="e.g., Near Sony World Signal, Opposite ICICI Bank"
        />

        {/* City and State Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* City */}
          <FormInput
            label="City"
            name="city"
            placeholder="City"
            required
            register={register}
            error={errors?.city?.message}
          />

          {/* State */}
          <FormSelect
            label="State"
            name="state"
            options={stateOptions}
            placeholder="Select state"
            required
            register={register}
            error={errors?.state?.message}
          />
        </div>

        {/* Pincode and Country Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pincode */}
          <FormInput
            label="Pincode"
            name="pincode"
            type="tel"
            placeholder="6-digit pincode"
            maxLength={6}
            required
            register={register}
            error={errors?.pincode?.message}
          />

          {/* Country (Read-only) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Country
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
              India
            </div>
            <p className="text-xs text-gray-500">
              Currently, PulseMate Connect is available only in India
            </p>
          </div>
        </div>
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
