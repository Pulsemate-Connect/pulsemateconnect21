require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRoles() {
  console.log('\n🔧 Fixing Admin User Roles');
  console.log('═══════════════════════════════════════\n');

  try {
    // Find all users with admin profiles
    const admins = await prisma.user.findMany({
      where: {
        adminProfile: {
          isNot: null
        }
      },
      include: {
        adminProfile: true
      }
    });

    console.log(`Found ${admins.length} users with admin profiles\n`);

    for (const admin of admins) {
      console.log(`→ ${admin.email}`);
      console.log(`  Current role: ${admin.role}`);
      console.log(`  Admin level: ${admin.adminProfile.level}`);
      console.log(`  Current roles array: ${JSON.stringify(admin.roles)}`);

      // Update role to SUPER_ADMIN and add to roles array
      const updated = await prisma.user.update({
        where: { id: admin.id },
        data: {
          role: 'SUPER_ADMIN',
          primaryRole: 'SUPER_ADMIN',
          roles: {
            set: ['SUPER_ADMIN']
          }
        }
      });

      console.log(`  ✅ Updated role to: ${updated.role}`);
      console.log(`  ✅ Updated roles array to: ${JSON.stringify(updated.roles)}\n`);
    }

    console.log('✅ All admin roles fixed!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRoles();
