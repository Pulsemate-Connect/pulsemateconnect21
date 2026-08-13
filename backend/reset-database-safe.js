/**
 * Safe Database Reset Script
 * Deletes all data EXCEPT admin users
 * Usage: node reset-database-safe.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 Starting safe database reset...\n');

  try {
    // 1. Find and preserve admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
      },
      include: {
        adminProfile: true,
      },
    });

    console.log(`✅ Found ${adminUsers.length} admin user(s) to preserve:`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.name || 'Admin'} (${admin.email || admin.mobile})`);
    });
    console.log('');

    const adminUserIds = adminUsers.map(u => u.id);

    // 2. Delete in correct order (respecting foreign key constraints)
    
    console.log('🗑️  Deleting appointment-related data...');
    await prisma.reminderSent.deleteMany({});
    await prisma.prescriptions.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.queueItem.deleteMany({});
    await prisma.appointment.deleteMany({});
    
    console.log('🗑️  Deleting queue data...');
    await prisma.queue.deleteMany({});
    
    console.log('🗑️  Deleting notification data...');
    await prisma.scheduledNotification.deleteMany({}); // Delete all scheduled notifications
    await prisma.userNotification.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.notificationRead.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.notification.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.notificationPreference.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.notificationCampaign.deleteMany({});
    
    console.log('🗑️  Deleting clinic and doctor data...');
    await prisma.clinicHoliday.deleteMany({});
    await prisma.clinicSession.deleteMany({});
    await prisma.doctorAvailability.deleteMany({});
    await prisma.doctorClinic.deleteMany({});
    await prisma.clinicVerificationLog.deleteMany({});
    await prisma.clinicStaff.deleteMany({});
    await prisma.clinic.deleteMany({});
    
    console.log('🗑️  Deleting user profiles (non-admin)...');
    await prisma.dashboardWidgetPreference.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.doctorProfile.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.receptionistProfile.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.clinicOwnerProfile.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.patientProfile.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    
    console.log('🗑️  Deleting auth/session data (non-admin)...');
    await prisma.fcmToken.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.session.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.refreshToken.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: { notIn: adminUserIds },
      },
    });
    
    console.log('🗑️  Deleting verification records...');
    await prisma.otpVerification.deleteMany({});
    await prisma.otpAttempt.deleteMany({});
    await prisma.emailVerification.deleteMany({});
    await prisma.firebasePhoneVerification.deleteMany({});
    
    console.log('🗑️  Deleting audit logs (non-admin)...');
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { userId: null },
          { userId: { notIn: adminUserIds } },
        ],
      },
    });
    
    console.log('🗑️  Deleting non-admin users...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: { not: 'SUPER_ADMIN' },
      },
    });
    
    console.log(`\n✅ Database reset complete!`);
    console.log(`   - Deleted ${deletedUsers.count} non-admin users`);
    console.log(`   - Preserved ${adminUsers.length} admin user(s)`);
    console.log(`\n🎉 You can now start fresh clinic onboarding!\n`);

  } catch (error) {
    console.error('❌ Error during database reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetDatabase()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
