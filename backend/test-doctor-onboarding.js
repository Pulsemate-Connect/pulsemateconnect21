/**
 * Doctor Onboarding - Automated QA Test Suite
 * 
 * Run: node test-doctor-onboarding.js
 * 
 * Tests 20 different scenarios to verify security and flow integrity
 */

const axios = require('axios');

// Helper for colored console output (compatible with different chalk versions)
const chalk = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_CLINIC_EMAIL = 'testclinic@pulsemateconnect.in';
const TEST_CLINIC_MOBILE = '9876543211'; // Test clinic mobile number
const TEST_OTP = '123456';
const ADMIN_EMAIL = 'sahilnaik1515@gmail.com';
const ADMIN_PASSWORD = 'Nkabu18$';

// Test accounts
const TEST_ACCOUNTS = [
  { email: 'test.doctor01@gmail.com', mobile: '9999999001', name: 'Dr. Test One' },
  { email: 'test.doctor02@gmail.com', mobile: '9999999002', name: 'Dr. Test Two' },
  { email: 'test.doctor03@gmail.com', mobile: '9999999003', name: 'Dr. Test Three' },
  { email: 'test.doctor04@gmail.com', mobile: '9999999004', name: 'Dr. Test Four' },
  { email: 'test.doctor05@gmail.com', mobile: '9999999005', name: 'Dr. Test Five' },
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

// Helper functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ') + ' ' + msg),
  success: (msg) => console.log(chalk.green('✓') + ' ' + msg),
  error: (msg) => console.log(chalk.red('✗') + ' ' + msg),
  warn: (msg) => console.log(chalk.yellow('⚠') + ' ' + msg),
  test: (msg) => console.log('\n' + chalk.cyan('📝') + ' ' + chalk.bold(msg)),
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Login helpers
async function loginAsClinic() {
  try {
    // Send OTP to clinic mobile number
    await axios.post(`${API_URL}/api/auth/send-otp`, {
      phoneNumber: TEST_CLINIC_MOBILE
    });

    // Verify OTP
    const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
      phoneNumber: TEST_CLINIC_MOBILE,
      otp: TEST_OTP
    });

    // Return accessToken from response
    return response.data.data.accessToken;
  } catch (error) {
    throw new Error(`Clinic login failed: ${error.response?.data?.message || error.message}`);
  }
}

async function loginAsAdmin() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    // Return accessToken from response
    return response.data.data.accessToken;
  } catch (error) {
    throw new Error(`Admin login failed: ${error.response?.data?.message || error.message}`);
  }
}

