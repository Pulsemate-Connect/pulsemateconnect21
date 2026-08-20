const cron = require('node-cron');
const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Cleanup Expired Refresh Tokens Job
 * 
 * Runs daily at 2 AM to delete:
 * 1. Expired refresh tokens (expiresAt < now)
 * 2. Revoked tokens older than 30 days (for audit trail)
 * 
 * This keeps the database clean and maintains performance.
 */
const cleanupExpiredTokens = async () => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Delete expired tokens
    const expiredResult = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    // Delete old revoked tokens (keep for 30 days for audit)
    const revokedResult = await prisma.refreshToken.deleteMany({
      where: {
        revokedAt: { not: null, lt: thirtyDaysAgo },
      },
    });

    const totalDeleted = expiredResult.count + revokedResult.count;

    if (totalDeleted > 0) {
      logger.info(`[Cleanup] Deleted ${totalDeleted} expired/revoked refresh tokens (${expiredResult.count} expired, ${revokedResult.count} old revoked)`);
    }

    return totalDeleted;
  } catch (error) {
    logger.error('[Cleanup] Error cleaning up refresh tokens:', error);
    throw error;
  }
};

/**
 * Start the cleanup job
 * Runs daily at 2:00 AM server time
 */
const startCleanupJob = () => {
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('[Cleanup] Starting expired token cleanup job');
    try {
      await cleanupExpiredTokens();
    } catch (error) {
      logger.error('[Cleanup] Token cleanup job failed:', error);
    }
  });

  logger.info('[Cleanup] Token cleanup job scheduled (daily at 2:00 AM)');
};

module.exports = {
  cleanupExpiredTokens,
  startCleanupJob,
};
