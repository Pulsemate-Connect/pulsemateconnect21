const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminLevel() {
  console.log('='.repeat(80));
  console.log('FIXING ADMIN LEVEL');
  console.log('='.repeat(80));
  
  const email = 'shubham27052002@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      adminProfile: true,
    },
  });

  if (!user) {
    console.log('❌ User not found:', email);
    await prisma.$disconnect();
    return;
  }

  console.log('\nBefore Fix:');
  console.log('  Email:', user.email);
  console.log('  Role:', user.role);
  console.log('  Has Admin Profile:', user.adminProfile ? 'YES' : 'NO');
  
  if (user.adminProfile) {
    console.log('  Admin Level:', user.adminProfile.level || 'NULL');
  }

  // Update admin profile
  await prisma.adminProfile.update({
    where: { userId: user.id },
    data: {
      level: 'ROOT',
    },
  });

  console.log('\n✅ Admin level updated to ROOT');

  // Verify
  const updated = await prisma.user.findUnique({
    where: { email },
    include: {
      adminProfile: true,
    },
  });

  console.log('\nAfter Fix:');
  console.log('  Email:', updated.email);
  console.log('  Role:', updated.role);
  console.log('  Admin Level:', updated.adminProfile.level);
  console.log('\n✅ Fix complete. Please logout and login again.');

  await prisma.$disconnect();
}

fixAdminLevel().catch(console.error);
