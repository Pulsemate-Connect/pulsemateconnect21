/**
 * Test Message Central SMS Service
 * This will verify if Message Central credentials are working
 */

require('dotenv').config();
const messageCentralService = require('./src/services/messagecentral.service');

async function testMessageCentral() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🧪 TESTING MESSAGE CENTRAL SMS SERVICE');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📋 Configuration Check:');
  console.log('   SMS_PROVIDER:', process.env.SMS_PROVIDER);
  console.log('   OTP_PROVIDER:', process.env.OTP_PROVIDER);
  console.log('   ENABLE_TEST_OTP:', process.env.ENABLE_TEST_OTP);
  console.log('   MESSAGE_CENTRAL_CUSTOMER_ID:', process.env.MESSAGE_CENTRAL_CUSTOMER_ID);
  console.log('   MESSAGE_CENTRAL_EMAIL:', process.env.MESSAGE_CENTRAL_EMAIL);
  console.log('   MESSAGE_CENTRAL_PASSWORD:', process.env.MESSAGE_CENTRAL_PASSWORD ? '[SET]' : '[NOT SET]');
  console.log('');
  
  try {
    // Test 1: Generate Auth Token
    console.log('TEST 1: Generating Message Central Auth Token...');
    console.log('─────────────────────────────────────────────────────\n');
    
    const token = await messageCentralService.generateAuthToken();
    
    console.log('✅ SUCCESS: Auth token generated!');
    console.log('   Token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('');
    
    // Test 2: Send OTP to your mobile
    console.log('TEST 2: Sending OTP to +919663080521...');
    console.log('─────────────────────────────────────────────────────\n');
    
    const result = await messageCentralService.sendOTP('9663080521', 6);
    
    console.log('✅ SUCCESS: OTP sent via SMS!');
    console.log('   Mobile:', result.mobileNumber);
    console.log('   Verification ID:', result.verificationId);
    console.log('   Expires in:', result.timeout, 'seconds');
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅✅✅ ALL TESTS PASSED ✅✅✅');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📱 CHECK YOUR MOBILE FOR OTP SMS!');
    console.log('');
    console.log('To test OTP validation, run:');
    console.log(`   node test-validate-otp.js ${result.verificationId} <OTP_CODE>`);
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌❌❌ TEST FAILED ❌❌❌');
    console.error('═══════════════════════════════════════════════════════');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.response?.data) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
      console.error('');
    }
    
    console.error('TROUBLESHOOTING:');
    console.error('─────────────────────────────────────────────────────');
    
    if (error.message.includes('JWT')) {
      console.error('❌ PASSWORD appears to be a JWT token');
      console.error('   Message Central requires Base64-encoded password');
      console.error('   Check your Message Central dashboard for the correct key');
    } else if (error.message.includes('BASE64')) {
      console.error('❌ PASSWORD is not valid Base64');
      console.error('   Current password format is incorrect');
      console.error('   Get the correct key from Message Central dashboard');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('❌ Authentication failed');
      console.error('   Check your CUSTOMER_ID, EMAIL, and PASSWORD');
      console.error('   Verify credentials in Message Central dashboard');
    } else if (error.message.includes('No valid OTP found')) {
      console.error('❌ OTP validation failed');
      console.error('   The OTP you entered is incorrect or expired');
    } else {
      console.error('❌ Unknown error occurred');
      console.error('   Check backend logs for more details');
    }
    
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    
    process.exit(1);
  }
}

testMessageCentral();
