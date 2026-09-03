/**
 * Check Admin Accounts Script
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmins() {
  console.log('\n🔍 Checking Admin Accounts...\n');

  try {
    // Find all admin users
    const admins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        role: true,
        roles: true,
        primaryRole: true,
        approvalStatus: true,
        isActive: true,
        passwordHash: true,
        adminProfile: {
          select: {
            level: true
          }
        }
      }
    });

    if (admins.length === 0) {
      console.log('❌ No admin accounts found!');
      console.log('\nYou need to create an admin account first.');
      return;
    }

    console.log(`Found ${admins.length} admin account(s):\n`);

    for (const admin of admins) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Email: ${admin.email || 'N/A'}`);
      console.log(`Mobile: ${admin.mobile || 'N/A'}`);
      console.log(`Name: ${admin.name || 'N/A'}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Roles Array: [${admin.roles?.join(', ') || 'none'}]`);
      console.log(`Primary Role: ${admin.primaryRole || 'N/A'}`);
      console.log(`Admin Level: ${admin.adminProfile?.level || 'N/A'}`);
      console.log(`Status: ${admin.approvalStatus}`);
      console.log(`Active: ${admin.isActive ? 'Yes' : 'No'}`);
      console.log(`Has Password: ${admin.passwordHash ? 'Yes' : 'No'}`);
      console.log('');
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
