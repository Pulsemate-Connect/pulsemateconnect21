require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Add RBAC mappings for test users
 * Maps test users to their appropriate roles in the user_roles table
 */

async function addRBACForTestUsers() {
  console.log('🔐 Adding RBAC mappings for test users...\n');

  // Get all roles
  const roles = await prisma.role.findMany();
  const roleMap = {};
  roles.forEach(role => {
    roleMap[role.name] = role.id;
  });

  console.log('Available roles:', Object.keys(roleMap));
  console.log('');

  // Get admin for approval
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!admin) {
    throw new Error('No admin found');
  }

  // Get all test users
  const testDoctors = await prisma.user.findMany({
    where: {
      role: 'DOCTOR',
      email: { contains: 'test' }
    }
  });

  const testReceptionists = await prisma.user.findMany({
    where: {
      role: 'RECEPTIONIST',
      email: { contains: 'test' }
    }
  });

  const testOwners = await prisma.user.findMany({
    where: {
      role: 'CLINIC_OWNER',
      email: { contains: 'test' }
    }
  });

  console.log(`Found ${testDoctors.length} test doctors`);
  console.log(`Found ${testReceptionists.length} test receptionists`);
  console.log(`Found ${testOwners.length} test clinic owners`);
  console.log('');

  let added = 0;

  // Add DOCTOR role mappings
  for (const doctor of testDoctors) {
    const existing = await prisma.userRoleMapping.findFirst({
      where: {
        userId: doctor.id,
        roleId: roleMap['DOCTOR']
      }
    });

    if (!existing) {
      await prisma.userRoleMapping.create({
        data: {
          userId: doctor.id,
          roleId: roleMap['DOCTOR'],
          isPrimary: true,
          status: 'APPROVED',
          approvedBy: admin.id,
          approvedAt: new Date()
        }
      });
      console.log(`✅ Added DOCTOR role for ${doctor.email}`);
      added++;
    } else {
      console.log(`⏭️  ${doctor.email} already has DOCTOR role`);
    }
  }

  // Add RECEPTIONIST role mappings
  for (const receptionist of testReceptionists) {
    const existing = await prisma.userRoleMapping.findFirst({
      where: {
        userId: receptionist.id,
        roleId: roleMap['RECEPTIONIST']
      }
    });

    if (!existing) {
      await prisma.userRoleMapping.create({
        data: {
          userId: receptionist.id,
          roleId: roleMap['RECEPTIONIST'],
          isPrimary: true,
          status: 'APPROVED',
          approvedBy: admin.id,
          approvedAt: new Date()
        }
      });
      console.log(`✅ Added RECEPTIONIST role for ${receptionist.email}`);
      added++;
    } else {
      console.log(`⏭️  ${receptionist.email} already has RECEPTIONIST role`);
    }
  }

  // Add CLINIC_OWNER role mappings
  for (const owner of testOwners) {
    const existing = await prisma.userRoleMapping.findFirst({
      where: {
        userId: owner.id,
        roleId: roleMap['CLINIC_OWNER']
      }
    });

    if (!existing) {
      await prisma.userRoleMapping.create({
        data: {
          userId: owner.id,
          roleId: roleMap['CLINIC_OWNER'],
          isPrimary: true,
          status: 'APPROVED',
          approvedBy: admin.id,
          approvedAt: new Date()
        }
      });
      console.log(`✅ Added CLINIC_OWNER role for ${owner.email}`);
      added++;
    } else {
      console.log(`⏭️  ${owner.email} already has CLINIC_OWNER role`);
    }
  }

  console.log('');
  console.log(`✅ Added ${added} RBAC mappings`);
  console.log('');

  // Verify mappings
  const totalMappings = await prisma.userRoleMapping.count({
    where: {
      user: {
        email: { contains: 'test' }
      }
    }
  });

  console.log(`📊 Total RBAC mappings for test users: ${totalMappings}`);
}

addRBACForTestUsers()
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
