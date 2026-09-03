#!/usr/bin/env node
/**
 * Verify Admin Users
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAdmins() {
  console.log('🔍 Verifying admin users...\n');

  const adminEmails = [
    'shubham27052002@gmail.com',
    'sahilnaik1515@gmail.com',
  ];

  try {
    for (const email of adminEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { 
          adminProfile: true,
        },
      });

      if (!user) {
        console.log(`❌ Admin NOT FOUND: ${email}\n`);
        continue;
      }

      console.log(`✅ Admin Found: ${email}`);
      console.log(`   📝 User ID: ${user.id}`);
      console.log(`   👤 Name: ${user.name}`);
      console.log(`   📞 Mobile: ${user.mobile}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   🎭 Roles Array: ${user.roles.join(', ')}`);
      console.log(`   🎯 Primary Role: ${user.primaryRole}`);
      console.log(`   ✓ Active: ${user.isActive}`);
      console.log(`   ✓ Approval: ${user.approvalStatus}`);
      console.log(`   ✓ Email Verified: ${user.isEmailVerified}`);
      console.log(`   🔐 Has Password: ${!!user.passwordHash}`);
      
      if (user.adminProfile) {
        console.log(`   🛡️  Admin Level: ${user.adminProfile.level}`);
        console.log(`   📅 Admin Created: ${user.adminProfile.createdAt.toISOString()}`);
      } else {
        console.log(`   ❌ NO ADMIN PROFILE!`);
      }
      console.log('');
    }

    // Count total admins
    const adminCount = await prisma.adminProfile.count();
    console.log(`📊 Total Admins in Database: ${adminCount}\n`);

  } catch (error) {
    console.error('❌ Error verifying admins:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmins()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
