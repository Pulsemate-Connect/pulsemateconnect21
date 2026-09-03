/**
 * ⚠️ DEPRECATED - Use setup-admins.js instead
 * 
 * This script has been deprecated due to hardcoded credentials.
 * Use the secure setup-admins.js script which reads credentials from environment variables.
 * 
 * Run: node backend/setup-admins.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ⚠️ SECURITY: Credentials should NEVER be hardcoded
// Use environment variables instead
const admins = [
  {
    name: process.env.ADMIN_1_NAME || 'Admin User 1',
    email: process.env.ADMIN_1_EMAIL,
    mobile: process.env.ADMIN_1_MOBILE || '+919999999001',
    password: process.env.ADMIN_1_PASSWORD,
  },
  {
    name: process.env.ADMIN_2_NAME || 'Admin User 2',
    email: process.env.ADMIN_2_EMAIL,
    mobile: process.env.ADMIN_2_MOBILE || '+919999999002',
    password: process.env.ADMIN_2_PASSWORD,
  },
].filter(admin => admin.email && admin.password); // Only process admins with email and password set

async function createAdmins() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  ⚠️  DEPRECATED SCRIPT - Use setup-admins.js instead');
  console.log('════════════════════════════════════════════════════\n');
  
  if (admins.length === 0) {
    console.error('❌ No admin credentials found in environment variables.');
    console.error('\nRequired environment variables:');
    console.error('  - ADMIN_1_EMAIL');
    console.error('  - ADMIN_1_PASSWORD');
    console.error('  - ADMIN_2_EMAIL (optional)');
    console.error('  - ADMIN_2_PASSWORD (optional)\n');
    console.error('Please use the secure setup-admins.js script instead.\n');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('Creating Admin Accounts\n');

  for (const admin of admins) {
    try {
      // Generate bcrypt hash
      const passwordHash = await bcrypt.hash(admin.password, 10);
      
      console.log(`Creating: ${admin.email}`);
      
      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: admin.email },
        update: {
          passwordHash,
          name: admin.name,
          role: 'SUPER_ADMIN', // Ensure role is SUPER_ADMIN
          isActive: true,
          isEmailVerified: true,
          approvalStatus: 'VERIFIED',
          authProvider: 'EMAIL_PASSWORD',
        },
        create: {
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          passwordHash,
          role: 'SUPER_ADMIN', // Set role to SUPER_ADMIN
          authProvider: 'EMAIL_PASSWORD',
          approvalStatus: 'VERIFIED',
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: false,
        },
      });

      console.log(`  ✓ User created: ${user.id}`);

      // Create or update admin profile
      const adminProfile = await prisma.adminProfile.upsert({
        where: { userId: user.id },
        update: {
          level: 'SUPER_ADMIN',
        },
        create: {
          userId: user.id,
          level: 'SUPER_ADMIN',
          createdById: null, // Self-created
        },
      });

      console.log(`  ✓ Admin profile created: ${adminProfile.level}\n`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${admin.email}:`, error.message, '\n');
    }
  }

  console.log('════════════════════════════════════════════════════');
  console.log('  Verifying Admin Accounts');
  console.log('════════════════════════════════════════════════════\n');

  const result = await prisma.user.findMany({
    where: {
      email: {
        in: admins.map(a => a.email),
      },
    },
    include: {
      adminProfile: true,
    },
  });

  console.table(result.map(u => ({
    Email: u.email,
    Name: u.name,
    AdminLevel: u.adminProfile?.level || 'N/A',
    Active: u.isActive,
    Verified: u.approvalStatus,
  })));

  console.log('\n✅ Admin accounts ready!\n');
  console.log('Login at: https://pulsemateconnect.in/admin\n');
  
  await prisma.$disconnect();
}

createAdmins().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
