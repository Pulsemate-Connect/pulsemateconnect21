/**
 * Check Admin Account Details
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'sahilnaik1515@gmail.com' },
      include: {
        adminProfile: true
      }
    });

    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }

    console.log('👤 Admin Account Details:');
    console.log('  ID:', admin.id);
    console.log('  Name:', admin.name);
    console.log('  Email:', admin.email);
    console.log('  Mobile:', admin.mobile);
    console.log('  Role:', admin.role);
    console.log('  Approval Status:', admin.approvalStatus);
    console.log('  Admin Profile:', admin.adminProfile);

    if (admin.adminProfile) {
      console.log('\n✅ Admin profile exists');
      console.log('  Level:', admin.adminProfile.level);
    } else {
      console.log('\n❌ NO ADMIN PROFILE - This is the problem!');
      console.log('\nCreating admin profile...');
      
      await prisma.adminProfile.create({
        data: {
          userId: admin.id,
          level: 'SUPER_ADMIN',
          createdById: admin.id
        }
      });
      
      console.log('✅ Admin profile created successfully!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
