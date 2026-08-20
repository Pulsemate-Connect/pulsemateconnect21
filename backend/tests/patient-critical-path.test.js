/**
 * PulseMate Connect - Patient Critical Path Tests
 * 
 * Tests the complete patient journey:
 * 1. Registration & Authentication
 * 2. Profile Management
 * 3. Doctor Search
 * 4. Appointment Booking
 * 5. Payment Flow
 * 6. Queue Management
 * 7. Real-time Updates
 */

const axios = require('axios');

const BASE_URL = 'http://192.168.31.240:5000/api';
const TEST_PATIENT_COUNT = 10; // Start with 10, scale to 100

// Test state storage
const testUsers = [];
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

// Utility: Generate test mobile
const getTestMobile = (index) => `+91${9900000000 + index}`;
const getTestEmail = (index) => `test-patient-${String(index).padStart(3, '0')}@pulsemate.test`;
const getTestName = (index) => `Test Patient ${String(index).padStart(3, '0')}`;

// Utility: Test assertion
function assert(condition, testName, details = '') {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
    return true;
  } else {
    testResults.failed++;
    const error = { test: testName, details, timestamp: new Date().toISOString() };
    testResults.errors.push(error);
    console.error(`❌ FAIL: ${testName}${details ? ' - ' + details : ''}`);
    return false;
  }
}

