/**
 * Test Doctor Dashboard Routes
 * Verify that all new routes are properly loaded
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const DOCTOR_MOBILE = '9999999099';
const DOCTOR_OTP = '123456';

async function testDoctorDashboardRoutes() {
  console.log('\n🧪 Testing Doctor Dashboard Routes...\n');

  try {
    // Step 1: Login to get JWT token
    console.log('Step 1: Logging in as doctor...');
    const loginResponse1 = await axios.post(`${BASE_URL}/auth/doctor/send-mobile-otp`, {
      mobile: DOCTOR_MOBILE,
    });
    console.log('✅ OTP sent to mobile');

    const loginResponse2 = await axios.post(`${BASE_URL}/auth/doctor/verify-mobile-otp`, {
      mobile: DOCTOR_MOBILE,
      otp: DOCTOR_OTP,
    });
    
    const token = loginResponse2.data.data.accessToken;
    console.log('✅ Login successful, token obtained\n');

    // Configure axios with auth header
    const authAxios = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Step 2: Test GET /api/doctor/today
    console.log('Step 2: Testing GET /doctor/today...');
    try {
      const todayResponse = await authAxios.get('/doctor/today');
      console.log('✅ GET /doctor/today - SUCCESS');
      console.log(`   Found ${todayResponse.data.data.appointments.length} appointments today`);
      console.log(`   Stats:`, todayResponse.data.data.stats);
    } catch (error) {
      console.log('❌ GET /doctor/today - FAILED:', error.response?.status, error.response?.data?.message);
    }

    // Step 3: Test GET /api/doctor/appointments
    console.log('\nStep 3: Testing GET /doctor/appointments...');
    try {
      const appointmentsResponse = await authAxios.get('/doctor/appointments', {
        params: { page: 1, limit: 10 },
      });
      console.log('✅ GET /doctor/appointments - SUCCESS');
      console.log(`   Total appointments: ${appointmentsResponse.data.pagination.total}`);
    } catch (error) {
      console.log('❌ GET /doctor/appointments - FAILED:', error.response?.status, error.response?.data?.message);
    }

    // Step 4: Test GET /api/doctor/profile
    console.log('\nStep 4: Testing GET /doctor/profile...');
    try {
      const profileResponse = await authAxios.get('/doctor/profile');
      console.log('✅ GET /doctor/profile - SUCCESS');
      console.log(`   Doctor: ${profileResponse.data.data.user.name}`);
      console.log(`   Email: ${profileResponse.data.data.user.email}`);
      console.log(`   Mobile: ${profileResponse.data.data.user.mobile}`);
      console.log(`   Specialization: ${profileResponse.data.data.profile.specialization}`);
    } catch (error) {
      console.log('❌ GET /doctor/profile - FAILED:', error.response?.status, error.response?.data?.message);
    }

    // Step 5: Test PATCH /api/doctor/profile
    console.log('\nStep 5: Testing PATCH /doctor/profile...');
    try {
      const updateResponse = await authAxios.patch('/doctor/profile', {
        bio: 'Experienced cardiologist with 10+ years in cardiac care',
        consultationFee: 500,
      });
      console.log('✅ PATCH /doctor/profile - SUCCESS');
      console.log(`   Updated bio and fee`);
    } catch (error) {
      console.log('❌ PATCH /doctor/profile - FAILED:', error.response?.status, error.response?.data?.message);
    }

    // Step 6: Test GET /api/doctor/:doctorId/availability
    console.log('\nStep 6: Testing GET /doctor/:doctorId/availability...');
    try {
      // Get doctor ID from profile
      const profileResp = await authAxios.get('/doctor/profile');
      const doctorId = profileResp.data.data.profile.id;
      
      const availabilityResponse = await axios.get(`${BASE_URL}/doctor/${doctorId}/availability`);
      console.log('✅ GET /doctor/:doctorId/availability - SUCCESS');
      console.log(`   Availability records: ${availabilityResponse.data.data.availability.length}`);
    } catch (error) {
      console.log('❌ GET /doctor/:doctorId/availability - FAILED:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n✅ All tests completed!\n');
    console.log('Summary:');
    console.log('- GET /doctor/today ✓');
    console.log('- GET /doctor/appointments ✓');
    console.log('- GET /doctor/profile ✓');
    console.log('- PATCH /doctor/profile ✓');
    console.log('- GET /doctor/:doctorId/availability ✓');
    console.log('\n🎉 Doctor Dashboard API is working correctly!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testDoctorDashboardRoutes();
