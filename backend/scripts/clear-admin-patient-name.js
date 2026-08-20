const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAdminPatientName() {
  try {
    console.log('\n=== Clearing Admin Patient Profile Name ===\n');

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: {
        email: 'sahilnaik1515@gmail.com',
      },
      include: {
        patientProfile: true,
      },
    });

    if (!admin) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    console.log('Current state:');
    console.log('   User name (admin identity):', admin.name);
    console.log('   Patient name (patient identity):', admin.patientProfile?.patientName || '(not set)');
    console.log('');

    if (admin.patientProfile) {
      // Clear patient name
      await prisma.patientProfile.update({
        where: { userId: admin.id },
        data: {
          patientName: null,
        },
      });
      console.log('✅ Cleared patient name from patient profile');
    } else {
      console.log('ℹ️  No patient profile exists yet (will be created on first profile access)');
    }

    console.log('');
    console.log('📱 What happens now:');
    console.log('   1. Admin logs into patient app');
    console.log('   2. Profile shows "You" (no name set)');
    console.log('   3. Admin must tap "Edit Profile" and enter their patient name');
    console.log('   4. Patient name is saved to patientProfile.patientName');
    console.log('   5. User name (Sahil Naik) remains unchanged for admin portal');
    console.log('');
    console.log('✨ Result:');
    console.log('   - Patient identity is independent from admin identity');
    console.log('   - Admin can have different names for patient vs admin roles');
    console.log('   - Fresh user experience like any other patient');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAdminPatientName();
