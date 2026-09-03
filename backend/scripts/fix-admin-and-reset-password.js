/**
 * Fix Admin Roles and Reset Password
 */

const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/hash');
const prisma = new PrismaClient();

async function fixAdminAndResetPassword() {
  console.log('\n🔧 Fixing Admin Accounts...\n');

  try {
    const email = 'shubham27052002@gmail.com';
    const newPassword = 'Shubham27#';

    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roles: true,
        primaryRole: true,
      }
    });

    if (!admin) {
      console.log(`❌ Admin not found: ${email}`);
      return;
    }

    console.log(`Found admin: ${admin.name} (${admin.email})`);
    console.log(`Current roles: [${admin.roles?.join(', ') || 'none'}]`);
    console.log(`Current primaryRole: ${admin.primaryRole}`);
    console.log('');

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update admin: fix roles and reset password
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        roles: ['SUPER_ADMIN'], // ✅ Fix roles array
        primaryRole: 'SUPER_ADMIN', // ✅ Fix primaryRole
        passwordHash: passwordHash, // ✅ Reset password
        isActive: true,
        approvalStatus: 'VERIFIED',
      }
    });

    console.log('✅ Admin account fixed!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Also fix the other admin
    const otherAdmin = await prisma.user.findUnique({
      where: { email: 'sahilnaik1515@gmail.com' }
    });

    if (otherAdmin) {
      await prisma.user.update({
        where: { id: otherAdmin.id },
        data: {
          roles: ['SUPER_ADMIN'],
          primaryRole: 'SUPER_ADMIN',
        }
      });
      console.log('✅ Also fixed other admin account (sahilnaik1515@gmail.com)');
    }

    // Ensure RoleApprovalStatus exists for both
    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' }
    });

    for (const adm of admins) {
      const allApprovals = await prisma.roleApprovalStatus.findMany({
        where: { userId: adm.id }
      });

      const hasSuper = allApprovals.some(a => a.role === 'SUPER_ADMIN');

      if (!hasSuper) {
        await prisma.roleApprovalStatus.create({
          data: {
            userId: adm.id,
            role: 'SUPER_ADMIN',
            approvalStatus: 'VERIFIED',
            requestedAt: new Date(),
            approvedAt: new Date(),
          }
        });
        console.log(`✅ Created RoleApprovalStatus for ${adm.email}`);
      }
    }

    console.log('\n✅ All admin accounts fixed!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminAndResetPassword();
