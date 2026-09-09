const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================');
  console.log('Fix Doctor Approval Status');
  console.log('============================================\n');

  // Update Dr Arjun's approvalStatus in doctorProfile
  const updated = await prisma.doctorProfile.update({
    where: { id: 'fd03af76-a64d-4843-9a0d-c45fe5212863' },
    data: { approvalStatus: 'VERIFIED' }
  });

  console.log('✅ Fixed: doctorProfile.approvalStatus set to VERIFIED');
  console.log(`   Doctor: ${updated.id}`);
  console.log(`   New approvalStatus: ${updated.approvalStatus}`);
  console.log();
  console.log('Now test the search API again - doctor should appear!');
}

main().finally(() => prisma.$disconnect());
