/**
 * Check All Admin Accounts
 * Run: node check-admins.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmins() {
  try {
    console.log('🔍 Checking admin accounts...\n');

    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      include: { adminProfile: true },
      orderBy: { createdAt: 'asc' }
    });

    if (admins.length === 0) {
      console.log('❌ No admin accounts found!');
      console.log('');
      console.log('To create a root admin, run: node create-admin.js');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Found ${admins.length} admin account(s):\n`);
    console.log('═══════════════════════════════════════════════════════════════');

    admins.forEach((admin, index) => {
      console.log('');
      console.log(`${index + 1}. ${admin.name || 'Unnamed Admin'}`);
      console.log('   ─────────────────────────────────────────');
      console.log('   📧 Email:', admin.email);
      console.log('   📱 Mobile:', admin.mobile);
      console.log('   🎖️  Level:', admin.adminProfile?.level || 'No Profile');
      console.log('   ✅ Active:', admin.isActive ? 'Yes' : 'No');
      console.log('   ✅ Verified:', admin.approvalStatus);
      console.log('   📅 Created:', admin.createdAt.toLocaleDateString());
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('🌐 Admin Login: http://localhost:3000/admin');
    console.log('');
    console.log('Commands:');
    console.log('  • Create admin: node create-admin.js');
    console.log('  • Reset password: node reset-admin-password.js');
    console.log('  • View database: npx prisma studio');
    console.log('');

  } catch (error) {
    console.error('❌ Error checking admins:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('- Database not running');
    console.error('- Database connection error (check .env DATABASE_URL)');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkAdmins();