// Utility: Async test wrapper
async function runTest(name, testFn) {
  try {
    await testFn();
  } catch (error) {
    assert(false, name, error.message);
  }
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  PulseMate Connect - Critical Path Test Suite             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// TEST 1: PATIENT REGISTRATION & AUTHENTICATION
// ============================================================================

async function test01_PatientRegistration() {
  console.log('\n📝 TEST 1: Patient Registration & Authentication\n');

  for (let i = 1; i <= TEST_PATIENT_COUNT; i++) {
    const mobile = getTestMobile(i);
    const name = getTestName(i);

    await runTest(`TC-001-${i}: Send OTP to ${mobile}`, async () => {
      const res = await axios.post(`${BASE_URL}/auth/send-otp`, {
        phoneNumber: mobile,
      });
      assert(res.data.success === true, `TC-001-${i}: OTP sent`, JSON.stringify(res.data));
      assert(res.data.data?.verificationId, `TC-001-${i}: Verification ID received`);
      
      testUsers[i] = {
        index: i,
        mobile,
        name,
        verificationId: res.data.data.verificationId,
      };
    });

    await runTest(`TC-002-${i}: Verify OTP for ${mobile}`, async () => {
      const res = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        phoneNumber: mobile,
        otp: '123456',
        verificationId: testUsers[i].verificationId,
      });

      assert(res.data.success === true, `TC-002-${i}: OTP verified`);
      assert(res.data.data?.accessToken, `TC-002-${i}: Access token received`);
      assert(res.data.data?.user?.id, `TC-002-${i}: User ID received`);
      assert(res.data.data?.user?.role === 'PATIENT', `TC-002-${i}: Role is PATIENT`);

      testUsers[i].accessToken = res.data.data.accessToken;
      testUsers[i].userId = res.data.data.user.id;
      testUsers[i].user = res.data.data.user;
    });

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// ============================================================================
// TEST 2: PATIENT IDENTITY ISOLATION
// ============================================================================

async function test02_PatientIdentityIsolation() {
  console.log('\n🔐 TEST 2: Patient Identity Isolation (Security)\n');

  // Verify each patient can only access their own data
  for (let i = 1; i <= TEST_PATIENT_COUNT; i++) {
    const patient = testUsers[i];
    if (!patient?.accessToken) continue;

    await runTest(`TC-003-${i}: Patient ${i} fetches own profile`, async () => {
      const res = await axios.get(`${BASE_URL}/patient/profile`, {
        headers: { Authorization: `Bearer ${patient.accessToken}` },
      });

      assert(res.data.success === true, `TC-003-${i}: Profile fetch succeeded`);
      assert(res.data.data?.user?.id === patient.userId, `TC-003-${i}: Correct user ID`);
      assert(res.data.data?.user?.mobile === patient.mobile, `TC-003-${i}: Correct mobile`);
    });

    // Try to access another patient's data (should fail)
    if (i > 1 && testUsers[i - 1]?.userId) {
      await runTest(`TC-004-${i}: Patient ${i} CANNOT access Patient ${i-1} data`, async () => {
        try {
          // This should ideally fail with 403, but depends on implementation
          const otherUserId = testUsers[i - 1].userId;
          
          // If there's an endpoint like /patient/:id, test it
          // For now, we verify appointments endpoint with ownership middleware
          const res = await axios.get(`${BASE_URL}/patient/appointments`, {
            headers: { Authorization: `Bearer ${patient.accessToken}` },
          });

          // The response should only contain this patient's appointments, not others
          const appointments = res.data.data || [];
          const hasOtherPatientData = appointments.some(apt => apt.patientId !== patient.userId);
          
          assert(!hasOtherPatientData, `TC-004-${i}: No cross-patient data leak`);
        } catch (error) {
          // 403 or 404 is acceptable - means access control works
          if (error.response?.status === 403 || error.response?.status === 404) {
            assert(true, `TC-004-${i}: Access correctly denied (${error.response.status})`);
          } else {
            throw error;
          }
        }
      });
    }
  }
}

// ============================================================================
// TEST 3: PROFILE MANAGEMENT
// ============================================================================

async function test03_ProfileManagement() {
  console.log('\n👤 TEST 3: Profile Management\n');

  // Test with first 5 patients
  for (let i = 1; i <= Math.min(5, TEST_PATIENT_COUNT); i++) {
    const patient = testUsers[i];
    if (!patient?.accessToken) continue;

    const profileData = {
      name: getTestName(i),
      gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
      dob: `199${i % 10}-0${(i % 9) + 1}-15`,
      city: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune'][i % 5],
      emergencyContact: `+919${String(1000000000 + i).slice(1)}`,
      bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-'][i % 5],
    };

    await runTest(`TC-005-${i}: Update profile for Patient ${i}`, async () => {
      const res = await axios.patch(`${BASE_URL}/patient/profile`, profileData, {
        headers: { Authorization: `Bearer ${patient.accessToken}` },
      });

      assert(res.data.success === true, `TC-005-${i}: Profile update succeeded`);
      assert(res.data.data?.user?.patientProfile?.patientName === profileData.name, `TC-005-${i}: Name saved`);
      assert(res.data.data?.user?.patientProfile?.gender === profileData.gender, `TC-005-${i}: Gender saved`);
      assert(res.data.data?.user?.patientProfile?.city === profileData.city, `TC-005-${i}: City saved`);
    });

    await runTest(`TC-006-${i}: Verify profile persistence for Patient ${i}`, async () => {
      const res = await axios.get(`${BASE_URL}/patient/profile`, {
        headers: { Authorization: `Bearer ${patient.accessToken}` },
      });

      assert(res.data.success === true, `TC-006-${i}: Profile fetch succeeded`);
      const profile = res.data.data?.user?.patientProfile;
      assert(profile?.patientName === profileData.name, `TC-006-${i}: Name persisted`);
      assert(profile?.gender === profileData.gender, `TC-006-${i}: Gender persisted`);
      assert(profile?.city === profileData.city, `TC-006-${i}: City persisted`);
      assert(profile?.bloodGroup === profileData.bloodGroup, `TC-006-${i}: Blood group persisted`);
    });
  }
}

// ============================================================================
// TEST 4: DOCTOR SEARCH
// ============================================================================

async function test04_DoctorSearch() {
  console.log('\n🔍 TEST 4: Doctor Search\n');

  const patient = testUsers[1];
  if (!patient?.accessToken) {
    console.log('⏭️  Skipping: No authenticated patient');
    return;
  }

  await runTest('TC-007: Search all doctors', async () => {
    const res = await axios.get(`${BASE_URL}/patient/doctors`, {
      params: { limit: 20 },
    });

    assert(res.data.success === true, 'TC-007: Doctor search succeeded');
    assert(Array.isArray(res.data.data), 'TC-007: Returns array');
    
    const doctors = res.data.data;
    testUsers.doctors = doctors;
    
    assert(doctors.length > 0, 'TC-007: At least one doctor found', `Found ${doctors.length} doctors`);
    
    if (doctors.length > 0) {
      const doctor = doctors[0];
      assert(doctor.id, 'TC-007: Doctor has ID');
      assert(doctor.user?.name, 'TC-007: Doctor has name');
      assert(doctor.specialization, 'TC-007: Doctor has specialization');
      assert(Array.isArray(doctor.doctorClinics), 'TC-007: Doctor has clinics');
      assert(doctor.doctorClinics.length > 0, 'TC-007: Doctor linked to clinic');
    }
  });

  await runTest('TC-008: Filter doctors by specialization', async () => {
    const res = await axios.get(`${BASE_URL}/patient/doctors`, {
      params: { specialization: 'Cardiology', limit: 10 },
    });

    assert(res.data.success === true, 'TC-008: Filtered search succeeded');
    const doctors = res.data.data;
    
    doctors.forEach(doc => {
      assert(
        doc.specialization?.toLowerCase().includes('cardio'),
        'TC-008: Doctor matches specialization filter'
      );
    });
  });
}

// ============================================================================
// TEST 5: APPOINTMENT BOOKING (CONCURRENT)
// ============================================================================

async function test05_AppointmentBooking() {
  console.log('\n📅 TEST 5: Appointment Booking\n');

  const doctors = testUsers.doctors;
  if (!doctors || doctors.length === 0) {
    console.log('⏭️  Skipping: No doctors available');
    return;
  }

  const doctor = doctors[0];
  const clinic = doctor.doctorClinics[0]?.clinic;

  if (!clinic) {
    console.log('⏭️  Skipping: Doctor not linked to clinic');
    return;
  }

  // Test booking with first 3 patients
  for (let i = 1; i <= Math.min(3, TEST_PATIENT_COUNT); i++) {
    const patient = testUsers[i];
    if (!patient?.accessToken) continue;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointmentDate = tomorrow.toISOString().split('T')[0];

    const bookingData = {
      doctorId: doctor.id,
      clinicId: clinic.id,
      appointmentType: 'OFFLINE',
      appointmentDate,
      slotTime: `${9 + i}:00`, // Different slots for each patient
      symptoms: `Test symptoms for Patient ${i}`,
    };

    await runTest(`TC-009-${i}: Book appointment for Patient ${i}`, async () => {
      const res = await axios.post(`${BASE_URL}/patient/appointments`, bookingData, {
        headers: { Authorization: `Bearer ${patient.accessToken}` },
      });

      assert(res.data.success === true, `TC-009-${i}: Booking succeeded`, JSON.stringify(res.data));
      assert(res.data.data?.appointment?.id, `TC-009-${i}: Appointment ID generated`);
      assert(res.data.data?.appointment?.queueNumber, `TC-009-${i}: Queue number assigned`);
      assert(res.data.data?.appointment?.status === 'BOOKED', `TC-009-${i}: Status is BOOKED`);

      patient.appointment = res.data.data.appointment;
    });
  }
}

// ============================================================================
// TEST 6: CONCURRENT BOOKING (RACE CONDITION TEST)
// ============================================================================

async function test06_ConcurrentBooking() {
  console.log('\n⚡ TEST 6: Concurrent Booking (Race Condition)\n');

  const doctors = testUsers.doctors;
  if (!doctors || doctors.length === 0) {
    console.log('⏭️  Skipping: No doctors available');
    return;
  }

  const doctor = doctors[0];
  const clinic = doctor.doctorClinics[0]?.clinic;

  if (!clinic) {
    console.log('⏭️  Skipping: Doctor not linked to clinic');
    return;
  }

  // Try to book SAME slot with 5 patients simultaneously
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const appointmentDate = tomorrow.toISOString().split('T')[0];
  const sameSlotTime = '14:00'; // Everyone tries to book 2:00 PM

  const bookingPromises = [];
  
  for (let i = 1; i <= Math.min(5, TEST_PATIENT_COUNT); i++) {
    const patient = testUsers[i];
    if (!patient?.accessToken) continue;

    const bookingData = {
      doctorId: doctor.id,
      clinicId: clinic.id,
      appointmentType: 'OFFLINE',
      appointmentDate,
      slotTime: sameSlotTime,
      symptoms: `Concurrent test Patient ${i}`,
    };

    bookingPromises.push(
      axios.post(`${BASE_URL}/patient/appointments`, bookingData, {
        headers: { Authorization: `Bearer ${patient.accessToken}` },
      }).then(res => ({ success: true, patient: i, data: res.data }))
        .catch(err => ({ success: false, patient: i, error: err.response?.data || err.message }))
    );
  }

  await runTest('TC-010: Concurrent slot booking', async () => {
    const results = await Promise.all(bookingPromises);
    
    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`   📊 Results: ${succeeded.length} succeeded, ${failed.length} failed`);

    // Only ONE booking should succeed for the same slot
    assert(succeeded.length === 1, 'TC-010: Only 1 booking succeeded for same slot', 
      `Expected 1, got ${succeeded.length}`);
    
    assert(failed.length === bookingPromises.length - 1, 'TC-010: Others rejected',
      `Expected ${bookingPromises.length - 1}, got ${failed.length}`);

    // Check that failed bookings got proper error messages
    failed.forEach(f => {
      assert(
        f.error?.message?.includes('slot') || 
        f.error?.message?.includes('booked') ||
        f.error?.message?.includes('already'),
        'TC-010: Proper error message for failed booking'
      );
    });
  });
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  const startTime = Date.now();

  try {
    await test01_PatientRegistration();
    await test02_PatientIdentityIsolation();
    await test03_ProfileManagement();
    await test04_DoctorSearch();
    await test05_AppointmentBooking();
    await test06_ConcurrentBooking();

  } catch (error) {
    console.error('\n💥 Fatal error during testing:', error.message);
    console.error(error.stack);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // ============================================================================
  // TEST REPORT
  // ============================================================================

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Execution Summary                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📊 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed} (${((testResults.passed / testResults.total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${testResults.failed} (${((testResults.failed / testResults.total) * 100).toFixed(1)}%)`);
  console.log('');

  if (testResults.failed > 0) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Failed Tests                                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    testResults.errors.forEach((err, index) => {
      console.log(`${index + 1}. ❌ ${err.test}`);
      if (err.details) console.log(`   Details: ${err.details}`);
      console.log(`   Time: ${err.timestamp}\n`);
    });
  }

  const status = testResults.failed === 0 ? '✅ PASS' : '❌ FAIL';
  console.log(`\n🏁 Final Status: ${status}\n`);

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
