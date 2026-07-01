/**
 * fix-session-types.js
 *
 * One-time script: corrects ClinicSession records where the sessionType
 * label does not match the actual stored startTime.
 *
 * Rules:
 *   startTime  06:00–11:59 → MORNING
 *   startTime  12:00–17:59 → AFTERNOON
 *   startTime  18:00–23:59 → EVENING
 *
 * sortOrder is also re-assigned (MORNING=1, AFTERNOON=2, EVENING=3).
 *
 * Run once from the backend directory:
 *   node fix-session-types.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function deriveSessionType(startTime) {
  const hour = parseInt(startTime.split(':')[0], 10);
  if (hour >= 6 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 18) return 'AFTERNOON';
  return 'EVENING';
}

const SORT_ORDER = { MORNING: 1, AFTERNOON: 2, EVENING: 3 };

async function main() {
  const sessions = await prisma.clinicSession.findMany();
  let fixed = 0;

  for (const sess of sessions) {
    const correct = deriveSessionType(sess.startTime);
    if (sess.sessionType !== correct || sess.sortOrder !== SORT_ORDER[correct]) {
      console.log(
        `Fixing session ${sess.id} (${sess.name}): ` +
        `${sess.sessionType} → ${correct}, startTime=${sess.startTime}`
      );
      await prisma.clinicSession.update({
        where: { id: sess.id },
        data: {
          sessionType: correct,
          sortOrder: SORT_ORDER[correct],
        },
      });
      fixed++;
    }
  }

  console.log(`\nDone. Fixed ${fixed} of ${sessions.length} sessions.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
