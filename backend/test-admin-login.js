#!/usr/bin/env node
/**
 * Test Admin Login - Verify credentials work
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin(email, password) {
  console.log(`\n🔐 Testing login for: ${email}`);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { adminProfile: true },
    });

    if (!user) {
      console.log(`   ❌ User not found`);
      return false;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log(`   ❌ Invalid password`);
      return false;
    }

    // Check admin profile
    if (!user.adminProfile) {
      console.log(`   ❌ No admin profile found`);
      return false;
    }

    // Check if active
    if (!user.isActive) {
      console.log(`   ❌ Account is inactive`);
      return false;
    }

    // All checks passed
    console.log(`   ✅ Login successful!`);
    console.log(`   👤 Name: ${user.name}`);
    console.log(`   🛡️  Admin Level: ${user.adminProfile.level}`);
    console.log(`   🎭 Role: ${user.role}`);
    return true;

  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
}

async function testAllAdmins() {
  console.log('🧪 Testing Admin Logins\n');
  console.log('=' .repeat(60));

  const admins = [
    { email: 'shubham27052002@gmail.com', password: 'Shubham27*' },
    { email: 'sahilnaik1515@gmail.com', password: 'Nkabu18$' },
  ];

  let allPassed = true;

  for (const admin of admins) {
    const result = await testLogin(admin.email, admin.password);
    if (!result) allPassed = false;
  }

  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('\n✅ All admin logins working correctly!');
    console.log('🌐 Ready to login at: https://pulsemateconnect.in/admin\n');
  } else {
    console.log('\n❌ Some logins failed - check errors above\n');
  }

  await prisma.$disconnect();
  return allPassed;
}

testAllAdmins()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
