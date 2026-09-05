/**
 * Test OTP Validation with Message Central
 * Usage: node test-validate-otp.js <VERIFICATION_ID> <OTP_CODE>
 */

require('dotenv').config();
const messageCentralService = require('./src/services/messagecentral.service');

async function testValidateOTP() {
  const verificationId = process.argv[2];
  const otpCode = process.argv[3];
  
  if (!verificationId || !otpCode) {
    console.error('\n❌ Usage: node test-validate-otp.js <VERIFICATION_ID> <OTP_CODE>');
    console.error('   Example: node test-validate-otp.js 12469194 123456\n');
    process.exit(1);
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🧪 TESTING OTP VALIDATION');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📋 Input:');
  console.log('   Verification ID:', verificationId);
  console.log('   OTP Code:', otpCode);
  console.log('');
  
  try {
    const result = await messageCentralService.validateOTP(verificationId, otpCode);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅✅✅ OTP VALIDATION SUCCESS ✅✅✅');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📱 Mobile:', result.mobileNumber);
    console.log('✓ Status:', result.verificationStatus);
    console.log('✓ Success:', result.success);
    console.log('');
    console.log('🎉 Your Message Central SMS service is working perfectly!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌❌❌ OTP VALIDATION FAILED ❌❌❌');
    console.error('═══════════════════════════════════════════════════════');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.message.includes('WRONG_OTP')) {
      console.error('❌ The OTP you entered is incorrect');
      console.error('   Please check the SMS and try again');
    } else if (error.message.includes('OTP_EXPIRED')) {
      console.error('❌ The OTP has expired (60 seconds timeout)');
      console.error('   Run: node test-messagecentral.js to get a new OTP');
    } else if (error.message.includes('ALREADY_VERIFIED')) {
      console.error('✅ This OTP was already used successfully');
    } else if (error.message.includes('INVALID_VERIFICATION_ID')) {
      console.error('❌ Invalid or expired verification session');
      console.error('   Run: node test-messagecentral.js to get a new OTP');
    }
    
    console.error('');
    process.exit(1);
  }
}

testValidateOTP();
