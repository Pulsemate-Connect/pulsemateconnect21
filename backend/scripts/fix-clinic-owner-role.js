/**
 * Fix Clinic Owner Role Script
 * 
 * Fixes users who are CLINIC_OWNER but have wrong primaryRole
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixClinicOwnerRoles() {
  console.log('\n🔧 Fixing CLINIC_OWNER roles...\n');

  try {
    // Find all CLINIC_OWNER users
    const clinicOwners = await prisma.user.findMany({
      where: { role: 'CLINIC_OWNER' },
      select: {
        id: true,
        email: true,
        mobile: true,
        role: true,
        roles: true,
        primaryRole: true,
      }
    });

    console.log(`Found ${clinicOwners.length} CLINIC_OWNER users`);

    for (const user of clinicOwners) {
      console.log(`\nUser: ${user.email || user.mobile}`);
      console.log(`  Current role: ${user.role}`);
      console.log(`  Current roles: [${user.roles?.join(', ') || 'none'}]`);
      console.log(`  Current primaryRole: ${user.primaryRole}`);

      const needsUpdate = 
        !user.roles?.includes('CLINIC_OWNER') || 
        user.primaryRole !== 'CLINIC_OWNER';

      if (needsUpdate) {
        console.log(`  ⚠️  Needs fix!`);

        // Update user
        await prisma.user.update({
          where: { id: user.id },
          data: {
            roles: user.roles?.includes('CLINIC_OWNER') 
              ? user.roles 
              : [...(user.roles || []), 'CLINIC_OWNER'],
            primaryRole: 'CLINIC_OWNER',
          }
        });

        // Ensure RoleApprovalStatus exists
        const allApprovals = await prisma.roleApprovalStatus.findMany({
          where: { userId: user.id }
        });

        const existing = allApprovals.find(a => a.role === 'CLINIC_OWNER');

        if (!existing) {
          await prisma.roleApprovalStatus.create({
            data: {
              userId: user.id,
              role: 'CLINIC_OWNER',
              approvalStatus: 'PENDING',
              requestedAt: new Date(),
            }
          });
          console.log(`  ✅ Created RoleApprovalStatus`);
        }

        console.log(`  ✅ Fixed!`);
      } else {
        console.log(`  ✅ Already correct`);
      }
    }

    console.log('\n✅ All CLINIC_OWNER roles fixed!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixClinicOwnerRoles();
