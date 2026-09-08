import * as yup from 'yup';

// File validation helper
const fileSchema = (required = false, message = 'File is required') => {
  const schema = yup.mixed()
    .test('required-check', message, (value) => {
      // If field is required, value must exist
      if (required && !value) {
        console.log('[Validation] Required field is missing:', { value, required });
        return false;
      }
      return true;
    })
    .test('fileSize', 'File size must be less than 5MB', (value) => {
      if (!value) return !required; // If no value and not required, pass
      if (typeof value === 'string') return true; // Already uploaded URL
      if (value instanceof File) {
        const isValid = value.size <= 5 * 1024 * 1024; // 5MB
        if (!isValid) console.log('[Validation] File too large:', value.size);
        return isValid;
      }
      console.log('[Validation] Unknown value type:', typeof value, value);
      return true; // If it's some other valid object, let it pass
    })
    .test('fileType', 'Only PDF, JPG, PNG files are allowed', (value) => {
      if (!value) return !required; // If no value and not required, pass
      if (typeof value === 'string') return true; // Already uploaded URL
      if (value instanceof File) {
        const isValid = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(value.type);
        if (!isValid) console.log('[Validation] Invalid file type:', value.type);
        return isValid;
      }
      return true; // If it's some other valid object, let it pass
    });

  return schema.nullable();
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
