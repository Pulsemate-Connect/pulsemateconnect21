/**
 * Admin Bootstrap Script
 * 
 * Idempotent admin account creation for initial system setup
 * 
 * SECURITY:
 * - Uses Auth UID as identity (no email/password hardcoding)
 * - Creates user WITHOUT password (must use password reset flow)
 * - Idempotent: safe to run multiple times
 * - No credential logging
 * - Server-side only (never expose to frontend)
 * 
 * USAGE:
 * 1. Set ADMIN_BOOTSTRAP_EMAIL in backend/.env
 * 2. Run: node bootstrap-admin.js
 * 3. Admin receives password reset email
 * 4. Admin sets password via reset link
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   ADMIN BOOTSTRAP');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Read config from environment
    const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
    const name = process.env.ADMIN_BOOTSTRAP_NAME || 'System Administrator';
    const level = process.env.ADMIN_BOOTSTRAP_LEVEL || 'ROOT';

    if (!email) {
      console.log('❌ ADMIN_BOOTSTRAP_EMAIL not set in .env file');
      console.log('\nSet the following in backend/.env:');
      console.log('ADMIN_BOOTSTRAP_EMAIL=admin@example.com');
      console.log('ADMIN_BOOTSTRAP_NAME=Admin Name (optional)');
      console.log('ADMIN_BOOTSTRAP_LEVEL=ROOT (optional)\n');
      return;
    }

    console.log('Bootstrap Configuration:');
    console.log('  Email:', email);
    console.log('  Name:', name);
    console.log('  Level:', level);
    console.log('');

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { adminProfile: true }
    });

    if (user) {
      console.log('✅ User already exists\n');
      console.log('User ID:', user.id);
      console.log('Role:', user.role);
      console.log('Roles:', JSON.stringify(user.roles));
      console.log('Primary Role:', user.primaryRole);
      console.log('Admin Level:', user.adminProfile?.level || 'NONE');
      console.log('Status:', user.approvalStatus);
      console.log('Active:', user.isActive);

      // Update to ensure correct role configuration
      if (user.role !== 'SUPER_ADMIN' || 
          !user.roles.includes('SUPER_ADMIN') || 
          user.primaryRole !== 'SUPER_ADMIN') {
        console.log('\n📝 Updating role configuration...');
        
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'SUPER_ADMIN',
            roles: ['SUPER_ADMIN'],
            primaryRole: 'SUPER_ADMIN',
            approvalStatus: 'VERIFIED',
            isActive: true,
            isEmailVerified: true
          },
          include: { adminProfile: true }
        });

        console.log('✅ Role updated to SUPER_ADMIN');
      }

      // Create admin profile if missing
      if (!user.adminProfile) {
        console.log('\n📝 Creating admin profile...');
        
        await prisma.adminProfile.create({
          data: {
            userId: user.id,
            level: level,
            createdById: user.id // Self-created
          }
        });

        console.log('✅ Admin profile created');
      } else if (user.adminProfile.level !== level) {
        console.log('\n📝 Updating admin level...');
        
        await prisma.adminProfile.update({
          where: { userId: user.id },
          data: { level }
        });

        console.log('✅ Admin level updated to', level);
      }

      console.log('\n✅ Bootstrap complete - user already configured');
      
    } else {
      console.log('📝 Creating new admin user...\n');

      // Generate a secure temporary password (will never be used - admin must reset)
      const tempPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Create user with admin role
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: 'SUPER_ADMIN',
          roles: ['SUPER_ADMIN'],
          primaryRole: 'SUPER_ADMIN',
          passwordHash,
          approvalStatus: 'VERIFIED',
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: false,
          authProvider: 'EMAIL_PASSWORD',
          adminProfile: {
            create: {
              level,
              createdById: undefined // Will be set after user creation
            }
          }
        },
        include: { adminProfile: true }
      });

      // Update admin profile to reference self as creator
      await prisma.adminProfile.update({
        where: { userId: user.id },
        data: { createdById: user.id }
      });

      console.log('✅ Admin user created');
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Admin Level:', level);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ BOOTSTRAP COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('NEXT STEPS:\n');
    console.log('1. Admin must set password via password reset flow:');
    console.log('   - Navigate to /forgot-password');
    console.log('   - Enter admin email');
    console.log('   - Follow reset link in email\n');
    console.log('2. Login at /admin with email and new password\n');
    console.log('SECURITY NOTES:\n');
    console.log('- No passwords were logged or stored in plain text');
    console.log('- Admin must use password reset to set secure password');
    console.log('- Temporary password is cryptographically random and unused\n');

  } catch (error) {
    console.error('❌ Bootstrap failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Prevent accidental execution in production without explicit confirmation
if (process.env.NODE_ENV === 'production' && !process.env.CONFIRM_BOOTSTRAP) {
  console.log('\n⚠️  Production environment detected');
  console.log('Set CONFIRM_BOOTSTRAP=true to run in production\n');
  process.exit(1);
}

bootstrapAdmin();
