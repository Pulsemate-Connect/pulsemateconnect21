// Clinic Types for Onboarding
export const CLINIC_TYPES = [
  { value: 'PHYSIOTHERAPY', label: 'Physiotherapy Clinic' },
  { value: 'ORTHOPEDIC', label: 'Orthopedic Clinic' },
  { value: 'MULTISPECIALTY', label: 'Multispecialty Clinic' },
  { value: 'DENTAL', label: 'Dental Clinic' },
  { value: 'GENERAL', label: 'General Clinic' },
  { value: 'DIAGNOSTIC', label: 'Diagnostic Centre' },
  { value: 'PEDIATRIC', label: 'Pediatric Clinic' },
  { value: 'AYURVEDIC', label: 'Ayurvedic Clinic' },
  { value: 'HOMEOPATHIC', label: 'Homeopathic Clinic' },
  { value: 'DERMATOLOGY', label: 'Dermatology Clinic' },
  { value: 'ENT', label: 'ENT Clinic' },
  { value: 'OPHTHALMOLOGY', label: 'Eye Clinic (Ophthalmology)' },
  { value: 'CARDIOLOGY', label: 'Cardiology Clinic' },
  { value: 'GYNECOLOGY', label: 'Gynecology Clinic' },
  { value: 'OTHER', label: 'Other' },
];

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

// Specialties for Step 2
export const SPECIALTIES = [
  { value: 'GENERAL_MEDICINE', label: 'General Medicine' },
  { value: 'PEDIATRICS', label: 'Pediatrics' },
  { value: 'ORTHOPEDICS', label: 'Orthopedics' },
  { value: 'DERMATOLOGY', label: 'Dermatology' },
  { value: 'GYNECOLOGY', label: 'Gynecology' },
  { value: 'DENTISTRY', label: 'Dentistry' },
  { value: 'PHYSIOTHERAPY', label: 'Physiotherapy' },
  { value: 'CARDIOLOGY', label: 'Cardiology' },
  { value: 'ENT', label: 'ENT (Ear, Nose, Throat)' },
  { value: 'OPHTHALMOLOGY', label: 'Ophthalmology (Eye Care)' },
  { value: 'OTHER', label: 'Other' },
];

// Consultation Types for Step 2
export const CONSULTATION_TYPES = [
  { value: 'IN_PERSON', label: 'In-Person (Offline)', icon: 'Building2' },
  { value: 'VIDEO_CALL', label: 'Video Call (Online)', icon: 'Video' },
  { value: 'HOME_VISIT', label: 'Home Visit', icon: 'Home' },
];

// Appointment Modes for Step 2
export const APPOINTMENT_MODES = [
  { value: 'APPOINTMENT_ONLY', label: 'Appointment Only', icon: 'CalendarCheck' },
  { value: 'WALK_IN_ONLY', label: 'Walk-in Only', icon: 'UserCheck' },
  { value: 'BOTH', label: 'Both', icon: 'Users' },
];

// Days of Week for Step 2
export const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
  { value: 'SATURDAY', label: 'Sat' },
  { value: 'SUNDAY', label: 'Sun' },
];

// Document Types for Step 3
export const DOCUMENT_TYPES = {
  CLINIC_REGISTRATION: {
    key: 'clinicRegistrationCertificate',
    label: 'Clinic Registration Certificate',
    description: 'Official registration certificate of your clinic',
    required: true,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png',
    maxSize: '5MB',
    icon: 'FileText',
  },
  MEDICAL_LICENSE: {
    key: 'medicalLicense',
    label: 'Medical Establishment License',
    description: 'License to operate as a medical facility',
    required: true,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png',
    maxSize: '5MB',
    icon: 'Award',
  },
  OWNER_ID: {
    key: 'ownerIdProof',
    label: 'Owner ID Proof',
    description: 'Aadhaar/PAN/Driving License/Passport',
    required: true,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png',
    maxSize: '2MB',
    icon: 'IdCard',
  },
  GST_CERTIFICATE: {
    key: 'gstCertificate',
    label: 'GST Certificate',
    description: 'Goods and Services Tax registration (optional)',
    required: false,
    acceptedFormats: '.pdf,.jpg,.jpeg,.png',
    maxSize: '2MB',
    icon: 'Receipt',
  },
  CLINIC_PHOTOS: {
    key: 'clinicPhotos',
    label: 'Clinic Photos',
    description: 'Upload photos to help patients recognize and trust your clinic',
    required: false,
    acceptedFormats: '.jpg,.jpeg,.png',
    maxSize: '2MB per photo',
    maxCount: 4,
    icon: 'Camera',
    photos: [
      {
        key: 'clinicLogo',
        label: 'Clinic Logo',
        description: 'Square logo (recommended: 512x512px) for mobile app display',
        required: false,
      },
      {
        key: 'clinicExterior',
        label: 'Clinic Exterior',
        description: 'Outside view of your clinic building',
        required: false,
      },
      {
        key: 'clinicReception',
        label: 'Reception Area',
        description: 'Photo of your reception/waiting area',
        required: false,
      },
      {
        key: 'clinicConsultation',
        label: 'Consultation Room',
        description: 'Photo of consultation or treatment room',
        required: false,
      },
    ],
  },
};

// Onboarding Steps Configuration
export const ONBOARDING_STEPS = [
  {
    id: 1,
    key: 'clinic-info',
    title: 'Clinic Information',
    description: 'Clinic name, owner and contact',
    icon: 'Building2', // Lucide icon name
    path: '/clinic/onboarding/step-1',
  },
  {
    id: 2,
    key: 'services',
    title: 'Services & Operations',
    description: 'Services, timings and operations',
    icon: 'Stethoscope', // Lucide icon name
    path: '/clinic/onboarding/step-2',
  },
  {
    id: 3,
    key: 'documents',
    title: 'Clinic Documents',
    description: 'Verify your clinic documents',
    icon: 'FileText', // Lucide icon name
    path: '/clinic/onboarding/step-3',
  },
  {
    id: 4,
    key: 'agreement',
    title: 'Partner Agreement',
    description: 'Review and accept agreement',
    icon: 'Handshake', // Lucide icon name
    path: '/clinic/onboarding/step-4',
  },
];
