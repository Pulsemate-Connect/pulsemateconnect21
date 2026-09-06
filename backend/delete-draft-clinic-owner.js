/**
 * Delete DRAFT CLINIC_OWNER user
 * Email: infopulsemateconnect@gmail.com
 * Mobile: 9999999999
 * 
 * ⚠️ SAFETY: This will NOT delete SUPER_ADMIN (Sahil Naik)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteDraftClinicOwner() {
  console.log('🗑️  Deleting DRAFT CLINIC_OWNER user...\n');

  try {
    // Step 1: Find the user to delete
    console.log('🔍 Step 1: Finding user to delete...');
    const userToDelete = await prisma.user.findFirst({
      where: {
        email: 'infopulsemateconnect@gmail.com',
        mobile: '9999999999',
        role: 'CLINIC_OWNER',
        approvalStatus: 'DRAFT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        approvalStatus: true,
      },
    });

    if (!userToDelete) {
      console.log('❌ User not found with the specified criteria.');
      console.log('   Email: infopulsemateconnect@gmail.com');
      console.log('   Mobile: 9999999999');
      console.log('   Role: CLINIC_OWNER');
      console.log('   Status: DRAFT');
      return;
    }

    console.log('✅ Found user to delete:');
    console.log(`   ID: ${userToDelete.id}`);
    console.log(`   Name: ${userToDelete.name || 'N/A'}`);
    console.log(`   Email: ${userToDelete.email}`);
    console.log(`   Mobile: ${userToDelete.mobile}`);
    console.log(`   Role: ${userToDelete.role}`);
    console.log(`   Status: ${userToDelete.approvalStatus}`);
    console.log();

    // Step 2: Check related data
    console.log('📋 Step 2: Checking related data...');

    const relatedClinics = await prisma.clinic.count({
      where: { ownerId: userToDelete.id },
    });

    const relatedSessions = await prisma.session.count({
      where: { userId: userToDelete.id },
    });

    const relatedTokens = await prisma.refreshToken.count({
      where: { userId: userToDelete.id },
    });

    console.log(`   Owned Clinics: ${relatedClinics}`);
    console.log(`   Sessions: ${relatedSessions}`);
    console.log(`   Refresh Tokens: ${relatedTokens}`);
    console.log();

    // Step 3: Delete the user (CASCADE will handle related data)
    console.log('🗑️  Step 3: Deleting user...');
    
    await prisma.user.delete({
      where: { id: userToDelete.id },
    });

    console.log('✅ User deleted successfully!');
    console.log();

    // Step 4: Verify deletion
    console.log('✔️  Step 4: Verifying deletion...');

    const deletedCheck = await prisma.user.findFirst({
      where: {
        email: 'infopulsemateconnect@gmail.com',
        mobile: '9999999999',
      },
    });

    if (deletedCheck) {
      console.log('⚠️  Warning: User still exists!');
    } else {
      console.log('✅ User successfully removed from database');
    }
    console.log();

    // Step 5: Verify SUPER_ADMIN still exists
    console.log('🔍 Step 5: Verifying SUPER_ADMIN (Sahil Naik) still exists...');

    const superAdmin = await prisma.user.findFirst({
      where: {
        email: 'sahilnaik1515@gmail.com',
        role: 'SUPER_ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
      },
    });

    if (superAdmin) {
      console.log('✅ SUPER_ADMIN still exists:');
      console.log(`   Name: ${superAdmin.name}`);
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Mobile: ${superAdmin.mobile}`);
    } else {
      console.log('❌ ERROR: SUPER_ADMIN not found!');
    }
    console.log();

    // Step 6: Show remaining users
    console.log('📋 Step 6: Remaining users in database:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        approvalStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`   Total users: ${allUsers.length}`);
    console.log();
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'}`);
      console.log(`      Mobile: ${user.mobile}`);
      console.log(`      Email: ${user.email || 'N/A'}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Status: ${user.approvalStatus}`);
      console.log();
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 Deletion Complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ DRAFT CLINIC_OWNER deleted');
    console.log('✅ SUPER_ADMIN preserved');
    console.log('✅ Database cleaned');
    console.log();

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteDraftClinicOwner()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
