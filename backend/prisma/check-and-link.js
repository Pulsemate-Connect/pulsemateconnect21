/**
 * check-and-link.js
 * Checks doctor-clinic links and creates them if missing.
 * Run: node prisma/check-and-link.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Show all doctors
  const doctors = await prisma.doctorProfile.findMany({
    include: {
      user: { select: { name: true, id: true } },
      doctorClinics: {
        include: { clinic: { select: { name: true, id: true } } }
      }
    }
  });

  console.log(`\nDoctors: ${doctors.length}`);
  for (const d of doctors) {
    console.log(`\n  Doctor: ${d.user.name} (${d.id})`);
    console.log(`    approvalStatus: ${d.approvalStatus}`);
    console.log(`    marketplaceVisible: ${d.marketplaceVisible}`);
    console.log(`    Clinic links: ${d.doctorClinics.length}`);
    d.doctorClinics.forEach(dc => {
      console.log(`      - ${dc.clinic.name} | inviteStatus: ${dc.inviteStatus} | isActive: ${dc.isActive}`);
    });
  }

  // Show all clinics
  const clinics = await prisma.clinic.findMany({
    select: { id: true, name: true, approvalStatus: true, isVerified: true, isActive: true, latitude: true, longitude: true }
  });

  console.log(`\nClinics: ${clinics.length}`);
  clinics.forEach(c => {
    console.log(`  - ${c.name} | status: ${c.approvalStatus} | isVerified: ${c.isVerified} | lat: ${c.latitude} | lng: ${c.longitude}`);
  });

  // If doctor has no clinic link, link to all verified clinics
  for (const doctor of doctors) {
    if (doctor.doctorClinics.length === 0) {
      console.log(`\n⚠️  Doctor ${doctor.user.name} has no clinic link. Linking to all active clinics...`);
      for (const clinic of clinics) {
        try {
          await prisma.doctorClinic.create({
            data: {
              doctorId: doctor.id,
              clinicId: clinic.id,
              inviteStatus: 'ACCEPTED',
              isActive: true,
              roleAtClinic: 'CONSULTANT',
              consultationFee: doctor.consultationFee || 500,
            }
          });
          console.log(`  ✅ Linked ${doctor.user.name} → ${clinic.name}`);
        } catch (e) {
          console.log(`  ⚠️  Already linked or error: ${e.message}`);
        }
      }
    } else {
      // Fix existing links
      await prisma.doctorClinic.updateMany({
        where: { doctorId: doctor.id },
        data: { inviteStatus: 'ACCEPTED', isActive: true }
      });
      console.log(`\n✅ Fixed existing links for ${doctor.user.name}`);
    }
  }

  console.log('\n✅ Done!\n');
}

main()
  .catch(e => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
