const prisma = require('../config/database');

/**
 * Get or create a Queue row — safe against race conditions.
 *
 * The Queue.date field is @db.Date (date-only). Prisma requires querying it
 * with a Date at UTC midnight. We normalise here to be sure.
 *
 * Runs OUTSIDE any Prisma transaction to avoid PostgreSQL 25P02.
 */
const getOrCreateQueue = async (clinicId, doctorId, date, sessionId) => {
  const sid = sessionId || null;

  // Normalise to UTC midnight — critical for @db.Date comparisons
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);

  const where = sid
    ? { clinicId, doctorId, date: d, sessionId: sid }
    : { clinicId, doctorId, date: d, sessionId: null };

  // Step 1 — optimistic read
  let q = await prisma.queue.findFirst({ where });
  if (q) return q;

  // Step 2 — try to create
  try {
    q = await prisma.queue.create({
      data: {
        clinicId,
        doctorId,
        date: d,
        status: 'ACTIVE',
        ...(sid ? { sessionId: sid } : {}),
      },
    });
    return q;
  } catch (err) {
    if (err.code !== 'P2002') throw err;
    // P2002 — concurrent request won the race, fall through to re-fetch
  }

  // Step 3 — re-fetch after losing the race
  // Add a small delay to let the winning transaction commit
  await new Promise((resolve) => setTimeout(resolve, 100));

  q = await prisma.queue.findFirst({ where });

  // Last resort: search without date filter in case of date type mismatch
  if (!q) {
    q = await prisma.queue.findFirst({
      where: sid
        ? { clinicId, doctorId, sessionId: sid }
        : { clinicId, doctorId, sessionId: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!q) throw new Error(
    `getOrCreateQueue: row missing after P2002 — clinicId=${clinicId} doctorId=${doctorId} date=${d.toISOString()} sessionId=${sid}`
  );
  return q;
};

module.exports = { getOrCreateQueue };
