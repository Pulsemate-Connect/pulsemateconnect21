/**
 * Fix user roles - add SUPER_ADMIN to roles array and set as primary
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    const userId = 'b8b7cf17-ba45-4594-baab-6cde6cfa1492';
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleApprovals: true,
      }
    });
    
    console.log('📝 Current State:');
    console.log('  Name:', user.name);
    console.log('  role (legacy):', user.role);
    console.log('  roles:', user.roles);
    console.log('  primaryRole:', user.primaryRole);
    console.log('  Role Approvals:');
    user.roleApprovals.forEach(a => {
      console.log(`    - ${a.role}: ${a.approvalStatus}`);
    });
    
    // Add SUPER_ADMIN to roles array
    const roles = [...(user.roles || [])];
    if (!roles.includes('SUPER_ADMIN')) {
      roles.push('SUPER_ADMIN');
    }
    
    console.log('\n📝 Updating user...');
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        roles: roles,
        primaryRole: 'SUPER_ADMIN',
        role: 'SUPER_ADMIN',
      }
    });
    
    // Create approval record for SUPER_ADMIN if doesn't exist
    const hasApproval = user.roleApprovals.find(a => a.role === 'SUPER_ADMIN');
    if (!hasApproval) {
      console.log('📝 Creating approval record for SUPER_ADMIN...');
      await prisma.roleApprovalStatus.create({
        data: {
          userId: userId,
          role: 'SUPER_ADMIN',
          approvalStatus: 'VERIFIED',
          requestedAt: new Date(),
          approvedAt: new Date(),
          notes: 'Auto-approved for existing super admin',
        }
      });
    }
    
    console.log('\n✅ Updated State:');
    console.log('  role (legacy):', updated.role);
    console.log('  roles:', updated.roles);
    console.log('  primaryRole:', updated.primaryRole);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: User must logout and login again!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
