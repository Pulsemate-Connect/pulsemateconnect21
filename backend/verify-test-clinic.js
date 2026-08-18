/**
 * verify-test-clinic.js
 * Verify the test clinic was created correctly
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking test clinic...\n');
  
  const user = await prisma.user.findUnique({
    where: { email: 'test@gmail.com' },
    include: { 
      ownedClinics: true,
      clinicOwnerProfile: true
    }
  });

  if (!user) {
    console.log('❌ Test user not found!');
    console.log('   Run: node create-test-clinic.js\n');
    return;
  }

  console.log('✅ USER FOUND:');
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Mobile: ${user.mobile}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Status: ${user.approvalStatus}`);
  console.log(`   Phone Verified: ${user.isPhoneVerified ? 'Yes' : 'No'}`);
  console.log(`   Email Verified: ${user.isEmailVerified ? 'Yes' : 'No'}`);
  console.log();

  if (user.ownedClinics.length === 0) {
    console.log('⚠️  USER HAS NO CLINICS!');
  } else {
    console.log(`✅ OWNED CLINICS: ${user.ownedClinics.length}`);
    user.ownedClinics.forEach(clinic => {
      console.log(`\n   📍 ${clinic.name}`);
      console.log(`      ID: ${clinic.id}`);
      console.log(`      Status: ${clinic.approvalStatus}`);
      console.log(`      Verified: ${clinic.isVerified ? 'Yes' : 'No'}`);
      console.log(`      Phone: ${clinic.phone}`);
      console.log(`      City: ${clinic.city}, ${clinic.state}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔑 LOGIN INFO:');
  console.log('   Email: test@gmail.com');
  console.log('   Mobile: 9999999999');
  console.log('   Password: Test@123456');
  console.log('   Test OTP: 123456\n');
  console.log('   Login URL: http://localhost:3000/login/clinic-owner');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
