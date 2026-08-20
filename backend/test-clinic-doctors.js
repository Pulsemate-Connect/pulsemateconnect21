/**
 * Test script to verify doctors appear in clinic portal after admin approval
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test clinic credentials
const CLINIC_MOBILE = '9876543211';
const CLINIC_PASSWORD = 'password123'; // Replace with actual password if different

let clinicToken = '';
let clinicId = '';

async function clinicLogin() {
  try {
    console.log('\n📝 Clinic Login...');
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      mobile: CLINIC_MOBILE,
      password: CLINIC_PASSWORD,
    });

    if (res.data.success && res.data.data.accessToken) {
      clinicToken = res.data.data.accessToken;
      const user = res.data.data.user;
      console.log('✅ Clinic login successful');
      console.log('   Clinic Owner:', user.name);
      console.log('   Role:', user.role);
      
      // Get clinic ID
      if (user.ownedClinics && user.ownedClinics.length > 0) {
        clinicId = user.ownedClinics[0].id;
        console.log('   Clinic ID:', clinicId);
      }
      
      return true;
    } else {
      console.error('❌ Clinic login failed - no token');
      return false;
    }
  } catch (err) {
    console.error('❌ Clinic login error:', err.response?.data || err.message);
    return false;
  }
}

async function getMyClinics() {
  try {
    console.log('\n🏥 Fetching clinic info...');
    const res = await axios.get(`${BASE_URL}/clinics/my`, {
      headers: {
        Authorization: `Bearer ${clinicToken}`,
      },
    });

    if (res.data.success) {
      const clinics = res.data.data.clinics;
      if (clinics && clinics.length > 0) {
        clinicId = clinics[0].id;
        console.log('✅ Clinic found:', clinics[0].name);
        console.log('   Clinic ID:', clinicId);
        return true;
      } else {
        console.log('❌ No clinics found for this owner');
        return false;
      }
    }
  } catch (err) {
    console.error('❌ Error fetching clinics:', err.response?.data || err.message);
    return false;
  }
}

async function getClinicDoctors() {
  try {
    console.log('\n👨‍⚕️ Fetching clinic doctors...');
    console.log('   Endpoint: GET /api/clinic/doctors');
    console.log('   Clinic ID:', clinicId);
    
    const res = await axios.get(`${BASE_URL}/clinic/doctors`, {
      headers: {
        Authorization: `Bearer ${clinicToken}`,
      },
      params: {
        page: 1,
        limit: 50,
      },
    });

    if (res.data.success) {
      const doctors = res.data.data;
      console.log('\n✅ GET /api/clinic/doctors SUCCESS');
      console.log('   Total Doctors:', res.data.pagination?.total || doctors.length);
      
      if (doctors && doctors.length > 0) {
        console.log('\n📋 Doctors List:');
        doctors.forEach((doctor, idx) => {
          console.log(`\n   Doctor ${idx + 1}:`);
          console.log('     Name:', doctor.profile?.fullLegalName || doctor.name);
          console.log('     Mobile:', doctor.mobile);
          console.log('     Email:', doctor.email || 'N/A');
          console.log('     Specialization:', doctor.profile?.specialization || 'N/A');
          console.log('     User Approval Status:', doctor.approvalStatus);
          console.log('     Clinic Invite Status:', doctor.inviteStatus);
          console.log('     Is Active:', doctor.isActive);
          console.log('     Profile Verification:', doctor.profile?.verificationStatus);
          console.log('     Joined At:', doctor.joinedAt || 'N/A');
          console.log('     Admin Verified At:', doctor.adminVerifiedAt || 'N/A');
        });
        
        // Count by status
        const statusCounts = {
          ACCEPTED: doctors.filter(d => d.inviteStatus === 'ACCEPTED').length,
          PENDING: doctors.filter(d => d.inviteStatus === 'PENDING').length,
          ACTIVE: doctors.filter(d => d.isActive === true).length,
          INACTIVE: doctors.filter(d => d.isActive === false).length,
        };
        
        console.log('\n📊 Status Breakdown:');
        console.log('   Invite Status ACCEPTED:', statusCounts.ACCEPTED);
        console.log('   Invite Status PENDING:', statusCounts.PENDING);
        console.log('   Is Active (true):', statusCounts.ACTIVE);
        console.log('   Is Active (false):', statusCounts.INACTIVE);
        
        // Check for approved doctors
        const approvedDoctors = doctors.filter(d => 
          d.inviteStatus === 'ACCEPTED' && 
          d.isActive === true &&
          d.adminVerifiedAt
        );
        
        if (approvedDoctors.length > 0) {
          console.log('\n✅ Admin-Approved Doctors Found:', approvedDoctors.length);
          approvedDoctors.forEach((doc, idx) => {
            console.log(`   ${idx + 1}. ${doc.profile?.fullLegalName || doc.name} - Approved on ${new Date(doc.adminVerifiedAt).toLocaleDateString()}`);
          });
        } else {
          console.log('\n⚠️  No admin-approved doctors found in clinic');
          console.log('   Please approve a doctor from admin panel first');
        }
      } else {
        console.log('\n⚠️  No doctors found in clinic portal');
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Check if any doctors have been invited to this clinic');
        console.log('   2. Check if invited doctors completed their profiles');
        console.log('   3. Check if admin approved the doctors');
        console.log('   4. Check DoctorClinic table for entries with clinicId:', clinicId);
      }
      
      return true;
    } else {
      console.error('❌ API returned success: false');
      return false;
    }
  } catch (err) {
    console.error('❌ GET /api/clinic/doctors ERROR:', err.response?.data || err.message);
    if (err.response?.status === 404) {
      console.log('\n💡 Tip: Make sure the clinic owner has at least one verified clinic');
    }
    return false;
  }
}

async function getClinicDoctorsWithFilter() {
  try {
    console.log('\n🔍 Testing GET /api/clinic/doctors with ACTIVE filter...');
    
    const res = await axios.get(`${BASE_URL}/clinic/doctors`, {
      headers: {
        Authorization: `Bearer ${clinicToken}`,
      },
      params: {
        status: 'ACTIVE',
        page: 1,
        limit: 50,
      },
    });

    if (res.data.success) {
      const doctors = res.data.data;
      console.log('✅ Filter by ACTIVE SUCCESS');
      console.log('   Active Doctors:', res.data.pagination?.total || doctors.length);
      
      if (doctors && doctors.length > 0) {
        console.log('\n📋 Active Doctors:');
        doctors.forEach((doctor, idx) => {
          console.log(`   ${idx + 1}. ${doctor.profile?.fullLegalName || doctor.name} - ${doctor.inviteStatus}, Active: ${doctor.isActive}`);
        });
      } else {
        console.log('   No active doctors found');
      }
      
      return true;
    }
  } catch (err) {
    console.error('❌ Filter test ERROR:', err.response?.data || err.message);
    return false;
  }
}

async function checkDatabaseDirectly() {
  console.log('\n🔍 Database Check Instructions:');
  console.log('\nRun this SQL query in your database to check DoctorClinic entries:');
  console.log('```sql');
  console.log(`SELECT dc.*, dp."fullLegalName", u.name, u.mobile`);
  console.log(`FROM "clinic_doctors" dc`);
  console.log(`JOIN "doctor_profiles" dp ON dc."doctorId" = dp.id`);
  console.log(`JOIN "users" u ON dp."userId" = u.id`);
  console.log(`WHERE dc."clinicId" = '${clinicId}';`);
  console.log('```');
  console.log('\nThis will show:');
  console.log('  - inviteStatus (should be ACCEPTED for approved doctors)');
  console.log('  - isActive (should be true)');
  console.log('  - adminVerifiedAt (should have timestamp)');
  console.log('  - adminVerifiedById (should have admin user ID)');
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║    Testing Clinic Doctor Portal After Admin Approval      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Step 1: Clinic Login
  const loginSuccess = await clinicLogin();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without clinic authentication');
    process.exit(1);
  }

  // Step 2: Get clinic info (if clinicId not found from login)
  if (!clinicId) {
    const clinicFound = await getMyClinics();
    if (!clinicFound) {
      console.error('\n❌ Cannot proceed without clinic ID');
      process.exit(1);
    }
  }

  // Step 3: Get clinic doctors (all)
  await getClinicDoctors();

  // Step 4: Get clinic doctors with ACTIVE filter
  await getClinicDoctorsWithFilter();

  // Step 5: Show database check instructions
  await checkDatabaseDirectly();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Tests Completed                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  console.log('\n📝 Next Steps:');
  console.log('   1. If no doctors appear, check the admin panel:');
  console.log('      - Login as admin');
  console.log('      - Go to /admin/doctors');
  console.log('      - Find a pending doctor');
  console.log('      - Click Approve');
  console.log('   2. After approval, run this test again');
  console.log('   3. The approved doctor should now appear in clinic portal');
}

runTests().catch(console.error);
