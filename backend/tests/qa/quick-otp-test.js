/**
 * Quick OTP Test - Verify test OTP configuration is working
 * Focus: Email OTP verification for clinic registration
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const TEST_OTP_CODE = '123456';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testOTPConfiguration() {
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  QUICK EMAIL OTP CONFIGURATION TEST                              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝\n', 'cyan');

  const testEmail = 'clinic001@pulsematetest.com';
  
  try {
    // Test 1: Send email OTP
    log('→ Test 1: Sending email OTP...', 'cyan');
    const emailSend = await axios.post(`${API_BASE}/auth/clinic-owner/send-email-otp`, {
      email: testEmail,
      ownerName: 'Test Owner',
    });
    
    if (emailSend.data.success) {
      log('✓ Email OTP sent successfully', 'green');
    } else {
      log('✗ Email OTP send failed', 'red');
      return false;
    }

    // Test 2: Verify email OTP with correct code
    log('→ Test 2: Verifying email OTP with TEST_OTP_CODE (123456)...', 'cyan');
    const emailVerify = await axios.post(`${API_BASE}/auth/clinic-owner/verify-email-otp`, {
      email: testEmail,
      otp: TEST_OTP_CODE,
    });
    
    if (emailVerify.data.success) {
      log('✓ Email OTP verified successfully', 'green');
    } else {
      log('✗ Email OTP verification failed', 'red');
      log(`  Response: ${JSON.stringify(emailVerify.data)}`, 'red');
      return false;
    }

    // Test 3: Try wrong OTP (should fail)
    log('→ Test 3: Testing wrong OTP (should fail)...', 'cyan');
    
    // Send new OTP first
    await axios.post(`${API_BASE}/auth/clinic-owner/send-email-otp`, {
      email: 'clinic002@pulsematetest.com',
      ownerName: 'Test Owner 2',
    });
    
    try {
      await axios.post(`${API_BASE}/auth/clinic-owner/verify-email-otp`, {
        email: 'clinic002@pulsematetest.com',
        otp: '999999', // Wrong OTP
      });
      log('✗ Wrong OTP should have been rejected', 'red');
      return false;
    } catch (err) {
      if (err.response && err.response.status === 400) {
        log('✓ Wrong OTP correctly rejected', 'green');
      } else {
        log('✗ Unexpected error response', 'red');
        return false;
      }
    }

    log('\n╔══════════════════════════════════════════════════════════════════╗', 'green');
    log('║  ✓ ALL TESTS PASSED - Email OTP configuration is correct!       ║', 'green');
    log('╚══════════════════════════════════════════════════════════════════╝\n', 'green');
    
    log('Note: Mobile OTP testing is done in the full 45-identity test suite\n', 'yellow');
    
    return true;

  } catch (error) {
    log('\n✗ Test failed with error:', 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return false;
  }
}

testOTPConfiguration().then(success => {
  process.exit(success ? 0 : 1);
});
