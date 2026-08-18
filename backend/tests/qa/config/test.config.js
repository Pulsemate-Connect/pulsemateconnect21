/**
 * QA Test Configuration
 * Centralized configuration for all QA tests
 */

module.exports = {
  // Test Scale
  scale: {
    totalClinics: 20,
    doctorsPerClinic: 25,
    totalDoctors: 500, // 20 × 25
  },

  // Test Environment
  env: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5000',
    frontendURL: process.env.TEST_FRONTEND_URL || 'http://localhost:5173',
    nodeEnv: 'test',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/pulsemate_test',
    resetBeforeTests: true,
    cleanupAfterTests: false, // Keep data for inspection
  },

  // Authentication
  auth: {
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'sahilnaik1515@gmail.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'Nkabu18$',
    },
    jwtSecret: process.env.JWT_SECRET || 'test-jwt-secret',
    jwtExpiry: '24h',
  },

  // OTP Configuration
  otp: {
    enabled: true,
    testMode: true,
    testOtpCode: process.env.TEST_OTP_CODE || '123456',
    expiryMinutes: 10,
    maxAttempts: 3,
  },

  // Test Data Patterns
  patterns: {
    clinic: {
      namePrefix: 'Test Medical Clinic',
      emailDomain: 'pulsematetest.com',
      mobilePrefix: '90000', // 9000000001 - 9000000020
      ownerNamePrefix: 'Dr. Owner',
      cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'],
      states: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat'],
    },
    doctor: {
      namePrefix: 'Dr. Test',
      emailDomain: 'pulsematetest.com',
      mobilePrefix: '91000', // 9100000001 - 9100000500
      specializations: [
        'Cardiology',
        'Dermatology',
        'Orthopedics',
        'Pediatrics',
        'Gynecology',
        'Neurology',
        'Gastroenterology',
        'ENT',
        'Ophthalmology',
        'Psychiatry',
      ],
      medicalSystems: [
        'Modern Medicine (Allopathy)',
        'Ayurveda',
        'Homeopathy',
        'Dentistry',
      ],
      registrationPrefix: 'TEST-REG',
      registrationAuthorities: [
        'Maharashtra Medical Council',
        'Delhi Medical Council',
        'Karnataka Medical Council',
        'Tamil Nadu Medical Council',
      ],
      qualifications: [
        'MBBS, MD',
        'MBBS, MS',
        'BDS, MDS',
        'BAMS, MD (Ayu)',
        'BHMS',
      ],
      experienceRange: { min: 2, max: 25 },
      consultationFeeRange: { min: 500, max: 2000 },
    },
  },

  // Test Timeouts
  timeouts: {
    short: 5000,       // 5 seconds
    medium: 15000,     // 15 seconds
    long: 30000,       // 30 seconds
    veryLong: 60000,   // 60 seconds
    regression: 300000, // 5 minutes for full regression
  },

  // File Upload
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
    testFilesDir: './tests/qa/fixtures/documents',
  },

  // Test Scenarios
  scenarios: {
    // Which tests to run
    runClinicTests: true,
    runDoctorInvitationTests: true,
    runDoctorOTPTests: true,
    runDoctorOnboardingTests: true,
    runAdminVerificationTests: true,
    runClinicDoctorRelationshipTests: true,
    runDoctorProfileTests: true,
    runFullRegression: true,
    runValidationTests: true,

    // Test modes
    quickMode: false, // Run with 1 clinic + 5 doctors
    fullMode: true,   // Run with 20 clinics + 500 doctors
  },

  // Expected Status Flows (matching Prisma schema)
  statusFlows: {
    clinic: [
      'PENDING',          // Initial registration
      'UNDER_REVIEW',     // Admin reviewing
      'VERIFIED',         // Approved by admin
      'REJECTED',         // Rejected by admin
      'CHANGES_REQUIRED', // Admin requests changes
      'SUSPENDED',        // Suspended after verification
    ],
    doctor: [
      'INVITED',
      'INVITATION_ACCEPTED',
      'MOBILE_VERIFIED',
      'EMAIL_VERIFIED',
      'PROFILE_IN_PROGRESS',
      'CREDENTIALS_PENDING',
      'PROFILE_SUBMITTED',
      'UNDER_REVIEW',     // Admin reviewing
      'VERIFIED',         // Approved by admin
      'REJECTED',         // Rejected by admin
      'ACTIVE',
    ],
  },

  // Security Test Configurations
  security: {
    testUnauthorizedAccess: true,
    testCrossClinicAccess: true,
    testAPIBypass: true,
    testOTPReuse: true,
    testExpiredTokens: true,
    testInvalidTokens: true,
  },

  // Validation Rules
  validation: {
    clinic: {
      requiredFields: ['name', 'ownerName', 'mobile', 'email', 'password'],
      minPasswordLength: 8,
    },
    doctor: {
      requiredFields: [
        'fullLegalName',
        'dateOfBirth',
        'gender',
        'medicalSystem',
        'qualification',
        'specialization',
        'medicalRegistrationNumber',
        'registrationAuthority',
        'registrationYear',
        'experienceYears',
      ],
      minAge: 21,
      minExperience: 0,
      maxExperience: 50,
      minDocuments: 2,
      maxBioLength: 500,
    },
  },

  // Reporting
  reporting: {
    generateHTML: true,
    generateJSON: true,
    generateText: true,
    outputDir: './tests/qa/reports',
    includeScreenshots: false,
    includeAPILogs: true,
    includeDatabaseSnapshots: true,
  },

  // Audit Logging
  auditLog: {
    enabled: true,
    eventsToCheck: [
      'CLINIC_REGISTERED',
      'CLINIC_OTP_VERIFIED',
      'CLINIC_APPROVED',
      'CLINIC_REJECTED',
      'DOCTOR_INVITED',
      'INVITATION_ACCEPTED',
      'MOBILE_VERIFIED',
      'EMAIL_VERIFIED',
      'PROFILE_COMPLETED',
      'DOCUMENTS_SUBMITTED',
      'DOCTOR_SUBMITTED',
      'DOCTOR_APPROVED',
      'DOCTOR_REJECTED',
      'RELATIONSHIP_CREATED',
      'DOCTOR_ACTIVATED',
      'PROFILE_UPDATED',
    ],
  },

  // Test Data Cleanup
  cleanup: {
    afterEachTest: false,
    afterAllTests: false,
    keepFailedTestData: true,
  },
};
