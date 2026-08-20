const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReset() {
  try {
    console.log('🧪 Testing database reset...\n');
    
    const tables = [
      'auditLog',
      'reminderSent',
      'notificationDeliveryLog',
      'scheduledNotification',
      'notificationRead',
      'userNotification',
      'broadcastNotification',
      'notificationCampaign',
      'notification',
      'notificationTemplate',
      'notificationPreference',
      'fcmToken',
      'firebasePhoneVerification',
      'otpAttempt',
      'emailVerification',
      'payment',
      'prescriptions',
      'queueItem',
      'queue',
      'appointment',
      'doctorAvailability',
      'doctorClinic',
      'clinicStaff',
      'clinicSession',
      'clinicHoliday',
      'clinicVerificationLog',
      'dashboardWidgetPreference',
      'receptionistProfile',
      'clinicOwnerProfile',
      'adminProfile',
      'doctorVerificationLog',
      'doctorVerificationDocument',
      'doctorInvitation',
      'doctorProfile',
      'patientProfile',
      'passwordResetToken',
      'refreshToken',
      'session',
      'otpVerification',
      'clinic',
      'user'
    ];
    
    console.log('Testing table access...\n');
    
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        console.log(`✅ ${table.padEnd(35)} - ${count} records`);
      } catch (err) {
        console.log(`❌ ${table.padEnd(35)} - ERROR: ${err.message}`);
      }
    }
    
    console.log('\n✅ All table access tests complete!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testReset();
