#!/usr/bin/env node

/**
 * Delete Incomplete Clinic Owner Accounts
 * 
 * This script deletes both incomplete clinic owner accounts
 * so you can start fresh with a clean registration.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteIncompleteAccounts() {
  console.log('\n========================================');
  console.log('🗑️  Deleting Incomplete Clinic Owner Accounts');
  console.log('========================================\n');

  try {
    // Account IDs to delete
    const accountsToDelete = [
      { id: '2ac8df8a-a57f-4149-ac10-d19e4df2ba62', mobile: '+919141638162', name: 'Unknown' },
      { id: '2ceff802-fa1c-4e0c-b8e1-874af44d4e81', mobile: '+918703635445', name: 'Arjun U' },
    ];

    for (const account of accountsToDelete) {
      console.log(`\n🔄 Processing: ${account.name} (${account.mobile})`);
      
      // Delete related records first
      
      // 1. Delete refresh tokens
      const refreshTokensDeleted = await prisma.refreshToken.deleteMany({
        where: { userId: account.id },
      });
      console.log(`   ✅ Deleted ${refreshTokensDeleted.count} refresh tokens`);
      
      // 2. Delete sessions
      const sessionsDeleted = await prisma.session.deleteMany({
        where: { userId: account.id },
      });
      console.log(`   ✅ Deleted ${sessionsDeleted.count} sessions`);
      
      // 3. Delete audit logs
      const auditLogsDeleted = await prisma.auditLog.deleteMany({
        where: { userId: account.id },
      });
      console.log(`   ✅ Deleted ${auditLogsDeleted.count} audit logs`);
      
      // 4. Delete firebase phone verifications
      const firebaseVerificationsDeleted = await prisma.firebasePhoneVerification.deleteMany({
        where: { mobile: account.mobile },
      });
      console.log(`   ✅ Deleted ${firebaseVerificationsDeleted.count} firebase verifications`);
      
      // 5. Delete clinic owner profile (if exists)
      const clinicOwnerProfileDeleted = await prisma.clinicOwnerProfile.deleteMany({
        where: { userId: account.id },
      });
      console.log(`   ✅ Deleted ${clinicOwnerProfileDeleted.count} clinic owner profiles`);
      
      // 6. Finally, delete the user
      await prisma.user.delete({
        where: { id: account.id },
      });
      console.log(`   ✅ Deleted user account`);
      
      console.log(`✅ Successfully deleted account: ${account.name} (${account.mobile})`);
    }

    console.log('\n\n========================================');
    console.log('✅ All incomplete accounts deleted!');
    console.log('========================================\n');
    
    console.log('📝 Next Steps:');
    console.log('1. Go to your registration page');
    console.log('2. Start fresh with Step 1');
    console.log('3. Enter the CORRECT phone number you want to use');
    console.log('4. Complete all 4 steps without interruption\n');

    // Verify deletion
    const remainingClinicOwners = await prisma.user.count({
      where: { role: 'CLINIC_OWNER' },
    });
    
    console.log(`📊 Remaining clinic owner accounts: ${remainingClinicOwners}`);
    
    if (remainingClinicOwners === 0) {
      console.log('✅ Database is clean - ready for fresh registration!\n');
    } else {
      console.log('⚠️  Warning: Some clinic owner accounts still exist\n');
    }

  } catch (error) {
    console.error('\n❌ Error deleting accounts:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
deleteIncompleteAccounts();
