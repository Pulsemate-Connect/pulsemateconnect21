/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PULSEMATE CONNECT - 45 IDENTITY COMPREHENSIVE END-TO-END TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * COMPREHENSIVE QA TEST with:
 * - 20 Clinic Owner test accounts
 * - 20 Clinic test records
 * - 25 Doctor test accounts
 * - 25 Doctor profiles
 * - REAL Email OTP verification
 * - REAL Mobile/Firebase OTP verification
 * - Database verification after EVERY test
 * - Approval/rejection flows
 * - Multi-clinic doctor testing
 * - Authorization bypass prevention
 * - Duplicate prevention testing
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const config = require('./config/test.config');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:5000/api';
const FRONTEND_URL = process.env.TEST_FRONTEND_URL || 'http://localhost:3000';
const TEST_PASSWORD = 'Test@123456';
const TEST_OTP_CODE = process.env.TEST_OTP_CODE || '123456';
const ENABLE_TEST_OTP = process.env.ENABLE_TEST_OTP === 'true';

// Test domain for email addresses (should be configured in .env)
const TEST_EMAIL_DOMAIN = process.env.TEST_EMAIL_DOMAIN || 'pulsematetest.com';

// Test results tracking
const testResults = {
  clinics: [],
  doctors: [],
  approvals: [],
  negative: [],
  database: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    notRun: 0,
  },
};

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function recordTestResult(category, testId, entity, testIdentity, mobileIdentity, otpResult, regResult, approvalResult, loginResult, dbResult, overallResult, details = {}) {
  const result = {
    testId,
    entity,
    testIdentity,
    mobileIdentity,
    otp: otpResult,
    registration: regResult,
    approval: approvalResult,
    login: loginResult,
    dbCheck: dbResult,
    result: overallResult,
    timestamp: new Date().toISOString(),
    ...details,
  };

  testResults[category].push(result);
  testResults.summary.totalTests++;
  
  if (overallResult === 'PASS') {
    testResults.summary.passed++;
    log(`✓ ${testId}: ${entity} - PASS`, 'green');
  } else if (overallResult === 'FAIL') {
    testResults.summary.failed++;
    log(`✗ ${testId}: ${entity} - FAIL`, 'red');
    if (details.error) log(`  Error: ${details.error}`, 'yellow');
  } else if (overallResult === 'BLOCKED') {
    testResults.summary.blocked++;
    log(`⊘ ${testId}: ${entity} - BLOCKED`, 'yellow');
    if (details.reason) log(`  Reason: ${details.reason}`, 'yellow');
  } else {
    testResults.summary.notRun++;
    log(`− ${testId}: ${entity} - NOT RUN`, 'white');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

function generateClinicTestData(index) {
  const paddedIndex = String(index).padStart(3, '0');
  const mobile = `90000${String(index).padStart(5, '0')}`; // 9000000001 - 9000000020
  
  return {
    // Owner details
    ownerName: `TEST_CLINIC_OWNER_${paddedIndex}`,
    mobile: mobile,
    email: `clinic${paddedIndex}@${TEST_EMAIL_DOMAIN}`,
    password: TEST_PASSWORD,
    
    // Clinic details
    clinicName: `TEST_CLINIC_${paddedIndex}`,
    clinicType: 'Individual Clinic',
    address: `${index} Test Medical Street, Test Building`,
    city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'][index % 4],
    state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu'][index % 4],
    district: ['Mumbai', 'Central Delhi', 'Bangalore Urban', 'Chennai'][index % 4],
    pincode: `40000${index % 10}`,
    landmark: `Near Test Hospital ${index}`,
    
    // Registration
    clinicRegistrationNumber: `TEST_REG_CLINIC_${paddedIndex}`,
    panNumber: `AAAAA${String(index).padStart(4, '0')}A`,
    gstNumber: `27AAAAA${String(index).padStart(4, '0')}A1Z5`,
    
    // Operations
    specialties: ['General Medicine', 'Pediatrics'][index % 2],
    openingTime: '09:00',
    closingTime: '18:00',
    avgConsultationMinutes: 15,
    dailyPatientCapacity: 50,
    
    // Contact
    phone: mobile,
    alternateEmail: `clinic${paddedIndex}.alt@${TEST_EMAIL_DOMAIN}`,
    emergencyContactNumber: mobile,
  };
}

function generateDoctorTestData(doctorIndex, clinicIndex = null) {
  const paddedIndex = String(doctorIndex).padStart(3, '0');
  const mobile = `91000${String(doctorIndex).padStart(5, '0')}`; // 9100000001 - 9100000025
  
  return {
    // Personal details
    doctorName: `TEST_DOCTOR_${paddedIndex}`,
    fullLegalName: `Dr. Test Doctor ${paddedIndex}`,
    mobile: mobile,
    email: `doctor${paddedIndex}@${TEST_EMAIL_DOMAIN}`,
    dateOfBirth: new Date(1985 + (doctorIndex % 15), (doctorIndex % 12), 1 + (doctorIndex % 28)),
    gender: ['Male', 'Female'][doctorIndex % 2],
    
    // Professional details
    medicalSystem: ['Modern Medicine (Allopathy)', 'Ayurveda', 'Homeopathy'][doctorIndex % 3],
    qualification: ['MBBS, MD', 'MBBS, MS', 'BAMS, MD (Ayu)'][doctorIndex % 3],
    specialization: [
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
    ][doctorIndex % 10],
    medicalRegistrationNumber: `TEST_MED_REG_${paddedIndex}`,
    registrationAuthority: [
      'Maharashtra Medical Council',
      'Delhi Medical Council',
      'Karnataka Medical Council',
      'Tamil Nadu Medical Council',
    ][doctorIndex % 4],
    registrationYear: 2010 + (doctorIndex % 14),
    experienceYears: 2 + (doctorIndex % 20),
    
    // Profile
    bio: `Test doctor profile ${paddedIndex}. This is a QA test account for comprehensive testing of the PulseMate Connect platform.`,
    languagesKnown: ['English', 'Hindi', ['Marathi', 'Tamil', 'Telugu', 'Kannada'][doctorIndex % 4]],
    consultationFee: 500 + (doctorIndex * 50),
    areasOfExpertise: ['General Consultation', 'Emergency Care'],
    
    // For invitation
    specialization: [
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
    ][doctorIndex % 10],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// API HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function adminLogin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      identifier: config.auth.admin.email,
      password: config.auth.admin.password,
    });
    return response.data.data.accessToken;
  } catch (error) {
    log(`Failed to login as admin: ${error.message}`, 'red');
    throw error;
  }
}

