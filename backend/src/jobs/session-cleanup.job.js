/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SESSION CLEANUP JOB — PulseMate Connect
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Periodic cleanup of expired and revoked sessions from the database.
 * 
 * Runs at configurable interval (default: daily)
 * Removes:
 * - Expired sessions (past expiresAt timestamp)
 * - Revoked sessions older than 30 days
 * 
 * Benefits:
 * - Keeps session table size manageable
 * - Improves query performance
 * - Removes stale data
 * - Maintains database hygiene
 * 
 * @module jobs/session-cleanup.job
 */

const cron = require('node-cron');
const logger = require('../config/logger');
const { cleanupExpiredSessions } = require('../services/session.service');

let cronJob = null;

/**
 * Start the session cleanup cron job
 * Runs at configured interval (default: daily at 2 AM)
 */
const startSessionCleanupJob = () => {
  // Get cleanup interval from environment (default: 24 hours)
  const intervalHours = parseInt(process.env.SESSION_CLEANUP_INTERVAL_HOURS || '24', 10);
  
  // Convert hours to cron expression
  // For daily cleanup at 2 AM: '0 2 * * *'
  // For every N hours: `0 */${intervalHours} * * *`
  let cronExpression;
  if (intervalHours === 24) {
    // Daily at 2 AM (optimal for low-traffic time)
    cronExpression = '0 2 * * *';
  } else if (intervalHours < 24) {
    // Every N hours
    cronExpression = `0 */${intervalHours} * * *`;
  } else {
    // Default to daily
    cronExpression = '0 2 * * *';
  }
  
  logger.info('[Session Cleanup Job] Starting', {
    interval: `${intervalHours} hours`,
    cronExpression,
  });
  
  // Schedule the job
  cronJob = cron.schedule(cronExpression, async () => {
    try {
      logger.info('[Session Cleanup Job] Running...');
      
      const deletedCount = await cleanupExpiredSessions();
      
      logger.info('[Session Cleanup Job] Completed', {
        deletedSessions: deletedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[Session Cleanup Job] Error', {
        error: error.message,
        stack: error.stack,
      });
    }
  });
  
  logger.info('[Session Cleanup Job] Scheduled successfully');
  
  return cronJob;
};

/**
 * Stop the session cleanup job
 */
const stopSessionCleanupJob = () => {
  if (cronJob) {
    cronJob.stop();
    logger.info('[Session Cleanup Job] Stopped');
  }
};

/**
 * Run cleanup immediately (for manual triggers or testing)
 */
const runCleanupNow = async () => {
  try {
    logger.info('[Session Cleanup Job] Running manual cleanup...');
    const deletedCount = await cleanupExpiredSessions();
    logger.info('[Session Cleanup Job] Manual cleanup completed', {
      deletedSessions: deletedCount,
    });
    return deletedCount;
  } catch (error) {
    logger.error('[Session Cleanup Job] Manual cleanup error', {
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  startSessionCleanupJob,
  stopSessionCleanupJob,
  runCleanupNow,
};
