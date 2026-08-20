/**
 * fix-doctor-visibility.js
 *
 * One-time script: sets marketplaceVisible = true for all doctors who:
 *   - are VERIFIED
 *   - have an active ACCEPTED link to at least one verified clinic
 *   - but currently have marketplaceVisible = false
 *
 * Run: node scripts/fix-doctor-visibility.js
 */

require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding doctors with marketplaceVisible = false...\n');

  // Find all doctor profiles that should be visible but aren't
  const doctors = await prisma.doctorProfile.findMany({
    where: {
      approvalStatus: 'VERIFIED',
      marketplaceVisible: false,
      user: { isActive: true },
      doctorClinics: {
        some: {
          isActive: true,
          inviteStatus: 'ACCEPTED',
          clinic: { approvalStatus: 'VERIFIED', isActive: true },
        },
      },
    },
    include: {
      user: { select: { name: true, mobile: true } },
      doctorClinics: {
        where: { isActive: true, inviteStatus: 'ACCEPTED' },
        include: { clinic: { select: { name: true, approvalStatus: true } } },
      },
    },
  });

  if (doctors.length === 0) {
    console.log('✅ No doctors need fixing — all eligible doctors already visible.\n');
    return;
  }

  console.log(`Found ${doctors.length} doctor(s) to fix:\n`);
  doctors.forEach((d) => {
    const clinics = d.doctorClinics.map((dc) => `${dc.clinic.name} (${dc.clinic.approvalStatus})`).join(', ');
    console.log(`  → ${d.user.name} (${d.user.mobile}) | Clinics: ${clinics}`);
  });

  const ids = doctors.map((d) => d.id);

  const result = await prisma.doctorProfile.updateMany({
    where: { id: { in: ids } },
    data: { marketplaceVisible: true },
  });

  console.log(`\n✅ Fixed ${result.count} doctor(s) — set marketplaceVisible = true`);
  console.log('   Patients can now find these doctors in search.\n');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
