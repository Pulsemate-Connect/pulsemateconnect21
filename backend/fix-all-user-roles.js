/**
 * Fix All User Roles
 * 
 * Updates roles array and primaryRole to match the role field for ALL users
 * This fixes JWT token generation issues where users have mismatched roles
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllUserRoles() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   FIX ALL USER ROLES');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Find all users where roles array doesn't match role field
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        roles: true,
        primaryRole: true
      }
    });

    console.log(`Found ${allUsers.length} total users\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const user of allUsers) {
      // Check if fix is needed
      const needsFix = 
        !user.roles.includes(user.role) || 
        user.primaryRole !== user.role;

      if (!needsFix) {
        alreadyCorrectCount++;
        continue;
      }

      console.log(`\n👤 ${user.name || 'Unnamed'} (${user.email || user.mobile})`);
      console.log('   Current state:');
      console.log('   - role:', user.role);
      console.log('   - roles:', JSON.stringify(user.roles));
      console.log('   - primaryRole:', user.primaryRole);

      // Fix the user record
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: [user.role],
          primaryRole: user.role
        }
      });

      console.log('   ✅ FIXED:');
      console.log('   - roles:', JSON.stringify(updated.roles));
      console.log('   - primaryRole:', updated.primaryRole);
      
      fixedCount++;
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ User roles fix complete');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Already correct: ${alreadyCorrectCount}\n`);

    if (fixedCount > 0) {
      console.log('⚠️  IMPORTANT: Users with fixed roles must:');
      console.log('1. Log out (or clear browser localStorage)');
      console.log('2. Log in again');
      console.log('3. They will receive new JWT with correct roles');
      console.log('4. Role-based access will work correctly\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllUserRoles();
