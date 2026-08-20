/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PulseMate Connect — Critical Security & Concurrency Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Focus Areas:
 * 1. Concurrent Booking (50+ users) - Race Condition Test
 * 2. Cross-Patient Data Access Security
 * 3. Payment Flow Integrity
 * 4. Unauthorized API Access Attempts
 * 5. Token Security & Session Management
 * 
 * TEST PHILOSOPHY:
 * TEST → DETECT FAILURE → IDENTIFY ROOT CAUSE → FIX → RETEST → VERIFY
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  BASE_URL: 'http://192.168.31.240:5000/api',
  TEST_OTP: '123456',
  CONCURRENT_USERS: 50, // 50 users for concurrent booking test
  SECURITY_TEST_USERS: 10, // For cross-access security tests
};

const TEST_STATE = {
  patients: [],
  doctors: [],
  clinics: [],
  results: {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    fixed: [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

const getTestMobile = (index) => `+91${9900000000 + index}`;
const getTestEmail = (index) => `test-patient-${String(index).padStart(3, '0')}@pulsemate.test`;

function assert(condition, testId, message, details = '') {
  TEST_STATE.results.total++;
  if (condition) {
    TEST_STATE.results.passed++;
    console.log(`✅ ${testId}: ${message}`);
    return true;
  } else {
    TEST_STATE.results.failed++;
    TEST_STATE.results.errors.push({ testId, message, details, time: new Date().toISOString() });
    console.error(`❌ ${testId}: ${message}${details ? ' - ' + details : ''}`);
    return false;
  }
}

async function runTest(testId, message, testFn) {
  try {
    await testFn();
  } catch (error) {
    assert(false, testId, message, error.message);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION HELPER
// ═══════════════════════════════════════════════════════════════════════════

async function authenticatePatient(index) {
  const mobile = getTestMobile(index);

  // Send OTP
  const otpRes = await axios.post(`${CONFIG.BASE_URL}/auth/send-otp`, {
    phoneNumber: mobile,
  });

  if (!otpRes.data.success) {
    throw new Error(`Failed to send OTP to ${mobile}`);
  }

  // Verify OTP
  const verifyRes = await axios.post(`${CONFIG.BASE_URL}/auth/verify-otp`, {
    phoneNumber: mobile,
    otp: CONFIG.TEST_OTP,
    verificationId: otpRes.data.data.verificationId,
  });

  if (!verifyRes.data.success) {
    throw new Error(`Failed to verify OTP for ${mobile}`);
  }

  return {
    index,
    mobile,
    userId: verifyRes.data.data.user.id,
    accessToken: verifyRes.data.data.accessToken,
    user: verifyRes.data.data.user,
  };
}

console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  PulseMate Connect — Critical Security & Concurrency Tests       ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1: CONCURRENT BOOKING STRESS TEST (50 USERS → SAME SLOT)
// ═══════════════════════════════════════════════════════════════════════════

async function test01_ConcurrentBookingRaceCondition() {
  console.log('\n⚡ TEST 1: CONCURRENT BOOKING RACE CONDITION (50 USERS)\n');
  console.log('📋 Scenario: 50 patients attempt to book the SAME doctor/date/slot simultaneously');
  console.log('✅ Expected: Only 1 booking succeeds, 49 fail with proper error\n');

  // Step 1: Authenticate 50 test patients (with rate limit handling)
  console.log('🔐 Step 1: Authenticating 50 test patients (batched to avoid rate limits)...\n');
  const patients = [];
  const BATCH_SIZE = 5; // Authenticate 5 at a time
  
  for (let batch = 0; batch < Math.ceil(CONFIG.CONCURRENT_USERS / BATCH_SIZE); batch++) {
    const start = batch * BATCH_SIZE + 1;
    const end = Math.min(start + BATCH_SIZE - 1, CONFIG.CONCURRENT_USERS);
    
    console.log(`   Batch ${batch + 1}: Authenticating patients ${start}-${end}...`);
    
    const batchPromises = [];
    for (let i = start; i <= end; i++) {
      batchPromises.push(authenticatePatient(i));
    }
    
    const batchResults = await Promise.all(batchPromises);
    patients.push(...batchResults);
    
    // Small delay between batches
    if (batch < Math.ceil(CONFIG.CONCURRENT_USERS / BATCH_SIZE) - 1) {
      await delay(500);
    }
  }
  
  console.log(`\n✅ ${patients.length} patients authenticated\n`);

  // Step 2: Get available doctors
  console.log('🔍 Step 2: Finding available doctor...\n');
  const doctorsRes = await axios.get(`${CONFIG.BASE_URL}/patient/doctors`, {
    params: { limit: 5 },
  });

  if (!doctorsRes.data.data || doctorsRes.data.data.length === 0) {
    console.log('❌ No doctors available for testing. Skipping concurrent booking test.');
    return;
  }

  const doctor = doctorsRes.data.data[0];
  const clinic = doctor.doctorClinics?.[0]?.clinic;

  if (!clinic) {
    console.log('❌ Doctor not linked to clinic. Skipping concurrent booking test.');
    return;
  }

  console.log(`✅ Found doctor: ${doctor.user.name} (${doctor.specialization})`);
  console.log(`✅ Clinic: ${clinic.name}\n`);

  // Step 3: Prepare booking data (SAME SLOT FOR ALL)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3); // 3 days from now to avoid past date issues
  const appointmentDate = tomorrow.toISOString().split('T')[0];
  const sameSlotTime = '14:30'; // Everyone books 2:30 PM

  const bookingData = {
    doctorId: doctor.id,
    clinicId: clinic.id,
    appointmentType: 'OFFLINE',
    appointmentDate,
    slotTime: sameSlotTime,
    symptoms: 'Concurrent booking race condition test',
  };

  console.log('📅 Booking Details:');
  console.log(`   Doctor: ${doctor.user.name}`);
  console.log(`   Clinic: ${clinic.name}`);
  console.log(`   Date: ${appointmentDate}`);
  console.log(`   Time: ${sameSlotTime}`);
  console.log(`   Concurrent Users: ${CONFIG.CONCURRENT_USERS}\n`);

  // Step 4: CONCURRENT BOOKING ATTEMPT
  console.log('⚡ Step 3: Launching concurrent booking requests...\n');

  const bookingPromises = patients.map((patient, idx) => {
    return axios.post(`${CONFIG.BASE_URL}/patient/appointments`, bookingData, {
      headers: { Authorization: `Bearer ${patient.accessToken}` },
    })
      .then(res => ({
        success: true,
        patient: idx + 1,
        data: res.data,
        queueNumber: res.data.data?.appointment?.queueNumber,
      }))
      .catch(err => ({
        success: false,
        patient: idx + 1,
        error: err.response?.data?.message || err.message,
        status: err.response?.status,
      }));
  });

  const results = await Promise.all(bookingPromises);

  // Step 5: Analyze results
  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('📊 Concurrent Booking Results:\n');
  console.log(`   ✅ Succeeded: ${succeeded.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);
  console.log(`   📊 Total: ${results.length}\n`);

  // Verification Tests
  await runTest('TC-RACE-001', 'Only 1 booking should succeed for same slot', async () => {
    assert(
      succeeded.length === 1,
      'TC-RACE-001',
      'Exactly 1 booking succeeded',
      `Expected 1, got ${succeeded.length}`
    );
  });

  await runTest('TC-RACE-002', 'Remaining bookings should fail', async () => {
    assert(
      failed.length === CONFIG.CONCURRENT_USERS - 1,
      'TC-RACE-002',
      'Correct number of failures',
      `Expected ${CONFIG.CONCURRENT_USERS - 1}, got ${failed.length}`
    );
  });

  await runTest('TC-RACE-003', 'Failed bookings have proper error messages', async () => {
    // Log sample errors for investigation
    const sampleErrors = failed.slice(0, 5).map(f => ({
      patient: f.patient,
      error: f.error,
      status: f.status,
    }));
    
    console.log('\n   📋 Sample error messages:');
    sampleErrors.forEach(e => {
      console.log(`      Patient ${e.patient}: [${e.status}] ${e.error}`);
    });
    console.log('');
    
    const hasProperErrors = failed.every(f =>
      f.error?.toLowerCase().includes('slot') ||
      f.error?.toLowerCase().includes('booked') ||
      f.error?.toLowerCase().includes('available') ||
      f.error?.toLowerCase().includes('already') ||
      f.error?.toLowerCase().includes('longer') ||
      f.status === 409 ||
      f.status === 400
    );
    assert(hasProperErrors, 'TC-RACE-003', 'All failures have proper error messages');
  });

  // Display winning patient
  if (succeeded.length > 0) {
    console.log(`\n🏆 Winner: Patient ${succeeded[0].patient} got the slot!`);
    console.log(`   Queue Number: #${succeeded[0].queueNumber}\n`);
  }

  // Database verification
  await runTest('TC-RACE-004', 'Database integrity check', async () => {
    const dbAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        clinicId: clinic.id,
        appointmentDate: new Date(appointmentDate),
        slotTime: sameSlotTime,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    assert(
      dbAppointments.length === 1,
      'TC-RACE-004',
      'Database has exactly 1 appointment for this slot',
      `Found ${dbAppointments.length} appointments in DB`
    );
  });

  console.log('\n✅ Concurrent booking race condition test complete\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2: CROSS-PATIENT DATA ACCESS SECURITY
// ═══════════════════════════════════════════════════════════════════════════

async function test02_CrossPatientDataAccessSecurity() {
  console.log('\n🔐 TEST 2: CROSS-PATIENT DATA ACCESS SECURITY\n');
  console.log('📋 Scenario: Patient A attempts to access Patient B\'s data');
  console.log('✅ Expected: All unauthorized access attempts fail\n');

  // Authenticate 2 test patients
  console.log('🔐 Authenticating 2 test patients...\n');
  const patientA = await authenticatePatient(1);
  const patientB = await authenticatePatient(2);

  console.log(`✅ Patient A: ${patientA.mobile} (ID: ${patientA.userId})`);
  console.log(`✅ Patient B: ${patientB.mobile} (ID: ${patientB.userId})\n`);

  // TC-SEC-001: Patient A tries to access Patient B's profile
  await runTest('TC-SEC-001', 'Patient A cannot access Patient B profile via query params', async () => {
    try {
      // Try to access with Patient B's ID in query/body
      const res = await axios.get(`${CONFIG.BASE_URL}/patient/profile`, {
        headers: { Authorization: `Bearer ${patientA.accessToken}` },
        params: { userId: patientB.userId }, // Attempt to trick the system
      });

      // Should only return Patient A's data
      const returnedUserId = res.data.data?.user?.id;
      assert(
        returnedUserId === patientA.userId,
        'TC-SEC-001',
        'Profile returns only own data',
        `Returned userId: ${returnedUserId}, expected: ${patientA.userId}`
      );
    } catch (error) {
      // 403/401 is also acceptable
      assert(
        error.response?.status === 403 || error.response?.status === 401,
        'TC-SEC-001',
        'Access denied with proper status code',
        `Status: ${error.response?.status}`
      );
    }
  });

  // TC-SEC-002: Patient A tries to access Patient B's appointments
  await runTest('TC-SEC-002', 'Patient A cannot see Patient B appointments', async () => {
    // Patient B books an appointment first
    const doctorsRes = await axios.get(`${CONFIG.BASE_URL}/patient/doctors`, { params: { limit: 1 } });
    
    if (doctorsRes.data.data?.length > 0) {
      const doctor = doctorsRes.data.data[0];
      const clinic = doctor.doctorClinics?.[0]?.clinic;

      if (clinic) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 4);
        const appointmentDate = tomorrow.toISOString().split('T')[0];

        // Patient B books
        const bookingB = await axios.post(
          `${CONFIG.BASE_URL}/patient/appointments`,
          {
            doctorId: doctor.id,
            clinicId: clinic.id,
            appointmentType: 'OFFLINE',
            appointmentDate,
            slotTime: '10:00',
            symptoms: 'Security test - Patient B',
          },
          { headers: { Authorization: `Bearer ${patientB.accessToken}` } }
        );

        const patientBAppointmentId = bookingB.data.data?.appointment?.id;

        // Patient A tries to access Patient B's appointments
        const appointmentsA = await axios.get(`${CONFIG.BASE_URL}/patient/appointments`, {
          headers: { Authorization: `Bearer ${patientA.accessToken}` },
        });

        const hasPatientBData = appointmentsA.data.data?.some(apt => apt.id === patientBAppointmentId);

        assert(
          !hasPatientBData,
          'TC-SEC-002',
          'Patient A does not see Patient B appointments',
          `Found Patient B appointment: ${hasPatientBData}`
        );
      }
    }
  });

  // TC-SEC-003: Direct appointment access with wrong token
  await runTest('TC-SEC-003', 'Cannot access appointment with unauthorized token', async () => {
    // Get Patient B's appointments
    const appointmentsB = await axios.get(`${CONFIG.BASE_URL}/patient/appointments`, {
      headers: { Authorization: `Bearer ${patientB.accessToken}` },
    });

    if (appointmentsB.data.data?.length > 0) {
      const patientBAppointmentId = appointmentsB.data.data[0].id;

      // Patient A tries to access Patient B's appointment directly
      try {
        await axios.get(`${CONFIG.BASE_URL}/patient/appointments/${patientBAppointmentId}`, {
          headers: { Authorization: `Bearer ${patientA.accessToken}` },
        });

        // Should not reach here
        assert(false, 'TC-SEC-003', 'Access should be denied');
      } catch (error) {
        assert(
          error.response?.status === 403 || error.response?.status === 404,
          'TC-SEC-003',
          'Unauthorized access properly denied',
          `Status: ${error.response?.status}`
        );
      }
    } else {
      console.log('   ⚠️  Patient B has no appointments to test direct access');
    }
  });

  // TC-SEC-004: Invalid token
  await runTest('TC-SEC-004', 'Invalid token rejected', async () => {
    try {
      await axios.get(`${CONFIG.BASE_URL}/patient/profile`, {
        headers: { Authorization: 'Bearer invalid_token_12345' },
      });
      assert(false, 'TC-SEC-004', 'Invalid token should be rejected');
    } catch (error) {
      assert(
        error.response?.status === 401,
        'TC-SEC-004',
        'Invalid token rejected with 401',
        `Status: ${error.response?.status}`
      );
    }
  });

  // TC-SEC-005: No token
  await runTest('TC-SEC-005', 'No token rejected', async () => {
    try {
      await axios.get(`${CONFIG.BASE_URL}/patient/profile`);
      assert(false, 'TC-SEC-005', 'No token should be rejected');
    } catch (error) {
      assert(
        error.response?.status === 401,
        'TC-SEC-005',
        'No token rejected with 401',
        `Status: ${error.response?.status}`
      );
    }
  });

  console.log('\n✅ Cross-patient data access security verified\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3: PAYMENT FLOW INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════

async function test03_PaymentFlowIntegrity() {
  console.log('\n💳 TEST 3: PAYMENT FLOW INTEGRITY\n');
  console.log('📋 Scenario: Test payment initiation, verification, and edge cases\n');

  const patient = await authenticatePatient(51); // Use a different patient

  // Get doctor and clinic
  const doctorsRes = await axios.get(`${CONFIG.BASE_URL}/patient/doctors`, { params: { limit: 1 } });

  if (!doctorsRes.data.data || doctorsRes.data.data.length === 0) {
    console.log('❌ No doctors available. Skipping payment tests.');
    return;
  }

  const doctor = doctorsRes.data.data[0];
  const clinic = doctor.doctorClinics?.[0]?.clinic;

  if (!clinic) {
    console.log('❌ Doctor not linked to clinic. Skipping payment tests.');
    return;
  }

  // Book appointment
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 5); // Add 5 days
  const appointmentDate = tomorrow.toISOString().split('T')[0];

  const booking = await axios.post(
    `${CONFIG.BASE_URL}/patient/appointments`,
    {
      doctorId: doctor.id,
      clinicId: clinic.id,
      appointmentType: 'OFFLINE',
      appointmentDate,
      slotTime: '11:00',
      symptoms: 'Payment integrity test',
    },
    { headers: { Authorization: `Bearer ${patient.accessToken}` } }
  );

  const appointmentId = booking.data.data?.appointment?.id;

  if (!appointmentId) {
    console.log('❌ Failed to create appointment. Skipping payment tests.');
    return;
  }

  console.log(`✅ Appointment created: ${appointmentId}\n`);

  // TC-PAY-001: Check booking fee status
  await runTest('TC-PAY-001', 'Check booking fee status', async () => {
    const res = await axios.get(`${CONFIG.BASE_URL}/payments/booking-status`, {
      headers: { Authorization: `Bearer ${patient.accessToken}` },
    });

    assert(res.data.success !== undefined, 'TC-PAY-001', 'Booking status endpoint responds');
    console.log(`   Booking fee: ₹${res.data.data?.bookingFee || 0}`);
    console.log(`   Free booking used: ${res.data.data?.freeBookingUsed}`);
  });

  // TC-PAY-002: Cannot verify payment without initiation
  await runTest('TC-PAY-002', 'Cannot verify non-existent payment', async () => {
    try {
      await axios.post(
        `${CONFIG.BASE_URL}/payments/verify`,
        {
          razorpay_order_id: 'fake_order_id',
          razorpay_payment_id: 'fake_payment_id',
          razorpay_signature: 'fake_signature',
          appointmentId,
        },
        { headers: { Authorization: `Bearer ${patient.accessToken}` } }
      );
      assert(false, 'TC-PAY-002', 'Fake payment verification should fail');
    } catch (error) {
      assert(
        error.response?.status === 400 || error.response?.status === 404,
        'TC-PAY-002',
        'Fake payment verification rejected',
        `Status: ${error.response?.status}`
      );
    }
  });

  console.log('\n✅ Payment flow integrity checks complete\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

async function runCriticalTests() {
  const startTime = Date.now();

  try {
    await test01_ConcurrentBookingRaceCondition();
    await test02_CrossPatientDataAccessSecurity();
    await test03_PaymentFlowIntegrity();

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    console.error(error.stack);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Final Report
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║  CRITICAL TESTS - FINAL REPORT                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📊 Total Tests: ${TEST_STATE.results.total}`);
  console.log(`✅ Passed: ${TEST_STATE.results.passed} (${((TEST_STATE.results.passed / TEST_STATE.results.total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${TEST_STATE.results.failed}\n`);

  if (TEST_STATE.results.errors.length > 0) {
    console.log('╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║  FAILED TESTS                                                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    TEST_STATE.results.errors.forEach((err, idx) => {
      console.log(`${idx + 1}. ❌ ${err.testId}: ${err.message}`);
      if (err.details) console.log(`   ${err.details}`);
      console.log('');
    });
  }

  const status = TEST_STATE.results.failed === 0 ? '✅ ALL CRITICAL TESTS PASSED' : '❌ SOME TESTS FAILED';
  console.log(`\n🏁 Final Status: ${status}\n`);

  process.exit(TEST_STATE.results.failed > 0 ? 1 : 0);
}

// Run
if (require.main === module) {
  runCriticalTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }).finally(async () => {
    await prisma.$disconnect();
  });
}

module.exports = { runCriticalTests };
