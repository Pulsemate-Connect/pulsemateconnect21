/**
 * Test Pending Doctors API
 * Verifies the admin can see pending doctors
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'sahilnaik1515@gmail.com';
const ADMIN_PASSWORD = 'Nkabu18$';

async function testPendingDoctorsAPI() {
  try {
    console.log('🧪 Testing Pending Doctors API\n');

    // Step 1: Admin Login
    console.log('Step 1: Admin Login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const adminToken = loginResponse.data.data.accessToken;
    console.log('✓ Admin authenticated\n');

    // Step 2: Get Pending Doctors
    console.log('Step 2: Fetching Pending Doctors...');
    const pendingResponse = await axios.get(`${API_URL}/api/admin/pending-doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('📦 Full Response:');
    console.log(JSON.stringify(pendingResponse.data, null, 2));
    console.log();

    const doctors = pendingResponse.data.data?.doctors || pendingResponse.data.data || [];
    console.log(`✓ Found ${doctors.length} pending doctor(s)\n`);

    if (doctors.length > 0) {
      console.log('Doctor Details:');
      doctors.forEach((doctor, index) => {
        console.log(`\n${index + 1}. ${doctor.name || doctor.doctorProfile?.fullLegalName}`);
        console.log(`   ID: ${doctor.id}`);
        console.log(`   Email: ${doctor.email}`);
        console.log(`   Mobile: ${doctor.mobile}`);
        console.log(`   Status: ${doctor.approvalStatus}`);
        console.log(`   Profile Status: ${doctor.doctorProfile?.profileStatus}`);
        console.log(`   Verification Status: ${doctor.doctorProfile?.verificationStatus}`);
      });
    } else {
      console.log('⚠️  No pending doctors found');
      console.log('   This might be because:');
      console.log('   1. All doctors have been approved/rejected');
      console.log('   2. No doctors have submitted profiles yet');
      console.log('   3. There\'s a data filter issue\n');
    }

    console.log('\n✅ API Test Complete');

  } catch (error) {
    console.error('\n❌ API Test Failed\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

testPendingDoctorsAPI();
