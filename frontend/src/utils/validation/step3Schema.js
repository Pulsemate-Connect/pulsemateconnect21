import * as yup from 'yup';

// File validation helper
const fileSchema = (required = false, message = 'File is required') => {
  const schema = yup.mixed().test('fileSize', 'File size must be less than 5MB', (value) => {
    if (!value) return !required;
    if (typeof value === 'string') return true; // Already uploaded URL
    return value.size <= 5 * 1024 * 1024; // 5MB
  }).test('fileType', 'Only PDF, JPG, PNG files are allowed', (value) => {
    if (!value) return !required;
    if (typeof value === 'string') return true; // Already uploaded URL
    return ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(value.type);
  });

  return required ? schema.required(message) : schema.nullable();
};

export const step3Schema = yup.object().shape({
  // Mandatory Documents
  clinicRegistrationCertificate: fileSchema(true, 'Clinic registration certificate is required'),
  medicalLicense: fileSchema(true, 'Medical establishment license is required'),
  ownerIdProof: fileSchema(true, 'Owner ID proof is required'),
  
  // Optional Documents
  gstCertificate: fileSchema(false),
  
  // Clinic Photos (individual fields)
  clinicLogo: yup.mixed()
    .nullable()
    .test('photoSize', 'Logo size must be less than 2MB', (value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      return value.size <= 2 * 1024 * 1024;
    })
    .test('photoType', 'Only JPG, PNG files are allowed', (value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      return ['image/jpeg', 'image/jpg', 'image/png'].includes(value.type);
    }),
  
  clinicExterior: yup.mixed()
    .nullable()
    .test('photoSize', 'Photo size must be less than 2MB', (value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      return value.size <= 2 * 1024 * 1024;
    })
    .test('photoType', 'Only JPG, PNG files are allowed', (value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      return ['image/jpeg', 'image/jpg', 'image/png'].includes(value.type);
    }),
  
  clinicReception: yup.mixed()
    .nullable()
    .test('photoSize', 'Photo size must be less than 2MB', (value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      return value.size <= 2 * 1024 * 1024;
    })
    .test('photoType', 'Only JPG, PNG files are allowed', (value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      return ['image/jpeg', 'image/jpg', 'image/png'].includes(value.type);
    }),
  
  clinicConsultation: yup.mixed()
    .nullable()
    .test('photoSize', 'Photo size must be less than 2MB', (value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      return value.size <= 2 * 1024 * 1024;
    })
    .test('photoType', 'Only JPG, PNG files are allowed', (value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      return ['image/jpeg', 'image/jpg', 'image/png'].includes(value.type);
    }),
  
  // Additional Information (All Optional)
  clinicRegistrationNumber: yup
    .string()
    .transform((value) => (value === '' ? undefined : value))
    .min(3, 'Registration number must be at least 3 characters')
    .optional(),
  
  gstNumber: yup
    .string()
    .transform((value) => (value === '' ? undefined : value))
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format')
    .optional(),
});
