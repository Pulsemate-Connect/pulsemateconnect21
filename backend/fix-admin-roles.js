/**
 * Fix Admin User Roles
 * 
 * Updates the roles array and primaryRole to match the role field for admin users
 * This fixes the JWT token generation issue where admins have SUPER_ADMIN role
 * but roles array still contains old PATIENT role
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRoles() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   FIX ADMIN USER ROLES');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Find all SUPER_ADMIN users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      include: { adminProfile: true }
    });

    if (adminUsers.length === 0) {
      console.log('❌ No SUPER_ADMIN users found\n');
      return;
    }

    console.log(`Found ${adminUsers.length} admin user(s)\n`);

    for (const admin of adminUsers) {
      console.log(`\n👤 ${admin.name} (${admin.email})`);
      console.log('   Current state:');
      console.log('   - role:', admin.role);
      console.log('   - roles:', JSON.stringify(admin.roles));
      console.log('   - primaryRole:', admin.primaryRole);
      console.log('   - Admin Level:', admin.adminProfile?.level || 'NONE');

      // Check if fix is needed
      const needsFix = 
        admin.role === 'SUPER_ADMIN' && 
        (admin.primaryRole !== 'SUPER_ADMIN' || 
         !admin.roles.includes('SUPER_ADMIN'));

      if (!needsFix) {
        console.log('   ✅ Already correct - no fix needed');
        continue;
      }

      // Fix the user record
      const updated = await prisma.user.update({
        where: { id: admin.id },
        data: {
          roles: ['SUPER_ADMIN'],
          primaryRole: 'SUPER_ADMIN'
        }
      });

      console.log('   ✅ FIXED:');
      console.log('   - roles:', JSON.stringify(updated.roles));
      console.log('   - primaryRole:', updated.primaryRole);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Admin roles fixed successfully');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('1. Admin users must log out');
    console.log('2. Clear browser localStorage');
    console.log('3. Log in again to get new JWT with correct roles');
    console.log('4. Dashboard should now work\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRoles();
