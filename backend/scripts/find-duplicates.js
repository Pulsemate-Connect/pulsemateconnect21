/**
 * find-duplicates.js
 * Find all users with mobile 9876543210
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Finding all users with mobile 9876543210...\n');

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { mobile: '9876543210' },
        { mobile: '+919876543210' },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      approvalStatus: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Found ${users.length} user(s):\n`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Mobile: ${user.mobile}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.approvalStatus}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log('');
  });

  // Now delete the SUPER_ADMIN one if there are duplicates
  if (users.length > 1) {
    const superAdmin = users.find((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
    if (superAdmin) {
      console.log(`\n🗑️  Deleting duplicate SUPER_ADMIN user: ${superAdmin.email}`);
      
      // First delete related records
      await prisma.adminProfile.deleteMany({
        where: { userId: superAdmin.id },
      });
      
      // Then delete the user
      await prisma.user.delete({
        where: { id: superAdmin.id },
      });
      
      console.log(`✅ Deleted ${superAdmin.email}`);
    }
  }

  console.log('\n✅ Done!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
