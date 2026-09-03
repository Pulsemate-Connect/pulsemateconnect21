/**
 * Cleanup Script: Merge Duplicate Clinic Owner Records
 * 
 * Merges two duplicate user records into one canonical record:
 * - User 1 (10be4a92...): Has email + profile + WRONG mobile
 * - User 2 (7e5b2d87...): Has CORRECT mobile + no email + no profile
 * 
 * Strategy:
 * - Keep User 1 (has profile and email)
 * - Update User 1 with correct mobile from User 2
 * - Delete User 2 (incomplete duplicate)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USER_TO_KEEP = '10be4a92-1259-40a6-b3f3-90c6f8524599';  // Has email + profile
const USER_TO_DELETE = '7e5b2d87-dee3-4a04-9c48-92d69250c051';  // Has correct mobile only
const CORRECT_MOBILE = '8105846719';

async function cleanupDuplicates() {
  console.log('='.repeat(80));
  console.log('DUPLICATE USER CLEANUP SCRIPT');
  console.log('='.repeat(80));
  console.log('\n⚠️  WARNING: This script will modify the database\n');

  try {
    // Step 1: Verify both users exist
    console.log('Step 1: Verifying users exist...');
    
    const userToKeep = await prisma.user.findUnique({
      where: { id: USER_TO_KEEP },
      include: { clinicOwnerProfile: true, ownedClinics: true },
    });

    const userToDelete = await prisma.user.findUnique({
      where: { id: USER_TO_DELETE },
      include: { clinicOwnerProfile: true, ownedClinics: true },
    });

    if (!userToKeep) {
      console.log('❌ ERROR: User to keep not found:', USER_TO_KEEP);
      return;
    }

    if (!userToDelete) {
      console.log('❌ ERROR: User to delete not found:', USER_TO_DELETE);
      return;
    }

    console.log('✅ Both users found\n');

    // Step 2: Display current state
    console.log('─'.repeat(80));
    console.log('CURRENT STATE');
    console.log('─'.repeat(80));
    console.log('\nUser to KEEP:', USER_TO_KEEP);
    console.log('  Email:', userToKeep.email);
    console.log('  Mobile:', userToKeep.mobile, '← WRONG');
    console.log('  Has Profile:', userToKeep.clinicOwnerProfile ? 'YES' : 'NO');
    console.log('  Owns Clinics:', userToKeep.ownedClinics.length);

    console.log('\nUser to DELETE:', USER_TO_DELETE);
    console.log('  Email:', userToDelete.email || 'NULL');
    console.log('  Mobile:', userToDelete.mobile, '← CORRECT');
    console.log('  Has Profile:', userToDelete.clinicOwnerProfile ? 'YES' : 'NO');
    console.log('  Owns Clinics:', userToDelete.ownedClinics.length);

    console.log('\n─'.repeat(80));
    console.log('CLEANUP PLAN');
    console.log('─'.repeat(80));
    console.log(`\n1. Delete User ${USER_TO_DELETE} (frees up mobile: ${CORRECT_MOBILE})`);
    console.log(`2. Update User ${USER_TO_KEEP} mobile: ${userToKeep.mobile} → ${CORRECT_MOBILE}`);
    console.log('\nResult: ONE user with:');
    console.log('  Email:', userToKeep.email);
    console.log('  Mobile:', CORRECT_MOBILE);
    console.log('  Profile: YES');
    console.log('');

    // Step 3: Check if User 2 has any data we need to preserve
    if (userToDelete.clinicOwnerProfile) {
      console.log('⚠️  WARNING: User to delete has a clinic owner profile!');
      console.log('   Manual review required before cleanup.\n');
      return;
    }

    if (userToDelete.ownedClinics.length > 0) {
      console.log('⚠️  WARNING: User to delete owns clinics!');
      console.log('   Manual review required before cleanup.\n');
      return;
    }

    // Step 4: Delete User 2 FIRST (to free up the mobile number)
    console.log('Step 2: Deleting duplicate User', USER_TO_DELETE, '...');
    
    await prisma.user.delete({
      where: { id: USER_TO_DELETE },
    });

    console.log('✅ Deleted User', USER_TO_DELETE);
    console.log('');

    // Step 5: Update User 1 with correct mobile
    console.log('Step 3: Updating User', USER_TO_KEEP, 'with correct mobile...');
    
    const updatedUser = await prisma.user.update({
      where: { id: USER_TO_KEEP },
      data: {
        mobile: CORRECT_MOBILE,
        isPhoneVerified: true,
      },
    });

    console.log('✅ Updated User', USER_TO_KEEP);
    console.log('   New mobile:', updatedUser.mobile);
    console.log('');

    // Step 6: Verify cleanup
    console.log('─'.repeat(80));
    console.log('VERIFICATION');
    console.log('─'.repeat(80));

    const finalUser = await prisma.user.findUnique({
      where: { id: USER_TO_KEEP },
      include: { clinicOwnerProfile: true },
    });

    const deletedUser = await prisma.user.findUnique({
      where: { id: USER_TO_DELETE },
    });

    if (deletedUser) {
      console.log('❌ ERROR: User', USER_TO_DELETE, 'still exists!');
      return;
    }

    console.log('\n✅ CLEANUP SUCCESSFUL\n');
    console.log('Final User State:');
    console.log('  User ID:', finalUser.id);
    console.log('  Email:', finalUser.email);
    console.log('  Mobile:', finalUser.mobile);
    console.log('  Has Profile:', finalUser.clinicOwnerProfile ? 'YES' : 'NO');
    console.log('  Email Verified:', finalUser.isEmailVerified ? 'YES' : 'NO');
    console.log('  Phone Verified:', finalUser.isPhoneVerified ? 'YES' : 'NO');
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ DUPLICATE CLEANUP COMPLETE');
    console.log('='.repeat(80));
    console.log('\nOne user now has both correct email and mobile.');
    console.log('Run test-identity-fix.js to verify.\n');

  } catch (error) {
    console.error('\n❌ CLEANUP ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n⚠️  Database may be in inconsistent state. Manual review required.\n');
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupDuplicates();
