const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRoles() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Fixing Admin User Roles');
  console.log('══════════════════════════════════════════════════\n');

  const result = await prisma.user.updateMany({
    where: {
      email: {
        in: ['shubham27052002@gmail.com', 'sahilnaik1515@gmail.com'],
      },
    },
    data: {
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`✓ Updated ${result.count} users to SUPER_ADMIN role\n`);

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['shubham27052002@gmail.com', 'sahilnaik1515@gmail.com'],
      },
    },
    select: {
      email: true,
      name: true,
      role: true,
      approvalStatus: true,
      isActive: true,
    },
  });

  console.table(users);

  console.log('\n✅ Admin roles fixed! Try logging in now.\n');

  await prisma.$disconnect();
}

fixAdminRoles().catch(console.error);
