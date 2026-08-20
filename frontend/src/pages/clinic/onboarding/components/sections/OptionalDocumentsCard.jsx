import React from 'react';
import * as LucideIcons from 'lucide-react';
import FileUpload from '../shared/FileUpload';
import { DOCUMENT_TYPES } from '../../../../../utils/constants/clinicTypes';

const OptionalDocumentsCard = ({ setValue, watch, errors }) => {
  const gstCertValue = watch?.('gstCertificate');
  const clinicLogoValue = watch?.('clinicLogo');
  const clinicExteriorValue = watch?.('clinicExterior');
  const clinicReceptionValue = watch?.('clinicReception');
  const clinicConsultationValue = watch?.('clinicConsultation');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Optional Documents
        </h2>
        <p className="text-sm text-gray-600">
          These documents are optional but recommended to enhance your clinic's credibility.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* GST Certificate */}
        <FileUpload
          label={DOCUMENT_TYPES.GST_CERTIFICATE.label}
          name={DOCUMENT_TYPES.GST_CERTIFICATE.key}
          description={DOCUMENT_TYPES.GST_CERTIFICATE.description}
          required={DOCUMENT_TYPES.GST_CERTIFICATE.required}
          accept={DOCUMENT_TYPES.GST_CERTIFICATE.acceptedFormats}
          maxSize={2}
          value={gstCertValue}
          onChange={(file) => setValue('gstCertificate', file)}
          error={errors?.gstCertificate?.message}
        />

        {/* Divider */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <LucideIcons.Camera className="w-5 h-5 text-blue-600" />
            Clinic Photos
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Upload photos to help patients recognize and trust your clinic. All photos are optional.
          </p>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clinic Logo */}
            <FileUpload
              label={DOCUMENT_TYPES.CLINIC_PHOTOS.photos[0].label}
              name="clinicLogo"
              description={DOCUMENT_TYPES.CLINIC_PHOTOS.photos[0].description}
              required={false}
              accept=".jpg,.jpeg,.png"
              maxSize={2}
              value={clinicLogoValue}
              onChange={(file) => setValue('clinicLogo', file)}
              error={errors?.clinicLogo?.message}
              showPreview={true}
            />

            {/* Clinic Exterior */}
            <FileUpload
              label={DOCUMENT_TYPES.CLINIC_PHOTOS.photos[1].label}
              name="clinicExterior"
              description={DOCUMENT_TYPES.CLINIC_PHOTOS.photos[1].description}
              required={false}
              accept=".jpg,.jpeg,.png"
              maxSize={2}
              value={clinicExteriorValue}
              onChange={(file) => setValue('clinicExterior', file)}
              error={errors?.clinicExterior?.message}
              showPreview={true}
            />

            {/* Clinic Reception */}
            <FileUpload
              label={DOCUMENT_TYPES.CLINIC_PHOTOS.photos[2].label}
              name="clinicReception"
              description={DOCUMENT_TYPES.CLINIC_PHOTOS.photos[2].description}
              required={false}
              accept=".jpg,.jpeg,.png"
              maxSize={2}
              value={clinicReceptionValue}
              onChange={(file) => setValue('clinicReception', file)}
              error={errors?.clinicReception?.message}
              showPreview={true}
            />

            {/* Clinic Consultation Room */}
            <FileUpload
              label={DOCUMENT_TYPES.CLINIC_PHOTOS.photos[3].label}
              name="clinicConsultation"
              description={DOCUMENT_TYPES.CLINIC_PHOTOS.photos[3].description}
              required={false}
              accept=".jpg,.jpeg,.png"
              maxSize={2}
              value={clinicConsultationValue}
              onChange={(file) => setValue('clinicConsultation', file)}
              error={errors?.clinicConsultation?.message}
              showPreview={true}
            />
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <LucideIcons.Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 mb-1">
              Why upload these documents and photos?
            </p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• <strong>GST certificate:</strong> Helps patients claim tax benefits</li>
              <li>• <strong>Clinic logo:</strong> Displays prominently in mobile app search results</li>
              <li>• <strong>Photos:</strong> Give patients confidence before booking, increasing trust and bookings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionalDocumentsCard;
