/**
 * fix-clinic-visibility.js
 *
 * Fixes clinics and doctors so they appear in the patient app.
 *
 * Run against your RENDER database:
 *   DATABASE_URL="your-render-db-url" node prisma/fix-clinic-visibility.js
 *
 * Or if your .env already points to Render:
 *   node prisma/fix-clinic-visibility.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧  Starting clinic/doctor visibility fix...\n');

  // ── 1. Show current state ─────────────────────────────────────────────────
  const allClinics = await prisma.clinic.findMany({
    select: {
      id: true, name: true,
      approvalStatus: true, isVerified: true, isActive: true,
      latitude: true, longitude: true,
    },
  });

  console.log(`📋  Total clinics in DB: ${allClinics.length}`);
  for (const c of allClinics) {
    const issues = [];
    if (c.approvalStatus !== 'VERIFIED') issues.push(`approvalStatus=${c.approvalStatus}`);
    if (!c.isVerified) issues.push('isVerified=false');
    if (!c.isActive) issues.push('isActive=false');
    if (!c.latitude || !c.longitude) issues.push('missing lat/lng');
    console.log(`  ${issues.length === 0 ? '✅' : '❌'} ${c.name} → ${issues.length === 0 ? 'OK' : issues.join(', ')}`);
  }

  // ── 2. Fix clinics that have lat/lng but wrong approval flags ─────────────
  const fixedClinics = await prisma.clinic.updateMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      OR: [
        { approvalStatus: { not: 'VERIFIED' } },
        { isVerified: false },
        { isActive: false },
      ],
    },
    data: {
      approvalStatus: 'VERIFIED',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`\n✅  Fixed ${fixedClinics.count} clinic(s) with lat/lng → set VERIFIED + isVerified + isActive`);

  // ── 3. Fix all clinics (even without lat/lng) to at least be VERIFIED/active
  const fixedAll = await prisma.clinic.updateMany({
    where: {
      OR: [
        { approvalStatus: { not: 'VERIFIED' } },
        { isActive: false },
      ],
    },
    data: {
      approvalStatus: 'VERIFIED',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`✅  Fixed ${fixedAll.count} remaining clinic(s) → set VERIFIED + active`);

  // ── 4. Show all doctors ───────────────────────────────────────────────────
  const allDoctors = await prisma.doctorProfile.findMany({
    select: {
      id: true, approvalStatus: true, marketplaceVisible: true,
      user: { select: { name: true, isActive: true } },
      doctorClinics: { select: { inviteStatus: true, isActive: true } },
    },
  });

  console.log(`\n📋  Total doctors in DB: ${allDoctors.length}`);
  for (const d of allDoctors) {
    const issues = [];
    if (d.approvalStatus !== 'VERIFIED') issues.push(`approvalStatus=${d.approvalStatus}`);
    if (!d.marketplaceVisible) issues.push('marketplaceVisible=false');
    if (!d.user?.isActive) issues.push('user.isActive=false');
    const hasAcceptedClinic = d.doctorClinics.some(dc => dc.inviteStatus === 'ACCEPTED' && dc.isActive);
    if (!hasAcceptedClinic) issues.push('no ACCEPTED clinic link');
    console.log(`  ${issues.length === 0 ? '✅' : '❌'} ${d.user?.name ?? 'Unknown'} → ${issues.length === 0 ? 'OK' : issues.join(', ')}`);
  }

  // ── 5. Fix doctors — set VERIFIED + marketplaceVisible ───────────────────
  const fixedDoctors = await prisma.doctorProfile.updateMany({
    where: {
      OR: [
        { approvalStatus: { not: 'VERIFIED' } },
        { marketplaceVisible: false },
      ],
    },
    data: {
      approvalStatus: 'VERIFIED',
      marketplaceVisible: true,
    },
  });
  console.log(`\n✅  Fixed ${fixedDoctors.count} doctor(s) → set VERIFIED + marketplaceVisible`);

  // ── 6. Fix doctor user accounts ───────────────────────────────────────────
  const fixedDoctorUsers = await prisma.user.updateMany({
    where: {
      role: 'DOCTOR',
      isActive: false,
    },
    data: { isActive: true },
  });
  console.log(`✅  Fixed ${fixedDoctorUsers.count} doctor user account(s) → set isActive=true`);

  // ── 7. Fix DoctorClinic invite status ─────────────────────────────────────
  const fixedLinks = await prisma.doctorClinic.updateMany({
    where: {
      OR: [
        { inviteStatus: { not: 'ACCEPTED' } },
        { isActive: false },
      ],
    },
    data: {
      inviteStatus: 'ACCEPTED',
      isActive: true,
    },
  });
  console.log(`✅  Fixed ${fixedLinks.count} doctor-clinic link(s) → set ACCEPTED + isActive`);

  // ── 8. Final summary ──────────────────────────────────────────────────────
  const readyClinics = await prisma.clinic.count({
    where: { approvalStatus: 'VERIFIED', isVerified: true, isActive: true },
  });
  const readyClinicsWithCoords = await prisma.clinic.count({
    where: {
      approvalStatus: 'VERIFIED', isVerified: true, isActive: true,
      latitude: { not: null }, longitude: { not: null },
    },
  });
  const readyDoctors = await prisma.doctorProfile.count({
    where: {
      approvalStatus: 'VERIFIED',
      marketplaceVisible: true,
      user: { isActive: true },
    },
  });

  console.log('\n── Final state ──────────────────────────────────────────────');
  console.log(`  Verified + active clinics:             ${readyClinics}`);
  console.log(`  Clinics with lat/lng (show in nearby): ${readyClinicsWithCoords}`);
  console.log(`  Marketplace-visible doctors:           ${readyDoctors}`);

  if (readyClinicsWithCoords === 0) {
    console.log('\n⚠️  WARNING: No clinics have latitude/longitude saved.');
    console.log('   Go to Admin → Clinics → Edit each clinic → add Latitude and Longitude.');
    console.log('   Without coordinates, clinics will not appear in "Nearby Clinics".');
  }

  console.log('\n✅  Done! Restart your Render backend for changes to take effect.\n');
}

main()
  .catch((e) => {
    console.error('❌  Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
