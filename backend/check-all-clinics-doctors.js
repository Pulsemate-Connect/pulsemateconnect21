const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================');
  console.log('All Clinics and Their Doctors');
  console.log('============================================\n');

  const clinics = await prisma.clinic.findMany({
    where: { approvalStatus: 'VERIFIED' },
    include: {
      owner: {
        select: { id: true, name: true, mobile: true }
      }
    }
  });

  console.log(`Found ${clinics.length} verified clinic(s)\n`);

  for (const clinic of clinics) {
    console.log(`Clinic: ${clinic.name}`);
    console.log(`  ID: ${clinic.id}`);
    console.log(`  Owner: ${clinic.owner.name} (${clinic.owner.mobile})`);
    console.log(`  Owner ID: ${clinic.ownerId}`);

    const doctorClinics = await prisma.doctorClinic.findMany({
      where: { clinicId: clinic.id },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true, approvalStatus: true, isActive: true }
            }
          }
        }
      }
    });

    console.log(`  Doctors: ${doctorClinics.length}`);
    
    if (doctorClinics.length === 0) {
      console.log(`    ❌ NO DOCTORS - Clinic owner will see "No doctors yet"`);
    } else {
      doctorClinics.forEach(dc => {
        console.log(`    - ${dc.doctor.user.name}`);
        console.log(`      inviteStatus: ${dc.inviteStatus}, isActive: ${dc.isActive}`);
        console.log(`      user.approvalStatus: ${dc.doctor.user.approvalStatus}`);
      });
    }
    console.log();
  }

  // Check if there are any doctor-clinic links at all
  const allDoctorClinics = await prisma.doctorClinic.findMany({
    include: {
      clinic: { select: { name: true } },
      doctor: { include: { user: { select: { name: true } } } }
    }
  });

  console.log('============================================');
  console.log('All Doctor-Clinic Links');
  console.log('============================================\n');
  console.log(`Total links: ${allDoctorClinics.length}\n`);

  allDoctorClinics.forEach((dc, i) => {
    console.log(`${i + 1}. ${dc.doctor.user.name} → ${dc.clinic.name}`);
    console.log(`   inviteStatus: ${dc.inviteStatus}, isActive: ${dc.isActive}`);
  });
}

main().finally(() => prisma.$disconnect());
