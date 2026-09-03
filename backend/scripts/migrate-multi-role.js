/**
 * Multi-Role Migration Script
 * 
 * Migrates existing single-role users to multi-role architecture
 * Safe to run multiple times (idempotent)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║  PULSEMATE MULTI-ROLE MIGRATION                                           ║');
  console.log('║  Date: 2026-08-30                                                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Check current state
    console.log('📊 STEP 1: Analyzing current database state...\n');
    
    const totalUsers = await prisma.user.count();
    
    // Count users where roles array is empty (default behavior check)
    const allUsers = await prisma.user.findMany({
      select: { id: true, roles: true, primaryRole: true }
    });
    
    const usersWithoutRoles = allUsers.filter(u => !u.roles || u.roles.length === 0).length;
    const usersWithoutPrimaryRole = allUsers.filter(u => !u.primaryRole).length;
    
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users without roles array: ${usersWithoutRoles}`);
    console.log(`   Users without primaryRole: ${usersWithoutPrimaryRole}`);
    
    // Step 2: Populate roles arrays
    console.log('\n🔄 STEP 2: Populating roles arrays...\n');
    
    const allUsersForUpdate = await prisma.user.findMany({
      select: { id: true, role: true, roles: true }
    });
    
    const usersToUpdate = allUsersForUpdate.filter(u => !u.roles || u.roles.length === 0);
    
    if (usersToUpdate.length > 0) {
      console.log(`   Updating ${usersToUpdate.length} users...`);
      
      for (const user of usersToUpdate) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roles: [user.role] }
        });
      }
      
      console.log(`   ✅ Updated ${usersToUpdate.length} users with roles array`);
    } else {
      console.log('   ✅ All users already have roles array populated');
    }
    
    // Step 3: Sync primaryRole with role field
    console.log('\n🔄 STEP 3: Syncing primaryRole with role field...\n');
    
    // primaryRole has @default(PATIENT), so check if it needs syncing with role field
    const allUsersForSync = await prisma.user.findMany({
      select: { id: true, role: true, primaryRole: true }
    });
    
    let syncedCount = 0;
    for (const user of allUsersForSync) {
      if (user.primaryRole !== user.role) {
        await prisma.user.update({
          where: { id: user.id },
          data: { primaryRole: user.role }
        });
        syncedCount++;
      }
    }
    
    if (syncedCount > 0) {
      console.log(`   ✅ Synced ${syncedCount} users' primaryRole with role field`);
    } else {
      console.log('   ✅ All users already have primaryRole synced');
    }
    
    // Step 4: Create RoleApprovalStatus records
    console.log('\n🔄 STEP 4: Creating RoleApprovalStatus records...\n');
    
    const allUsersForApproval = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Get all existing role approvals
    const existingApprovals = await prisma.roleApprovalStatus.findMany({
      select: { userId: true, role: true }
    });
    
    // Create a Set for fast lookup
    const existingKeys = new Set(
      existingApprovals.map(a => `${a.userId}:${a.role}`)
    );
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const user of allUsersForApproval) {
      const key = `${user.id}:${user.role}`;
      
      if (!existingKeys.has(key)) {
        await prisma.roleApprovalStatus.create({
          data: {
            userId: user.id,
            role: user.role,
            approvalStatus: user.approvalStatus,
            requestedAt: user.createdAt,
            approvedAt: user.approvalStatus === 'VERIFIED' ? user.createdAt : null,
          }
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log(`   ✅ Created ${createdCount} RoleApprovalStatus records`);
    if (skippedCount > 0) {
      console.log(`   ℹ️  Skipped ${skippedCount} existing records`);
    }
    
    // Step 5: Verification
    console.log('\n🔍 STEP 5: Verifying migration...\n');
    
    const verifyAllUsers = await prisma.user.findMany({
      select: { id: true, roles: true, primaryRole: true }
    });
    
    const verifyUsersWithoutRoles = verifyAllUsers.filter(u => !u.roles || u.roles.length === 0).length;
    const verifyUsersWithoutPrimary = verifyAllUsers.filter(u => !u.primaryRole).length;
    
    const verifyRoleApprovals = await prisma.roleApprovalStatus.count();
    
    console.log(`   Users without roles: ${verifyUsersWithoutRoles} (expected: 0)`);
    console.log(`   Users without primaryRole: ${verifyUsersWithoutPrimary} (expected: 0)`);
    console.log(`   Total RoleApprovalStatus records: ${verifyRoleApprovals}`);
    
    // Check for users without role approval (using Prisma ORM, not raw SQL)
    const allUserIds = verifyAllUsers.map(u => u.id);
    const approvalUserIds = (await prisma.roleApprovalStatus.findMany({
      select: { userId: true },
      distinct: ['userId']
    })).map(a => a.userId);
    
    const usersWithoutApprovalCount = allUserIds.filter(id => !approvalUserIds.includes(id)).length;
    console.log(`   Users without RoleApprovalStatus: ${usersWithoutApprovalCount} (expected: 0)`);
    
    // Final status
    console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
    if (verifyUsersWithoutRoles === 0 && verifyUsersWithoutPrimary === 0 && usersWithoutApprovalCount === 0) {
      console.log('║  ✅ MIGRATION SUCCESSFUL                                                  ║');
      console.log('║                                                                           ║');
      console.log('║  All users migrated to multi-role architecture                           ║');
      console.log('║  No data lost, no schema changes                                         ║');
    } else {
      console.log('║  ⚠️  MIGRATION INCOMPLETE                                                 ║');
      console.log('║                                                                           ║');
      console.log('║  Some users may not have complete multi-role data                        ║');
      console.log('║  Review verification results above                                       ║');
    }
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');
    
    // Show role distribution
    console.log('📊 Role Distribution:\n');
    const roleDistribution = await prisma.roleApprovalStatus.groupBy({
      by: ['role', 'approvalStatus'],
      _count: true
    });
    
    roleDistribution.forEach(({ role, approvalStatus, _count }) => {
      console.log(`   ${role}: ${approvalStatus} (${_count})`);
    });
    console.log('');
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:\n');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✅ Migration script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
