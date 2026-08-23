/**
 * Setup admin accounts with specific credentials
 * Creates or updates admin users with email/password login
 */

const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/hash');
const prisma = new PrismaClient();

const ADMIN_ACCOUNTS = [
  {
    email: 'shubham27052002@gmail.com',
    password: 'Shubham27*',
    name: 'Shubham',
    mobile: '+919876543210', // Placeholder
  },
  {
    email: 'sahilnaik1515@gmail.com',
    password: 'Nkabu18$',
    name: 'Sahil Naik',
    mobile: '+917022818878', // Existing user
  },
];

async function setupAdminAccounts() {
  try {
    console.log('🔧 Setting up admin accounts...\n');

    for (const account of ADMIN_ACCOUNTS) {
      console.log(`📝 Processing: ${account.email}`);

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: account.email },
        include: {
          roleApprovals: true,
          adminProfile: true,
        },
      });

      // Hash password
      const passwordHash = await hashPassword(account.password);

      if (user) {
        console.log(`   ✅ User exists (ID: ${user.id})`);
        
        // Update user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            role: 'SUPER_ADMIN',
            roles: ['SUPER_ADMIN'],
            primaryRole: 'SUPER_ADMIN',
            approvalStatus: 'VERIFIED',
            isActive: true,
            isEmailVerified: true,
          },
          include: {
            roleApprovals: true,
            adminProfile: true,
          },
        });

        console.log(`   ✅ Updated: role set to SUPER_ADMIN, password updated`);
      } else {
        console.log(`   📝 Creating new user...`);
        
        // Create new user
        user = await prisma.user.create({
          data: {
            email: account.email,
            mobile: account.mobile,
            name: account.name,
            passwordHash,
            role: 'SUPER_ADMIN',
            roles: ['SUPER_ADMIN'],
            primaryRole: 'SUPER_ADMIN',
            approvalStatus: 'VERIFIED',
            isActive: true,
            isEmailVerified: true,
            isPhoneVerified: false,
          },
        });

        console.log(`   ✅ Created user (ID: ${user.id})`);
      }

      // Ensure admin profile exists
      if (!user.adminProfile) {
        console.log(`   📝 Creating admin profile...`);
        await prisma.adminProfile.create({
          data: {
            userId: user.id,
            level: 'ROOT',
          },
        });
        console.log(`   ✅ Admin profile created (level: ROOT)`);
      } else {
        console.log(`   ✅ Admin profile exists (level: ${user.adminProfile.level})`);
      }

      // Ensure role approval exists
      const hasApproval = user.roleApprovals?.find(a => a.role === 'SUPER_ADMIN');

      if (!hasApproval) {
        console.log(`   📝 Creating role approval...`);
        await prisma.roleApprovalStatus.create({
          data: {
            userId: user.id,
            role: 'SUPER_ADMIN',
            approvalStatus: 'VERIFIED',
            requestedAt: new Date(),
            approvedAt: new Date(),
            notes: 'Auto-approved for super admin',
          },
        });
        console.log(`   ✅ Role approval created`);
      } else {
        console.log(`   ✅ Role approval exists (${hasApproval.approvalStatus})`);
      }

      console.log(`   ✅ Complete!\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL ADMIN ACCOUNTS SETUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Admin Accounts:');
    console.log('');
    console.log('1. Email: shubham27052002@gmail.com');
    console.log('   Password: Shubham27*');
    console.log('   Role: SUPER_ADMIN');
    console.log('   Level: ROOT');
    console.log('');
    console.log('2. Email: sahilnaik1515@gmail.com');
    console.log('   Password: Nkabu18$');
    console.log('   Role: SUPER_ADMIN');
    console.log('   Level: ROOT');
    console.log('');
    console.log('🎯 You can now login with either account!');
    console.log('');
    console.log('Login URL: http://localhost:3000/admin');
    console.log('');
    console.log('⚠️  Keep these credentials secure!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminAccounts();
