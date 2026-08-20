const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProfileState() {
  try {
    console.log('\n=== Checking Profile State ===\n');

    const user = await prisma.user.findFirst({
      where: {
        email: 'sahilnaik1515@gmail.com',
      },
      include: {
        patientProfile: true,
      },
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('User Info:');
    console.log('   ID:', user.id);
    console.log('   Name (users table):', user.name);
    console.log('   Role:', user.role);
    console.log('');

    if (user.patientProfile) {
      console.log('Patient Profile:');
      console.log('   Patient Name:', user.patientProfile.patientName || '(not set)');
      console.log('   Gender:', user.patientProfile.gender || '(not set)');
      console.log('   Age:', user.patientProfile.age || '(not set)');
      console.log('   DOB:', user.patientProfile.dob ? user.patientProfile.dob.toISOString().split('T')[0] : '(not set)');
      console.log('   City:', user.patientProfile.city || '(not set)');
      console.log('   Emergency Contact:', user.patientProfile.emergencyContact || '(not set)');
      console.log('   Blood Group:', user.patientProfile.bloodGroup || '(not set)');
      console.log('   Profile Completed:', user.patientProfile.profileCompleted);
      console.log('');

      if (user.patientProfile.patientName) {
        console.log('✅ Patient name is set:', user.patientProfile.patientName);
        console.log('✅ Profile should show this name on login');
        console.log('✅ Edit Profile should pre-fill all saved details');
      } else {
        console.log('ℹ️  Patient name is not set yet');
        console.log('ℹ️  Profile will show "You" until user enters their name');
      }
    } else {
      console.log('❌ No patient profile exists');
      console.log('   Profile will be created on first access');
    }
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfileState();
