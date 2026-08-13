import React from 'react';
import FormInput from '../shared/FormInput';
import FormSelect from '../shared/FormSelect';
import { CLINIC_TYPES } from '../../../../../utils/constants/clinicTypes';

const ClinicDetailsCard = ({ register, errors, watch }) => {
  const selectedClinicType = watch?.('clinicType');
  const showOtherField = selectedClinicType === 'OTHER';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Clinic details
        </h2>
        <p className="text-sm text-gray-600">
          Patients will see these details on PulseMate Connect.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Clinic Name */}
        <FormInput
          name="clinicName"
          placeholder="Clinic Name"
          required
          register={register}
          watch={watch}
          error={errors?.clinicName?.message}
          helpText="This is the official name of your clinic"
          showLabel={false}
        />

        {/* Clinic Type */}
        <FormSelect
          name="clinicType"
          options={CLINIC_TYPES}
          placeholder="Clinic Type"
          required
          register={register}
          error={errors?.clinicType?.message}
          helpText="Choose the category that best describes your clinic"
          showLabel={false}
        />

        {/* Other Clinic Type (conditional) */}
        {showOtherField && (
          <FormInput
            name="clinicTypeOther"
            placeholder="Specify Clinic Type"
            required
            register={register}
            watch={watch}
            error={errors?.clinicTypeOther?.message}
            maxLength={50}
            showLabel={false}
          />
        )}

        {/* Display Name (Optional) */}
        <FormInput
          name="displayName"
          placeholder="Clinic Display Name (optional)"
          register={register}
          watch={watch}
          error={errors?.displayName?.message}
          helpText="If different from the official name, e.g., 'ABC Clinic - Jayanagar Branch'"
          showLabel={false}
        />
      </div>
    </div>
  );
};

export default ClinicDetailsCard;
