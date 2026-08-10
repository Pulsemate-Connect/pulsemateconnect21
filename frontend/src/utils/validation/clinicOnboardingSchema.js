import * as yup from 'yup';

// Step 1: Clinic Information Validation Schema
export const step1Schema = yup.object({
  // Clinic Details
  clinicName: yup
    .string()
    .required('Clinic name is required')
    .min(2, 'Minimum 2 characters required')
    .max(100, 'Maximum 100 characters allowed')
    .trim(),

  clinicType: yup
    .string()
    .required('Please select a clinic type'),

  clinicTypeOther: yup
    .string()
    .when('clinicType', {
      is: 'OTHER',
      then: (schema) => schema
        .required('Please specify clinic type')
        .min(2, 'Minimum 2 characters')
        .max(50, 'Maximum 50 characters'),
      otherwise: (schema) => schema.notRequired(),
    }),

  displayName: yup
    .string()
    .max(100, 'Maximum 100 characters')
    .trim()
    .notRequired(),

  // Owner Details
  ownerName: yup
    .string()
    .required('Owner name is required')
    .min(2, 'Minimum 2 characters required')
    .matches(/^[a-zA-Z\s.]+$/, 'Only letters, spaces and periods allowed')
    .trim(),

  ownerEmail: yup
    .string()
    .required('Email is required')
    .email('Invalid email format')
    .trim()
    .lowercase(),

  ownerMobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')
    .length(10, 'Must be 10 digits'),

  mobileVerified: yup
    .boolean()
    .oneOf([true], 'Please verify your mobile number'),

  // Primary Contact
  sameAsOwner: yup
    .boolean()
    .default(true),

  primaryContactPhone: yup
    .string()
    .when('sameAsOwner', {
      is: false,
      then: (schema) => schema
        .required('Primary contact number is required')
        .matches(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')
        .length(10, 'Must be 10 digits'),
      otherwise: (schema) => schema.notRequired(),
    }),

  // Location
  latitude: yup
    .number()
    .required('Please select clinic location on map')
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude')
    .nullable(),

  longitude: yup
    .number()
    .required('Please select clinic location on map')
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude')
    .nullable(),

  // Address Details
  addressLine1: yup
    .string()
    .required('Address line 1 is required')
    .min(5, 'Minimum 5 characters required')
    .max(200, 'Maximum 200 characters')
    .trim(),

  addressLine2: yup
    .string()
    .required('Area/locality is required')
    .min(3, 'Minimum 3 characters required')
    .max(200, 'Maximum 200 characters')
    .trim(),

  landmark: yup
    .string()
    .max(100, 'Maximum 100 characters')
    .trim()
    .notRequired(),

  city: yup
    .string()
    .required('City is required')
    .min(2, 'Minimum 2 characters')
    .max(50, 'Maximum 50 characters')
    .trim(),

  state: yup
    .string()
    .required('State is required'),

  pincode: yup
    .string()
    .required('Pincode is required')
    .matches(/^\d{6}$/, 'Must be 6 digits')
    .length(6, 'Must be 6 digits'),

  country: yup
    .string()
    .default('India')
    .oneOf(['India'], 'Only India supported currently'),
});

// Helper function to get validation error messages
export const getFieldError = (errors, fieldName) => {
  return errors?.[fieldName]?.message;
};

// Helper to check if field has error
export const hasFieldError = (errors, fieldName) => {
  return !!errors?.[fieldName];
};
