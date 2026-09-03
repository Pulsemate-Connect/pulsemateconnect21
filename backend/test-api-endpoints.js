require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test credentials
const testAccounts = {
  doctor: {
    email: 'test-dr-kumar@pulsemate.test',
    password: 'Test@123456',
    expectedRole: 'DOCTOR'
  },
  clinicOwner: {
    email: 'test-owner-1@pulsemate.test',
    password: 'Test@123456',
    expectedRole: 'CLINIC_OWNER'
  },
  receptionist: {
    email: 'test-receptionist-1@pulsemate.test',
    password: 'Test@123456',
    expectedRole: 'RECEPTIONIST'
  }
};

let tokens = {};

async function testLogin(accountType) {
  console.log(`\n🔐 Testing ${accountType.toUpperCase()} login...`);
  
  const account = testAccounts[accountType];
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: account.email,
      password: account.password
    });

    if (response.data.success) {
      const user = response.data.data.user;
      tokens[accountType] = response.data.data.accessToken;
      
      console.log(`✅ Login successful`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      
      if (user.role !== account.expectedRole) {
        console.log(`⚠️  WARNING: Expected role ${account.expectedRole}, got ${user.role}`);
      }
      
      return true;
    } else {
      console.log(`❌ Login failed: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetClinics(accountType) {
  console.log(`\n🏥 Testing GET /api/clinic as ${accountType.toUpperCase()}...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/clinic`, {
      headers: {
        'Authorization': `Bearer ${tokens[accountType]}`
      }
    });

    if (response.data.success !== false) {
      const clinics = response.data.data || response.data;
      console.log(`✅ Retrieved ${clinics.length || 0} clinics`);
      
      if (clinics.length > 0) {
        clinics.slice(0, 3).forEach((clinic, idx) => {
          console.log(`   ${idx + 1}. ${clinic.name} (${clinic.city})`);
        });
      }
      
      return true;
    } else {
      console.log(`❌ Failed: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`⚠️  Unauthorized (expected if auth required)`);
      return 'unauthorized';
    } else {
      console.log(`❌ Failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

async function testGetDoctors(accountType) {
  console.log(`\n👨‍⚕️ Testing GET /api/doctor as ${accountType.toUpperCase()}...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/doctor`, {
      headers: {
        'Authorization': `Bearer ${tokens[accountType]}`
      }
    });

    if (response.data) {
      const doctors = response.data.data || response.data;
      console.log(`✅ Retrieved ${doctors.length || 0} doctors`);
      
      if (doctors.length > 0) {
        doctors.slice(0, 3).forEach((doctor, idx) => {
          console.log(`   ${idx + 1}. ${doctor.user?.name || doctor.name} - ${doctor.specialization}`);
        });
      }
      
      return true;
    } else {
      console.log(`❌ Failed: No data returned`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`⚠️  Unauthorized (expected if auth required)`);
      return 'unauthorized';
    } else {
      console.log(`❌ Failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

async function testSearchClinics() {
  console.log(`\n🔍 Testing clinic search (city: Bangalore)...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/clinic`, {
      params: { city: 'Bangalore' }
    });

    if (response.data) {
      const clinics = response.data.data || response.data;
      const blrClinics = Array.isArray(clinics) ? clinics.filter(c => c.city === 'Bangalore') : [];
      console.log(`✅ Found ${blrClinics.length} clinic(s) in Bangalore`);
      
      blrClinics.forEach((clinic, idx) => {
        console.log(`   ${idx + 1}. ${clinic.name}`);
      });
      
      return true;
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 PULSEMATE CONNECT API TESTING');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Backend URL: ${BASE_URL}`);
  console.log(`Date: ${new Date().toLocaleString()}`);
  console.log('');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    unauthorized: 0
  };

  // Test 1: Doctor Login
  results.total++;
  const doctorLogin = await testLogin('doctor');
  if (doctorLogin) results.passed++; else results.failed++;

  // Test 2: Clinic Owner Login
  results.total++;
  const ownerLogin = await testLogin('clinicOwner');
  if (ownerLogin) results.passed++; else results.failed++;

  // Test 3: Receptionist Login
  results.total++;
  const receptionistLogin = await testLogin('receptionist');
  if (receptionistLogin) results.passed++; else results.failed++;

  if (doctorLogin) {
    // Test 4: Get clinics as doctor
    results.total++;
    const doctorClinics = await testGetClinics('doctor');
    if (doctorClinics === true) results.passed++;
    else if (doctorClinics === 'unauthorized') results.unauthorized++;
    else results.failed++;

    // Test 5: Get doctors as doctor
    results.total++;
    const doctorDoctors = await testGetDoctors('doctor');
    if (doctorDoctors === true) results.passed++;
    else if (doctorDoctors === 'unauthorized') results.unauthorized++;
    else results.failed++;
  }

  if (ownerLogin) {
    // Test 6: Get clinics as clinic owner
    results.total++;
    const ownerClinics = await testGetClinics('clinicOwner');
    if (ownerClinics === true) results.passed++;
    else if (ownerClinics === 'unauthorized') results.unauthorized++;
    else results.failed++;
  }

  // Test 7: Public clinic search
  results.total++;
  const publicSearch = await testSearchClinics();
  if (publicSearch) results.passed++; else results.failed++;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Unauthorized: ${results.unauthorized}`);
  console.log('');
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  console.log('');

  if (results.failed === 0 && results.unauthorized === 0) {
    console.log('🎉 ALL TESTS PASSED!');
  } else if (results.passed > results.failed) {
    console.log('✅ TESTS MOSTLY PASSING');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

runTests().catch(console.error);
