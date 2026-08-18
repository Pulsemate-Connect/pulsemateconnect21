/**
 * Create a Test Pending Doctor
 * Creates a complete doctor profile that will show in admin dashboard
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const TEST_CLINIC_MOBILE = '9876543211';
const TEST_OTP = '123456';

const TEST_DOCTOR = {
  name: 'Dr. Admin Dashboard Test',
  mobile: '9999999099',
  email: 'test.doctor.final@gmail.com'  // Use an email from test list
};

async function createTestPendingDoctor() {
  try {
    console.log('🧪 Creating Test Pending Doctor for Admin Dashboard\n');

    // Step 1: Clinic Login
    console.log('Step 1: Clinic Login...');
    await axios.post(`${API_URL}/api/auth/send-otp`, { phoneNumber: TEST_CLINIC_MOBILE });
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
    const inviteResponse = await axios.post(`${API_URL}/api/clinic/${clinicId}/invite-doctor`, {
      name: TEST_DOCTOR.name,
      mobile: TEST_DOCTOR.mobile,
      email: TEST_DOCTOR.email,
      specialization: 'Cardiologist'
    }, {
      headers: { Authorization: `Bearer ${clinicToken}` }
    });
    const invitation = inviteResponse.data.data.invitation;
    const invToken = invitation.invitationToken;
    console.log(`✓ Invitation created: ${invitation.doctorName}\n`);

    // Step 4: Doctor Accepts
    console.log('Step 4: Doctor Accepts Invitation...');
    await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/accept`);
    console.log('✓ Invitation accepted\n');

    // Step 5: Mobile Verification
    console.log('Step 5: Mobile Verification...');
    await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/send-mobile-otp`);
    await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/verify-mobile-otp`, { otp: TEST_OTP });
    console.log('✓ Mobile verified\n');

    // Step 6: Email Verification
    console.log('Step 6: Email Verification...');
    await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/send-email-otp`);
    await axios.post(`${API_URL}/api/doctor/invitation/${invToken}/verify-email-otp`, { otp: TEST_OTP });
    console.log('✓ Email verified\n');

    // Step 7: Complete Profile
    console.log('Step 7: Complete Doctor Profile...');
    await axios.put(`${API_URL}/api/doctor/profile/${invToken}`, {
      fullLegalName: TEST_DOCTOR.name,
      dateOfBirth: '1985-05-15',
      gender: 'Male',
      medicalSystem: 'Allopathy',
      qualification: 'MBBS, MD (Cardiology)',
      specialization: 'Cardiologist',
      medicalRegistrationNumber: 'MH2024TEST123',
      registrationAuthority: 'Maharashtra Medical Council',
      registrationYear: 2010,
      experienceYears: 14,
      languagesKnown: ['English', 'Hindi', 'Marathi'],
      bio: 'Experienced cardiologist specializing in interventional cardiology and heart failure management.',
      consultationFee: 800,
      areasOfExpertise: ['Interventional Cardiology', 'Heart Failure', 'Preventive Cardiology']
    });
    console.log('✓ Profile completed\n');

    // Step 8: Submit for Verification
    console.log('Step 8: Submit Profile for Admin Verification...');
    await axios.post(`${API_URL}/api/doctor/profile/${invToken}/submit`);
    console.log('✓ Profile submitted for verification\n');

    console.log('✅ TEST DOCTOR CREATED SUCCESSFULLY!\n');
    console.log('========================================');
    console.log('Doctor Details:');
    console.log(`  Name: ${TEST_DOCTOR.name}`);
    console.log(`  Email: ${TEST_DOCTOR.email}`);
    console.log(`  Mobile: ${TEST_DOCTOR.mobile}`);
    console.log(`  Specialization: Cardiologist`);
    console.log(`  Status: PENDING (Waiting for admin approval)`);
    console.log('========================================\n');
    console.log('✅ This doctor should now appear in the Admin Dashboard!');
    console.log('   Go to: Admin Panel → Doctors → Pending Approvals\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

createTestPendingDoctor();
