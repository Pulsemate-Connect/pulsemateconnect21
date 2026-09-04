#!/usr/bin/env node
/**
 * Check Notifications - Verify push notifications are working
 * 
 * Usage:
 *   node check-notifications.js
 *   node check-notifications.js 9663080521
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotifications() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         📊 PulseMate - Notification System Check           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const mobile = process.argv[2] || '9663080521';

  try {
    // ── Step 1: Find Patient ─────────────────────────────────────────────
    console.log(`🔍 Searching for patient: ${mobile}\n`);

    const patient = await prisma.user.findFirst({
      where: { mobile },
      include: {
        patientProfile: {
          select: { patientName: true }
        }
      }
    });

    if (!patient) {
      console.log(`❌ Patient not found with mobile: ${mobile}`);
      console.log('\nAvailable test patients:');
      console.log('  - 9663080521 (Akshata)');
      console.log('  - 9999999999 (Test Patient)\n');
      return;
    }

    console.log('✅ Patient Found:');
    console.log(`   ID: ${patient.id}`);
    console.log(`   Name: ${patient.patientProfile?.patientName || patient.name}`);
    console.log(`   Mobile: ${patient.mobile}`);
    console.log(`   Email: ${patient.email || 'N/A'}\n`);

    console.log('═'.repeat(70) + '\n');

    // ── Step 2: Check FCM Tokens ─────────────────────────────────────────
    console.log('🔔 FCM Token Status:\n');

    const tokens = await prisma.fcmToken.findMany({
      where: { userId: patient.id },
      orderBy: { updatedAt: 'desc' }
    });

    if (tokens.length === 0) {
      console.log('❌ No FCM tokens registered for this user\n');
      console.log('📱 Action Required:');
      console.log('   1. Open PulseMate app on your phone');
      console.log('   2. Login as this user');
      console.log('   3. Grant notification permissions');
      console.log('   4. App will auto-register FCM token\n');
    } else {
      console.log(`✅ Total Tokens: ${tokens.length}\n`);
      tokens.forEach((token, i) => {
        console.log(`   Token ${i + 1}:`);
        console.log(`   Platform: ${token.platform}`);
        console.log(`   Token: ${token.token.substring(0, 60)}...`);
        console.log(`   Registered: ${token.createdAt.toLocaleString('en-IN')}`);
        console.log(`   Last Updated: ${token.updatedAt.toLocaleString('en-IN')}\n`);
      });
    }

    console.log('═'.repeat(70) + '\n');

    // ── Step 3: Check Notifications ──────────────────────────────────────
    console.log('📬 Recent Notifications:\n');

    const notifications = await prisma.notification.findMany({
      where: { userId: patient.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (notifications.length === 0) {
      console.log('❌ No notifications found for this user\n');
      console.log('📝 Possible Reasons:');
      console.log('   1. User hasn\'t booked any appointments yet');
      console.log('   2. Notifications are not being created (check backend logs)');
      console.log('   3. Database connection issue\n');
    } else {
      console.log(`✅ Total Notifications: ${notifications.length}\n`);

      const typeIcons = {
        APPOINTMENT_BOOKED: '📅',
        BOOKING_CONFIRMED: '✅',
        BOOKING_CANCELLED: '❌',
        QUEUE_CALLED: '🔔',
        QUEUE_UPDATE: '📊',
        PAYMENT_SUCCESS: '💳',
        PRESCRIPTION_READY: '💊',
        DOCTOR_NEW_APPOINTMENT: '👨‍⚕️',
        default: '📬'
      };

      notifications.forEach((notif, i) => {
        const icon = typeIcons[notif.type] || typeIcons.default;
        const readStatus = notif.isRead ? '✅ Read' : '❌ Unread';

        console.log(`${i + 1}. ${icon} ${notif.type}`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Status: ${readStatus}`);
        console.log(`   Created: ${notif.createdAt.toLocaleString('en-IN')}\n`);
      });
    }

    console.log('═'.repeat(70) + '\n');

    // ── Step 4: Check Recent Appointments ────────────────────────────────
    console.log('📅 Recent Appointments:\n');

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        doctor: {
          include: {
            user: { select: { name: true } }
          }
        },
        clinic: {
          select: { name: true }
        }
      }
    });

    if (appointments.length === 0) {
      console.log('❌ No appointments found\n');
    } else {
      console.log(`✅ Total Appointments: ${appointments.length}\n`);

      appointments.forEach((appt, i) => {
        const statusIcon = {
          CONFIRMED: '✅',
          PENDING_PAYMENT: '⏳',
          CANCELLED: '❌',
          COMPLETED: '✅',
          NO_SHOW: '❌'
        }[appt.status] || '📋';

        console.log(`${i + 1}. ${statusIcon} ${appt.status}`);
        console.log(`   Doctor: ${appt.doctor.user.name}`);
        console.log(`   Clinic: ${appt.clinic.name}`);
        console.log(`   Date: ${new Date(appt.appointmentDate).toLocaleDateString('en-IN')}`);
        console.log(`   Time: ${appt.slotTime || 'N/A'}`);
        console.log(`   Booked: ${appt.createdAt.toLocaleString('en-IN')}\n`);
      });
    }

    console.log('═'.repeat(70) + '\n');

    // ── Step 5: Firebase Configuration Check ─────────────────────────────
    console.log('🔥 Firebase Configuration:\n');

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const config = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        console.log('✅ Firebase Admin SDK configured');
        console.log(`   Project ID: ${config.project_id}`);
        console.log(`   Client Email: ${config.client_email}`);
        console.log(`   Status: Push notifications ENABLED\n`);
      } catch (error) {
        console.log('❌ Firebase JSON is malformed');
        console.log(`   Error: ${error.message}\n`);
      }
    } else {
      console.log('❌ FIREBASE_SERVICE_ACCOUNT_JSON not set');
      console.log('   Status: Push notifications DISABLED (dev mode)');
      console.log('   Action: Add to Render environment variables\n');
    }

    console.log('═'.repeat(70) + '\n');

    // ── Summary ──────────────────────────────────────────────────────────
    console.log('📊 Summary:\n');

    const summary = {
      patient: patient ? '✅' : '❌',
      tokens: tokens.length > 0 ? '✅' : '❌',
      notifications: notifications.length > 0 ? '✅' : '❌',
      appointments: appointments.length > 0 ? '✅' : '❌',
      firebase: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? '✅' : '❌'
    };

    console.log(`   Patient Found: ${summary.patient}`);
    console.log(`   FCM Tokens: ${summary.tokens} (${tokens.length})`);
    console.log(`   Notifications: ${summary.notifications} (${notifications.length})`);
    console.log(`   Appointments: ${summary.appointments} (${appointments.length})`);
    console.log(`   Firebase Config: ${summary.firebase}\n`);

    const allGood = Object.values(summary).every(v => v === '✅');

    if (allGood) {
      console.log('✅ All systems operational! Push notifications should work.\n');
    } else {
      console.log('⚠️  Some issues detected. See details above.\n');

      if (summary.firebase === '❌') {
        console.log('🔴 CRITICAL: Firebase not configured');
        console.log('   Add FIREBASE_SERVICE_ACCOUNT_JSON to Render env vars\n');
      }

      if (summary.tokens === '❌') {
        console.log('⚠️  No FCM tokens registered');
        console.log('   Open app and grant notification permissions\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nStack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }

  console.log('═'.repeat(70) + '\n');
}

checkNotifications()
  .then(() => {
    console.log('✅ Check complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
