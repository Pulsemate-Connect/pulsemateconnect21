/**
 * Test script to verify GET /api/admin/all-doctors endpoint
 * Tests the comprehensive doctor management API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Admin credentials
const ADMIN_EMAIL = 'sahilnaik1515@gmail.com';
const ADMIN_PASSWORD = 'Nkabu18$';

let adminToken = '';

async function adminLogin() {
  try {
    console.log('\n📝 Admin Login...');
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      mobile: '7022818878', // Admin mobile from context
      password: ADMIN_PASSWORD,
    });

    if (res.data.success && res.data.data.accessToken) {
      adminToken = res.data.data.accessToken;
      console.log('✅ Admin login successful');
      console.log('   Admin Name:', res.data.data.user.name);
      console.log('   Admin Role:', res.data.data.user.role);
      return true;
    } else {
      console.error('❌ Admin login failed - no token');
      return false;
    }
  } catch (err) {
    console.error('❌ Admin login error:', err.response?.data || err.message);
    return false;
  }
}

async function testGetAllDoctors() {
  try {
    console.log('\n🔍 Testing GET /api/admin/all-doctors...');
    
    const res = await axios.get(`${BASE_URL}/admin/all-doctors`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      params: {
        page: 1,
        limit: 50,
      },
    });

    if (res.data.success) {
      const { doctors, pagination } = res.data.data;
      console.log('✅ GET /api/admin/all-doctors SUCCESS');
      console.log('   Total Doctors:', pagination.total);
      console.log('   Page:', pagination.page, 'of', pagination.totalPages);
      console.log('   Limit:', pagination.limit);
      
      if (doctors && doctors.length > 0) {
        console.log('\n📋 Sample Doctors:');
        doctors.slice(0, 3).forEach((doctor, idx) => {
          console.log(`\n   Doctor ${idx + 1}:`);
          console.log('     Name:', doctor.doctorProfile?.fullLegalName || doctor.name);
          console.log('     Mobile:', doctor.mobile);
          console.log('     Email:', doctor.email || 'N/A');
          console.log('     Specialization:', doctor.doctorProfile?.specialization || 'N/A');
          console.log('     Status:', doctor.doctorProfile?.verificationStatus || 'N/A');
          console.log('     Registration:', doctor.doctorProfile?.medicalRegistrationNumber || 'N/A');
          console.log('     Clinic:', doctor.invitation?.clinic?.name || 'N/A');
        });
        
        // Count by status
        const statusCounts = doctors.reduce((acc, doc) => {
          const status = doc.doctorProfile?.verificationStatus || 'UNKNOWN';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n📊 Status Breakdown:');
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`   ${status}: ${count}`);
        });
      } else {
        console.log('   No doctors found');
      }
      
      return true;
    } else {
      console.error('❌ API returned success: false');
      return false;
    }
  } catch (err) {
    console.error('❌ GET /api/admin/all-doctors ERROR:', err.response?.data || err.message);
    return false;
  }
}

async function testGetAllDoctorsWithFilters() {
  try {
    console.log('\n🔍 Testing GET /api/admin/all-doctors with PENDING filter...');
    
    const res = await axios.get(`${BASE_URL}/admin/all-doctors`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      params: {
        status: 'PENDING',
        page: 1,
        limit: 10,
      },
    });

    if (res.data.success) {
      const { doctors, pagination } = res.data.data;
      console.log('✅ Filter by PENDING SUCCESS');
      console.log('   Pending Doctors:', pagination.total);
      
      if (doctors && doctors.length > 0) {
        console.log('\n📋 Pending Doctors:');
        doctors.forEach((doctor, idx) => {
          console.log(`   ${idx + 1}. ${doctor.doctorProfile?.fullLegalName || doctor.name} - ${doctor.doctorProfile?.verificationStatus}`);
        });
      } else {
        console.log('   No pending doctors found');
      }
      
      return true;
    }
  } catch (err) {
    console.error('❌ Filter test ERROR:', err.response?.data || err.message);
    return false;
  }
}

async function testGetAllDoctorsWithSearch() {
  try {
    console.log('\n🔍 Testing GET /api/admin/all-doctors with search...');
    
    const res = await axios.get(`${BASE_URL}/admin/all-doctors`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      params: {
        search: 'test',
        page: 1,
        limit: 10,
      },
    });

    if (res.data.success) {
      const { doctors, pagination } = res.data.data;
      console.log('✅ Search test SUCCESS');
      console.log('   Found:', pagination.total, 'doctors matching "test"');
      
      if (doctors && doctors.length > 0) {
        console.log('\n📋 Search Results:');
        doctors.forEach((doctor, idx) => {
          console.log(`   ${idx + 1}. ${doctor.doctorProfile?.fullLegalName || doctor.name} - ${doctor.mobile}`);
        });
      }
      
      return true;
    }
  } catch (err) {
    console.error('❌ Search test ERROR:', err.response?.data || err.message);
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      Testing GET /api/admin/all-doctors Endpoint          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Step 1: Admin Login
  const loginSuccess = await adminLogin();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without admin authentication');
    process.exit(1);
  }

  // Step 2: Test basic getAllDoctors
  await testGetAllDoctors();

  // Step 3: Test with filters
  await testGetAllDoctorsWithFilters();

  // Step 4: Test with search
  await testGetAllDoctorsWithSearch();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Tests Completed                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

runTests().catch(console.error);
