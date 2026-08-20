const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...\n');

    // Delete in correct order to respect foreign key constraints
    // Use try-catch for each table in case it doesn't exist
    
    const deleteTable = async (name, deleteFn) => {
      try {
        console.log(`Deleting ${name}...`);
        await deleteFn();
      } catch (error) {
        if (error.code === 'P2021') {
          console.log(`  ⚠️  Table ${name} doesn't exist, skipping...`);
        } else {
          throw error;
        }
      }
    };
    
    await deleteTable('prescriptions', () => prisma.prescriptions.deleteMany({}));
    await deleteTable('reminder_sent', () => prisma.reminderSent.deleteMany({}));
    await deleteTable('audit_logs', () => prisma.auditLog.deleteMany({}));
    await deleteTable('fcm_tokens', () => prisma.fcmToken.deleteMany({}));
    await deleteTable('payments', () => prisma.payment.deleteMany({}));
    await deleteTable('queue_items', () => prisma.queueItem.deleteMany({}));
    await deleteTable('queues', () => prisma.queue.deleteMany({}));
    await deleteTable('appointments', () => prisma.appointment.deleteMany({}));
    await deleteTable('doctor_clinics', () => prisma.doctorClinic.deleteMany({}));
    await deleteTable('clinic_staff', () => prisma.clinicStaff.deleteMany({}));
    await deleteTable('clinic_verification_logs', () => prisma.clinicVerificationLog.deleteMany({}));
    await deleteTable('clinics', () => prisma.clinic.deleteMany({}));
    await deleteTable('user_notifications', () => prisma.userNotification.deleteMany({}));
    await deleteTable('notification_campaigns', () => prisma.notificationCampaign.deleteMany({}));
    await deleteTable('notification_reads', () => prisma.notificationRead.deleteMany({}));
    await deleteTable('sessions', () => prisma.session.deleteMany({}));
    await deleteTable('refresh_tokens', () => prisma.refreshToken.deleteMany({}));
    await deleteTable('password_reset_tokens', () => prisma.passwordResetToken.deleteMany({}));
    await deleteTable('otp_verifications', () => prisma.otpVerification.deleteMany({}));
    await deleteTable('email_verifications', () => prisma.emailVerification.deleteMany({}));
    await deleteTable('receptionist_profiles', () => prisma.receptionistProfile.deleteMany({}));
    await deleteTable('admin_profiles', () => prisma.adminProfile.deleteMany({}));
    await deleteTable('doctor_profiles', () => prisma.doctorProfile.deleteMany({}));
    await deleteTable('patient_profiles', () => prisma.patientProfile.deleteMany({}));
    await deleteTable('users (including all admins)', () => prisma.user.deleteMany({}));
    
    console.log('\n✅ Database cleared successfully!');
    console.log('📊 All tables are now empty, including super admins.\n');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase()
  .then(() => {
    console.log('🎉 Done! Database is completely empty.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to clear database:', error);
    process.exit(1);
  });
