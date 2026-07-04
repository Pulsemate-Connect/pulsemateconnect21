const prisma = require('../config/database');

/**
 * Atomically get or create a Queue row.
 *
 * Uses raw SQL INSERT ... ON CONFLICT DO NOTHING so it is safe against race
 * conditions AND against Prisma's inability to upsert on nullable unique fields.
 *
 * @param {string} clinicId
 * @param {string} doctorId
 * @param {Date}   date       - UTC midnight date (setUTCHours(0,0,0,0) already applied)
 * @param {string|null} sessionId
 * @returns {Promise<Queue>}
 */
const getOrCreateQueue = async (clinicId, doctorId, date, sessionId) => {
  const sid = sessionId || null;

  if (sid) {
    await prisma.$executeRaw`
      INSERT INTO queues ("id", "clinicId", "doctorId", "date", "sessionId", "status", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${clinicId}, ${doctorId}, ${date}, ${sid}, 'ACTIVE', NOW(), NOW())
      ON CONFLICT ("clinicId", "doctorId", "date", "sessionId") DO NOTHING
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO queues ("id", "clinicId", "doctorId", "date", "sessionId", "status", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${clinicId}, ${doctorId}, ${date}, NULL, 'ACTIVE', NOW(), NOW())
      ON CONFLICT ("clinicId", "doctorId", "date", "sessionId") DO NOTHING
    `;
  }

  const q = await prisma.queue.findFirst({
    where: sid
      ? { clinicId, doctorId, date, sessionId: sid }
      : { clinicId, doctorId, date, sessionId: null },
  });

  if (!q) throw new Error(`getOrCreateQueue: row missing after insert — clinicId=${clinicId} doctorId=${doctorId} date=${date} sessionId=${sid}`);
  return q;
};

module.exports = { getOrCreateQueue };
