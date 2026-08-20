/**
 * Update Test Clinic - Remove Password, Enable OTP Only
 * 
 * This script updates the test clinic owner to use OTP authentication only
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTestClinicForOTP() {
  try {
    console.log('\n🔄 Updating Test Clinic for OTP Authentication...\n');

    // Find the test clinic owner
    const owner = await prisma.user.findUnique({
      where: { email: 'testclinic@pulsemateconnect.in' }
    });

    if (!owner) {
      console.log('❌ Test clinic owner not found!');
      console.log('Please run create-test-clinic.js first.\n');
      return;
    }

    // Update user to remove password and set auth provider to EMAIL_OTP
    const updatedOwner = await prisma.user.update({
      where: { id: owner.id },
      data: {
        passwordHash: null, // Remove password
        authProvider: 'EMAIL_OTP', // Set to OTP authentication
        isEmailVerified: true,
        isPhoneVerified: true,
      }
    });

    console.log('✅ Test Clinic Owner Updated Successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('👤 Owner Details:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   Name: ${updatedOwner.name}`);
    console.log(`   Email: ${updatedOwner.email}`);
    console.log(`   Mobile: ${updatedOwner.mobile}`);
    console.log(`   Auth Provider: ${updatedOwner.authProvider}`);
    console.log(`   Password: REMOVED (OTP Only) ✅`);
    console.log();
    console.log('🔐 Login Methods:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Method 1: Email OTP');
    console.log('   - Email: testclinic@pulsemateconnect.in');
    console.log('   - OTP will be sent to email');
    console.log();
    console.log('   Method 2: Mobile OTP');
    console.log('   - Mobile: 9876543211');
    console.log('   - OTP will be sent via SMS (Message Central)');
    console.log();
    console.log('🌐 Login URL:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   http://localhost:3000/login/clinic-owner');
    console.log('   or');
    console.log('   http://localhost:3000 (click "Clinic Partner")');
    console.log();
    console.log('✨ Authentication is now OTP-based only!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error updating test clinic:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateTestClinicForOTP()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
