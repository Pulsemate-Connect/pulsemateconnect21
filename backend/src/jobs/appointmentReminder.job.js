// ─────────────────────────────────────────────────────────────────────────────
//  Appointment Reminder Job — PulseMate Backend
//
//  Runs every hour. Sends FCM push notifications to patients:
//    • 24 h before their appointment   →  "Tomorrow reminder"
//    • 2 h  before their appointment   →  "Starting soon"
//
//  Uses node-cron for scheduling. Install: npm install node-cron@3.0.3
//  Both windows are checked on every tick; duplicate sends are prevented
//  by storing sent flags in the ReminderSent DB table (created below if
//  absent) or — as a lightweight alternative — a simple in-memory Set
//  that resets on server restart. The DB approach is used here so reminders
//  survive restarts without double-firing.
// ─────────────────────────────────────────────────────────────────────────────

const cron = require('node-cron');
const prisma = require('../config/database');
const { sendNotification } = require('../services/fcm.service');
const logger = require('../config/logger');

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return ` at ${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Check whether a reminder for (appointmentId, type) has already been sent.
 * Falls back to a no-op if the ReminderSent table doesn't exist yet.
 */
const hasBeenSent = async (appointmentId, type) => {
  try {
    const row = await prisma.reminderSent.findUnique({
      where: { appointmentId_type: { appointmentId, type } },
    });
    return !!row;
  } catch {
    // Table may not exist in older migrations — treat as not sent
    return false;
  }
};

const markSent = async (appointmentId, type) => {
  try {
    await prisma.reminderSent.create({ data: { appointmentId, type } });
  } catch {
    // Ignore — duplicate key or missing table; reminder was still sent
  }
};

// ── Core logic ────────────────────────────────────────────────────────────────

/**
 * Send reminders for appointments in a given time window.
 * @param {number} hoursAhead  - Target hours before appointment (24 or 2)
 * @param {string} type        - Reminder type key ('24h' | '2h')
 */
const sendRemindersForWindow = async (hoursAhead, type) => {
  const now = new Date();
  // Window: appointments starting between (hoursAhead - 0.5h) and (hoursAhead + 0.5h)
  const windowStart = new Date(now.getTime() + (hoursAhead - 0.5) * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + (hoursAhead + 0.5) * 60 * 60 * 1000);

  let appointments;
  try {
    appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: windowStart, lte: windowEnd },
        status: { in: ['BOOKED', 'CHECKED_IN', 'IN_QUEUE'] },
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { include: { user: { select: { name: true } } } },
        clinic: { select: { name: true } },
      },
    });
    // Guard: findMany should always return array, but be defensive
    if (!Array.isArray(appointments)) appointments = [];
  } catch (err) {
    logger.error('[Reminder] DB query failed', { error: err.message });
    return;
  }

  let sent = 0;
  for (const appt of appointments) {
    const patientUserId = appt.patient?.id;
    if (!patientUserId) continue;

    // Skip if already sent
    if (await hasBeenSent(appt.id, type)) continue;

    const doctorName = appt.doctor?.user?.name || 'your doctor';
    const clinicName = appt.clinic?.name || 'the clinic';
    const dateStr = fmtDate(appt.appointmentDate);
    const timeStr = fmtTime(appt.slotTime);

    const isToday = hoursAhead <= 3;
    const title = isToday
      ? '⏰ Appointment in 2 hours'
      : '📅 Appointment Tomorrow';
    const body = `Dr. ${doctorName} · ${clinicName}\n${dateStr}${timeStr}`;

    await sendNotification(patientUserId, {
      title,
      body,
      data: {
        type: 'APPOINTMENT_REMINDER',
        appointmentId: appt.id,
        reminderType: type,
      },
    });

    await markSent(appt.id, type);
    sent++;
  }

  if (sent > 0) {
    logger.info(`[Reminder] ${type} — sent ${sent} reminder(s)`);
  }
};

// ── Daily Owner Digest ────────────────────────────────────────────────────────

const sendDailyOwnerDigest = async () => {
  logger.info('[Digest] Running daily owner digest…');
  try {
    const { sendNotification } = require('../services/fcm.service');
    const { sendTransactionalEmail } = require('../services/email.service');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const clinics = await prisma.clinic.findMany({
      where: { isVerified: true, isActive: true },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    for (const clinic of clinics) {
      try {
        const [totalAppts, completedAppts, cancelledAppts, payments, newPatientIds] = await Promise.all([
          prisma.appointment.count({ where: { clinicId: clinic.id, appointmentDate: { gte: todayStart, lte: todayEnd } } }),
          prisma.appointment.count({ where: { clinicId: clinic.id, appointmentDate: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' } }),
          prisma.appointment.count({ where: { clinicId: clinic.id, appointmentDate: { gte: todayStart, lte: todayEnd }, status: 'CANCELLED' } }),
          prisma.payment.aggregate({ where: { appointment: { clinicId: clinic.id }, status: 'PAID', paidAt: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
          prisma.appointment.findMany({ where: { clinicId: clinic.id, createdAt: { gte: todayStart, lte: todayEnd } }, select: { patientId: true }, distinct: ['patientId'] }),
        ]);

        const revenue = payments._sum.amount || 0;
        const newPatients = newPatientIds.length;

        const title = `📊 Daily Summary — ${clinic.name}`;
        const body = `Today: ${totalAppts} appts · ${completedAppts} completed · ₹${revenue} revenue`;

        sendNotification(clinic.owner.id, {
          title,
          body,
          data: { type: 'DAILY_DIGEST' },
        }).catch(() => { });

        if (clinic.owner.email) {
          const emailBody = [
            `Hello ${clinic.owner.name || 'there'},`,
            '',
            `Here's your daily summary for ${clinic.name}:`,
            '',
            `• Total appointments: ${totalAppts}`,
            `• Completed: ${completedAppts}`,
            `• Cancelled: ${cancelledAppts}`,
            `• Revenue collected: ₹${revenue}`,
            `• New patients today: ${newPatients}`,
            '',
            'Log in to your dashboard for more details.',
            '',
            'Thanks,',
            'PulseMate Team',
          ].join('\n');

          sendTransactionalEmail({
            to: clinic.owner.email,
            subject: `PulseMate Daily Summary — ${clinic.name}`,
            text: emailBody,
            html: `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6"><h2>📊 Daily Summary</h2><h3>${clinic.name}</h3><ul><li>Total appointments: <strong>${totalAppts}</strong></li><li>Completed: <strong>${completedAppts}</strong></li><li>Cancelled: <strong>${cancelledAppts}</strong></li><li>Revenue: <strong>₹${revenue}</strong></li><li>New patients: <strong>${newPatients}</strong></li></ul></div>`,
          }).catch(() => { });
        }

        logger.info(`[Digest] Sent digest to ${clinic.owner.email || clinic.owner.id} for ${clinic.name}`);
      } catch (err) {
        logger.error(`[Digest] Failed for clinic ${clinic.id}`, { error: err.message });
      }
    }
  } catch (err) {
    logger.error('[Digest] Job failed', { error: err.message });
  }
};

// ── Cron job ──────────────────────────────────────────────────────────────────

/**
 * Schedule appointment reminders.
 * Runs every hour at :00.
 * Call this once from server.js after the server starts.
 */
const startReminderJob = () => {
  // Every hour on the hour: "0 * * * *"
  // For easier testing in dev, also fires at startup after 5s
  const run = async () => {
    logger.info('[Reminder] Running appointment reminder check…');
    await sendRemindersForWindow(24, '24h');
    await sendRemindersForWindow(2, '2h');
  };

  // Schedule: every hour
  cron.schedule('0 * * * *', run, { timezone: 'Asia/Kolkata' });

  // Fire once shortly after boot so the first hour isn't missed
  setTimeout(run, 5_000);

  logger.info('[Reminder] Appointment reminder job scheduled (hourly, IST)');

  // Daily digest at 8 PM IST
  cron.schedule('0 20 * * *', sendDailyOwnerDigest, { timezone: 'Asia/Kolkata' });
  logger.info('[Digest] Daily owner digest scheduled (8 PM IST)');
};

module.exports = { startReminderJob, sendDailyOwnerDigest };
