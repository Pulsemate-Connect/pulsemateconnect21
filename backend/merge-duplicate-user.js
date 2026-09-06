/**
 * Script to merge duplicate user accounts
 * - Finds DRAFT CLINIC_OWNER with temp mobile and verified email
 * - Finds existing PATIENT with same mobile (9999999999)
 * - Merges them into single user with MULTI-ROLE support
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mergeDuplicateAccounts() {
  console.log('🔍 Looking for duplicate accounts to merge...\n');

  try {
    // 1. Find the DRAFT CLINIC_OWNER with temp mobile
    const draftClinicOwner = await prisma.user.findFirst({
      where: {
        role: 'CLINIC_OWNER',
        approvalStatus: 'DRAFT',
        mobile: { startsWith: 'TEMP_' },
        email: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        role: true,
        approvalStatus: true,
        isEmailVerified: true,
      },
    });

    if (!draftClinicOwner) {
      console.log('✅ No DRAFT CLINIC_OWNER accounts with temp mobile found.');
      return;
    }

    console.log('📋 Found DRAFT CLINIC_OWNER:');
    console.log(`   User ID: ${draftClinicOwner.id}`);
    console.log(`   Email: ${draftClinicOwner.email}`);
    console.log(`   Temp Mobile: ${draftClinicOwner.mobile}`);
    console.log();

    // 2. Find existing PATIENT with mobile 9999999999
    const existingPatient = await prisma.user.findFirst({
      where: {
        mobile: '9999999999',
        id: { not: draftClinicOwner.id },
      },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        role: true,
        roles: true,
        primaryRole: true,
        approvalStatus: true,
      },
    });

    if (!existingPatient) {
      console.log('❌ No existing PATIENT account found with mobile 9999999999');
      return;
    }

    console.log('📋 Found existing PATIENT:');
    console.log(`   User ID: ${existingPatient.id}`);
    console.log(`   Mobile: ${existingPatient.mobile}`);
    console.log(`   Current Role: ${existingPatient.role}`);
    console.log(`   Current Roles: ${JSON.stringify(existingPatient.roles)}`);
    console.log();

    // 3. Merge: Update PATIENT to add CLINIC_OWNER role + email
    console.log('🔄 Merging accounts...');

    const updatedRoles = existingPatient.roles || [existingPatient.role];
    if (!updatedRoles.includes('CLINIC_OWNER')) {
      updatedRoles.push('CLINIC_OWNER');
    }

    // First, delete the DRAFT user to free up the email
    console.log('🗑️  Deleting DRAFT user to free up email...');
    await prisma.user.delete({
      where: { id: draftClinicOwner.id },
    });
    console.log(`✅ Deleted DRAFT user ${draftClinicOwner.id}`);
    console.log();

    // Now update the existing PATIENT user
    const mergedUser = await prisma.user.update({
      where: { id: existingPatient.id },
      data: {
        email: draftClinicOwner.email, // Add email from DRAFT user
        isEmailVerified: true,
        role: 'CLINIC_OWNER', // Update legacy role to primary
        roles: updatedRoles, // Multi-role: [PATIENT, CLINIC_OWNER]
        primaryRole: 'CLINIC_OWNER',
        approvalStatus: 'DRAFT', // Set to DRAFT for onboarding
        registrationComplete: false,
        registrationStartedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        role: true,
        roles: true,
        primaryRole: true,
        approvalStatus: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    console.log('✅ Successfully merged user:');
    console.log(`   User ID: ${mergedUser.id}`);
    console.log(`   Email: ${mergedUser.email}`);
    console.log(`   Mobile: ${mergedUser.mobile}`);
    console.log(`   Role: ${mergedUser.role}`);
    console.log(`   Roles: ${JSON.stringify(mergedUser.roles)}`);
    console.log(`   Primary Role: ${mergedUser.primaryRole}`);
    console.log();

    console.log('🎉 Account merge completed successfully!');
    console.log('📱 User can now continue clinic onboarding with their existing mobile number');
  } catch (error) {
    console.error('❌ Error merging accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
mergeDuplicateAccounts()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
