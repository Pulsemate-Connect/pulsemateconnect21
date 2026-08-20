import React from 'react';
import * as LucideIcons from 'lucide-react';
import FormInput from '../shared/FormInput';

const AdditionalInfoCard = ({ register, errors, watch }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Additional Information (Optional)
        </h2>
        <p className="text-sm text-gray-600">
          Provide additional details about your clinic's registration and licensing if available.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Clinic Registration Number */}
        <FormInput
          label="Clinic Registration Number"
          placeholder="Enter registration number (optional)"
          {...register('clinicRegistrationNumber')}
          error={errors?.clinicRegistrationNumber?.message}
          watch={watch}
        />

        {/* GST Number */}
        <FormInput
          label="GST Number (Optional)"
          placeholder="e.g., 29ABCDE1234F1Z5"
          {...register('gstNumber')}
          error={errors?.gstNumber?.message}
          watch={watch}
        />
      </div>

      {/* Info Note */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <LucideIcons.Info className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Ensure all information matches your official documents exactly. Mismatched details may cause verification delays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoCard;
