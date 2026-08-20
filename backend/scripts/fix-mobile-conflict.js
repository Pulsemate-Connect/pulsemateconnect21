/**
 * fix-mobile-conflict.js
 * Fixes the mobile number conflict between SUPER_ADMIN and CLINIC_OWNER
 * - Changes SUPER_ADMIN mobile from 9876543210 to null
 * - Ensures rajesh.clinic@test.com has mobile 9876543210 and role CLINIC_OWNER
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 Fixing mobile number conflict...\n');

  // 1. Find all users with mobile 9876543210
  const conflictingUsers = await prisma.user.findMany({
    where: { mobile: '9876543210' },
    select: { id: true, email: true, role: true, name: true },
  });

  console.log(`Found ${conflictingUsers.length} user(s) with mobile 9876543210:`);
  conflictingUsers.forEach((u) => {
    console.log(`  - ${u.email} (${u.role}) - ${u.name}`);
  });

  // 2. Update SUPER_ADMIN users to have null mobile
  for (const user of conflictingUsers) {
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      console.log(`\n📝 Updating ${user.email} (${user.role}) - removing mobile...`);
      await prisma.user.update({
        where: { id: user.id },
        data: { mobile: null },
      });
      console.log(`✅ Mobile removed from ${user.email}`);
    }
  }

  // 3. Ensure clinic owner account exists with correct data
  console.log('\n📝 Creating/updating clinic owner account...');
  
  const ownerPassword = await bcrypt.hash('Clinic@123', 12);
  
  const owner = await prisma.user.upsert({
    where: { email: 'rajesh.clinic@test.com' },
    update: {
      mobile: '9876543210',
      name: 'Dr. Rajesh Kumar',
      passwordHash: ownerPassword,
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      authProvider: 'EMAIL_PASSWORD',
    },
    create: {
      email: 'rajesh.clinic@test.com',
      mobile: '9876543210',
      name: 'Dr. Rajesh Kumar',
      passwordHash: ownerPassword,
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      authProvider: 'EMAIL_PASSWORD',
    },
  });

  console.log(`✅ Clinic owner account ready: ${owner.email}`);
  console.log(`   Mobile: ${owner.mobile}`);
  console.log(`   Role: ${owner.role}`);

  // 4. Verify the fix
  console.log('\n🔍 Verifying fix...');
  const checkUser = await prisma.user.findUnique({
    where: { mobile: '9876543210' },
    select: { id: true, email: true, role: true, name: true },
  });

  if (checkUser && checkUser.role === 'CLINIC_OWNER') {
    console.log('✅ SUCCESS! Mobile 9876543210 is now assigned to CLINIC_OWNER');
    console.log(`   Email: ${checkUser.email}`);
    console.log(`   Name: ${checkUser.name}`);
  } else {
    console.log('❌ FAILED! Mobile still has wrong role:', checkUser);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎉 FIX COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n📋 CLINIC OWNER LOGIN:');
  console.log('   Email: rajesh.clinic@test.com');
  console.log('   Mobile: 9876543210');
  console.log('   Password: Clinic@123');
  console.log('   OTP: 123456');
  console.log('   Login at: /clinic-partner or /portal');
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
