/**
 * Test the clinic API endpoint that mobile uses
 */

const axios = require('axios');

const API_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const CLINIC_ID = '0bce7374-e4c1-4f0f-a219-b3fe9c76a226'; // SPINE clinic

async function main() {
  console.log('\n============================================');
  console.log('Mobile Clinic API Test');
  console.log('============================================\n');

  try {
    console.log(`Calling: GET ${API_URL}/api/clinics/${CLINIC_ID}`);
    console.log('(Without authentication - as mobile app would)');
    console.log();

    const response = await axios.get(`${API_URL}/api/clinics/${CLINIC_ID}`);
    
    const clinic = response.data.data.clinic;
    
    console.log('Response Status:', response.status);
    console.log();
    console.log('Clinic Data:');
    console.log(`  ID: ${clinic.id}`);
    console.log(`  Name: ${clinic.name}`);
    console.log(`  Owner: ${clinic.owner.name}`);
    console.log();
    console.log(`Staff (from 'staff' relation): ${clinic.staff?.length || 0}`);
    if (clinic.staff?.length > 0) {
      clinic.staff.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.user.name} (${s.role})`);
      });
    }
    console.log();
    console.log(`Doctors (from 'doctorClinics' relation): ${clinic.doctorClinics?.length || 0}`);
    if (clinic.doctorClinics?.length > 0) {
      clinic.doctorClinics.forEach((dc, i) => {
        console.log(`  ${i + 1}. ${dc.doctor.user.name}`);
        console.log(`     - inviteStatus: ${dc.inviteStatus}`);
        console.log(`     - isActive: ${dc.isActive}`);
      });
    } else {
      console.log('  ❌ NO DOCTORS RETURNED');
      console.log('  This is why mobile app shows no doctors!');
    }
    console.log();
    
    if (clinic.doctorClinics?.length > 0) {
      console.log('✅ SUCCESS: Mobile app should display doctors correctly');
    } else {
      console.log('❌ PROBLEM: Mobile app will not show doctors');
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.statusText);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log();
        console.log('⚠️  The API requires authentication!');
        console.log('   Need to check if mobile app is sending auth token.');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Could not connect to backend server');
      console.error('   Make sure the backend is running on', API_URL);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log();
}

main();
