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
          label="Clinic Name"
          name="clinicName"
          placeholder="Enter clinic name"
          required
          register={register}
          error={errors?.clinicName?.message}
          helpText="This is the official name of your clinic"
        />

        {/* Clinic Type */}
        <FormSelect
          label="Clinic Type"
          name="clinicType"
          options={CLINIC_TYPES}
          placeholder="Select clinic type"
          required
          register={register}
          error={errors?.clinicType?.message}
          helpText="Choose the category that best describes your clinic"
        />

        {/* Other Clinic Type (conditional) */}
        {showOtherField && (
          <FormInput
            label="Specify Clinic Type"
            name="clinicTypeOther"
            placeholder="Enter your clinic type"
            required
            register={register}
            error={errors?.clinicTypeOther?.message}
            maxLength={50}
          />
        )}

        {/* Display Name (Optional) */}
        <FormInput
          label="Clinic Display Name"
          name="displayName"
          placeholder="Name shown to patients (optional)"
          register={register}
          error={errors?.displayName?.message}
          helpText="If different from the official name, e.g., 'ABC Clinic - Jayanagar Branch'"
        />
      </div>
    </div>
  );
};

export default ClinicDetailsCard;
