/**
 * Test Script: Verify PENDING users cannot log in
 * 
 * This script tests that clinic owners with PENDING status
 * are blocked from logging in after the fix.
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
};

async function testPendingUserLogin() {
  console.log('\n' + '='.repeat(70));
  console.log('  TEST: PENDING USER LOGIN BLOCKED');
  console.log('='.repeat(70) + '\n');

  // Test credentials (replace with actual PENDING user credentials)
  const testCases = [
    {
      name: 'Password Login - PENDING User',
      endpoint: '/login',
      data: {
        identifier: 'pending@test.com', // Replace with actual PENDING user
        password: 'password123',
      },
    },
  ];

  for (const testCase of testCases) {
    log.test(`Testing: ${testCase.name}`);
    
    try {
      const response = await axios.post(`${API_URL}${testCase.endpoint}`, testCase.data, {
        headers: { 'Content-Type': 'application/json' },
      });

      // If we get here, login succeeded (BAD - fix didn't work)
      log.error(`FAILED: ${testCase.name} - User was allowed to log in!`);
      console.log('Response:', response.data);
      
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 403) {
          // Expected: 403 Forbidden
          log.success(`PASSED: ${testCase.name} - Login blocked correctly`);
          console.log(`   Status: ${status}`);
          console.log(`   Message: "${data.message}"`);
          
          // Verify the error message mentions verification
          if (data.message.toLowerCase().includes('pending') || 
              data.message.toLowerCase().includes('verification')) {
            log.success('   Error message is user-friendly ✓');
          } else {
            log.warning('   Error message could be more specific');
          }
        } else if (status === 401) {
          log.warning(`${testCase.name} - Got 401 (Invalid credentials)`);
          console.log('   This might mean the test user doesn\'t exist');
        } else {
          log.error(`UNEXPECTED: ${testCase.name} - Got status ${status}`);
          console.log('Response:', data);
        }
      } else {
        log.error(`Network error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line between tests
  }
}

async function testVerifiedUserLogin() {
  console.log('='.repeat(70));
  console.log('  TEST: VERIFIED USER CAN LOGIN');
  console.log('='.repeat(70) + '\n');

  log.test('Testing: Password Login - VERIFIED User');
  
  try {
    const response = await axios.post(`${API_URL}/login`, {
      identifier: 'verified@test.com', // Replace with actual VERIFIED user
      password: 'password123',
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    // If we get here, login succeeded (GOOD)
    log.success('PASSED: VERIFIED user can log in successfully');
    console.log('   User role:', response.data.data?.user?.role);
    console.log('   User status:', response.data.data?.user?.status);
    
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 403) {
        log.error('FAILED: VERIFIED user was blocked from logging in!');
        console.log('   Message:', data.message);
      } else if (status === 401) {
        log.warning('Test user credentials invalid or user doesn\'t exist');
      } else {
        log.error(`Unexpected status: ${status}`);
        console.log('Response:', data);
      }
    } else {
      log.error(`Network error: ${error.message}`);
    }
  }
  
  console.log('');
}

async function checkServerHealth() {
  log.info('Checking if server is running...');
  
  try {
    // Try a simple health check (adjust endpoint if needed)
    await axios.get('http://localhost:5000/', { timeout: 3000 });
    log.success('Server is running on http://localhost:5000');
    return true;
  } catch (error) {
    log.error('Cannot connect to server at http://localhost:5000');
    log.error('Make sure the backend is running: npm start');
    return false;
  }
}

// Main execution
async function main() {
  console.clear();
  
  console.log('\n' + '╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(15) + 'PENDING USER LOGIN BLOCK TEST' + ' '.repeat(24) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  // Check if server is running
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    process.exit(1);
  }
  
  console.log('');

  // Run tests
  await testPendingUserLogin();
  
  // Optional: Test that VERIFIED users can still log in
  // await testVerifiedUserLogin();

  console.log('='.repeat(70));
  console.log('  TEST INSTRUCTIONS');
  console.log('='.repeat(70));
  console.log('');
  console.log('To run this test properly:');
  console.log('');
  console.log('1. Update test credentials in this script:');
  console.log('   - Line 34: Replace with actual PENDING user email/phone');
  console.log('   - Line 35: Replace with actual password');
  console.log('');
  console.log('2. Run the test:');
  console.log('   node test-pending-login-block.js');
  console.log('');
  console.log('3. Expected result:');
  console.log('   ✅ Login blocked with 403 Forbidden');
  console.log('   ✅ Message: "Your clinic application is pending verification..."');
  console.log('');
  console.log('='.repeat(70));
}

main().catch((error) => {
  log.error('Test script error:');
  console.error(error);
  process.exit(1);
});