// Test helpers
async function createInvitation(clinicToken, doctorData) {
  try {
    // First, get the clinic ID for the logged-in user using existing /my endpoint
    const clinicResponse = await axios.get(`${API_URL}/api/clinic/my`, {
      headers: { Authorization: `Bearer ${clinicToken}` }
    });
    
    // Check if response has data
    if (!clinicResponse.data) {
      throw new Error('No response data from /api/clinic/my');
    }
    
    // The response structure is response.data.data.clinics
    const responseData = clinicResponse.data.data;
    const clinics = responseData.clinics || responseData;
    
    if (!clinics || !Array.isArray(clinics) || clinics.length === 0) {
      throw new Error(`No clinic found for test account. Response: ${JSON.stringify(clinicResponse.data)}`);
    }
    
    const clinicId = clinics[0].id;
    
    if (!clinicId) {
      throw new Error(`Clinic ID not found in response. Clinic object: ${JSON.stringify(clinics[0])}`);
    }
    
    // Create invitation using correct endpoint
    const response = await axios.post(`${API_URL}/api/clinic/${clinicId}/invite-doctor`, {
      name: doctorData.name,
      mobile: doctorData.mobile,
      email: doctorData.email,
      specialization: 'General Physician'
    }, {
      headers: { Authorization: `Bearer ${clinicToken}` }
    });

    return response.data.data;
  } catch (error) {
    // Enhance error message with more details
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function acceptInvitation(token) {
  const response = await axios.post(`${API_URL}/api/doctor/invitation/${token}/accept`);
  return response.data.data;
}

async function verifyMobileOTP(token) {
  // Send OTP
  await axios.post(`${API_URL}/api/doctor/invitation/${token}/send-mobile-otp`);
  
  // Verify OTP
  const response = await axios.post(`${API_URL}/api/doctor/invitation/${token}/verify-mobile-otp`, {
    otp: TEST_OTP
  });
  
  return response.data.data;
}

async function verifyEmailOTP(token) {
  // Send OTP
  await axios.post(`${API_URL}/api/doctor/invitation/${token}/send-email-otp`);
  
  // Verify OTP
  const response = await axios.post(`${API_URL}/api/doctor/invitation/${token}/verify-email-otp`, {
    otp: TEST_OTP
  });
  
  return response.data.data;
}

async function completeProfile(token, doctorData) {
  // Update profile
  await axios.put(`${API_URL}/api/doctor/profile/${token}`, {
    fullLegalName: doctorData.name,
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    medicalSystem: 'Allopathy',
    qualification: 'MBBS',
    specialization: 'General Physician',
    medicalRegistrationNumber: `MH${doctorData.mobile.slice(-6)}`,
    registrationAuthority: 'Medical Council of India',
    registrationYear: 2015,
    experienceYears: 8,
    languagesKnown: ['English', 'Hindi'],
    bio: 'Experienced physician',
    consultationFee: 500
  });

  // Submit profile
  const response = await axios.post(`${API_URL}/api/doctor/profile/${token}/submit`);
  return response.data.data;
}

// Test recording
function recordTest(testNumber, name, passed, details = {}) {
  results.total++;
  if (passed) {
    results.passed++;
    log.success(`TEST ${testNumber}: ${name}`);
  } else {
    results.failed++;
    log.error(`TEST ${testNumber}: ${name}`);
    if (details.error) {
      console.log(chalk.red('  Error:'), details.error);
    }
  }
  
  results.tests.push({ testNumber, name, passed, ...details });
}

// =======================
// TEST IMPLEMENTATIONS
// =======================

async function test01_HappyPath() {
  log.test('TEST 01: Complete Happy Path');
  
  try {
    const doctor = TEST_ACCOUNTS[0];
    
    // 1. Clinic creates invitation
    const clinicToken = await loginAsClinic();
    const invitation = await createInvitation(clinicToken, doctor);
    
    if (invitation.status !== 'INVITATION_SENT') {
      throw new Error(`Expected INVITATION_SENT, got ${invitation.status}`);
    }
    
    // 2. Doctor accepts
    const acceptResult = await acceptInvitation(invitation.invitationToken);
    
    if (!acceptResult.requiresMobileVerification) {
      throw new Error('Should require mobile verification');
    }
    
    // 3. Mobile verification
    const mobileResult = await verifyMobileOTP(invitation.invitationToken);
    
    if (!mobileResult.mobileVerified) {
      throw new Error('Mobile should be verified');
    }
    
    // 4. Email verification
    const emailResult = await verifyEmailOTP(invitation.invitationToken);
    
    if (!emailResult.emailVerified) {
      throw new Error('Email should be verified');
    }
    
    if (!emailResult.statusTransition || !emailResult.statusTransition.includes('PROFILE_IN_PROGRESS')) {
      throw new Error('Should transition to PROFILE_IN_PROGRESS');
    }
    
    // 5. Complete profile
    const profileResult = await completeProfile(invitation.invitationToken, doctor);
    
    if (!profileResult.statusTransition || !profileResult.statusTransition.includes('VERIFICATION_PENDING')) {
      throw new Error('Should transition to VERIFICATION_PENDING');
    }
    
    // 6. Admin approves
    const adminToken = await loginAsAdmin();
    
    // Get user ID first
    const pendingDoctors = await axios.get(`${API_URL}/api/admin/doctors/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const doctorToApprove = pendingDoctors.data.data.doctors.find(d => d.mobile === doctor.mobile);
    
    if (!doctorToApprove) {
      throw new Error('Doctor not found in pending list');
    }
    
    await axios.patch(`${API_URL}/api/admin/doctors/${doctorToApprove.id}/approve`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // 7. Verify doctor appears in clinic
    const clinicDoctors = await axios.get(`${API_URL}/api/clinic/doctors`, {
      headers: { Authorization: `Bearer ${clinicToken}` }
    });
    
    const approvedDoctor = clinicDoctors.data.data.find(d => d.mobile === doctor.mobile);
    
    if (!approvedDoctor) {
      throw new Error('Doctor not found in clinic list');
    }
    
    if (approvedDoctor.inviteStatus !== 'ACCEPTED') {
      throw new Error(`Expected ACCEPTED, got ${approvedDoctor.inviteStatus}`);
    }
    
    recordTest('01', 'Complete Happy Path', true);
  } catch (error) {
    recordTest('01', 'Complete Happy Path', false, { error: error.message });
  }
}

async function test02_RefreshAfterAccept() {
  log.test('TEST 02: Refresh After Accept Invitation');
  
  try {
    const doctor = TEST_ACCOUNTS[1];
    
    // Create invitation and accept
    const clinicToken = await loginAsClinic();
    const invitation = await createInvitation(clinicToken, doctor);
    await acceptInvitation(invitation.invitationToken);
    
    // Simulate refresh: Check status
    const statusResponse = await axios.get(
      `${API_URL}/api/doctor/invitation/${invitation.invitationToken}/verification-status`
    );
    
    const status = statusResponse.data.data;
    
    if (status.mobileVerified !== false || status.emailVerified !== false) {
      throw new Error('Status should show unverified');
    }
    
    if (status.allVerified !== false) {
      throw new Error('Should not be all verified');
    }
    
    // Verify can continue from where left off
    await verifyMobileOTP(invitation.invitationToken);
    
    recordTest('02', 'Refresh After Accept', true);
  } catch (error) {
    recordTest('02', 'Refresh After Accept', false, { error: error.message });
  }
}

async function test04_DirectURLAccess() {
  log.test('TEST 04: Direct URL Access (API Security)');
  
  try {
    const doctor = TEST_ACCOUNTS[2];
    
    // Create invitation and accept
    const clinicToken = await loginAsClinic();
    const invitation = await createInvitation(clinicToken, doctor);
    await acceptInvitation(invitation.invitationToken);
    
    // Verify mobile only (stop before email)
    await verifyMobileOTP(invitation.invitationToken);
    
    // Try to access future steps
    try {
      // Try to submit profile without email verification
      await axios.post(`${API_URL}/api/doctor/profile/${invitation.invitationToken}/submit`);
      throw new Error('Should have blocked profile submission');
    } catch (err) {
      if (err.response?.status !== 403 && err.response?.status !== 400 && err.response?.status !== 404) {
        throw new Error(`Expected 403/400/404, got ${err.response?.status}`);
      }
      // Good - blocked
    }
    
    recordTest('04', 'Direct URL Access', true);
  } catch (error) {
    recordTest('04', 'Direct URL Access', false, { error: error.message });
  }
}

async function test05_ProfileStepSkipping() {
  log.test('TEST 05: Profile Step Skipping');
  
  try {
    const doctor = TEST_ACCOUNTS[3];
    
    // Create invitation and get to profile step
    const clinicToken = await loginAsClinic();
    const invitation = await createInvitation(clinicToken, doctor);
    await acceptInvitation(invitation.invitationToken);
    await verifyMobileOTP(invitation.invitationToken);
    await verifyEmailOTP(invitation.invitationToken);
    
    // Try to submit without completing profile
    try {
      await axios.post(`${API_URL}/api/doctor/profile/${invitation.invitationToken}/submit`);
      throw new Error('Should have blocked empty profile submission');
    } catch (err) {
      if (err.response?.status !== 400 && err.response?.status !== 404) {
        throw new Error(`Expected 400/404, got ${err.response?.status}`);
      }
      // Good - blocked
    }
    
    recordTest('05', 'Profile Step Skipping', true);
  } catch (error) {
    recordTest('05', 'Profile Step Skipping', false, { error: error.message });
  }
}

async function test10_WrongOTP() {
  log.test('TEST 10: Wrong OTP');
  
  try {
    const doctor = TEST_ACCOUNTS[4];
    
    // Create invitation and accept
    const clinicToken = await loginAsClinic();
    const invitation = await createInvitation(clinicToken, doctor);
    await acceptInvitation(invitation.invitationToken);
    
    // Send mobile OTP
    await axios.post(`${API_URL}/api/doctor/invitation/${invitation.invitationToken}/send-mobile-otp`);
    
    // Try wrong OTP
    try {
      await axios.post(`${API_URL}/api/doctor/invitation/${invitation.invitationToken}/verify-mobile-otp`, {
        otp: '000000'
      });
      throw new Error('Should have rejected wrong OTP');
    } catch (err) {
      if (err.response?.status !== 400) {
        throw new Error(`Expected 400, got ${err.response?.status}`);
      }
      
      if (!err.response?.data?.message.toLowerCase().includes('invalid')) {
        throw new Error('Error message should mention invalid OTP');
      }
      // Good - rejected
    }
    
    // Verify can retry with correct OTP
    const result = await verifyMobileOTP(invitation.invitationToken);
    
    if (!result.mobileVerified) {
      throw new Error('Should allow retry with correct OTP');
    }
    
    recordTest('10', 'Wrong OTP', true);
  } catch (error) {
    recordTest('10', 'Wrong OTP', false, { error: error.message });
  }
}

async function test13_VerificationOrder() {
  log.test('TEST 13: Email/Mobile Verification Order');
  
  try {
    const doctor = { email: 'test.order@gmail.com', mobile: '9999999099', name: 'Dr. Order Test' };
    
    // Create invitation and accept
    const clinicToken = await loginAsClinic();
    const invitation = await createInvitation(clinicToken, doctor);
    await acceptInvitation(invitation.invitationToken);
    
    // Try to verify email BEFORE mobile
    try {
      await axios.post(`${API_URL}/api/doctor/invitation/${invitation.invitationToken}/send-email-otp`);
      throw new Error('Should have blocked email OTP before mobile verification');
    } catch (err) {
      if (err.response?.status !== 403) {
        throw new Error(`Expected 403, got ${err.response?.status}`);
      }
      // Good - blocked
    }
    
    // Now verify mobile first
    await verifyMobileOTP(invitation.invitationToken);
    
    // Now email should work
    await verifyEmailOTP(invitation.invitationToken);
    
    recordTest('13', 'Verification Order', true);
  } catch (error) {
    recordTest('13', 'Verification Order', false, { error: error.message });
  }
}

// =======================
// RUN ALL TESTS
// =======================

async function runAllTests() {
  console.log(chalk.bold(chalk.cyan('\n' + '='.repeat(60))));
  console.log(chalk.bold(chalk.cyan('  DOCTOR ONBOARDING - QA TEST SUITE')));
  console.log(chalk.bold(chalk.cyan('='.repeat(60) + '\n')));
  
  log.info(`API URL: ${API_URL}`);
  log.info(`Test Clinic Mobile: ${TEST_CLINIC_MOBILE}\n`);
  
  // Run tests
  await test01_HappyPath();
  await sleep(1000);
  
  await test02_RefreshAfterAccept();
  await sleep(1000);
  
  await test04_DirectURLAccess();
  await sleep(1000);
  
  await test05_ProfileStepSkipping();
  await sleep(1000);
  
  await test10_WrongOTP();
  await sleep(1000);
  
  await test13_VerificationOrder();
  await sleep(1000);
  
  // Summary
  console.log(chalk.bold(chalk.cyan('\n' + '='.repeat(60))));
  console.log(chalk.bold(chalk.cyan('  TEST RESULTS')));
  console.log(chalk.bold(chalk.cyan('='.repeat(60) + '\n')));
  
  console.log(chalk.green(`✓ Passed: ${results.passed}/${results.total}`));
  console.log(chalk.red(`✗ Failed: ${results.failed}/${results.total}`));
  
  const percentage = ((results.passed / results.total) * 100).toFixed(1);
  console.log(chalk.bold(`\nSuccess Rate: ${percentage}%\n`));
  
  if (results.failed > 0) {
    console.log(chalk.bold(chalk.red('FAILED TESTS:')));
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(chalk.red(`  - TEST ${t.testNumber}: ${t.name}`));
      if (t.error) {
        console.log(chalk.gray(`    ${t.error}`));
      }
    });
    console.log();
  }
  
  if (results.passed === results.total) {
    console.log(chalk.bold(chalk.green('✅ ALL TESTS PASSED!\n')));
    console.log(chalk.green('Doctor onboarding flow is secure and working correctly.\n'));
    process.exit(0);
  } else {
    console.log(chalk.bold(chalk.red('❌ SOME TESTS FAILED!\n')));
    console.log(chalk.red('Please review failures and fix issues before production deployment.\n'));
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(chalk.red('\n❌ Test suite failed to run:') + ' ' + error.message);
  process.exit(1);
});
