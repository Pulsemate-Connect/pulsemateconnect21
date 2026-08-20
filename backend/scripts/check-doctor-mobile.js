/**
 * check-doctor-mobile.js
 * Check doctor mobile number formats
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Checking doctor mobile formats...\n');

  const doctors = await prisma.user.findMany({
    where: {
      role: 'DOCTOR',
    },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      isPhoneVerified: true,
      approvalStatus: true,
    },
  });

  console.log(`Found ${doctors.length} doctor(s):\n`);
  doctors.forEach((doc, index) => {
    console.log(`${index + 1}. ${doc.name}`);
    console.log(`   Email: ${doc.email}`);
    console.log(`   Mobile: "${doc.mobile}" (length: ${doc.mobile?.length || 0})`);
    console.log(`   Phone Verified: ${doc.isPhoneVerified}`);
    console.log(`   Status: ${doc.approvalStatus}`);
    console.log('');
  });

  // Test the normalization
  const testMobile = '9876543211';
  console.log(`\n📱 Testing normalization for: ${testMobile}`);
  
  const withPlus = '+91' + testMobile;
  console.log(`   With +91: ${withPlus}`);
  
  const found1 = await prisma.user.findFirst({
    where: {
      mobile: testMobile,
      role: 'DOCTOR',
    },
  });
  
  const found2 = await prisma.user.findFirst({
    where: {
      mobile: withPlus,
      role: 'DOCTOR',
    },
  });
  
  console.log(`   Found with "${testMobile}": ${found1 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   Found with "${withPlus}": ${found2 ? 'YES ✅' : 'NO ❌'}`);
  
  console.log('\n✅ Done!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
