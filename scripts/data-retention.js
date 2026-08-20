/**
 * PulseMate Data Retention Job
 * Run weekly via cron: 0 3 * * 0 node /opt/pulsemate/scripts/data-retention.js
 *
 * Retention policy:
 *   - OTP records:            90 days
 *   - Revoked refresh tokens: 90 days
 *   - Email verifications:    90 days
 *   - Password reset tokens:  90 days
 *   - Audit logs:             3 years
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const cutoff90d = new Date(Date.now() - 90 * DAY);
const cutoff3y = new Date(Date.now() - 3 * 365 * DAY);

async function runRetention() {
  console.log(`[${new Date().toISOString()}] Running data retention job...`);

  // OTP records
  const otpDeleted = await prisma.otpVerification.deleteMany({
    where: { createdAt: { lt: cutoff90d } },
  });
  console.log(`  OTP records deleted: ${otpDeleted.count}`);

  // Revoked/expired refresh tokens
  const tokensDeleted = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { revokedAt: { lt: cutoff90d } },
        { expiresAt: { lt: cutoff90d } },
      ],
    },
  });
  console.log(`  Refresh tokens deleted: ${tokensDeleted.count}`);

  // Used/expired email verifications
  const emailVerifDeleted = await prisma.emailVerification.deleteMany({
    where: { createdAt: { lt: cutoff90d } },
  });
  console.log(`  Email verifications deleted: ${emailVerifDeleted.count}`);

  // Used/expired password reset tokens
  const pwResetDeleted = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: cutoff90d } },
  });
  console.log(`  Password reset tokens deleted: ${pwResetDeleted.count}`);

  // Audit logs older than 3 years
  const auditDeleted = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff3y } },
  });
  console.log(`  Audit logs deleted: ${auditDeleted.count}`);

  console.log(`[${new Date().toISOString()}] Data retention job complete.`);
}

runRetention()
  .catch((err) => {
    console.error('Data retention job failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
