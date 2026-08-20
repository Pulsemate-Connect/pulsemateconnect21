/**
 * Reset Admin Password
 * Run: node reset-admin-password.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password...\n');

    const email = process.env.ROOT_ADMIN_EMAIL || 'admin@pulsemateconnect.in';
    const newPassword = process.env.ROOT_ADMIN_PASSWORD || 'Admin@123!';

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email },
      include: { adminProfile: true }
    });

    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      console.log('');
      console.log('To create a new admin, run: node create-admin.js');
      await prisma.$disconnect();
      return;
    }

    // Hash new password
    console.log('🔐 Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    console.log('💾 Updating password in database...');
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    console.log('');
    console.log('✅ Admin password reset successfully!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('👤 Name:', admin.name);
    console.log('📧 Email:', admin.email);
    console.log('🔑 New Password:', newPassword);
    console.log('🎖️  Level:', admin.adminProfile?.level || 'N/A');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🌐 Login at: http://localhost:3000/admin');
    console.log('');

  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('- Database not running');
    console.error('- Invalid email address');
    console.error('- Database connection error (check .env DATABASE_URL)');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
resetAdminPassword();
