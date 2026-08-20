const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAdminProfile() {
  try {
    console.log('\n=== Verifying Admin Profile ===\n');

    const admin = await prisma.user.findFirst({
      where: {
        email: 'sahilnaik1515@gmail.com',
      },
      include: {
        patientProfile: true,
        adminProfile: true,
      },
    });

    if (!admin) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log('   ID:', admin.id);
    console.log('   Name:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   Mobile:', admin.mobile);
    console.log('   Role:', admin.role);
    console.log('   Approval Status:', admin.approvalStatus);
    console.log('   Is Active:', admin.isActive);
    console.log('');
    console.log('📱 Patient Profile:');
    if (admin.patientProfile) {
      console.log('   Exists: Yes');
      console.log('   Gender:', admin.patientProfile.gender || 'Not set');
      console.log('   Age:', admin.patientProfile.age || 'Not set');
      console.log('   City:', admin.patientProfile.city || 'Not set');
      console.log('   Blood Group:', admin.patientProfile.bloodGroup || 'Not set');
      console.log('   Profile Completed:', admin.patientProfile.profileCompleted);
    } else {
      console.log('   Exists: No');
    }
    console.log('');
    console.log('🔑 Admin Profile:');
    if (admin.adminProfile) {
      console.log('   Exists: Yes');
      console.log('   Level:', admin.adminProfile.level);
    } else {
      console.log('   Exists: No');
    }
    console.log('');
    console.log('✨ Summary:');
    console.log('   - Database name is:', admin.name);
    console.log('   - To see this in the app, user must logout and login again');
    console.log('   - The JWT token contains the old name until re-login');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminProfile();
