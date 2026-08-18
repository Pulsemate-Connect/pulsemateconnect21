/**
 * Simple server health check script
 * Run before executing tests to ensure backend is ready
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function checkServer() {
  console.log('\n🔍 Checking backend server...');
  console.log(`📍 URL: ${API_URL}\n`);

  try {
    // Try to reach the server
    const response = await axios.get(`${API_URL}/api/health`, {
      timeout: 5000
    });

    console.log('✅ Backend server is RUNNING');
    console.log(`📊 Status: ${response.status}`);
    console.log(`💾 Response:`, response.data);
    console.log('\n✨ Ready to run tests!');
    console.log('\nRun: node test-doctor-onboarding.js\n');
    process.exit(0);
  } catch (error) {
    console.log('❌ Backend server is NOT RUNNING');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Connection refused. Is the backend server started?');
      console.log('\n📝 To start the backend:');
      console.log('   cd backend');
      console.log('   npm run dev');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n⚠️  Request timed out. Server may be slow to respond.');
    } else if (error.response?.status === 404) {
      console.log('\n⚠️  Server is running but /api/health endpoint not found.');
      console.log('   This might be okay - try running tests anyway.');
    } else {
      console.log(`\n⚠️  Error: ${error.message}`);
    }

    console.log('\n');
    process.exit(1);
  }
}

checkServer();
