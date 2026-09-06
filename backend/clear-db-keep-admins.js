/**
 * Clear Database - Keep Only Admins
 * 
 * This script removes ALL data except:
 * - Admin users and their profiles
 * - Essential system data
 * 
 * ⚠️ WARNING: This will DELETE all patients, doctors, clinics, appointments, etc.
 * 
 * Usage: node clear-db-keep-admins.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('\n🗑️  DATABASE CLEANUP - KEEP ADMINS ONLY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Get all admin user IDs
    console.log('Step 1: Finding admin users...');
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { roles: { has: 'SUPER_ADMIN' } },
          { primaryRole: 'SUPER_ADMIN' }
        ]
      },
      select: { id: true, email: true, name: true, role: true, primaryRole: true }
    });
    
    console.log(`   ✅ Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(admin => {
      console.log(`      - ${admin.name || admin.email} (${admin.id})`);
    });
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️  WARNING: No admin users found! Database will be completely empty.');
      console.log('   Consider creating an admin first before running this script.\n');
      
      // Ask for confirmation
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise((resolve) => {
        readline.question('Continue anyway? (yes/no): ', (answer) => {
          readline.close();
          if (answer.toLowerCase() !== 'yes') {
            console.log('\n❌ Operation cancelled.\n');
            process.exit(0);
          }
          resolve();
        });
      });
    }
    
    const adminUserIds = adminUsers.map(u => u.id);
    
    console.log('\n⚠️  FINAL WARNING:');
    console.log('   This will DELETE ALL data except the admin users listed above!');
    console.log('   - All patients, doctors, clinics');
    console.log('   - All appointments, payments, prescriptions');
    console.log('   - All notifications, OTPs, sessions');
    console.log('   - Everything except admins!\n');
    
    // Confirm
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise((resolve) => {
      readline.question('Type "DELETE ALL" to confirm: ', (answer) => {
        readline.close();
        if (answer !== 'DELETE ALL') {
          console.log('\n❌ Operation cancelled. Database unchanged.\n');
          process.exit(0);
        }
        resolve();
      });
    });
    
    console.log('\n🚀 Starting database cleanup...\n');
    
    // Step 2: Delete in correct order (respecting foreign keys)
    
    console.log('Step 2: Deleting scheduled notifications...');
    const scheduledNotifs = await prisma.scheduledNotification.deleteMany({});
    console.log(`   ✅ Deleted ${scheduledNotifs.count} scheduled notifications`);
    
    console.log('Step 3: Deleting notifications...');
    const notifs = await prisma.notification.deleteMany({});
    console.log(`   ✅ Deleted ${notifs.count} notifications`);
    
    console.log('Step 4: Deleting notification reads...');
    const notifReads = await prisma.notificationRead.deleteMany({});
    console.log(`   ✅ Deleted ${notifReads.count} notification reads`);
    
    console.log('Step 5: Deleting notification preferences...');
    const notifPrefs = await prisma.notificationPreference.deleteMany({});
    console.log(`   ✅ Deleted ${notifPrefs.count} notification preferences`);
    
    console.log('Step 6: Deleting queue items...');
    const queueItems = await prisma.queueItem.deleteMany({});
    console.log(`   ✅ Deleted ${queueItems.count} queue items`);
    
    console.log('Step 7: Deleting queues...');
    const queues = await prisma.queue.deleteMany({});
    console.log(`   ✅ Deleted ${queues.count} queues`);
    
    console.log('Step 8: Deleting prescriptions...');
    try {
      const prescriptions = await prisma.prescription.deleteMany({});
      console.log(`   ✅ Deleted ${prescriptions.count} prescriptions`);
    } catch (e) {
      console.log(`   ⚠️  Prescription table not found, skipping...`);
    }
    
    console.log('Step 9: Deleting appointment status changes...');
    const statusChanges = await prisma.appointmentStatusChange.deleteMany({});
    console.log(`   ✅ Deleted ${statusChanges.count} appointment status changes`);
    
    console.log('Step 10: Deleting appointments...');
    const appointments = await prisma.appointment.deleteMany({});
    console.log(`   ✅ Deleted ${appointments.count} appointments`);
    
    console.log('Step 11: Deleting payments...');
    const payments = await prisma.payment.deleteMany({});
    console.log(`   ✅ Deleted ${payments.count} payments`);
    
    console.log('Step 12: Deleting sessions...');
    const sessions = await prisma.session.deleteMany({});
    console.log(`   ✅ Deleted ${sessions.count} sessions`);
    
    console.log('Step 13: Deleting clinic schedules...');
    const schedules = await prisma.clinicSchedule.deleteMany({});
    console.log(`   ✅ Deleted ${schedules.count} clinic schedules`);
    
    console.log('Step 14: Deleting temporary closures...');
    const closures = await prisma.temporaryClosure.deleteMany({});
    console.log(`   ✅ Deleted ${closures.count} temporary closures`);
    
    console.log('Step 15: Deleting clinic staff...');
    const staff = await prisma.clinicStaff.deleteMany({});
    console.log(`   ✅ Deleted ${staff.count} clinic staff`);
    
    console.log('Step 16: Deleting doctor invitations...');
    const invitations = await prisma.doctorInvitation.deleteMany({});
    console.log(`   ✅ Deleted ${invitations.count} doctor invitations`);
    
    console.log('Step 17: Deleting doctor profiles...');
    const doctorProfiles = await prisma.doctorProfile.deleteMany({});
    console.log(`   ✅ Deleted ${doctorProfiles.count} doctor profiles`);
    
    console.log('Step 18: Deleting patient profiles...');
    const patientProfiles = await prisma.patientProfile.deleteMany({});
    console.log(`   ✅ Deleted ${patientProfiles.count} patient profiles`);
    
    console.log('Step 19: Deleting receptionist profiles...');
    const receptionistProfiles = await prisma.receptionistProfile.deleteMany({});
    console.log(`   ✅ Deleted ${receptionistProfiles.count} receptionist profiles`);
    
    console.log('Step 20: Deleting clinic owner profiles...');
    const ownerProfiles = await prisma.clinicOwnerProfile.deleteMany({});
    console.log(`   ✅ Deleted ${ownerProfiles.count} clinic owner profiles`);
    
    console.log('Step 21: Deleting clinics...');
    const clinics = await prisma.clinic.deleteMany({});
    console.log(`   ✅ Deleted ${clinics.count} clinics`);
    
    console.log('Step 22: Deleting OTP verifications...');
    const otps = await prisma.otpVerification.deleteMany({});
    console.log(`   ✅ Deleted ${otps.count} OTP verifications`);
    
    console.log('Step 23: Deleting email verifications...');
    const emailVerifs = await prisma.emailVerification.deleteMany({});
    console.log(`   ✅ Deleted ${emailVerifs.count} email verifications`);
    
    console.log('Step 24: Deleting refresh tokens...');
    const refreshTokens = await prisma.refreshToken.deleteMany({});
    console.log(`   ✅ Deleted ${refreshTokens.count} refresh tokens`);
    
    console.log('Step 25: Deleting password reset tokens...');
    const resetTokens = await prisma.passwordResetToken.deleteMany({});
    console.log(`   ✅ Deleted ${resetTokens.count} password reset tokens`);
    
    console.log('Step 26: Deleting FCM tokens...');
    const fcmTokens = await prisma.fcmToken.deleteMany({});
    console.log(`   ✅ Deleted ${fcmTokens.count} FCM tokens`);
    
    console.log('Step 27: Deleting audit logs...');
    const auditLogs = await prisma.auditLog.deleteMany({});
    console.log(`   ✅ Deleted ${auditLogs.count} audit logs`);
    
    console.log('Step 28: Deleting user role mappings (non-admin)...');
    const roleMappings = await prisma.userRoleMapping.deleteMany({
      where: {
        userId: { notIn: adminUserIds }
      }
    });
    console.log(`   ✅ Deleted ${roleMappings.count} user role mappings`);
    
    console.log('Step 29: Deleting non-admin users...');
    const users = await prisma.user.deleteMany({
      where: {
        id: { notIn: adminUserIds }
      }
    });
    console.log(`   ✅ Deleted ${users.count} non-admin users`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ DATABASE CLEANUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   - Admin users kept: ${adminUsers.length}`);
    console.log(`   - All other data: DELETED`);
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Admin login should still work');
    console.log('   3. Start fresh with new data\n');
    
  } catch (error) {
    console.error('\n❌ ERROR during cleanup:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearDatabase();
