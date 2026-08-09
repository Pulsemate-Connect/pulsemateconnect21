// Test Message Central using different encoding approaches
require('dotenv').config({ path: '.env' });
const axios = require('axios');

const BASE_URL = 'https://cpaas.messagecentral.com';
const CUSTOMER_ID = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;
const PASSWORD = process.env.MESSAGE_CENTRAL_PASSWORD;

console.log('Testing different authentication approaches...\n');

// Approach 1: Query params (current method)
async function test1() {
  console.log('🔹 Test 1: Using query parameters (current method)');
  try {
    const response = await axios.get(`${BASE_URL}/auth/v1/authentication/token`, {
      params: {
        customerId: CUSTOMER_ID,
        key: PASSWORD,
        scope: 'NEW',
        country: '91'
      },
      headers: { 'accept': '*/*' },
      timeout: 10000
    });
    console.log('✅ Success!', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
}

// Approach 2: Headers
async function test2() {
  console.log('\n🔹 Test 2: Using headers');
  try {
    const response = await axios.get(`${BASE_URL}/auth/v1/authentication/token`, {
      headers: {
        'accept': '*/*',
        'X-Customer-Id': CUSTOMER_ID,
        'X-Auth-Key': PASSWORD,
        'X-Scope': 'NEW',
        'X-Country': '91'
      },
      timeout: 10000
    });
    console.log('✅ Success!', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
}

// Approach 3: POST with body
async function test3() {
  console.log('\n🔹 Test 3: POST with JSON body');
  try {
    const response = await axios.post(`${BASE_URL}/auth/v1/authentication/token`, {
      customerId: CUSTOMER_ID,
      key: PASSWORD,
      scope: 'NEW',
      country: '91'
    }, {
      headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
      timeout: 10000
    });
    console.log('✅ Success!', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
}

// Approach 4: Basic Auth
async function test4() {
  console.log('\n🔹 Test 4: Using Basic Auth');
  try {
    const response = await axios.get(`${BASE_URL}/auth/v1/authentication/token`, {
      params: { scope: 'NEW', country: '91' },
      auth: {
        username: CUSTOMER_ID,
        password: PASSWORD
      },
      headers: { 'accept': '*/*' },
      timeout: 10000
    });
    console.log('✅ Success!', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  await test1();
  await test2();
  await test3();
  await test4();
  
  console.log('\n' + '='.repeat(60));
  console.log('If all tests fail, the issue is with Message Central credentials');
  console.log('or their API has changed. Contact Message Central support.');
  console.log('='.repeat(60));
}

runTests();
