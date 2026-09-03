#!/usr/bin/env node
/**
 * Fix Sahil's Admin Role Settings
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSahilAdmin() {
  console.log('🔧 Fixing Sahil admin account...\n');

  try {
    const user = await prisma.user.update({
      where: { email: 'sahilnaik1515@gmail.com' },
      data: {
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN'],
        primaryRole: 'SUPER_ADMIN',
        isActive: true,
        approvalStatus: 'VERIFIED',
      },
      include: { adminProfile: true },
    });

    console.log('✅ Fixed Sahil admin account');
    console.log(`   📝 User ID: ${user.id}`);
    console.log(`   🎭 Role: ${user.role}`);
    console.log(`   🎭 Roles Array: ${user.roles.join(', ')}`);
    console.log(`   🎯 Primary Role: ${user.primaryRole}`);
    console.log(`   🛡️  Admin Level: ${user.adminProfile.level}\n`);

  } catch (error) {
    console.error('❌ Error fixing admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixSahilAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
