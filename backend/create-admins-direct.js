/**
 * Create Admin Accounts Directly in Database
 * Run: node create-admins-direct.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const admins = [
  {
    name: 'Shubham',
    email: 'shubham27052002@gmail.com',
    mobile: '+919999999001',
    password: 'Shubham27*',
  },
  {
    name: 'Sahil Naik',
    email: 'sahilnaik1515@gmail.com',
    mobile: '+919999999002',
    password: 'Nkabu18$',
  },
];

async function createAdmins() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  Creating Admin Accounts');
  console.log('════════════════════════════════════════════════════\n');

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
          role: 'PATIENT', // Base role (AdminProfile defines actual admin level)
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
