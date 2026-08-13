import React from 'react';
import FormCheckboxGroup from '../shared/FormCheckboxGroup';
import FormInput from '../shared/FormInput';
import { SPECIALTIES, CONSULTATION_TYPES } from '../../../../../utils/constants/clinicTypes';

const ServicesCard = ({ register, errors, watch }) => {
  const selectedSpecialties = watch?.('specialties') || [];
  const showOtherField = selectedSpecialties.includes('OTHER');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Services Offered
        </h2>
        <p className="text-sm text-gray-600">
          Select the medical services and consultation types your clinic provides.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Primary Specialties */}
        <FormCheckboxGroup
          label="Primary Specialties"
          name="specialties"
          options={SPECIALTIES}
          required
          register={register}
          watch={watch}
          error={errors?.specialties?.message}
          helpText="Select all specialties your clinic offers"
          columns={2}
        />

        {/* Other Specialty (conditional) */}
        {showOtherField && (
          <FormInput
            name="specialtyOther"
            placeholder="Specify Other Specialty"
            required
            register={register}
            watch={watch}
            error={errors?.specialtyOther?.message}
            maxLength={50}
            showLabel={false}
          />
        )}

        {/* Consultation Types */}
        <FormCheckboxGroup
          label="Consultation Types"
          name="consultationTypes"
          options={CONSULTATION_TYPES}
          required
          register={register}
          watch={watch}
          error={errors?.consultationTypes?.message}
          helpText="How can patients consult with your doctors?"
          columns={2}
        />
      </div>
    </div>
  );
};

export default ServicesCard;
