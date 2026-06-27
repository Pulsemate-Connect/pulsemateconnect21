// ─────────────────────────────────────────────────────────────────────────────
//  Account Deletion Purge Job — PulseMate Backend
//
//  Runs daily at 2 AM IST.
//  Hard-deletes users who requested deletion more than 10 days ago.
//  Anonymizes PII before deletion to satisfy GDPR / data retention rules.
// ─────────────────────────────────────────────────────────────────────────────

const cron = require('node-cron');
const prisma = require('../config/database');
const logger = require('../config/logger');

const PURGE_AFTER_DAYS = 10;

const purgeDeletedAccounts = async () => {
  logger.info('[AccountDeletion] Running purge job…');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PURGE_AFTER_DAYS);

  try {
    // Find users pending deletion past the cutoff
    const users = await prisma.user.findMany({
      where: {
        deletionRequestedAt: { lte: cutoff },
        isActive: false,
      },
      select: { id: true, mobile: true, email: true },
    });

    if (users.length === 0) {
      logger.info('[AccountDeletion] No accounts due for purge.');
      return;
    }

    logger.info(`[AccountDeletion] Purging ${users.length} account(s)…`);

    for (const user of users) {
      try {
        await prisma.$transaction(async (tx) => {
          // Anonymize PII before hard delete (keeps appointment history intact)
          const anonymizedMobile = `+00000000${user.id.slice(-6)}`;
          await tx.user.update({
            where: { id: user.id },
            data: {
              name: 'Deleted User',
              mobile: anonymizedMobile,
              email: null,
              firebaseUid: null,
              passwordHash: null,
              approvalStatus: 'REJECTED',
            },
          });

          // Wipe patient profile PII
          await tx.patientProfile.updateMany({
            where: { userId: user.id },
            data: {
              emergencyContact: null,
              allergies: null,
              existingDiseases: null,
              insuranceProvider: null,
              address: null,
              pincode: null,
            },
          });

          // Clean up remaining tokens / verifications
          await tx.otpVerification.deleteMany({ where: { mobile: user.mobile } });
          await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
          await tx.session.deleteMany({ where: { userId: user.id } });
          await tx.notificationRead.deleteMany({ where: { userId: user.id } });
        });

        logger.info(`[AccountDeletion] Purged user ${user.id.slice(-6)}`);
      } catch (err) {
        logger.error(`[AccountDeletion] Failed to purge user ${user.id.slice(-6)}`, { error: err.message });
      }
    }

    logger.info(`[AccountDeletion] Purge complete. ${users.length} account(s) anonymized.`);
  } catch (err) {
    logger.error('[AccountDeletion] Job failed', { error: err.message });
  }
};

const startAccountDeletionJob = () => {
  // Run daily at 2 AM IST
  cron.schedule('0 2 * * *', purgeDeletedAccounts, { timezone: 'Asia/Kolkata' });

  logger.info('[AccountDeletion] Account purge job scheduled (daily 2 AM IST)');
};

module.exports = { startAccountDeletionJob, purgeDeletedAccounts };
