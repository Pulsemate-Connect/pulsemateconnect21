const prisma = require('../config/database');

/**
 * Create a new verified-phone record after Firebase token validation.
 */
const create = (data) =>
  prisma.firebasePhoneVerification.create({ data });

/**
 * Find the most recent valid (not used, not expired) record for a
 * mobile + purpose combination.
 */
const findLatestValid = (mobile, purpose) =>
  prisma.firebasePhoneVerification.findFirst({
    where: {
      mobile,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

/**
 * Invalidate (mark used) all outstanding records for mobile + purpose.
 * Called before creating a new one to prevent stale records.
 */
const invalidateOutstanding = (mobile, purpose) =>
  prisma.firebasePhoneVerification.updateMany({
    where: { mobile, purpose, isUsed: false },
    data: { isUsed: true },
  });

/**
 * Mark a single record as used once it is consumed at registration.
 */
const markUsed = (id) =>
  prisma.firebasePhoneVerification.update({
    where: { id },
    data: { isUsed: true },
  });

module.exports = {
  create,
  findLatestValid,
  invalidateOutstanding,
  markUsed,
};
