const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminProfile() {
  try {
    console.log('\n=== Updating Sahil Naik Profile ===\n');

    // Find Sahil Naik (admin user)
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
      console.error('❌ Sahil Naik not found');
      process.exit(1);
    }

    console.log('✅ Found user:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   Email:', admin.email);
    console.log('   Has patient profile:', !!admin.patientProfile);

    // What name do you want to use?
    const newName = 'You'; // Change this to your preferred name

    // Update user name
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        name: newName,
      },
    });

    console.log('\n✅ Updated user name to:', newName);

    // Create or update patient profile
    if (admin.patientProfile) {
      await prisma.patientProfile.update({
        where: { userId: admin.id },
        data: {
          gender: 'MALE', // Change if needed
          age: 30,        // Change to your age
          profileCompleted: true,
        },
      });
      console.log('✅ Updated patient profile');
    } else {
      await prisma.patientProfile.create({
        data: {
          userId: admin.id,
          gender: 'MALE', // Change if needed
          age: 30,        // Change to your age
          profileCompleted: true,
        },
      });
      console.log('✅ Created patient profile');
    }

    console.log('\n✨ Profile updated successfully!');
    console.log('\n📱 Now when you open the mobile app:');
    console.log('   - Profile will show:', newName);
    console.log('   - You can edit profile and add more details');
    console.log('   - You can book appointments');
    console.log('   - You keep all admin privileges');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminProfile();
