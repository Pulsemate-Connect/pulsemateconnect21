/**
 * Add CLINIC_OWNER role to existing SUPER_ADMIN user (7022818878)
 * 
 * This script:
 * 1. Finds user with mobile 7022818878
 * 2. Adds CLINIC_OWNER to their roles array
 * 3. Creates pending approval record for CLINIC_OWNER role
 * 4. Allows immediate testing (can be approved later by admin)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new Prisma Client();

async function addClinicOwnerRole() {
  try {
    console.log('🔍 Finding user with mobile 7022818878...');
    
    const user = await prisma.user.findUnique({
      where: { mobile: '+917022818878' },
      include: {
        roleApprovals: true,
      },
    });

    if (!user) {
      console.error('❌ User not found with mobile +917022818878');
      console.log('   Try without +91 prefix...');
      
      const userAlt = await prisma.user.findUnique({
        where: { mobile: '7022818878' },
      });
      
      if (!userAlt) {
        console.error('❌ User not found with either mobile format');
        process.exit(1);
      }
      
      console.log('✅ Found user:', userAlt.id);
      return addRoleToUser(userAlt);
    }

    console.log('✅ Found user:', user.id);
    console.log('   Current roles:', user.roles);
    console.log('   Primary role:', user.primaryRole);
    
    return addRoleToUser(user);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function addRoleToUser(user) {
  // Check if already has CLINIC_OWNER
  if (user.roles && user.roles.includes('CLINIC_OWNER')) {
    console.log('⚠️  User already has CLINIC_OWNER role');
    
    const approval = await prisma.roleApprovalStatus.findUnique({
      where: {
        userId_role: {
          userId: user.id,
          role: 'CLINIC_OWNER',
        },
      },
    });
    
    if (approval) {
      console.log('   Approval status:', approval.approvalStatus);
    }
    
    console.log('✅ No changes needed');
    return;
  }

  console.log('\n📝 Adding CLINIC_OWNER role...');

  // Add role to roles array
  const updatedRoles = [...(user.roles || [user.role]), 'CLINIC_OWNER'];
  
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      roles: updatedRoles,
      // Keep primaryRole as current (SUPER_ADMIN or whatever it was)
    },
  });

  console.log('✅ Updated user roles:', updatedUser.roles);

  // Create role approval record (pending approval)
  console.log('\n📝 Creating role approval record...');
  
  const roleApproval = await prisma.roleApprovalStatus.create({
    data: {
      userId: user.id,
      role: 'CLINIC_OWNER',
      approvalStatus: 'PENDING',
      requestedAt: new Date(),
      requestData: {
        requestSource: 'ADMIN_SCRIPT',
        reason: 'Multi-role support - adding CLINIC_OWNER to existing SUPER_ADMIN',
        mobile: user.mobile,
      },
      notes: 'Added via script during multi-role implementation',
    },
  });

  console.log('✅ Role approval created:', roleApproval.id);
  console.log('   Status:', roleApproval.approvalStatus);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SUCCESS!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('User now has roles:', updatedRoles);
  console.log('');
  console.log('⚠️  CLINIC_OWNER role is PENDING approval');
  console.log('   To approve, admin must:');
  console.log('   1. Login to admin portal');
  console.log('   2. Go to role approval section');
  console.log('   3. Approve CLINIC_OWNER for this user');
  console.log('');
  console.log('OR run the approval script:');
  console.log('   node scripts/approve-role.js', user.id, 'CLINIC_OWNER');
  console.log('');
}

// Run the script
addClinicOwnerRole();
