/**
 * Single Doctor Onboarding Test - Debug Version
 * Tests one complete flow with detailed logging
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const TEST_CLINIC_MOBILE = '9876543211';
const TEST_OTP = '123456';
const ADMIN_EMAIL = 'sahilnaik1515@gmail.com';
const ADMIN_PASSWORD = 'Nkabu18$';

const TEST_DOCTOR = {
  name: 'Dr. Test Single',
  mobile: '9999999001',
  email: 'test.doctor01@gmail.com'
};

console.log('🧪 Single Doctor Onboarding Flow Test\n');

async function runTest() {
  try {
    // Step 1: Clinic Login
    console.log('Step 1: Clinic Login...');
    const otpResponse = await axios.post(`${API_URL}/api/auth/send-otp`, {
      phoneNumber: TEST_CLINIC_MOBILE
    });
    console.log('✓ OTP sent');

    const verifyResponse = await axios.post(`${API_URL}/api/auth/verify-otp`, {
      phoneNumber: TEST_CLINIC_MOBILE,
      otp: TEST_OTP
    });
    const clinicToken = verifyResponse.data.data.accessToken;
    console.log('✓ Clinic authenticated\n');

    // Step 2: Get Clinic ID
    console.log('Step 2: Get Clinic ID...');
    const clinicResponse = await axios.get(`${API_URL}/api/clinic/my`, {
      headers: { Authorization: `Bearer ${clinicToken}` }
    });
    const clinics = clinicResponse.data.data.clinics || clinicResponse.data.data;
    const clinicId = clinics[0].id;
    console.log(`✓ Clinic ID: ${clinicId}\n`);

    // Step 3: Create Invitation
    console.log('Step 3: Create Doctor Invitation...');
    console.log(`   Doctor: ${TEST_DOCTOR.name}`);
    console.log(`   Mobile: ${TEST_DOCTOR.mobile}`);
    console.log(`   Email: ${TEST_DOCTOR.email}`);
    
    const inviteResponse = await axios.post(`${API_URL}/api/clinic/${clinicId}/invite-doctor`, {
      name: TEST_DOCTOR.name,
      mobile: TEST_DOCTOR.mobile,
      email: TEST_DOCTOR.email,
      specialization: 'General Physician'
    }, {
      headers: { Authorization: `Bearer ${clinicToken}` }
    });
    
    console.log('\n📦 Full Invitation Response:');
    console.log(JSON.stringify(inviteResponse.data, null, 2));
    
    const invitation = inviteResponse.data.data.invitation;
    const invToken = invitation.invitationToken;
    console.log(`\n✓ Invitation created`);
    console.log(`   Token: ${invToken.substring(0, 20)}...`);
    console.log(`   Status: ${invitation.status}\n`);

    // Step 4: Accept Invitation
    console.log('Step 4: Doctor Accepts Invitation...');
    const acceptResponse = await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/accept`);
    console.log('✓ Invitation accepted');
    console.log(`   Response:`, acceptResponse.data.data);
    console.log();

    // Step 5: Mobile OTP
    console.log('Step 5: Mobile Verification...');
    await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/send-mobile-otp`);
    console.log('✓ Mobile OTP sent');
    
    const mobileVerifyResponse = await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/verify-mobile-otp`, {
      otp: TEST_OTP
    });
    console.log('✓ Mobile verified');
    console.log(`   Response:`, mobileVerifyResponse.data.data);
    console.log();

    // Step 6: Email OTP
    console.log('Step 6: Email Verification...');
    await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/send-email-otp`);
    console.log('✓ Email OTP sent');
    
    const emailVerifyResponse = await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/verify-email-otp`, {
      otp: TEST_OTP
    });
    console.log('✓ Email verified');
    console.log(`   Response:`, emailVerifyResponse.data.data);
    console.log();

    // Step 7: Complete Profile
    console.log('Step 7: Complete Doctor Profile...');
    await axios.put(`${API_URL}/api/doctor/profile/${invToken}`, {
      fullLegalName: TEST_DOCTOR.name,
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      medicalSystem: 'Allopathy',
      qualification: 'MBBS',
      specialization: 'General Physician',
      medicalRegistrationNumber: `MH${TEST_DOCTOR.mobile.slice(-6)}`,
      registrationAuthority: 'Medical Council of India',
      registrationYear: 2015,
      experienceYears: 8,
      languagesKnown: ['English', 'Hindi'],
      bio: 'Experienced physician',
      consultationFee: 500
    });
    console.log('✓ Profile updated\n');

    // Step 8: Submit Profile
    console.log('Step 8: Submit Profile for Verification...');
    const submitResponse = await axios.post(`${API_URL}/api/doctor/profile/${invToken}/submit`);
    console.log('✓ Profile submitted');
    console.log(`   Response:`, submitResponse.data.data);
    console.log();

    // Step 9: Admin Login
    console.log('Step 9: Admin Login...');
    const adminResponse = await axios.post(`${API_URL}/api/auth/login`, {
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const adminToken = adminResponse.data.data.accessToken;
    console.log('✓ Admin authenticated\n');

    // Step 10: Get Pending Doctors
    console.log('Step 10: Get Pending Doctors...');
    const pendingResponse = await axios.get(`${API_URL}/api/admin/pending-doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pending = pendingResponse.data.data.doctors || pendingResponse.data.data;
    console.log(`✓ Found ${pending.length} pending doctors`);
    
    const doctorToApprove = pending.find(d => d.mobile === `+91${TEST_DOCTOR.mobile}` || d.email === TEST_DOCTOR.email);
    if (!doctorToApprove) {
      throw new Error('Doctor not found in pending list');
    }
    console.log(`   Doctor ID: ${doctorToApprove.id}\n`);

    // Step 11: Approve Doctor
    console.log('Step 11: Admin Approves Doctor...');
    await axios.patch(`${API_URL}/api/admin/doctors/${doctorToApprove.id}/approve`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✓ Doctor approved\n');

    // Step 12: Verify in Clinic List
    console.log('Step 12: Verify Doctor in Clinic Dashboard...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const clinicDoctorsResponse = await axios.get(`${API_URL}/api/clinic/doctors`, {
      headers: { Authorization: `Bearer ${clinicToken}` }
    });
    const clinicDoctors = clinicDoctorsResponse.data.data;
    console.log(`✓ Clinic has ${clinicDoctors.length} doctors`);
    
    const approvedDoctor = clinicDoctors.find(d => d.mobile === `+91${TEST_DOCTOR.mobile}` || d.email === TEST_DOCTOR.email);
    if (!approvedDoctor) {
      throw new Error('Doctor not found in clinic dashboard');
    }
    console.log(`   Doctor: ${approvedDoctor.name}`);
    console.log(`   Status: ${approvedDoctor.status || approvedDoctor.inviteStatus}`);
    console.log();

    console.log('✅ ALL STEPS COMPLETED SUCCESSFULLY!\n');
    console.log('========================================');
    console.log('Doctor Onboarding Flow: WORKING ✓');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

runTest();
