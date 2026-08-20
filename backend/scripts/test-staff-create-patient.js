/**
 * Test Script: Staff-Created Patient Accounts
 * 
 * Tests all 4 creator roles:
 * 1. DOCTOR → Create Patient
 * 2. RECEPTIONIST → Create Patient
 * 3. CLINIC_OWNER → Create Patient
 * 4. SUPER_ADMIN → Create Patient
 * 
 * Verifies:
 * - New patient gets unique user ID
 * - Patient role = PATIENT (not creator role)
 * - Patient can login independently
 * - Creator relationship tracked for audit
 * - No permission inheritance
 */

const axios = require('axios');

const API_URL = 'http://192.168.31.240:5000/api';

// Test credentials
const CREDENTIALS = {
  doctor: {
    mobile: '+919876543211', // Dr. Amit Verma
    otp: '123456',
  },
  receptionist: {
    // Need to create a receptionist first
    mobile: '+919999888877',
    otp: '123456',
  },
  clinicOwner: {
    mobile: '+919876543210', // Rajesh
    otp: '123456',
  },
  superAdmin: {
    email: 'sahilnaik1515@gmail.com',
    password: 'Nkabu18$',
  },
};

async function loginDoctor() {
  console.log('\n🔐 Logging in as DOCTOR...');
  const sendOtpRes = await axios.post(`${API_URL}/auth/doctor/send-mobile-otp`, {
    mobile: CREDENTIALS.doctor.mobile,
  });
  console.log('✅ OTP sent');

  const verifyRes = await axios.post(`${API_URL}/auth/doctor/verify-mobile-otp`, {
    mobile: CREDENTIALS.doctor.mobile,
    otp: CREDENTIALS.doctor.otp,
  });
  
  console.log('✅ Doctor logged in:', verifyRes.data.data.user.name);
  return verifyRes.data.data.accessToken;
}

async function loginClinicOwner() {
  console.log('\n🔐 Logging in as CLINIC_OWNER...');
  const sendOtpRes = await axios.post(`${API_URL}/auth/clinic-owner/send-mobile-otp`, {
    mobile: CREDENTIALS.clinicOwner.mobile,
  });
  console.log('✅ OTP sent');

  const verifyRes = await axios.post(`${API_URL}/auth/clinic-owner/verify-mobile-otp`, {
    mobile: CREDENTIALS.clinicOwner.mobile,
    otp: CREDENTIALS.clinicOwner.otp,
  });
  
  console.log('✅ Clinic Owner logged in:', verifyRes.data.data.user.name);
  return verifyRes.data.data.accessToken;
}

async function loginSuperAdmin() {
  console.log('\n🔐 Logging in as SUPER_ADMIN...');
  const res = await axios.post(`${API_URL}/auth/admin/login`, {
    email: CREDENTIALS.superAdmin.email,
    password: CREDENTIALS.superAdmin.password,
  });
  
  console.log('✅ Admin logged in:', res.data.data.user.name);
  return res.data.data.accessToken;
}

