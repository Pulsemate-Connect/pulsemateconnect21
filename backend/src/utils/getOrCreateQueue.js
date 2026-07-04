const prisma = require('../config/database');

/**
 * Get or create a Queue row — safe against race conditions.
 *
 * Strategy:
 *   1. findFirst — return immediately if exists
 *   2. create — if P2002 unique violation, another request beat us to it
 *   3. findFirst again — guaranteed to find it after P2002
 *
 * This runs OUTSIDE any Prisma transaction so PostgreSQL 25P02 cannot fire.
 *
 * @param {string}      clinicId
 * @param {string}      doctorId
 * @param {Date}        date      — must already be UTC midnight (@db.Date)
 * @param {string|null} sessionId
 * @returns {Promise<Queue>}
 */
const getOrCreateQueue = async (clinicId, doctorId, date, sessionId) => {
  const sid = sessionId || null;
  const where = sid
    ? { clinicId, doctorId, date, sessionId: sid }
    : { clinicId, doctorId, date, sessionId: null };

  // Step 1 — optimistic read (covers 99% of requests after first booking)
  let q = await prisma.queue.findFirst({ where });
  if (q) return q;

  // Step 2 — try to create
  try {
    q = await prisma.queue.create({
      data: {
        clinicId,
        doctorId,
        date,
        status: 'ACTIVE',
        ...(sid ? { sessionId: sid } : {}),
      },
    });
    return q;
  } catch (err) {
    // P2002 = concurrent request created the row between our findFirst and create
    if (err.code !== 'P2002') throw err;
  }

  // Step 3 — race lost, fetch the winner's row
  q = await prisma.queue.findFirst({ where });
  if (!q) throw new Error(
    `getOrCreateQueue: row still missing after P2002 — clinicId=${clinicId} doctorId=${doctorId} date=${date} sessionId=${sid}`
  );
  return q;
};

module.exports = { getOrCreateQueue };
