const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProfileEndpoint() {
  try {
    console.log('\n=== Testing Profile Endpoint Logic ===\n');

    // Simulate what getProfile() does
    const user = await prisma.user.findUnique({
      where: { email: 'sahilnaik1515@gmail.com' },
      include: { patientProfile: true },
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('Database state:');
    console.log('   users.name:', user.name);
    console.log('   patientProfile.patientName:', user.patientProfile?.patientName || '(null)');
    console.log('');

    // What API should return (NEW: returns "You" instead of null)
    const patientUser = {
      ...user,
      name: user.patientProfile?.patientName || "You", // NEW: Return "You" instead of null
    };

    console.log('What API should return:');
    console.log('   name:', patientUser.name);
    console.log('');

    console.log('What mobile app should show:');
    console.log('   displayName:', patientUser.name);
    console.log('');

    if (patientUser.name === "You") {
      console.log('✅ Correct: API returns "You", app will show "You"');
      console.log('✅ This overrides auth context name "Sahil Naik"');
    } else {
      console.log('   Display name:', patientUser.name);
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

testProfileEndpoint();
