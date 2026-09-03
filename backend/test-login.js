require('dotenv').config();
const axios = require('axios');

async function testLogin() {
  const API_URL = 'http://localhost:5000/api';
  
  console.log('\n🧪 Testing Admin Login Endpoint');
  console.log('═══════════════════════════════════════\n');
  
  const credentials = {
    identifier: 'sahilnaik1515@gmail.com',
    password: 'Nkabu18$'
  };
  
  try {
    console.log('→ Attempting login with:');
    console.log(`  Email: ${credentials.identifier}`);
    console.log(`  Password: ${'*'.repeat(credentials.password.length)}`);
    console.log(`  URL: ${API_URL}/auth/login\n`);
    
    const response = await axios.post(`${API_URL}/auth/login`, credentials, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 400
    });
    
    console.log('✅ Login successful!');
    console.log('\nResponse:');
    console.log('  Status:', response.status);
    console.log('  User:', response.data.data.user.email);
    console.log('  Role:', response.data.data.user.role);
    console.log('  Admin Level:', response.data.data.user.adminProfile?.level);
    console.log('  Access Token:', response.data.data.accessToken ? 'Present' : 'Missing');
    console.log('\n✅ Backend authentication is working!\n');
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('\nError Details:');
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Message:', error.response.data.message || error.response.data.error);
      console.log('  Full response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('  Error:', error.message);
    }
    console.log('\n');
  }
}

testLogin();
