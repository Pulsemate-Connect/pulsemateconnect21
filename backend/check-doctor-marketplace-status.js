const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: 'fd03af76-a64d-4843-9a0d-c45fe5212863' },
    include: {
      user: {
        select: { name: true, approvalStatus: true, role: true }
      }
    }
  });

  console.log('\nDr Arjun Status:\n');
  console.log('User:');
  console.log('  Name:', doctor.user.name);
  console.log('  Role:', doctor.user.role);
  console.log('  Approval Status:', doctor.user.approvalStatus);
  console.log();
  console.log('Doctor Profile:');
  console.log('  Profile Status:', doctor.profileStatus);
  console.log('  Verification Status:', doctor.verificationStatus);
  console.log('  Marketplace Visible:', doctor.marketplaceVisible);
  console.log('  Approval Status (old):', doctor.approvalStatus);
  console.log();

  if (!doctor.marketplaceVisible) {
    console.log('❌ PROBLEM: marketplaceVisible is FALSE');
    console.log('   This is why doctor doesn\'t appear in search!');
    console.log('   The doctor approval should have set this to TRUE.');
  } else {
    console.log('✅ marketplaceVisible is TRUE - doctor should appear in search');
  }
}

main().finally(() => prisma.$disconnect());
