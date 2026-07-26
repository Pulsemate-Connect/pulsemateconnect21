// Test 2Factor API Key
const axios = require('axios');

const API_KEY = '0f290349-865f-11f1-908b-0200cd936042'; // Correct key
const PHONE = '7022818878'; // Your test number
const BASE_URL = 'https://2factor.in/API/V1';

async function testSendOTP() {
  try {
    console.log('Testing 2Factor API...');
    console.log('API Key:', API_KEY);
    console.log('Phone:', PHONE);
    
    const url = `${BASE_URL}/${API_KEY}/SMS/${PHONE}/AUTOGEN/PULSEMATE_LOGIN`;
    console.log('URL:', url);
    
    const response = await axios.get(url);
    
    console.log('\n✅ SUCCESS!');
    console.log('Response:', response.data);
    console.log('Session ID:', response.data.Details);
    
  } catch (error) {
    console.log('\n❌ ERROR!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
  }
}

testSendOTP();
