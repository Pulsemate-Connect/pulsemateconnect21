/**
 * clear-data.js
 * Deletes all clinic, patient, doctor, receptionist, appointment, queue,
 * prescription, payment, and related data.
 * KEEPS the root super-admin account intact.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Starting data clear...\n');

  // ── 1. Reminder tracking ──────────────────────────────────────────────────
  const r1 = await prisma.reminderSent.deleteMany();
  console.log(`  reminderSent        deleted: ${r1.count}`);

  // ── 2. Audit logs ─────────────────────────────────────────────────────────
  const r2 = await prisma.auditLog.deleteMany();
  console.log(`  auditLog            deleted: ${r2.count}`);

  // ── 3. FCM tokens ─────────────────────────────────────────────────────────
  const r3 = await prisma.fcmToken.deleteMany();
  console.log(`  fcmToken            deleted: ${r3.count}`);

  // ── 4. Payments ───────────────────────────────────────────────────────────
  const r4 = await prisma.payment.deleteMany();
  console.log(`  payment             deleted: ${r4.count}`);

  // ── 5. Prescriptions ──────────────────────────────────────────────────────
  const r5 = await prisma.prescription.deleteMany();
  console.log(`  prescription        deleted: ${r5.count}`);

  // ── 6. Queue items ────────────────────────────────────────────────────────
  const r6 = await prisma.queueItem.deleteMany();
  console.log(`  queueItem           deleted: ${r6.count}`);

  // ── 7. Queues ─────────────────────────────────────────────────────────────
  const r7 = await prisma.queue.deleteMany();
  console.log(`  queue               deleted: ${r7.count}`);

  // ── 8. Appointments ───────────────────────────────────────────────────────
  const r8 = await prisma.appointment.deleteMany();
  console.log(`  appointment         deleted: ${r8.count}`);

  // ── 9. Doctor-clinic links ────────────────────────────────────────────────
  const r9 = await prisma.doctorClinic.deleteMany();
  console.log(`  doctorClinic        deleted: ${r9.count}`);

  // ── 10. Clinic staff ──────────────────────────────────────────────────────
  const r10 = await prisma.clinicStaff.deleteMany();
  console.log(`  clinicStaff         deleted: ${r10.count}`);

  // ── 11. Clinic verification logs ─────────────────────────────────────────
  const r11 = await prisma.clinicVerificationLog.deleteMany();
  console.log(`  clinicVerificationLog deleted: ${r11.count}`);

  // ── 12. Clinics ───────────────────────────────────────────────────────────
  const r12 = await prisma.clinic.deleteMany();
  console.log(`  clinic              deleted: ${r12.count}`);

  // ── 13. Profiles ──────────────────────────────────────────────────────────
  const r13 = await prisma.receptionistProfile.deleteMany();
  console.log(`  receptionistProfile deleted: ${r13.count}`);

  const r14 = await prisma.doctorProfile.deleteMany();
  console.log(`  doctorProfile       deleted: ${r14.count}`);

  const r15 = await prisma.patientProfile.deleteMany();
  console.log(`  patientProfile      deleted: ${r15.count}`);

  // ── 14. Auth tokens / sessions ────────────────────────────────────────────
  const r16 = await prisma.passwordResetToken.deleteMany();
  console.log(`  passwordResetToken  deleted: ${r16.count}`);

  const r17 = await prisma.refreshToken.deleteMany();
  console.log(`  refreshToken        deleted: ${r17.count}`);

  const r18 = await prisma.session.deleteMany();
  console.log(`  session             deleted: ${r18.count}`);

  const r19 = await prisma.otpVerification.deleteMany();
  console.log(`  otpVerification     deleted: ${r19.count}`);

  const r20 = await prisma.emailVerification.deleteMany();
  console.log(`  emailVerification   deleted: ${r20.count}`);

  // ── 15. Non-admin users ───────────────────────────────────────────────────
  //  Keep SUPER_ADMIN accounts so the admin can still log in.
  const r21 = await prisma.user.deleteMany({
    where: { role: { not: 'SUPER_ADMIN' } },
  });
  console.log(`  user (non-admin)    deleted: ${r21.count}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const remaining = await prisma.user.count();
  const admins = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, adminProfile: { select: { level: true } } },
  });

  console.log('\n✅  Data cleared successfully.');
  console.log(`\n👤  Remaining users (${remaining}):`);
  for (const u of admins) {
    console.log(`    • ${u.name} <${u.email}> [${u.role} / ${u.adminProfile?.level ?? '-'}]`);
  }
  console.log('\nAll tables are clean. Admin account preserved.\n');
}

main()
  .catch((e) => {
    console.error('❌  Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
