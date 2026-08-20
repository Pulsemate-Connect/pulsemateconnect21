const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminNameToReal() {
  try {
    console.log('\n=== Updating Admin Profile to Real Name ===\n');

    // Find the admin user
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

    console.log('Current user data:');
    console.log('   Name:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   Mobile:', admin.mobile);
    console.log('   Role:', admin.role);
    console.log('');

    // What's your real name?
    const realName = 'Sahil Naik'; // Change this to your actual preferred name
    
    console.log('Updating name to:', realName);
    console.log('');

    // Update user name
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        name: realName,
      },
    });

    console.log('✅ Name updated successfully!');
    console.log('');
    console.log('📱 Mobile app will now show:');
    console.log('   Profile name:', realName);
    console.log('   Like any other patient user');
    console.log('');
    console.log('🔄 Next step:');
    console.log('   Logout and login again in the mobile app');
    console.log('   to get a fresh JWT token with the updated name');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminNameToReal();
