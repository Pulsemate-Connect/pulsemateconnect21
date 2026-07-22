// ─────────────────────────────────────────────────────────────────────────────
//  Follow-Up Reminder Job — PulseMate Backend
//
//  Runs daily at 8:00 AM IST.
//  Refreshes follow-up statuses (PENDING → UPCOMING → DUE → OVERDUE) for all
//  clinics, then sends FCM push notifications to patients:
//    • 3 days before follow-up date  → "Due in 3 days"
//    • 1 day before follow-up date   → "Due tomorrow"
//    • On follow-up date             → "Due today"
//    • After due date (overdue)      → "Overdue" (once, on transition)
//
//  Notifications are NOT sent when the follow-up is BOOKED or COMPLETED.
//  Duplicate sends prevented by status transitions — only notified once per
//  status change using a simple status tracking approach.
// ─────────────────────────────────────────────────────────────────────────────

const cron = require('node-cron');
const prisma = require('../config/database');
const {
  notifyFollowUpDueSoon,
  notifyFollowUpDueToday,
  notifyFollowUpOverdue,
} = require('../services/fcm.service');
const { computeStatus } = require('../services/followupManager.service');
const logger = require('../config/logger');

/**
 * Process all active follow-ups:
 * 1. Refresh computed status in DB (PENDING/UPCOMING/DUE/OVERDUE)
 * 2. Send appropriate reminders for each status transition
 */
const runFollowUpReminders = async () => {
  logger.info('[FollowUpReminder] Running follow-up status refresh and reminders…');

  try {
    // Get all clinics that have the follow-up feature enabled
    const clinicSettings = await prisma.clinicFollowUpSettings.findMany({
      where: { followUpEnabled: true },
      select: { clinicId: true, gracePeriodDays: true },
    });

    let totalUpdated = 0;
    let totalNotified = 0;

    for (const setting of clinicSettings) {
      try {
        // Get all active follow-ups for this clinic (not booked/completed/cancelled)
        const activeFollowUps = await prisma.followUp.findMany({
          where: {
            clinicId: setting.clinicId,
            status: { notIn: ['BOOKED', 'COMPLETED', 'CANCELLED'] },
          },
          include: {
            patient: { select: { id: true, name: true } },
            doctor: { include: { user: { select: { id: true, name: true } } } },
          },
        });

        for (const fu of activeFollowUps) {
          const previousStatus = fu.status;
          const newStatus = computeStatus(fu, setting.gracePeriodDays);

          // Update status in DB if it changed
          if (newStatus !== previousStatus) {
            await prisma.followUp.update({
              where: { id: fu.id },
              data: { status: newStatus },
            });
            totalUpdated++;
          }

          // Send notifications based on date proximity
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const dueDate = new Date(fu.followUpDate);
          const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          const daysUntilDue = Math.round((dueDateOnly - today) / (1000 * 60 * 60 * 24));

          const doctorName = fu.doctor?.user?.name || 'your doctor';

          // Only notify if not already booked/completed
          if (['PENDING', 'UPCOMING', 'DUE', 'OVERDUE'].includes(newStatus)) {
            if (daysUntilDue === 3 || daysUntilDue === 1) {
              await notifyFollowUpDueSoon(fu.patientId, doctorName, fu.followUpDate, daysUntilDue).catch(() => { });
              totalNotified++;
            } else if (daysUntilDue === 0) {
              await notifyFollowUpDueToday(fu.patientId, doctorName).catch(() => { });
              totalNotified++;
            } else if (daysUntilDue < 0 && previousStatus !== 'OVERDUE' && newStatus === 'OVERDUE') {
              // Only notify on the day it first becomes overdue (status transition)
              await notifyFollowUpOverdue(fu.patientId, doctorName, fu.followUpDate).catch(() => { });
              totalNotified++;
            }
          }
        }
      } catch (err) {
        logger.error(`[FollowUpReminder] Failed for clinic ${setting.clinicId}`, { error: err.message });
      }
    }

    logger.info(`[FollowUpReminder] Done — ${totalUpdated} status updates, ${totalNotified} notifications sent`);
  } catch (err) {
    logger.error('[FollowUpReminder] Job failed', { error: err.message });
  }
};

/**
 * Schedule the follow-up reminder job.
 * Runs daily at 8:00 AM IST.
 * Call this once from server.js.
 */
const startFollowUpReminderJob = () => {
  // Daily at 8:00 AM IST
  cron.schedule('0 8 * * *', runFollowUpReminders, { timezone: 'Asia/Kolkata' });

  logger.info('[FollowUpReminder] Follow-up reminder job scheduled (daily 8 AM IST)');
};

module.exports = { startFollowUpReminderJob, runFollowUpReminders };