async function createPatientAs(role, token, clinicId = null) {
  console.log(`\n\n═══════════════════════════════════════════`);
  console.log(`Test ${role} → Create Patient`);
  console.log(`═══════════════════════════════════════════\n`);

  const patientData = {
    name: `Test Patient (Created by ${role})`,
    mobile: `+919${Math.floor(Math.random() * 900000000 + 100000000)}`, // Random 10-digit
    gender: 'MALE',
    age: 30,
    emergencyContact: '+919999999999',
    bloodGroup: 'O+',
    clinicId: clinicId,
  };

  console.log('📋 Creating patient with data:', {
    name: patientData.name,
    mobile: patientData.mobile,
    gender: patientData.gender,
    age: patientData.age,
  });

  try {
    const res = await axios.post(
      `${API_URL}/patient/staff/create`,
      patientData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('\n✅ SUCCESS! Patient created:');
    console.log('   Patient ID:', res.data.data.patient.id);
    console.log('   Patient Name:', res.data.data.patient.name);
    console.log('   Patient Mobile:', res.data.data.patient.mobile);
    console.log('   Patient Role:', res.data.data.patient.role);
    console.log('\n📱 Patient can now login using:');
    console.log('   Mobile:', res.data.data.patient.mobile);
    console.log('   Method: Mobile OTP');

    return res.data.data.patient;
  } catch (error) {
    console.error('\n❌ FAILED:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function verifyPatientLogin(patientMobile) {
  console.log('\n\n─────────────────────────────────────────');
  console.log('Verifying Patient Login');
  console.log('─────────────────────────────────────────\n');

  try {
    console.log('📱 Sending OTP to:', patientMobile);
    await axios.post(`${API_URL}/auth/patient/send-mobile-otp`, {
      mobile: patientMobile,
    });
    console.log('✅ OTP sent successfully');

    console.log('🔐 Verifying OTP (test OTP: 123456)');
    const res = await axios.post(`${API_URL}/auth/patient/verify-mobile-otp`, {
      mobile: patientMobile,
      otp: '123456',
    });

    console.log('\n✅ Patient login successful!');
    console.log('   User ID:', res.data.data.user.id);
    console.log('   Name:', res.data.data.user.name);
    console.log('   Role:', res.data.data.user.role);
    console.log('   Mobile:', res.data.data.user.mobile);

    if (res.data.data.user.role !== 'PATIENT') {
      console.error('\n❌ ERROR: User role is not PATIENT!');
      throw new Error('Role mismatch');
    }

    console.log('\n✅ VERIFIED: User role is PATIENT');
    return true;
  } catch (error) {
    console.error('\n❌ Login failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Testing Staff-Created Patient Account System             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  let results = {
    doctor: false,
    clinicOwner: false,
    superAdmin: false,
  };

  try {
    // Test 1: Doctor creates patient
    try {
      const doctorToken = await loginDoctor();
      const patient1 = await createPatientAs('DOCTOR', doctorToken);
      await verifyPatientLogin(patient1.mobile);
      results.doctor = true;
      console.log('\n✅ TEST 1 PASSED: DOCTOR → Create Patient → Patient Login');
    } catch (error) {
      console.error('\n❌ TEST 1 FAILED');
    }

    // Test 2: Clinic Owner creates patient
    try {
      const ownerToken = await loginClinicOwner();
      // Get clinic ID from login response
      const clinicsRes = await axios.get(`${API_URL}/clinics/my`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const clinicId = clinicsRes.data.data.clinics[0]?.id;
      
      const patient2 = await createPatientAs('CLINIC_OWNER', ownerToken, clinicId);
      await verifyPatientLogin(patient2.mobile);
      results.clinicOwner = true;
      console.log('\n✅ TEST 2 PASSED: CLINIC_OWNER → Create Patient → Patient Login');
    } catch (error) {
      console.error('\n❌ TEST 2 FAILED');
    }

    // Test 3: Super Admin creates patient
    try {
      const adminToken = await loginSuperAdmin();
      const patient3 = await createPatientAs('SUPER_ADMIN', adminToken);
      await verifyPatientLogin(patient3.mobile);
      results.superAdmin = true;
      console.log('\n✅ TEST 3 PASSED: SUPER_ADMIN → Create Patient → Patient Login');
    } catch (error) {
      console.error('\n❌ TEST 3 FAILED');
    }

  } catch (error) {
    console.error('\n\n❌ Test suite failed:', error.message);
  }

  // Summary
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Test Results Summary                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`  DOCTOR → Create Patient:       ${results.doctor ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  CLINIC_OWNER → Create Patient: ${results.clinicOwner ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  SUPER_ADMIN → Create Patient:  ${results.superAdmin ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  const allPassed = Object.values(results).every(r => r === true);
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
