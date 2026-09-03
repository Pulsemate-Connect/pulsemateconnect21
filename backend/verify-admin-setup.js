/**
 * Verify Admin Setup Script
 * 
 * Checks that admin users are correctly configured in the database
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAdminSetup() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   PULSEMATE ADMIN SETUP VERIFICATION');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Check admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approvalStatus: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        adminProfile: {
          select: {
            level: true,
            createdAt: true
          }
        }
      }
    });

    if (adminUsers.length === 0) {
      console.log('❌ No SUPER_ADMIN users found in database!\n');
      console.log('Run the following to create admin users:');
      console.log('  node backend/setup-admins.js\n');
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin user(s)\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const admin of adminUsers) {
      console.log(`👤 Admin User: ${admin.name}`);
      console.log(`   Email:        ${admin.email}`);
      console.log(`   User ID:      ${admin.id}`);
      console.log(`   Role:         ${admin.role}`);
      console.log(`   Status:       ${admin.approvalStatus}`);
      console.log(`   Email Verif:  ${admin.isEmailVerified ? '✅' : '❌'}`);
      console.log(`   Phone Verif:  ${admin.isPhoneVerified ? '✅' : '❌'}`);
      console.log(`   Admin Level:  ${admin.adminProfile?.level || '❌ NOT SET'}`);
      console.log(`   Profile Created: ${admin.adminProfile?.createdAt ? admin.adminProfile.createdAt.toLocaleString() : 'N/A'}`);
      console.log(`   User Created:    ${admin.createdAt.toLocaleString()}`);
      
      // Validate configuration
      const issues = [];
      if (!admin.isEmailVerified) issues.push('Email not verified');
      if (admin.approvalStatus !== 'APPROVED') issues.push(`Status is ${admin.approvalStatus} instead of APPROVED`);
      if (!admin.adminProfile) issues.push('No admin profile');
      if (admin.adminProfile && !admin.adminProfile.level) issues.push('Admin level not set');
      
      if (issues.length > 0) {
        console.log(`   ⚠️  Issues:     ${issues.join(', ')}`);
      } else {
        console.log(`   ✅ Status:     All checks passed`);
      }
      
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check if any non-admin users with admin emails exist
    const adminEmails = adminUsers.map(u => u.email);
    const duplicateUsers = await prisma.user.findMany({
      where: {
        email: {
          in: adminEmails
        },
        role: {
          not: 'SUPER_ADMIN'
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (duplicateUsers.length > 0) {
      console.log('⚠️  WARNING: Found non-admin users with admin emails:\n');
      for (const dup of duplicateUsers) {
        console.log(`   ${dup.email} (${dup.role}) - ID: ${dup.id}`);
      }
      console.log('\nThis could cause login conflicts. Consider removing these accounts.\n');
    }

    // Test login credentials
    console.log('\n📋 TEST LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const admin of adminUsers) {
      console.log(`Email:    ${admin.email}`);
      console.log(`Password: Check backend/.env for ADMIN_${adminUsers.indexOf(admin) + 1}_PASSWORD`);
      console.log(`URL:      http://localhost:3000/admin`);
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    const allValid = adminUsers.every(admin => 
      admin.isEmailVerified && 
      admin.approvalStatus === 'APPROVED' && 
      admin.adminProfile?.level
    );

    if (allValid) {
      console.log('✅ ALL ADMIN USERS ARE CORRECTLY CONFIGURED');
      console.log('\nYou can now:');
      console.log('1. Clear browser localStorage');
      console.log('2. Navigate to http://localhost:3000/admin');
      console.log('3. Login with admin credentials');
      console.log('4. Access admin dashboard\n');
    } else {
      console.log('⚠️  SOME ADMIN USERS HAVE ISSUES');
      console.log('\nRun the following to fix:');
      console.log('  node backend/setup-admins.js      # Reset passwords');
      console.log('  node backend/fix-admin-level.js   # Set admin levels\n');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyAdminSetup();
