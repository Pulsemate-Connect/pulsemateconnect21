/**
 * ============================================================================
 * NOTIFICATION SCHEDULER JOB
 * ============================================================================
 * Runs every minute to process scheduled notifications and retry failed ones
 * ============================================================================
 */

const cron = require('node-cron');
const logger = require('../config/logger');
const {
  processScheduledNotifications,
  retryFailedNotifications,
} = require('../services/notification-enhanced.service');

let isSchedulerRunning = false;
let isRetryRunning = false;

// ─── Process Scheduled Notifications (Every Minute) ──────────────────────────
const startNotificationScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    if (isSchedulerRunning) {
      logger.warn('[NOTIFICATION-JOB] Scheduler already running, skipping this run');
      return;
    }

    try {
      isSchedulerRunning = true;
      logger.debug('[NOTIFICATION-JOB] Starting scheduled notifications processor');
      await processScheduledNotifications();
      logger.debug('[NOTIFICATION-JOB] Completed scheduled notifications processor');
    } catch (error) {
      logger.error('[NOTIFICATION-JOB] Scheduler error:', error);
    } finally {
      isSchedulerRunning = false;
    }
  });

  logger.info('[NOTIFICATION-JOB] Notification scheduler started (runs every minute)');
};

// ─── Retry Failed Notifications (Every 5 Minutes) ────────────────────────────
const startNotificationRetry = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    if (isRetryRunning) {
      logger.warn('[NOTIFICATION-JOB] Retry already running, skipping this run');
      return;
    }

    try {
      isRetryRunning = true;
      logger.debug('[NOTIFICATION-JOB] Starting failed notifications retry');
      await retryFailedNotifications();
      logger.debug('[NOTIFICATION-JOB] Completed failed notifications retry');
    } catch (error) {
      logger.error('[NOTIFICATION-JOB] Retry error:', error);
    } finally {
      isRetryRunning = false;
    }
  });

  logger.info('[NOTIFICATION-JOB] Notification retry job started (runs every 5 minutes)');
};

// ─── Start Both Jobs ─────────────────────────────────────────────────────────
const startNotificationJobs = () => {
  startNotificationScheduler();
  startNotificationRetry();
  logger.info('[NOTIFICATION-JOB] All notification jobs started successfully');
};

module.exports = {
  startNotificationJobs,
  startNotificationScheduler,
  startNotificationRetry,
};
