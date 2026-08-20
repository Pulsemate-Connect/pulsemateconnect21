import React from 'react';
import * as LucideIcons from 'lucide-react';
import FileUpload from '../shared/FileUpload';
import { DOCUMENT_TYPES } from '../../../../../utils/constants/clinicTypes';

const MandatoryDocumentsCard = ({ setValue, watch, errors }) => {
  const clinicRegValue = watch?.('clinicRegistrationCertificate');
  const medicalLicenseValue = watch?.('medicalLicense');
  const ownerIdValue = watch?.('ownerIdProof');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Mandatory Documents
        </h2>
        <p className="text-sm text-gray-600">
          Upload the required documents to verify your clinic. All documents must be clear and valid.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Clinic Registration Certificate */}
        <FileUpload
          label={DOCUMENT_TYPES.CLINIC_REGISTRATION.label}
          name={DOCUMENT_TYPES.CLINIC_REGISTRATION.key}
          description={DOCUMENT_TYPES.CLINIC_REGISTRATION.description}
          required={DOCUMENT_TYPES.CLINIC_REGISTRATION.required}
          accept={DOCUMENT_TYPES.CLINIC_REGISTRATION.acceptedFormats}
          maxSize={5}
          value={clinicRegValue}
          onChange={(file) => setValue('clinicRegistrationCertificate', file)}
          error={errors?.clinicRegistrationCertificate?.message}
        />

        {/* Medical Establishment License */}
        <FileUpload
          label={DOCUMENT_TYPES.MEDICAL_LICENSE.label}
          name={DOCUMENT_TYPES.MEDICAL_LICENSE.key}
          description={DOCUMENT_TYPES.MEDICAL_LICENSE.description}
          required={DOCUMENT_TYPES.MEDICAL_LICENSE.required}
          accept={DOCUMENT_TYPES.MEDICAL_LICENSE.acceptedFormats}
          maxSize={5}
          value={medicalLicenseValue}
          onChange={(file) => setValue('medicalLicense', file)}
          error={errors?.medicalLicense?.message}
        />

        {/* Owner ID Proof */}
        <FileUpload
          label={DOCUMENT_TYPES.OWNER_ID.label}
          name={DOCUMENT_TYPES.OWNER_ID.key}
          description={DOCUMENT_TYPES.OWNER_ID.description}
          required={DOCUMENT_TYPES.OWNER_ID.required}
          accept={DOCUMENT_TYPES.OWNER_ID.acceptedFormats}
          maxSize={2}
          value={ownerIdValue}
          onChange={(file) => setValue('ownerIdProof', file)}
          error={errors?.ownerIdProof?.message}
        />
      </div>

      {/* Important Note */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <LucideIcons.Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Document Requirements
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Documents must be clear and readable</li>
              <li>• All documents must be valid and not expired</li>
              <li>• File formats: PDF, JPG, PNG</li>
              <li>• Max file size: 5MB for certificates, 2MB for ID proof</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MandatoryDocumentsCard;
