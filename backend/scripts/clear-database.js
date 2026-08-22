/**
 * ⚠️ DANGER: DATABASE RESET SCRIPT
 * 
 * This script will DELETE ALL DATA from your database.
 * Use with extreme caution!
 * 
 * Usage:
 *   node backend/scripts/clear-database.js --confirm
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CONFIRM_FLAG = '--confirm';

async function clearDatabase() {
  const args = process.argv.slice(2);

  if (!args.includes(CONFIRM_FLAG)) {
    console.log('\n⚠️  WARNING: This will DELETE ALL DATA from your database!\n');
    console.log('To proceed, run:');
    console.log('  node backend/scripts/clear-database.js --confirm\n');
    process.exit(0);
  }

  console.log('\n🔴 CLEARING DATABASE - THIS WILL DELETE ALL DATA\n');
  console.log('Starting in 3 seconds... Press Ctrl+C to cancel\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Order matters - delete child records before parents
    console.log('Deleting data in correct order...\n');

    // 1. Delete all appointments and related
    console.log('🗑️  Deleting scheduled notifications...');
    await prisma.scheduledNotification.deleteMany({});
    
    console.log('🗑️  Deleting notifications...');
    await prisma.notification.deleteMany({});
    
    console.log('🗑️  Deleting notification reads...');
    await prisma.notificationRead.deleteMany({});
    
    console.log('🗑️  Deleting user notifications...');
    await prisma.userNotification.deleteMany({});
    
    console.log('🗑️  Deleting notification preferences...');
    await prisma.notificationPreference.deleteMany({});
    
    console.log('🗑️  Deleting queue items...');
    await prisma.queueItem.deleteMany({});
    
    console.log('🗑️  Deleting queues...');
    await prisma.queue.deleteMany({});
    
    console.log('🗑️  Deleting prescriptions...');
    await prisma.prescriptions.deleteMany({});
    
    console.log('🗑️  Deleting appointments...');
    await prisma.appointment.deleteMany({});
    
    console.log('🗑️  Deleting payments...');
    await prisma.payment.deleteMany({});

    // 2. Delete sessions and availabilities
    console.log('🗑️  Deleting clinic sessions...');
    await prisma.clinicSession.deleteMany({});
    
    console.log('🗑️  Deleting doctor availabilities...');
    await prisma.doctorAvailability.deleteMany({});
    
    console.log('🗑️  Deleting doctor clinics...');
    await prisma.doctorClinic.deleteMany({});

    // 3. Delete clinic-related data
    console.log('🗑️  Deleting clinic temporary closures...');
    await prisma.clinicTemporaryClosure.deleteMany({});
    
    console.log('🗑️  Deleting clinic special hours...');
    await prisma.clinicSpecialHours.deleteMany({});
    
    console.log('🗑️  Deleting clinic breaks...');
    await prisma.clinicBreak.deleteMany({});
    
    console.log('🗑️  Deleting clinic working hours...');
    await prisma.clinicWorkingHours.deleteMany({});
    
    console.log('🗑️  Deleting clinic appointment settings...');
    await prisma.clinicAppointmentSettings.deleteMany({});
    
    console.log('🗑️  Deleting clinic queue settings...');
    await prisma.clinicQueueSettings.deleteMany({});
    
    console.log('🗑️  Deleting clinic holidays...');
    await prisma.clinicHoliday.deleteMany({});
    
    console.log('🗑️  Deleting clinic verification logs...');
    await prisma.clinicVerificationLog.deleteMany({});
    
    console.log('🗑️  Deleting clinic staff...');
    await prisma.clinicStaff.deleteMany({});
    
    console.log('🗑️  Deleting doctor invitations...');
    await prisma.doctorInvitation.deleteMany({});
    
    console.log('🗑️  Deleting doctor verification documents...');
    await prisma.doctorVerificationDocument.deleteMany({});
    
    console.log('🗑️  Deleting doctor verification logs...');
    await prisma.doctorVerificationLog.deleteMany({});
    
    console.log('🗑️  Deleting clinics...');
    await prisma.clinic.deleteMany({});

    // 4. Delete profile data
    console.log('🗑️  Deleting admin profiles...');
    await prisma.adminProfile.deleteMany({});
    
    console.log('🗑️  Deleting doctor profiles...');
    await prisma.doctorProfile.deleteMany({});
    
    console.log('🗑️  Deleting receptionist profiles...');
    await prisma.receptionistProfile.deleteMany({});
    
    console.log('🗑️  Deleting clinic owner profiles...');
    await prisma.clinicOwnerProfile.deleteMany({});
    
    console.log('🗑️  Deleting patient profiles...');
    await prisma.patientProfile.deleteMany({});

    // 5. Delete authentication and token data
    console.log('🗑️  Deleting FCM tokens...');
    await prisma.fcmToken.deleteMany({});
    
    console.log('🗑️  Deleting refresh tokens...');
    await prisma.refreshToken.deleteMany({});
    
    console.log('🗑️  Deleting sessions...');
    await prisma.session.deleteMany({});
    
    console.log('🗑️  Deleting password reset tokens...');
    await prisma.passwordResetToken.deleteMany({});
    
    console.log('🗑️  Deleting OTP verifications...');
    await prisma.otpVerification.deleteMany({});

    // 6. Delete widget preferences
    console.log('🗑️  Deleting dashboard widget preferences...');
    await prisma.dashboardWidgetPreference.deleteMany({});

    // 7. Delete audit logs
    console.log('🗑️  Deleting audit logs...');
    await prisma.auditLog.deleteMany({});

    // 8. Finally, delete users
    console.log('🗑️  Deleting users...');
    await prisma.user.deleteMany({});

    console.log('\n✅ DATABASE CLEARED SUCCESSFULLY!\n');
    console.log('All data has been deleted from the database.\n');

  } catch (error) {
    console.error('\n❌ ERROR CLEARING DATABASE:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  clearDatabase()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { clearDatabase };
