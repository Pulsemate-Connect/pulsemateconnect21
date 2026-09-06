/**
 * Simple Database Clear - Keep Only Admins
 * Uses SQL to clear all tables safely
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('\n🗑️  DATABASE CLEANUP - KEEP ADMINS ONLY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Find admins
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { roles: { has: 'SUPER_ADMIN' } },
          { primaryRole: 'SUPER_ADMIN' }
        ]
      }
    });
    
    console.log(`Found ${adminUsers.length} admin users to keep:`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.name || admin.email} (${admin.id})`);
    });
    console.log('');
    
    const adminIds = adminUsers.map(u => u.id);
    
    if (adminIds.length === 0) {
      console.log('⚠️  No admins found! Aborting to prevent complete data loss.\n');
      return;
    }
    
    console.log('⚠️  This will delete ALL data except these admins!');
    console.log('Type "yes" to confirm: ');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise((resolve) => {
      readline.question('', (answer) => {
        readline.close();
        if (answer.toLowerCase() !== 'yes') {
          console.log('\n❌ Cancelled\n');
          process.exit(0);
        }
        resolve();
      });
    });
    
    console.log('\n🚀 Deleting...\n');
    
    // Delete tables one by one
    const tables = [
      'scheduled_notifications',
      'notifications',
      'notification_reads',
      'notification_preferences',
      'queue_items',
      'queues',
      'appointment_status_changes',
      'appointments',
      'payments',
      'sessions',
      'clinic_schedules',
      'temporary_closures',
      'clinic_staff',
      'doctor_invitations',
      'doctor_profiles',
      'patient_profiles',
      'receptionist_profiles',
      'clinic_owner_profiles',
      'clinics',
      'otp_verification',
      'email_verification',
      'refresh_tokens',
      'password_reset_tokens',
      'fcm_tokens',
      'audit_logs',
      'dashboard_widget_preferences',
      'verification_logs'
    ];
    
    for (const table of tables) {
      try {
        const result = await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
        console.log(`   ✅ ${table}: deleted`);
      } catch (e) {
        console.log(`   ⚠️  ${table}: skipped (${e.message.substring(0, 50)})`);
      }
    }
    
    // Delete user role mappings (keep admin ones)
    try {
      await prisma.$executeRawUnsafe(`
        DELETE FROM "user_role_mappings" WHERE "userId" NOT IN (${adminIds.map((_, i) => `$${i + 1}`).join(',')})
      `, ...adminIds);
      console.log(`   ✅ user_role_mappings: deleted (kept admin mappings)`);
    } catch (e) {
      console.log(`   ⚠️  user_role_mappings: skipped (table doesn't exist)`);
    }
    
    // Delete admin profiles (keep admin ones)
    try {
      await prisma.$executeRawUnsafe(`
        DELETE FROM "admin_profiles" WHERE "userId" NOT IN (${adminIds.map((_, i) => `$${i + 1}`).join(',')})
      `, ...adminIds);
      console.log(`   ✅ admin_profiles: deleted (kept admin profiles)`);
    } catch (e) {
      console.log(`   ⚠️  admin_profiles: skipped (table doesn't exist)`);
    }
    
    // Delete non-admin users
    try {
      await prisma.$executeRawUnsafe(`
        DELETE FROM "users" WHERE id NOT IN (${adminIds.map((_, i) => `$${i + 1}`).join(',')})
      `, ...adminIds);
      console.log(`   ✅ users: deleted (kept ${adminIds.length} admins)`);
    } catch (e) {
      console.log(`   ⚠️  users: error - ${e.message}`);
    }
    
    console.log('✅ Database cleaned!\n');
    console.log(`Kept ${adminIds.length} admin users.`);
    console.log('All other data deleted.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
