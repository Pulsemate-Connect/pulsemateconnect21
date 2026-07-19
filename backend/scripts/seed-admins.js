/**
 * seed-admins.js
 * Creates two SUPER_ADMIN accounts in the database.
 * Run: node scripts/seed-admins.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMINS = [
  {
    email: 'sahilnaik1515@gmail.com',
    password: 'Nkabu18$',
    name: 'Sahil Naik',
    level: 'SUPER_ADMIN',
  },
  {
    email: 'shubham27052002@gmail.com',
    password: 'Shubham27*',
    name: 'Shubham',
    level: 'ROOT',
  },
];

async function main() {
  for (const admin of ADMINS) {
    const passwordHash = await bcrypt.hash(admin.password, 12);

    // Upsert user — won't duplicate if run again
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        approvalStatus: 'VERIFIED',
        authProvider: 'EMAIL_PASSWORD',
        isEmailVerified: true,
      },
      create: {
        email: admin.email,
        mobile: `admin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, // unique placeholder
        name: admin.name,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        approvalStatus: 'VERIFIED',
        authProvider: 'EMAIL_PASSWORD',
        isEmailVerified: true,
      },
    });

    // Upsert admin profile
    await prisma.adminProfile.upsert({
      where: { userId: user.id },
      update: { level: admin.level },
      create: {
        userId: user.id,
        level: admin.level,
      },
    });

    console.log(`✅ Admin created/updated: ${admin.email} (${admin.level})`);
  }

  console.log('\n🎉 All admin accounts are ready.');
  console.log('Login at: POST /api/auth/login');
  console.log('Body: { "identifier": "<email>", "password": "<password>" }');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
