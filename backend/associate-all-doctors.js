/**
 * Associate ALL Doctors with First Clinic
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Associate ALL Doctors with Clinic ===\n');

  // Get all doctors
  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    include: { doctorProfile: true }
  });

  // Get first clinic
  const clinic = await prisma.clinic.findFirst({
    where: { approvalStatus: 'VERIFIED' }
  });

  if (!clinic) {
    console.log('❌ No verified clinics found!');
    return;
  }

  console.log(`🏥 Clinic: ${clinic.name}\n`);

  for (const doctor of doctors) {
    // Check if already associated
    const existing = await prisma.clinicStaff.findFirst({
      where: {
        userId: doctor.id,
        clinicId: clinic.id
      }
    });

    if (existing) {
      if (!existing.isActive) {
        await prisma.clinicStaff.update({
          where: { id: existing.id },
          data: { isActive: true }
        });
        console.log(`✅ ${doctor.name} - ACTIVATED`);
      } else {
        console.log(`✓  ${doctor.name} - Already active`);
      }
    } else {
      await prisma.clinicStaff.create({
        data: {
          userId: doctor.id,
          clinicId: clinic.id,
          role: 'DOCTOR',
          isActive: true
        }
      });
      console.log(`✅ ${doctor.name} - ASSOCIATED`);
    }
  }

  console.log(`\n✅ Done! ${doctors.length} doctor(s) associated with ${clinic.name}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
