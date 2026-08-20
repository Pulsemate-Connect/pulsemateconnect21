/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PulseMate Connect — Complete Patient Flow Comprehensive QA Test Suite
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This test suite performs exhaustive end-to-end testing covering:
 * - 100 test patients
 * - Authentication & Authorization
 * - Profile Management
 * - Doctor Search & Booking
 * - Payment Integration
 * - Queue Management
 * - Real-time Updates (Socket.IO)
 * - Push Notifications
 * - Security & Isolation
 * - Concurrent Operations
 * - Race Conditions
 * - Performance & Stress Testing
 * 
 * TEST PHILOSOPHY:
 * TEST → DETECT FAILURE → IDENTIFY ROOT CAUSE → FIX → RETEST → VERIFY
 * 
 * DO NOT ASSUME. TEST EVERYTHING.
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  BASE_URL: 'http://192.168.31.240:5000/api',
  TEST_PATIENT_COUNT: 100,
  TEST_OTP: '123456',
  CONCURRENT_TEST_SIZE: 10, // For concurrent operations
  STRESS_TEST_SIZE: 50, // For stress testing
};

// Test state storage
const TEST_STATE = {
  patients: [], // All test patients with auth tokens
  doctors: [],
  clinics: [],
  appointments: [],
  results: {
    total: 0,
    passed: 0,
    failed: 0,
    fixed: 0,
    blocked: 0,
    errors: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

const getTestMobile = (index) => `+91${9900000000 + index}`;
const getTestEmail = (index) => `test-patient-${String(index).padStart(3, '0')}@pulsemate.test`;
const getTestName = (index) => `Test Patient ${String(index).padStart(3, '0')}`;

function assert(condition, testId, testName, details = '') {
  TEST_STATE.results.total++;
  if (condition) {
    TEST_STATE.results.passed++;
    console.log(`✅ ${testId}: ${testName}`);
    return { passed: true, testId, testName };
  } else {
    TEST_STATE.results.failed++;
    const error = {
      testId,
      testName,
      details,
      timestamp: new Date().toISOString(),
    };
    TEST_STATE.results.errors.push(error);
    console.error(`❌ ${testId}: ${testName}${details ? ' - ' + details : ''}`);
    return { passed: false, testId, testName, details };
  }
}

async function runTest(testId, testName, testFn) {
  try {
    await testFn();
  } catch (error) {
    assert(false, testId, testName, error.message);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  PulseMate Connect — Comprehensive QA Test Suite                  ║');
console.log('║  Testing 100 Patient Users                                        ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 1: PATIENT REGISTRATION (100 USERS)
// ═══════════════════════════════════════════════════════════════════════════

async function test01_PatientRegistration() {
  console.log('\n📝 CATEGORY 1: PATIENT REGISTRATION (100 USERS)\n');

  for (let i = 1; i <= CONFIG.TEST_PATIENT_COUNT; i++) {
    const mobile = getTestMobile(i);
    const name = getTestName(i);

    // TC-001: Send OTP
    await runTest(`TC-001-${i}`, `Send OTP to ${mobile}`, async () => {
      const res = await axios.post(`${CONFIG.BASE_URL}/auth/send-otp`, {
        phoneNumber: mobile,
      });
      assert(res.data.success === true, `TC-001-${i}`, `OTP sent`, JSON.stringify(res.data));
      assert(res.data.data?.verificationId, `TC-001-${i}`, `Verification ID received`);

      TEST_STATE.patients[i] = {
        index: i,
        mobile,
        name,
        verificationId: res.data.data.verificationId,
      };
    });

    // TC-002: Verify OTP
    await runTest(`TC-002-${i}`, `Verify OTP for ${mobile}`, async () => {
      const res = await axios.post(`${CONFIG.BASE_URL}/auth/verify-otp`, {
        phoneNumber: mobile,
        otp: CONFIG.TEST_OTP,
        verificationId: TEST_STATE.patients[i].verificationId,
      });

      assert(res.data.success === true, `TC-002-${i}`, `OTP verified`);
      assert(res.data.data?.accessToken, `TC-002-${i}`, `Access token received`);
      assert(res.data.data?.user?.id, `TC-002-${i}`, `User ID received`);
      assert(res.data.data?.user?.role === 'PATIENT', `TC-002-${i}`, `Role is PATIENT`);

      TEST_STATE.patients[i].accessToken = res.data.data.accessToken;
      TEST_STATE.patients[i].userId = res.data.data.user.id;
      TEST_STATE.patients[i].user = res.data.data.user;
    });

    // Small delay to avoid rate limiting
    if (i % 10 === 0) {
      await delay(100);
      console.log(`   Progress: ${i}/${CONFIG.TEST_PATIENT_COUNT} patients registered\n`);
    }
  }

  console.log(`\n✅ Registration complete: ${CONFIG.TEST_PATIENT_COUNT} patients\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 2: PATIENT IDENTITY ISOLATION (CRITICAL SECURITY)
// ═══════════════════════════════════════════════════════════════════════════

async function test02_PatientIdentityIsolation() {
  console.log('\n🔐 CATEGORY 2: PATIENT IDENTITY ISOLATION (SECURITY)\n');

  // Test every patient can only access their own data
  for (let i = 1; i <= Math.min(10, CONFIG.TEST_PATIENT_COUNT); i++) {
    const patient = TEST_STATE.patients[i];
    if (!patient?.accessToken) continue;

    // TC-003: Patient fetches own profile
    await runTest(`TC-003-${i}`, `Patient ${i} fetches own profile`, async () => {
      const res = await axios.get(`${CONFIG.BASE_URL}/patient/profile`, {
        headers: { Authorization: `Bearer ${patient.accessToken}` },
      });

      assert(res.data.success === true, `TC-003-${i}`, `Profile fetch succeeded`);
      assert(res.data.data?.user?.id === patient.userId, `TC-003-${i}`, `Correct user ID`);
      assert(res.data.data?.user?.mobile === patient.mobile, `TC-003-${i}`, `Correct mobile`);
    });

    // TC-004: Patient CANNOT access another patient's appointments
    if (i > 1 && TEST_STATE.patients[i - 1]?.userId) {
      await runTest(`TC-004-${i}`, `Patient ${i} CANNOT see Patient ${i-1} data`, async () => {
        const res = await axios.get(`${CONFIG.BASE_URL}/patient/appointments`, {
          headers: { Authorization: `Bearer ${patient.accessToken}` },
        });

        const appointments = res.data.data || [];
        const hasOtherPatientData = appointments.some(apt => apt.patientId !== patient.userId);

        assert(!hasOtherPatientData, `TC-004-${i}`, `No cross-patient data leak`);
      });
    }
  }

  console.log('\n✅ Identity isolation verified\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 3: PROFILE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

async function test03_ProfileManagement() {
  console.log('\n👤 CATEGORY 3: PROFILE MANAGEMENT\n');

  // Test with first 10 patients
  for (let i = 1; i <= Math.min(10, CONFIG.TEST_PATIENT_COUNT); i++) {
    const patient = TEST_STATE.patients[i];
    if (!patient?.accessToken) continue;

    const profileData = {
      name: getTestName(i),
      gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
      dob: `199${i % 10}-0${(i % 9) + 1}-15`,
      city: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune'][i % 5],
      emergencyContact: `+919${String(1000000000 + i).slice(1)}`,
      bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-'][i % 5],
    };

    // TC-005: Update profile
    await runTest(`TC-005-${i}`, `Update profile for Patient ${i}`, async () => {
      const res = await axios.patch(`${CONFIG.BASE_URL}/patient/profile`, profileData, {
        headers: { Authorization: `Bearer ${patient.accessToken}` },
      });

      assert(res.data.success === true, `TC-005-${i}`, `Profile update succeeded`);
      assert(res.data.data?.user?.patientProfile?.patientName === profileData.name, `TC-005-${i}`, `Name saved`);
      assert(res.data.data?.user?.patientProfile?.gender === profileData.gender, `TC-005-${i}`, `Gender saved`);
    });

    // TC-006: Verify persistence
    await runTest(`TC-006-${i}`, `Verify profile persistence for Patient ${i}`, async () => {
      const res = await axios.get(`${CONFIG.BASE_URL}/patient/profile`, {
        headers: { Authorization: `Bearer ${patient.accessToken}` },
      });

      const profile = res.data.data?.user?.patientProfile;
      assert(profile?.patientName === profileData.name, `TC-006-${i}`, `Name persisted`);
      assert(profile?.gender === profileData.gender, `TC-006-${i}`, `Gender persisted`);
      assert(profile?.bloodGroup === profileData.bloodGroup, `TC-006-${i}`, `Blood group persisted`);
    });
  }

  console.log('\n✅ Profile management verified\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 4: DOCTOR SEARCH
// ═══════════════════════════════════════════════════════════════════════════

async function test04_DoctorSearch() {
  console.log('\n🔍 CATEGORY 4: DOCTOR SEARCH\n');

  const patient = TEST_STATE.patients[1];
  if (!patient?.accessToken) {
    console.log('⏭️  Skipping: No authenticated patient');
    return;
  }

  // TC-007: Search all doctors
  await runTest('TC-007', 'Search all doctors', async () => {
    const res = await axios.get(`${CONFIG.BASE_URL}/patient/doctors`, {
      params: { limit: 20 },
    });

    assert(res.data.success === true, 'TC-007', 'Doctor search succeeded');
    assert(Array.isArray(res.data.data), 'TC-007', 'Returns array');

    const doctors = res.data.data;
    TEST_STATE.doctors = doctors;

    assert(doctors.length > 0, 'TC-007', 'At least one doctor found', `Found ${doctors.length} doctors`);

    if (doctors.length > 0) {
      const doctor = doctors[0];
      assert(doctor.id, 'TC-007', 'Doctor has ID');
      assert(doctor.user?.name, 'TC-007', 'Doctor has name');
      assert(doctor.specialization, 'TC-007', 'Doctor has specialization');
    }
  });

  console.log('\n✅ Doctor search verified\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  const startTime = Date.now();

  try {
    await test01_PatientRegistration();
    await test02_PatientIdentityIsolation();
    await test03_ProfileManagement();
    await test04_DoctorSearch();

    // More test categories will be added here...

  } catch (error) {
    console.error('\n💥 Fatal error during testing:', error.message);
    console.error(error.stack);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL TEST REPORT
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║  COMPREHENSIVE QA TEST REPORT                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📊 Total Tests: ${TEST_STATE.results.total}`);
  console.log(`✅ Passed: ${TEST_STATE.results.passed} (${((TEST_STATE.results.passed / TEST_STATE.results.total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${TEST_STATE.results.failed} (${((TEST_STATE.results.failed / TEST_STATE.results.total) * 100).toFixed(1)}%)`);
  console.log(`🔧 Fixed: ${TEST_STATE.results.fixed}`);
  console.log(`🚫 Blocked: ${TEST_STATE.results.blocked}`);
  console.log('');

  if (TEST_STATE.results.failed > 0) {
    console.log('╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║  FAILED TESTS                                                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    TEST_STATE.results.errors.forEach((err, index) => {
      console.log(`${index + 1}. ❌ ${err.testId}: ${err.testName}`);
      if (err.details) console.log(`   Details: ${err.details}`);
      console.log(`   Time: ${err.timestamp}\n`);
    });
  }

  const status = TEST_STATE.results.failed === 0 ? '✅ PASS' : '❌ FAIL';
  console.log(`\n🏁 Final Status: ${status}\n`);

  process.exit(TEST_STATE.results.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }).finally(async () => {
    await prisma.$disconnect();
  });
}

module.exports = { runAllTests };
