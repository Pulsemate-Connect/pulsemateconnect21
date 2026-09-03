#!/usr/bin/env node
/**
 * Create Two Admin Users for PulseMate Connect
 * 
 * Admin 1: shubham27052002@gmail.com / Shubham27*
 * Admin 2: sahilnaik1515@gmail.com / Nkabu18$
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmins() {
  console.log('🔐 Creating admin users...\n');

  const admins = [
    {
      name: 'Shubham',
      email: 'shubham27052002@gmail.com',
      mobile: '9999999001', // Placeholder mobile
      password: 'Shubham27*',
      level: 'SUPER_ADMIN',
    },
    {
      name: 'Sahil Naik',
      email: 'sahilnaik1515@gmail.com',
      mobile: '9999999002', // Placeholder mobile
      password: 'Nkabu18$',
      level: 'SUPER_ADMIN',
    },
  ];

  try {
    for (const admin of admins) {
      console.log(`\n📧 Creating admin: ${admin.email}`);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: admin.email },
        include: { adminProfile: true },
      });

      if (existingUser) {
        if (existingUser.adminProfile) {
          console.log(`   ⚠️  Admin already exists - updating password`);
          
          // Update password
          const passwordHash = await bcrypt.hash(admin.password, 12);
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { 
              passwordHash,
              isActive: true,
              approvalStatus: 'VERIFIED',
            },
          });

          // Update admin level if needed
          await prisma.adminProfile.update({
            where: { userId: existingUser.id },
            data: { level: admin.level },
          });

          console.log(`   ✅ Password updated for ${admin.email}`);
        } else {
          console.log(`   ⚠️  User exists but not admin - converting to admin`);
          
          // Update password
          const passwordHash = await bcrypt.hash(admin.password, 12);
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { 
              passwordHash,
              role: 'SUPER_ADMIN',
              roles: ['SUPER_ADMIN'],
              primaryRole: 'SUPER_ADMIN',
              isActive: true,
              approvalStatus: 'VERIFIED',
            },
          });

          // Create admin profile
          await prisma.adminProfile.create({
            data: {
              userId: existingUser.id,
              level: admin.level,
            },
          });

          console.log(`   ✅ Converted to admin: ${admin.email}`);
        }
      } else {
        console.log(`   🆕 Creating new admin user`);

        // Hash password
        const passwordHash = await bcrypt.hash(admin.password, 12);

        // Create user with admin profile
        const newUser = await prisma.user.create({
          data: {
            name: admin.name,
            email: admin.email,
            mobile: admin.mobile,
            passwordHash,
            role: 'SUPER_ADMIN',
            roles: ['SUPER_ADMIN'],
            primaryRole: 'SUPER_ADMIN',
            isActive: true,
            approvalStatus: 'VERIFIED',
            isEmailVerified: true,
            isPhoneVerified: true,
            authProvider: 'EMAIL_PASSWORD',
            adminProfile: {
              create: {
                level: admin.level,
              },
            },
          },
          include: {
            adminProfile: true,
          },
        });

        console.log(`   ✅ Created admin: ${admin.email}`);
        console.log(`   📝 User ID: ${newUser.id}`);
      }
    }

    console.log('\n✅ All admin users created successfully!\n');
    console.log('📋 Admin Credentials:\n');
    console.log('   Admin 1:');
    console.log(`   📧 Email: shubham27052002@gmail.com`);
    console.log(`   🔑 Password: Shubham27*`);
    console.log(`   🔒 Level: SUPER_ADMIN\n`);
    console.log('   Admin 2:');
    console.log(`   📧 Email: sahilnaik1515@gmail.com`);
    console.log(`   🔑 Password: Nkabu18$`);
    console.log(`   🔒 Level: SUPER_ADMIN\n`);
    console.log('🌐 Login at: https://pulsemateconnect.in/admin\n');

  } catch (error) {
    console.error('❌ Error creating admins:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmins()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
