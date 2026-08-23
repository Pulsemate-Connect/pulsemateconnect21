/**
 * Set primary role for a user
 * Usage: node scripts/set-primary-role.js <userId> <newPrimaryRole>
 * Example: node scripts/set-primary-role.js b8b7cf17-ba45-4594-baab-6cde6cfa1492 SUPER_ADMIN
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setPrimaryRole() {
  try {
    const userId = process.argv[2];
    const newPrimaryRole = process.argv[3];

    if (!userId || !newPrimaryRole) {
      console.error('❌ Usage: node scripts/set-primary-role.js <userId> <newPrimaryRole>');
      console.error('   Example: node scripts/set-primary-role.js abc-123 SUPER_ADMIN');
      process.exit(1);
    }

    console.log(`🔍 Finding user ${userId}...`);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.mobile}`);
    console.log(`   Current roles: ${JSON.stringify(user.roles)}`);
    console.log(`   Current primary role: ${user.primaryRole}`);
    console.log(`   Legacy role field: ${user.role}`);

    // Check if user has the new primary role
    const userRoles = user.roles || [user.role];
    if (!userRoles.includes(newPrimaryRole)) {
      console.error(`❌ User does not have ${newPrimaryRole} role`);
      console.error(`   User roles: ${JSON.stringify(userRoles)}`);
      console.error(`\n💡 First add the role using: node scripts/add-clinic-owner-role-to-super-admin.js`);
      process.exit(1);
    }

    if (user.primaryRole === newPrimaryRole) {
      console.log(`⚠️  Primary role is already ${newPrimaryRole}`);
      console.log('   No changes needed');
      return;
    }

    // Update primary role
    console.log(`\n📝 Updating primary role to ${newPrimaryRole}...`);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        primaryRole: newPrimaryRole,
        // Also update legacy role field for backward compatibility
        role: newPrimaryRole,
      },
    });

    console.log('✅ Primary role updated successfully');
    console.log(`   Old primary role: ${user.primaryRole}`);
    console.log(`   New primary role: ${updated.primaryRole}`);
    console.log(`   Legacy role field: ${updated.role}`);

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Primary role updated!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`User ${user.name || user.mobile} will now login as ${newPrimaryRole} by default`);
    console.log('');
    console.log('⚠️  IMPORTANT: User must logout and login again for this to take effect!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. User logs out');
    console.log('  2. User logs in again');
    console.log(`  3. JWT will have activeRole: ${newPrimaryRole}`);
    console.log('  4. User can access admin dashboard');
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setPrimaryRole();
