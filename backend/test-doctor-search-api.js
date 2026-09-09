/**
 * Test the doctor search API that mobile app uses
 */

const axios = require('axios');

const API_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const DOCTOR_ID = 'fd03af76-a64d-4843-9a0d-c45fe5212863'; // Dr Arjun

async function main() {
  console.log('\n============================================');
  console.log('Doctor Search API Test (Mobile App)');
  console.log('============================================\n');

  try {
    // Test 1: Search all doctors
    console.log('Test 1: Search All Doctors');
    console.log(`GET ${API_URL}/api/patient/doctors`);
    const searchResponse = await axios.get(`${API_URL}/api/patient/doctors`);
    
    const doctors = searchResponse.data.data || [];
    console.log(`Found ${doctors.length} doctor(s)\n`);
    
    doctors.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.user.name}`);
      console.log(`   Specialization: ${doc.specialization || 'N/A'}`);
      console.log(`   Clinics: ${doc.doctorClinics?.length || 0}`);
      if (doc.doctorClinics?.length > 0) {
        doc.doctorClinics.forEach((dc) => {
          console.log(`     - ${dc.clinic.name} (${dc.clinic.city})`);
          console.log(`       Status: ${dc.inviteStatus}, Active: ${dc.isActive}`);
        });
      } else {
        console.log(`     ❌ No clinics linked`);
      }
      console.log();
    });

    // Test 2: Get specific doctor profile
    console.log('\n============================================');
    console.log('Test 2: Get Dr Arjun Profile');
    console.log(`GET ${API_URL}/api/patient/doctors/${DOCTOR_ID}`);
    const profileResponse = await axios.get(`${API_URL}/api/patient/doctors/${DOCTOR_ID}`);
    
    const doctor = profileResponse.data.data.doctor;
    console.log(`\nDoctor: ${doctor.user.name}`);
    console.log(`Specialization: ${doctor.specialization || 'N/A'}`);
    console.log(`Experience: ${doctor.experienceYears || 0} years`);
    console.log(`Clinics: ${doctor.doctorClinics?.length || 0}\n`);
    
    if (doctor.doctorClinics?.length > 0) {
      console.log('Clinic Details:');
      doctor.doctorClinics.forEach((dc, i) => {
        console.log(`\n${i + 1}. ${dc.clinic.name}`);
        console.log(`   City: ${dc.clinic.city || 'N/A'}`);
        console.log(`   Address: ${dc.clinic.address || 'N/A'}`);
        console.log(`   Approval Status: ${dc.clinic.approvalStatus}`);
        console.log(`   Doctor Status: inviteStatus=${dc.inviteStatus}, isActive=${dc.isActive}`);
      });
      console.log();
      console.log('✅ SUCCESS: Mobile app should display these clinics');
    } else {
      console.log('❌ PROBLEM: No clinics in doctorClinics array');
      console.log('   Mobile app will not show any clinics for this doctor');
    }

    console.log('\n============================================');
    console.log('Summary');
    console.log('============================================');
    console.log(`Total Doctors: ${doctors.length}`);
    console.log(`Dr Arjun Clinics: ${doctor.doctorClinics?.length || 0}`);
    
    if (doctor.doctorClinics?.length > 0) {
      console.log('\n✅ API is working correctly');
      console.log('   If mobile still doesn\'t show doctors, the issue is in mobile app code.');
    } else {
      console.log('\n❌ API is NOT returning clinics');
      console.log('   Database or backend code issue.');
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.statusText);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Could not connect to backend server');
      console.error('   Make sure the backend is running:', API_URL);
      console.error('\n   Start it with:');
      console.error('   cd backend');
      console.error('   npm start');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log();
}

main();
