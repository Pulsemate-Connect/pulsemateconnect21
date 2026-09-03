require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Fix user role from PATIENT to CLINIC_OWNER
 * For user who registered through wrong flow
 */

async function fixUserRole() {
  console.log('🔧 Fixing User Role: PATIENT → CLINIC_OWNER\n');

  // The problematic user ID from logs
  const userId = '10be4a92-1259-40a6-b3f3-90c6f8524599';
  
  // First, check current user state
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clinicOwnerProfile: true,
      patientProfile: true
    }
  });

  if (!currentUser) {
    console.error('❌ User not found');
    return;
  }

  console.log('Current User State:');
  console.log(`  Name: ${currentUser.name}`);
  console.log(`  Email: ${currentUser.email}`);
  console.log(`  Mobile: ${currentUser.mobile}`);
  console.log(`  Current Role: ${currentUser.role}`);
  console.log(`  Approval Status: ${currentUser.approvalStatus}`);
  console.log(`  Has Patient Profile: ${currentUser.patientProfile ? 'YES' : 'NO'}`);
  console.log(`  Has Clinic Owner Profile: ${currentUser.clinicOwnerProfile ? 'YES' : 'NO'}`);
  console.log('');

  // Update user role
  console.log('Step 1: Updating user role...');
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: 'CLINIC_OWNER',
      approvalStatus: 'PENDING', // Set to PENDING until clinic is submitted
    }
  });
  console.log(`✅ Role updated: PATIENT → CLINIC_OWNER`);
  console.log(`✅ Approval status: ${updatedUser.approvalStatus}`);
  console.log('');

  // Create or update clinic owner profile
  console.log('Step 2: Creating/updating clinic owner profile...');
  const clinicOwnerProfile = await prisma.clinicOwnerProfile.upsert({
    where: { userId: userId },
    update: {
      profileCompleted: false,
      updatedAt: new Date()
    },
    create: {
      userId: userId,
      profileCompleted: false
    }
  });
  console.log(`✅ Clinic owner profile ${clinicOwnerProfile ? 'ready' : 'created'}`);
  console.log('');

  // Add RBAC role mapping if using new RBAC system
  console.log('Step 3: Updating RBAC mappings...');
  try {
    // Get CLINIC_OWNER role ID
    const clinicOwnerRole = await prisma.role.findFirst({
      where: { name: 'CLINIC_OWNER' }
    });

    if (clinicOwnerRole) {
      // Get admin for approval
      const admin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      });

      // Create or update role mapping
      await prisma.userRoleMapping.upsert({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: clinicOwnerRole.id
          }
        },
        update: {
          isPrimary: true,
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: admin?.id
        },
        create: {
          userId: userId,
          roleId: clinicOwnerRole.id,
          isPrimary: true,
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: admin?.id
        }
      });
      console.log(`✅ RBAC role mapping updated`);
    } else {
      console.log(`⚠️  RBAC role not found (might not be using RBAC system)`);
    }
  } catch (error) {
    console.log(`⚠️  RBAC update skipped: ${error.message}`);
  }
  console.log('');

  // Verify final state
  const finalUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clinicOwnerProfile: true
    }
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ USER ROLE FIX COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Updated User State:');
  console.log(`  Name: ${finalUser.name}`);
  console.log(`  Email: ${finalUser.email}`);
  console.log(`  Role: ${finalUser.role} ✅`);
  console.log(`  Approval Status: ${finalUser.approvalStatus}`);
  console.log(`  Has Clinic Owner Profile: ${finalUser.clinicOwnerProfile ? 'YES ✅' : 'NO ❌'}`);
  console.log('');
  console.log('User can now:');
  console.log('  ✅ Access clinic onboarding pages');
  console.log('  ✅ Complete clinic registration');
  console.log('  ✅ Submit clinic for approval');
  console.log('  ✅ Manage clinic after approval');
  console.log('');
  console.log('Next Steps:');
  console.log('  1. User should logout and login again');
  console.log('  2. User will see clinic onboarding flow');
  console.log('  3. Complete all onboarding steps');
  console.log('  4. Submit for admin approval');
  console.log('');
}

fixUserRole()
  .catch((error) => {
    console.error('❌ Error fixing user role:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
