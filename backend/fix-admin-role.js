/**
 * Fix Admin Role
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRole() {
  try {
    console.log('Fixing admin role...\n');
    
    const admin = await prisma.user.update({
      where: { email: 'sahilnaik1515@gmail.com' },
      data: { role: 'SUPER_ADMIN' },
      include: { adminProfile: true }
    });

    console.log('✅ Admin role updated successfully!');
    console.log('  Email:', admin.email);
    console.log('  Role:', admin.role);
    console.log('  Admin Level:', admin.adminProfile?.level);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRole();
