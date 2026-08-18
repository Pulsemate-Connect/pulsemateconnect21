/**
 * Create Root Admin Account
 * Run: node create-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createRootAdmin() {
  try {
    console.log('🔧 Creating root admin account...\n');

    const email = process.env.ROOT_ADMIN_EMAIL || 'admin@pulsemateconnect.in';
    const password = process.env.ROOT_ADMIN_PASSWORD || 'Admin@123!';
    const name = process.env.ROOT_ADMIN_NAME || 'Root Admin';
    const mobile = process.env.ROOT_ADMIN_MOBILE || '+919000000001';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log('❌ Admin already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('');
      console.log('To reset password, run: node reset-admin-password.js');
      await prisma.$disconnect();
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user with profile
    console.log('👤 Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        name,
        mobile,
        email,
        role: 'SUPER_ADMIN',
        approvalStatus: 'VERIFIED',
        passwordHash,
        isActive: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        adminProfile: {
          create: {
            level: 'ROOT'
          }
        }
      },
      include: {
        adminProfile: true
      }
    });

    console.log('');
    console.log('✅ Root admin created successfully!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('👤 Name:', admin.name);
    console.log('📧 Email:', admin.email);
    console.log('📱 Mobile:', admin.mobile);
    console.log('🔑 Password:', password);
    console.log('🎖️  Level:', admin.adminProfile.level);
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🌐 Login at: http://localhost:3000/admin');
    console.log('');
    console.log('⚠️  Save these credentials in a secure place!');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('- Database not running');
    console.error('- Email already exists (check users table)');
    console.error('- Database connection error (check .env DATABASE_URL)');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createRootAdmin();
