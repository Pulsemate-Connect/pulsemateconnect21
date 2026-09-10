const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================');
  console.log('Fix Doctor Approval Status');
  console.log('============================================\n');

  // Get all verified doctors with pending profile approval
  const doctors = await prisma.doctorProfile.findMany({
    where: {
      user: { approvalStatus: 'VERIFIED' }
    },
    include: {
      user: { select: { name: true, approvalStatus: true } }
    }
  });

  console.log(`Found ${doctors.length} verified doctor(s)\n`);

  for (const doctor of doctors) {
    if (doctor.approvalStatus !== 'VERIFIED') {
      console.log(`Fixing: ${doctor.user.name}`);
      console.log(`  Profile ID: ${doctor.id}`);
      console.log(`  Current approvalStatus: ${doctor.approvalStatus}`);

      await prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: { approvalStatus: 'VERIFIED' }
      });

      console.log(`  ✅ Updated to: VERIFIED\n`);
    } else {
      console.log(`Skipping: ${doctor.user.name} - already VERIFIED\n`);
    }
  }

  console.log('✅ All verified doctors now have approvalStatus = VERIFIED');
  console.log('Now test the search API - doctors should appear!');
}

main().finally(() => prisma.$disconnect());
