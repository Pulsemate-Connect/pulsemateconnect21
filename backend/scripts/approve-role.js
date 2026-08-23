/**
 * Approve a role for a user
 * Usage: node scripts/approve-role.js <userId> <role>
 * Example: node scripts/approve-role.js b8b7cf17-ba45-4594-baab-6cde6cfa1492 CLINIC_OWNER
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function approveRole() {
  try {
    const userId = process.argv[2];
    const role = process.argv[3];

    if (!userId || !role) {
      console.error('❌ Usage: node scripts/approve-role.js <userId> <role>');
      console.error('   Example: node scripts/approve-role.js abc-123 CLINIC_OWNER');
      process.exit(1);
    }

    console.log(`🔍 Finding user ${userId}...`);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleApprovals: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.mobile}`);
    console.log(`   Current roles: ${JSON.stringify(user.roles)}`);
    console.log(`   Primary role: ${user.primaryRole}`);

    // Check if user has this role
    const userRoles = user.roles || [user.role];
    if (!userRoles.includes(role)) {
      console.error(`❌ User does not have ${role} role`);
      console.error(`   User roles: ${JSON.stringify(userRoles)}`);
      process.exit(1);
    }

    // Find the approval record for this role
    const approval = user.roleApprovals.find(a => a.role === role);
    if (!approval) {
      console.error(`❌ No approval record found for ${role}`);
      console.log('   Creating approval record...');

      const newApproval = await prisma.roleApprovalStatus.create({
        data: {
          userId: user.id,
          role,
          approvalStatus: 'VERIFIED',
          requestedAt: new Date(),
          approvedAt: new Date(),
          notes: 'Approved via script',
        },
      });

      console.log(`✅ Approval record created: ${newApproval.id}`);
      console.log(`   Status: VERIFIED`);
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SUCCESS! Role approved!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log(`User ${user.name || user.mobile} can now use ${role} role`);
      console.log('');
      return;
    }

    console.log(`\n📝 Current approval status: ${approval.approvalStatus}`);

    if (approval.approvalStatus === 'VERIFIED') {
      console.log('⚠️  Role is already VERIFIED');
      console.log('   No changes needed');
      return;
    }

    // Update approval status to VERIFIED
    console.log('\n📝 Updating approval status to VERIFIED...');
    const updated = await prisma.roleApprovalStatus.update({
      where: { id: approval.id },
      data: {
        approvalStatus: 'VERIFIED',
        approvedAt: new Date(),
        notes: approval.notes
          ? `${approval.notes}\nApproved via script at ${new Date().toISOString()}`
          : 'Approved via script',
      },
    });

    console.log('✅ Approval updated successfully');
    console.log(`   Status: ${updated.approvalStatus}`);
    console.log(`   Approved at: ${updated.approvedAt}`);

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Role approved!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`User ${user.name || user.mobile} can now switch to ${role} role`);
    console.log('');
    console.log('Test with:');
    console.log('  1. Login to get access token');
    console.log(`  2. POST /api/auth/switch-role with { "newRole": "${role}" }`);
    console.log('  3. Verify new token has activeRole set to ' + role);
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

approveRole();
