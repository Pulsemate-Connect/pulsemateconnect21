/**
 * check-admin.js
 * Quick script to verify admin accounts exist and their details
 * Run: node scripts/check-admin.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN',
    },
    include: {
      adminProfile: true,
    },
  });

  if (admins.length === 0) {
    console.log('❌ No SUPER_ADMIN accounts found!');
    return;
  }

  console.log(`\n✅ Found ${admins.length} SUPER_ADMIN account(s):\n`);
  
  for (const admin of admins) {
    console.log('─────────────────────────────────────────');
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Admin Level: ${admin.adminProfile?.level || 'N/A'}`);
    console.log(`Status: ${admin.approvalStatus}`);
    console.log(`Active: ${admin.isActive}`);
    console.log(`Email Verified: ${admin.isEmailVerified}`);
    console.log(`Phone Verified: ${admin.isPhoneVerified}`);
    console.log(`Has Password: ${admin.passwordHash ? 'YES' : 'NO'}`);
    console.log(`Auth Provider: ${admin.authProvider}`);
    console.log(`Created At: ${admin.createdAt}`);
    console.log(`Last Login: ${admin.lastLoginAt || 'Never'}`);
  }
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
