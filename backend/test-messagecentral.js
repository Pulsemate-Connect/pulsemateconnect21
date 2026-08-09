// Test Message Central authentication
require('dotenv').config({ path: '.env' });
const axios = require('axios');

const BASE_URL = process.env.MESSAGE_CENTRAL_BASE_URL || 'https://cpaas.messagecentral.com';
const CUSTOMER_ID = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;
const PASSWORD = process.env.MESSAGE_CENTRAL_PASSWORD;

console.log('?? Configuration:');
console.log('Customer ID:', CUSTOMER_ID);
console.log('Password length:', PASSWORD ? PASSWORD.length : 0, 'characters');
console.log('Password starts with:', PASSWORD ? PASSWORD.substring(0, 20) + '...' : 'NOT SET');
console.log('Base URL:', BASE_URL);
console.log('');

async function testAuth() {
  try {
    console.log('?? Testing authentication...');
    
    const response = await axios.get(`${BASE_URL}/auth/v1/authentication/token`, {
      params: {
        customerId: CUSTOMER_ID,
        key: PASSWORD,
        scope: 'NEW',
        country: '91'
      },
      headers: {
        'accept': '*/*'
      },
      timeout: 10000
    });

    console.log('? Success!');
    console.log('Response code:', response.data.responseCode);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.responseCode === 200) {
      console.log('\n? Message Central authentication working!');
      console.log('Session token received:', response.data.data.authToken.substring(0, 50) + '...');
    }
  } catch (error) {
    console.log('\n? Authentication failed!');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAuth();