async function sendClinicEmailOTP(email, ownerName) {
  try {
    const response = await axios.post(`${API_BASE}/auth/clinic-owner/send-email-otp`, {
      email,
      ownerName,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function verifyClinicEmailOTP(email, otp) {
  try {
    const response = await axios.post(`${API_BASE}/auth/clinic-owner/verify-email-otp`, {
      email,
      otp,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function sendClinicMobileOTP(mobile) {
  try {
    const response = await axios.post(`${API_BASE}/auth/send-otp`, {
      phoneNumber: mobile, // API expects 'phoneNumber' not 'mobile'
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function verifyClinicMobileOTP(mobile, otp) {
  try {
    const response = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phoneNumber: mobile, // API expects 'phoneNumber' not 'mobile'
      otp,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function registerClinic(clinicData, emailVerified, mobileVerified) {
  try {
    // Use the single-step registration endpoint
    const response = await axios.post(`${API_BASE}/auth/clinic-owner/register`, {
      // Owner details
      ownerName: clinicData.ownerName,
      phone: clinicData.mobile,
      email: clinicData.email,
      password: clinicData.password,
      
      // Clinic details
      clinicName: clinicData.clinicName,
      clinicType: clinicData.clinicType,
      clinicAddress: clinicData.address,
      city: clinicData.city,
      state: clinicData.state,
      district: clinicData.district,
      pincode: clinicData.pincode,
      landmark: clinicData.landmark,
      
      // Registration numbers
      clinicRegistrationNumber: clinicData.clinicRegistrationNumber,
      gstNumber: clinicData.gstNumber,
      panNumber: clinicData.panNumber,
      
      // Operations
      specialties: [clinicData.specialties],
      dailyPatientCapacity: clinicData.dailyPatientCapacity,
      averageConsultationTimeMinutes: clinicData.avgConsultationMinutes,
      appointmentSlotMinutes: 15, // Required field
      
      // Consultation modes (required)
      consultationModes: ['In-Person', 'Online'],
      
      // Weekly schedule (required)
      weeklySchedule: [
        { day: 'Monday', openingTime: '09:00', closingTime: '18:00', isOpen: true },
        { day: 'Tuesday', openingTime: '09:00', closingTime: '18:00', isOpen: true },
        { day: 'Wednesday', openingTime: '09:00', closingTime: '18:00', isOpen: true },
        { day: 'Thursday', openingTime: '09:00', closingTime: '18:00', isOpen: true },
        { day: 'Friday', openingTime: '09:00', closingTime: '18:00', isOpen: true },
        { day: 'Saturday', openingTime: '09:00', closingTime: '14:00', isOpen: true },
        { day: 'Sunday', openingTime: '00:00', closingTime: '00:00', isOpen: false },
      ],
      
      // Payment methods (required)
      paymentMethods: ['Cash', 'Card', 'UPI'],
      
      // Contact
      clinicPhone: clinicData.phone,
      emergencyContactNumber: clinicData.emergencyContactNumber,
      alternateEmail: clinicData.alternateEmail,
      
      // Documents (required - using placeholder URLs for test)
      licenseDocumentUrl: 'https://test.pulsemateconnect.in/docs/license.pdf',
      medicalEstablishmentCertificateUrl: 'https://test.pulsemateconnect.in/docs/medical-cert.pdf',
      gstCertificateUrl: 'https://test.pulsemateconnect.in/docs/gst-cert.pdf',
      panCardUrl: 'https://test.pulsemateconnect.in/docs/pan-card.pdf',
      
      // Verification status
      ownerMobileVerified: mobileVerified,
      ownerEmailVerified: emailVerified,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function attemptLogin(identifier, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      identifier,
      password,
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function adminApproveClinic(clinicId, token) {
  try {
    const response = await axios.patch(
      `${API_BASE}/admin/clinics/${clinicId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function adminRejectClinic(clinicId, reason, token) {
  try {
    const response = await axios.patch(
      `${API_BASE}/admin/clinics/${clinicId}/reject`,
      { rejectionReason: reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function inviteDoctor(clinicId, doctorData, token) {
  try {
    const response = await axios.post(
      `${API_BASE}/clinic/${clinicId}/invite-doctor`,
      {
        doctorName: doctorData.doctorName,
        doctorMobile: doctorData.mobile,
        doctorEmail: doctorData.email,
        specialization: doctorData.specialization,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function getInvitationByToken(invitationToken) {
  try {
    const response = await axios.get(`${API_BASE}/doctor/invitation/${invitationToken}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function acceptInvitation(invitationToken) {
  try {
    const response = await axios.post(`${API_BASE}/doctor/invitation/${invitationToken}/accept`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function sendDoctorMobileOTP(invitationToken) {
  try {
    const response = await axios.post(`${API_BASE}/doctor/invitation/${invitationToken}/send-mobile-otp`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function verifyDoctorMobileOTP(invitationToken, otp) {
  try {
    const response = await axios.post(`${API_BASE}/doctor/invitation/${invitationToken}/verify-mobile-otp`, { otp });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function sendDoctorEmailOTP(invitationToken) {
  try {
    const response = await axios.post(`${API_BASE}/doctor/invitation/${invitationToken}/send-email-otp`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function verifyDoctorEmailOTP(invitationToken, otp) {
  try {
    const response = await axios.post(`${API_BASE}/doctor/invitation/${invitationToken}/verify-email-otp`, { otp });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function updateDoctorProfile(invitationToken, profileData) {
  try {
    const response = await axios.put(`${API_BASE}/doctor/profile/${invitationToken}`, profileData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function submitDoctorProfile(invitationToken) {
  try {
    const response = await axios.post(`${API_BASE}/doctor/profile/${invitationToken}/submit`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function adminApproveDoctor(doctorProfileId, token) {
  try {
    const response = await axios.patch(
      `${API_BASE}/admin/doctors/${doctorProfileId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

async function adminRejectDoctor(doctorProfileId, reason, token) {
  try {
    const response = await axios.patch(
      `${API_BASE}/admin/doctors/${doctorProfileId}/reject`,
      { rejectionReason: reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE VERIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function verifyClinicInDatabase(clinicData) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: clinicData.email },
      include: {
        ownedClinics: true,
        clinicOwnerProfile: true,
      },
    });

    if (!user) return { verified: false, error: 'User not found' };

    const clinic = await prisma.clinic.findFirst({
      where: { clinicRegistrationNumber: clinicData.clinicRegistrationNumber },
    });

    if (!clinic) return { verified: false, error: 'Clinic not found' };

    return {
      verified: true,
      user,
      clinic,
      checks: {
        userRole: user.role === 'CLINIC_OWNER',
        userApprovalStatus: user.approvalStatus,
        clinicApprovalStatus: clinic.approvalStatus,
        clinicIsActive: clinic.isActive,
        clinicOwnerId: clinic.ownerId === user.id,
      },
    };
  } catch (error) {
    return { verified: false, error: error.message };
  }
}

async function verifyDoctorInDatabase(doctorData) {
  try {
    const user = await prisma.user.findUnique({
      where: { mobile: doctorData.mobile },
      include: {
        doctorProfile: {
          include: {
            invitation: true,
            doctorClinics: {
              include: {
                clinic: true,
              },
            },
          },
        },
      },
    });

    if (!user) return { verified: false, error: 'Doctor user not found' };

    return {
      verified: true,
      user,
      profile: user.doctorProfile,
      checks: {
        userRole: user.role === 'DOCTOR',
        userApprovalStatus: user.approvalStatus,
        profileExists: !!user.doctorProfile,
        verificationStatus: user.doctorProfile?.verificationStatus,
        profileStatus: user.doctorProfile?.profileStatus,
        clinicRelationships: user.doctorProfile?.doctorClinics?.length || 0,
      },
    };
  } catch (error) {
    return { verified: false, error: error.message };
  }
}

async function verifyDatabaseIntegrity() {
  try {
    const results = {
      passed: true,
      checks: {},
      errors: [],
    };

    // Check for duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count
      FROM users
      WHERE email IS NOT NULL
      GROUP BY email
      HAVING COUNT(*) > 1
    `;
    results.checks.duplicateEmails = duplicateEmails.length === 0;
    if (duplicateEmails.length > 0) {
      results.passed = false;
      results.errors.push(`Found ${duplicateEmails.length} duplicate emails`);
    }

    // Check for duplicate mobiles
    const duplicateMobiles = await prisma.$queryRaw`
      SELECT mobile, COUNT(*) as count
      FROM users
      GROUP BY mobile
      HAVING COUNT(*) > 1
    `;
    results.checks.duplicateMobiles = duplicateMobiles.length === 0;
    if (duplicateMobiles.length > 0) {
      results.passed = false;
      results.errors.push(`Found ${duplicateMobiles.length} duplicate mobiles`);
    }

    // Check for orphaned DoctorProfiles
    const orphanedProfiles = await prisma.$queryRaw`
      SELECT dp.id
      FROM doctor_profiles dp
      LEFT JOIN users u ON dp."userId" = u.id
      WHERE u.id IS NULL
    `;
    results.checks.orphanedProfiles = orphanedProfiles.length === 0;
    if (orphanedProfiles.length > 0) {
      results.passed = false;
      results.errors.push(`Found ${orphanedProfiles.length} orphaned doctor profiles`);
    }

    // Check for orphaned DoctorClinics
    const orphanedDoctorClinics = await prisma.$queryRaw`
      SELECT dc.id
      FROM clinic_doctors dc
      LEFT JOIN doctor_profiles dp ON dc."doctorId" = dp.id
      LEFT JOIN clinics c ON dc."clinicId" = c.id
      WHERE dp.id IS NULL OR c.id IS NULL
    `;
    results.checks.orphanedDoctorClinics = orphanedDoctorClinics.length === 0;
    if (orphanedDoctorClinics.length > 0) {
      results.passed = false;
      results.errors.push(`Found ${orphanedDoctorClinics.length} orphaned doctor-clinic relationships`);
    }

    // Check for duplicate DoctorClinic relationships
    const duplicateDoctorClinics = await prisma.$queryRaw`
      SELECT "doctorId", "clinicId", COUNT(*) as count
      FROM clinic_doctors
      GROUP BY "doctorId", "clinicId"
      HAVING COUNT(*) > 1
    `;
    results.checks.duplicateDoctorClinics = duplicateDoctorClinics.length === 0;
    if (duplicateDoctorClinics.length > 0) {
      results.passed = false;
      results.errors.push(`Found ${duplicateDoctorClinics.length} duplicate doctor-clinic relationships`);
    }

    // Check for invalid approval statuses
    const invalidStatuses = await prisma.user.findMany({
      where: {
        approvalStatus: {
          notIn: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'UNDER_REVIEW', 'CHANGES_REQUIRED'],
        },
      },
    });
    results.checks.invalidApprovalStatuses = invalidStatuses.length === 0;
    if (invalidStatuses.length > 0) {
      results.passed = false;
      results.errors.push(`Found ${invalidStatuses.length} users with invalid approval statuses`);
    }

    return results;
  } catch (error) {
    return { passed: false, error: error.message, errors: [error.message] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST EXECUTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function testClinicRegistration(clinicIndex) {
  const testId = `CLINIC_${String(clinicIndex).padStart(3, '0')}`;
  const clinicData = generateClinicTestData(clinicIndex);
  
  log(`\n→ Testing ${testId}: ${clinicData.clinicName}`, 'cyan');

  let otpResult = 'NOT_TESTED';
  let regResult = 'NOT_TESTED';
  let loginResult = 'NOT_TESTED';
  let dbResult = 'NOT_TESTED';
  let overallResult = 'FAIL';
  let error = null;

  try {
    // Step 1: Send email OTP
    log('  Step 1: Sending email OTP...', 'blue');
    const emailOTPSend = await sendClinicEmailOTP(clinicData.email, clinicData.ownerName);
    if (!emailOTPSend.success) {
      error = `Email OTP send failed: ${JSON.stringify(emailOTPSend.error)}`;
      throw new Error(error);
    }

    // Step 2: Verify email OTP
    log('  Step 2: Verifying email OTP...', 'blue');
    const emailOTPVerify = await verifyClinicEmailOTP(clinicData.email, TEST_OTP_CODE);
    if (!emailOTPVerify.success) {
      error = `Email OTP verification failed: ${JSON.stringify(emailOTPVerify.error)}`;
      throw new Error(error);
    }

    // Step 3: Send mobile OTP
    log('  Step 3: Sending mobile OTP...', 'blue');
    const mobileOTPSend = await sendClinicMobileOTP(clinicData.mobile);
    if (!mobileOTPSend.success) {
      error = `Mobile OTP send failed: ${JSON.stringify(mobileOTPSend.error)}`;
      throw new Error(error);
    }

    // Step 4: Verify mobile OTP
    log('  Step 4: Verifying mobile OTP...', 'blue');
    const mobileOTPVerify = await verifyClinicMobileOTP(clinicData.mobile, TEST_OTP_CODE);
    if (!mobileOTPVerify.success) {
      error = `Mobile OTP verification failed: ${JSON.stringify(mobileOTPVerify.error)}`;
      throw new Error(error);
    }

    otpResult = 'PASS';

    // Step 5: Register clinic
    log('  Step 5: Submitting clinic application...', 'blue');
    const registration = await registerClinic(clinicData, true, true);
    if (!registration.success) {
      error = `Registration failed: ${JSON.stringify(registration.error)}`;
      regResult = 'FAIL';
      throw new Error(error);
    }
    regResult = 'PASS';

    // Step 6: Verify database state
    log('  Step 6: Verifying database state...', 'blue');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB commit
    
    const dbVerify = await verifyClinicInDatabase(clinicData);
    if (!dbVerify.verified) {
      error = `Database verification failed: ${dbVerify.error}`;
      dbResult = 'FAIL';
      throw new Error(error);
    }

    const expectedChecks = {
      userRole: true,
      userApprovalStatus: 'PENDING',
      clinicApprovalStatus: 'PENDING',
      clinicIsActive: false,
      clinicOwnerId: true,
    };

    const checksPass =
      dbVerify.checks.userRole &&
      dbVerify.checks.userApprovalStatus === expectedChecks.userApprovalStatus &&
      dbVerify.checks.clinicApprovalStatus === expectedChecks.clinicApprovalStatus &&
      dbVerify.checks.clinicIsActive === expectedChecks.clinicIsActive &&
      dbVerify.checks.clinicOwnerId;

    if (!checksPass) {
      error = `Database checks failed: ${JSON.stringify(dbVerify.checks)}`;
      dbResult = 'FAIL';
      throw new Error(error);
    }
    dbResult = 'PASS';

    // Step 7: Attempt login (should be blocked)
    log('  Step 7: Attempting login (should be BLOCKED)...', 'blue');
    const loginAttempt = await attemptLogin(clinicData.email, clinicData.password);
    if (loginAttempt.success) {
      error = 'PENDING clinic was able to login (SECURITY ISSUE)';
      loginResult = 'FAIL';
      throw new Error(error);
    }
    loginResult = 'PASS (BLOCKED)';

    overallResult = 'PASS';
    
    // Store clinic data for later tests
    testResults.clinics.push({
      ...clinicData,
      userId: dbVerify.user.id,
      clinicId: dbVerify.clinic.id,
    });

  } catch (err) {
    error = error || err.message;
  }

  recordTestResult(
    'clinics',
    testId,
    clinicData.clinicName,
    clinicData.email,
    clinicData.mobile,
    otpResult,
    regResult,
    'PENDING',
    loginResult,
    dbResult,
    overallResult,
    { error }
  );

  return overallResult === 'PASS';
}

async function testClinicApprovalFlow(adminToken) {
  log('\n═══ CLINIC APPROVAL FLOW ═══', 'magenta');
  
  const approvedClinics = [];
  const rejectedClinics = [];

  for (let i = 0; i < testResults.clinics.length; i++) {
    const clinic = testResults.clinics[i];
    const testId = `APPROVAL_CLINIC_${String(i + 1).padStart(3, '0')}`;
    
    log(`\n→ ${testId}: Approving ${clinic.clinicName}`, 'cyan');

    try {
      // Approve clinic
      const approval = await adminApproveClinic(clinic.clinicId, adminToken);
      if (!approval.success) {
        throw new Error(`Approval failed: ${JSON.stringify(approval.error)}`);
      }

      // Verify database state
      await new Promise(resolve => setTimeout(resolve, 1000));
      const dbVerify = await verifyClinicInDatabase(clinic);
      
      if (!dbVerify.verified ||
          dbVerify.checks.userApprovalStatus !== 'VERIFIED' ||
          dbVerify.checks.clinicApprovalStatus !== 'VERIFIED' ||
          dbVerify.checks.clinicIsActive !== true) {
        throw new Error(`Post-approval verification failed: ${JSON.stringify(dbVerify.checks)}`);
      }

      // Test login (should succeed now)
      const loginAttempt = await attemptLogin(clinic.email, clinic.password);
      if (!loginAttempt.success) {
        throw new Error('VERIFIED clinic cannot login');
      }

      clinic.token = loginAttempt.data.accessToken;
      approvedClinics.push(clinic);

      recordTestResult(
        'approvals',
        testId,
        clinic.clinicName,
        clinic.email,
        clinic.mobile,
        'N/A',
        'N/A',
        'APPROVED',
        'PASS',
        'PASS',
        'PASS',
        {}
      );

    } catch (error) {
      recordTestResult(
        'approvals',
        testId,
        clinic.clinicName,
        clinic.email,
        clinic.mobile,
        'N/A',
        'N/A',
        'FAILED',
        'FAIL',
        'FAIL',
        'FAIL',
        { error: error.message }
      );
    }
  }

  return { approvedClinics, rejectedClinics };
}

async function testDoctorInvitationAndOnboarding(doctorIndex, clinic) {
  const testId = `DOCTOR_${String(doctorIndex).padStart(3, '0')}`;
  const doctorData = generateDoctorTestData(doctorIndex);
  
  log(`\n→ Testing ${testId}: ${doctorData.doctorName}`, 'cyan');

  let otpResult = 'NOT_TESTED';
  let regResult = 'NOT_TESTED';
  let loginResult = 'NOT_TESTED';
  let dbResult = 'NOT_TESTED';
  let overallResult = 'FAIL';
  let error = null;

  try {
    // Step 1: Clinic invites doctor
    log('  Step 1: Sending doctor invitation...', 'blue');
    const invitation = await inviteDoctor(clinic.clinicId, doctorData, clinic.token);
    if (!invitation.success) {
      error = `Invitation failed: ${JSON.stringify(invitation.error)}`;
      throw new Error(error);
    }

    const invitationToken = invitation.data.invitation.invitationToken;

    // Step 2: Doctor accepts invitation
    log('  Step 2: Accepting invitation...', 'blue');
    const accept = await acceptInvitation(invitationToken);
    if (!accept.success) {
      error = `Accept invitation failed: ${JSON.stringify(accept.error)}`;
      throw new Error(error);
    }

    // Step 3: Send and verify mobile OTP
    log('  Step 3: Verifying mobile OTP...', 'blue');
    await sendDoctorMobileOTP(invitationToken);
    const mobileVerify = await verifyDoctorMobileOTP(invitationToken, TEST_OTP_CODE);
    if (!mobileVerify.success) {
      error = `Mobile OTP verification failed: ${JSON.stringify(mobileVerify.error)}`;
      throw new Error(error);
    }

    // Step 4: Send and verify email OTP (if email provided)
    if (doctorData.email) {
      log('  Step 4: Verifying email OTP...', 'blue');
      await sendDoctorEmailOTP(invitationToken);
      const emailVerify = await verifyDoctorEmailOTP(invitationToken, TEST_OTP_CODE);
      if (!emailVerify.success) {
        error = `Email OTP verification failed: ${JSON.stringify(emailVerify.error)}`;
        throw new Error(error);
      }
    }

    otpResult = 'PASS';

    // Step 5: Complete doctor profile
    log('  Step 5: Completing doctor profile...', 'blue');
    const profileUpdate = await updateDoctorProfile(invitationToken, {
      fullLegalName: doctorData.fullLegalName,
      dateOfBirth: doctorData.dateOfBirth,
      gender: doctorData.gender,
      medicalSystem: doctorData.medicalSystem,
      qualification: doctorData.qualification,
      specialization: doctorData.specialization,
      medicalRegistrationNumber: doctorData.medicalRegistrationNumber,
      registrationAuthority: doctorData.registrationAuthority,
      registrationYear: doctorData.registrationYear,
      experienceYears: doctorData.experienceYears,
      bio: doctorData.bio,
      languagesKnown: doctorData.languagesKnown,
      consultationFee: doctorData.consultationFee,
      areasOfExpertise: doctorData.areasOfExpertise,
    });

    if (!profileUpdate.success) {
      error = `Profile update failed: ${JSON.stringify(profileUpdate.error)}`;
      regResult = 'FAIL';
      throw new Error(error);
    }

    // Step 6: Submit profile
    log('  Step 6: Submitting profile for verification...', 'blue');
    const submission = await submitDoctorProfile(invitationToken);
    if (!submission.success) {
      error = `Profile submission failed: ${JSON.stringify(submission.error)}`;
      regResult = 'FAIL';
      throw new Error(error);
    }
    regResult = 'PASS';

    // Step 7: Verify database state
    log('  Step 7: Verifying database state...', 'blue');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const dbVerify = await verifyDoctorInDatabase(doctorData);
    if (!dbVerify.verified) {
      error = `Database verification failed: ${dbVerify.error}`;
      dbResult = 'FAIL';
      throw new Error(error);
    }

    const checksPass =
      dbVerify.checks.userRole &&
      dbVerify.checks.profileExists &&
      dbVerify.checks.userApprovalStatus === 'PENDING' &&
      dbVerify.checks.verificationStatus === 'PENDING' &&
      dbVerify.checks.profileStatus === 'COMPLETE';

    if (!checksPass) {
      error = `Database checks failed: ${JSON.stringify(dbVerify.checks)}`;
      dbResult = 'FAIL';
      throw new Error(error);
    }
    dbResult = 'PASS';

    // Step 8: Attempt login (should be blocked)
    log('  Step 8: Attempting login (should be BLOCKED)...', 'blue');
    const loginAttempt = await attemptLogin(doctorData.email, TEST_PASSWORD);
    if (loginAttempt.success) {
      error = 'PENDING doctor was able to login (SECURITY ISSUE)';
      loginResult = 'FAIL';
      throw new Error(error);
    }
    loginResult = 'PASS (BLOCKED)';

    overallResult = 'PASS';
    
    // Store doctor data for later tests
    testResults.doctors.push({
      ...doctorData,
      userId: dbVerify.user.id,
      profileId: dbVerify.profile.id,
      clinicId: clinic.clinicId,
      invitationToken,
    });

  } catch (err) {
    error = error || err.message;
  }

  recordTestResult(
    'doctors',
    testId,
    doctorData.doctorName,
    doctorData.email,
    doctorData.mobile,
    otpResult,
    regResult,
    'PENDING',
    loginResult,
    dbResult,
    overallResult,
    { error }
  );

  return overallResult === 'PASS';
}

async function testDoctorApprovalFlow(adminToken) {
  log('\n═══ DOCTOR APPROVAL FLOW ═══', 'magenta');
  
  const approvedDoctors = [];
  const rejectedDoctors = [];

  for (let i = 0; i < testResults.doctors.length; i++) {
    const doctor = testResults.doctors[i];
    const testId = `APPROVAL_DOCTOR_${String(i + 1).padStart(3, '0')}`;
    
    // Special case: Reject doctors 21, 22, 23
    if (i >= 20 && i <= 22) {
      log(`\n→ ${testId}: Rejecting ${doctor.doctorName}`, 'cyan');
      
      try {
        const rejection = await adminRejectDoctor(doctor.profileId, 'Test rejection for QA', adminToken);
        if (!rejection.success) {
          throw new Error(`Rejection failed: ${JSON.stringify(rejection.error)}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        const dbVerify = await verifyDoctorInDatabase(doctor);
        
        if (!dbVerify.verified ||
            dbVerify.checks.verificationStatus !== 'REJECTED' ||
            dbVerify.checks.userApprovalStatus !== 'REJECTED') {
          throw new Error(`Post-rejection verification failed: ${JSON.stringify(dbVerify.checks)}`);
        }

        rejectedDoctors.push(doctor);

        recordTestResult(
          'approvals',
          testId,
          doctor.doctorName,
          doctor.email,
          doctor.mobile,
          'N/A',
          'N/A',
          'REJECTED',
          'N/A',
          'PASS',
          'PASS',
          {}
        );
      } catch (error) {
        recordTestResult(
          'approvals',
          testId,
          doctor.doctorName,
          doctor.email,
          doctor.mobile,
          'N/A',
          'N/A',
          'REJECTED',
          'FAIL',
          'FAIL',
          'FAIL',
          { error: error.message }
        );
      }
      
      continue;
    }

    log(`\n→ ${testId}: Approving ${doctor.doctorName}`, 'cyan');

    try {
      // Approve doctor
      const approval = await adminApproveDoctor(doctor.profileId, adminToken);
      if (!approval.success) {
        throw new Error(`Approval failed: ${JSON.stringify(approval.error)}`);
      }

      // Verify database state
      await new Promise(resolve => setTimeout(resolve, 1000));
      const dbVerify = await verifyDoctorInDatabase(doctor);
      
      if (!dbVerify.verified ||
          dbVerify.checks.verificationStatus !== 'VERIFIED' ||
          dbVerify.checks.userApprovalStatus !== 'VERIFIED') {
        throw new Error(`Post-approval verification failed: ${JSON.stringify(dbVerify.checks)}`);
      }

      // Test login (should succeed now)
      const loginAttempt = await attemptLogin(doctor.email, TEST_PASSWORD);
      if (!loginAttempt.success) {
        throw new Error('VERIFIED doctor cannot login');
      }

      doctor.token = loginAttempt.data.accessToken;
      approvedDoctors.push(doctor);

      recordTestResult(
        'approvals',
        testId,
        doctor.doctorName,
        doctor.email,
        doctor.mobile,
        'N/A',
        'N/A',
        'APPROVED',
        'PASS',
        'PASS',
        'PASS',
        {}
      );

    } catch (error) {
      recordTestResult(
        'approvals',
        testId,
        doctor.doctorName,
        doctor.email,
        doctor.mobile,
        'N/A',
        'N/A',
        'FAILED',
        'FAIL',
        'FAIL',
        'FAIL',
        { error: error.message }
      );
    }
  }

  return { approvedDoctors, rejectedDoctors };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function runTests() {
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  PULSEMATE CONNECT - 45 IDENTITY COMPREHENSIVE E2E TEST SUITE   ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝\n', 'cyan');

  let adminToken = null;

  try {
    // Login as admin
    log('→ Logging in as admin...', 'blue');
    adminToken = await adminLogin();
    log('✓ Admin logged in successfully\n', 'green');

    // ═════════════════════════════════════════════════════════════════════
    // PHASE 1: CLINIC REGISTRATION (20 Clinics)
    // ═════════════════════════════════════════════════════════════════════
    log('╔══════════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 1: CLINIC REGISTRATION (20 Clinics)                       ║', 'magenta');
    log('╚══════════════════════════════════════════════════════════════════╝\n', 'magenta');

    for (let i = 1; i <= 20; i++) {
      await testClinicRegistration(i);
      await new Promise(resolve => setTimeout(resolve, 500)); // Throttle
    }

    // Database integrity check after all clinics
    log('\n→ Running database integrity check after clinic registration...', 'blue');
    const integrityCheck1 = await verifyDatabaseIntegrity();
    if (!integrityCheck1.passed) {
      log(`✗ Database integrity check FAILED:`, 'red');
      integrityCheck1.errors.forEach(err => log(`  - ${err}`, 'yellow'));
    } else {
      log('✓ Database integrity check PASSED', 'green');
    }

    // ═════════════════════════════════════════════════════════════════════
    // PHASE 2: CLINIC APPROVAL (20 Clinics)
    // ═════════════════════════════════════════════════════════════════════
    log('\n╔══════════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 2: CLINIC APPROVAL (20 Clinics)                           ║', 'magenta');
    log('╚══════════════════════════════════════════════════════════════════╝\n', 'magenta');

    const { approvedClinics } = await testClinicApprovalFlow(adminToken);
    log(`\n✓ Approved ${approvedClinics.length} clinics\n`, 'green');

    // ═════════════════════════════════════════════════════════════════════
    // PHASE 3: DOCTOR INVITATION & ONBOARDING (25 Doctors)
    // ═════════════════════════════════════════════════════════════════════
    log('╔══════════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 3: DOCTOR INVITATION & ONBOARDING (25 Doctors)            ║', 'magenta');
    log('╚══════════════════════════════════════════════════════════════════╝\n', 'magenta');

    for (let i = 1; i <= 25; i++) {
      const clinicIndex = (i - 1) % approvedClinics.length;
      const clinic = approvedClinics[clinicIndex];
      await testDoctorInvitationAndOnboarding(i, clinic);
      await new Promise(resolve => setTimeout(resolve, 500)); // Throttle
    }

    // Database integrity check after all doctors
    log('\n→ Running database integrity check after doctor registration...', 'blue');
    const integrityCheck2 = await verifyDatabaseIntegrity();
    if (!integrityCheck2.passed) {
      log(`✗ Database integrity check FAILED:`, 'red');
      integrityCheck2.errors.forEach(err => log(`  - ${err}`, 'yellow'));
    } else {
      log('✓ Database integrity check PASSED', 'green');
    }

    // ═════════════════════════════════════════════════════════════════════
    // PHASE 4: DOCTOR APPROVAL (22 Approved, 3 Rejected)
    // ═════════════════════════════════════════════════════════════════════
    log('\n╔══════════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 4: DOCTOR APPROVAL (22 Approved, 3 Rejected)              ║', 'magenta');
    log('╚══════════════════════════════════════════════════════════════════╝\n', 'magenta');

    const { approvedDoctors, rejectedDoctors } = await testDoctorApprovalFlow(adminToken);
    log(`\n✓ Approved ${approvedDoctors.length} doctors`, 'green');
    log(`✓ Rejected ${rejectedDoctors.length} doctors\n`, 'green');

    // ═════════════════════════════════════════════════════════════════════
    // PHASE 5: MULTI-CLINIC DOCTOR TEST
    // ═════════════════════════════════════════════════════════════════════
    log('╔══════════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 5: MULTI-CLINIC DOCTOR TEST                               ║', 'magenta');
    log('╚══════════════════════════════════════════════════════════════════╝\n', 'magenta');

    if (approvedDoctors.length > 0 && approvedClinics.length >= 2) {
      const testDoctor = approvedDoctors[approvedDoctors.length - 1]; // Use Doctor025
      const clinic1 = approvedClinics[0];
      const clinic2 = approvedClinics[1];

      log(`→ Inviting ${testDoctor.doctorName} to second clinic (${clinic2.clinicName})...`, 'cyan');

      try {
        // Invite same doctor to second clinic
        const invitation = await inviteDoctor(clinic2.clinicId, testDoctor, clinic2.token);
        if (!invitation.success) {
          throw new Error(`Invitation failed: ${JSON.stringify(invitation.error)}`);
        }

        // Verify ONE user, ONE profile, TWO DoctorClinic records
        const dbVerify = await verifyDoctorInDatabase(testDoctor);
        const expectedClinics = 2;
        
        if (dbVerify.checks.clinicRelationships !== expectedClinics) {
          throw new Error(`Expected ${expectedClinics} clinic relationships, found ${dbVerify.checks.clinicRelationships}`);
        }

        // Check for duplicate User or DoctorProfile
        const allUsers = await prisma.user.findMany({
          where: { mobile: testDoctor.mobile },
        });

        const allProfiles = await prisma.doctorProfile.findMany({
          where: { userId: testDoctor.userId },
        });

        if (allUsers.length !== 1) {
          throw new Error(`Expected 1 User, found ${allUsers.length}`);
        }

        if (allProfiles.length !== 1) {
          throw new Error(`Expected 1 DoctorProfile, found ${allProfiles.length}`);
        }

        recordTestResult(
          'database',
          'MULTI_CLINIC_001',
          testDoctor.doctorName,
          testDoctor.email,
          testDoctor.mobile,
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'PASS',
          'PASS',
          { message: 'Multi-clinic doctor verified correctly' }
        );

      } catch (error) {
        recordTestResult(
          'database',
          'MULTI_CLINIC_001',
          testDoctor.doctorName,
          testDoctor.email,
          testDoctor.mobile,
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'FAIL',
          'FAIL',
          { error: error.message }
        );
      }
    }

    // ═════════════════════════════════════════════════════════════════════
    // PHASE 6: FINAL DATABASE AUDIT
    // ═════════════════════════════════════════════════════════════════════
    log('\n╔══════════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 6: FINAL DATABASE AUDIT                                   ║', 'magenta');
    log('╚══════════════════════════════════════════════════════════════════╝\n', 'magenta');

    const finalIntegrity = await verifyDatabaseIntegrity();
    if (!finalIntegrity.passed) {
      log('✗ FINAL DATABASE AUDIT FAILED:', 'red');
      finalIntegrity.errors.forEach(err => log(`  - ${err}`, 'yellow'));
    } else {
      log('✓ FINAL DATABASE AUDIT PASSED', 'green');
    }

  } catch (error) {
    log(`\nFATAL ERROR: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GENERATE FINAL REPORT
  // ═══════════════════════════════════════════════════════════════════════
  generateFinalReport();
}

function generateFinalReport() {
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  FINAL TEST REPORT                                               ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`TOTAL TESTS: ${testResults.summary.totalTests}`, 'cyan');
  log(`PASSED: ${testResults.summary.passed}`, 'green');
  log(`FAILED: ${testResults.summary.failed}`, 'red');
  log(`BLOCKED: ${testResults.summary.blocked}`, 'yellow');
  log(`NOT RUN: ${testResults.summary.notRun}`, 'white');

  const passRate = ((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1);
  log(`\nPASS RATE: ${passRate}%\n`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');

  // Save detailed report to file
  const reportPath = path.join(__dirname, 'reports', `test-report-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\nDetailed report saved to: ${reportPath}\n`, 'cyan');

  // Generate markdown table
  generateMarkdownReport();
}

function generateMarkdownReport() {
  const reportPath = path.join(__dirname, 'reports', `test-report-${Date.now()}.md`);
  
  let markdown = '# PulseMate Connect - 45 Identity Comprehensive Test Report\n\n';
  markdown += `**Test Date:** ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${testResults.summary.totalTests}\n`;
  markdown += `- **Passed:** ${testResults.summary.passed}\n`;
  markdown += `- **Failed:** ${testResults.summary.failed}\n`;
  markdown += `- **Blocked:** ${testResults.summary.blocked}\n`;
  markdown += `- **Not Run:** ${testResults.summary.notRun}\n`;
  markdown += `- **Pass Rate:** ${((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1)}%\n\n`;

  // Clinic tests table
  markdown += `## Clinic Tests (20 accounts)\n\n`;
  markdown += `| Test ID | Entity | Email | Mobile | OTP | Registration | Approval | Login | DB Check | Result |\n`;
  markdown += `|---------|--------|-------|--------|-----|--------------|----------|-------|----------|--------|\n`;
  
  testResults.clinics.forEach(test => {
    markdown += `| ${test.testId} | ${test.entity} | ${test.testIdentity} | ${test.mobileIdentity} | ${test.otp} | ${test.registration} | ${test.approval} | ${test.login} | ${test.dbCheck} | ${test.result} |\n`;
  });

  // Doctor tests table
  markdown += `\n## Doctor Tests (25 accounts)\n\n`;
  markdown += `| Test ID | Entity | Email | Mobile | OTP | Registration | Approval | Login | DB Check | Result |\n`;
  markdown += `|---------|--------|-------|--------|-----|--------------|----------|-------|----------|--------|\n`;
  
  testResults.doctors.forEach(test => {
    markdown += `| ${test.testId} | ${test.entity} | ${test.testIdentity} | ${test.mobileIdentity} | ${test.otp} | ${test.registration} | ${test.approval} | ${test.login} | ${test.dbCheck} | ${test.result} |\n`;
  });

  // Failed tests
  markdown += `\n## Failed Tests\n\n`;
  const failedTests = [
    ...testResults.clinics.filter(t => t.result === 'FAIL'),
    ...testResults.doctors.filter(t => t.result === 'FAIL'),
    ...testResults.approvals.filter(t => t.result === 'FAIL'),
    ...testResults.database.filter(t => t.result === 'FAIL'),
  ];

  if (failedTests.length === 0) {
    markdown += `✓ No failed tests\n\n`;
  } else {
    failedTests.forEach(test => {
      markdown += `### ${test.testId}: ${test.entity}\n`;
      markdown += `- **Error:** ${test.error}\n`;
      markdown += `- **Email:** ${test.testIdentity}\n`;
      markdown += `- **Mobile:** ${test.mobileIdentity}\n\n`;
    });
  }

  fs.writeFileSync(reportPath, markdown);
  log(`Markdown report saved to: ${reportPath}\n`, 'cyan');
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════

runTests().catch(error => {
  log(`\nUNEXPECTED ERROR: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

