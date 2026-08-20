/**
 * fix-clinic-doctor-links.js
 * Create proper DoctorClinic links and add registration numbers
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 Fixing clinic-doctor links...\n');

  // Find the clinic
  const clinic = await prisma.clinic.findFirst({
    where: { name: 'HealthCare Plus Clinic' },
  });

  if (!clinic) {
    console.log('❌ Clinic not found!');
    return;
  }

  console.log(`✅ Clinic found: ${clinic.name} (${clinic.id})\n`);

  // Find doctors
  const doctors = await prisma.user.findMany({
    where: {
      role: 'DOCTOR',
      email: { in: ['priya.sharma@test.com', 'amit.verma@test.com'] },
    },
    include: {
      doctorProfile: true,
    },
  });

  console.log(`👨‍⚕️ Found ${doctors.length} doctor(s)\n`);

  for (const doctor of doctors) {
    console.log(`Processing ${doctor.name}...`);

    // 1. Update medical registration number in doctor profile
    const regNumber = doctor.email === 'priya.sharma@test.com' ? 'MH-MED-12345' : 'MH-MED-54321';
    
    await prisma.doctorProfile.update({
      where: { userId: doctor.id },
      data: {
        medicalRegistrationNumber: regNumber,
        licenseNumber: doctor.doctorProfile?.licenseNumber || (doctor.email === 'priya.sharma@test.com' ? 'MCI12345' : 'MCI54321'),
      },
    });

    console.log(`   ✅ Updated registration number: ${regNumber}`);

    // 2. Create DoctorClinic link
    const existingLink = await prisma.doctorClinic.findUnique({
      where: {
        doctorId_clinicId: {
          doctorId: doctor.doctorProfile.id,
          clinicId: clinic.id,
        },
      },
    });

    if (existingLink) {
      console.log(`   ℹ️  DoctorClinic link already exists`);
    } else {
      await prisma.doctorClinic.create({
        data: {
          doctorId: doctor.doctorProfile.id,
          clinicId: clinic.id,
          inviteStatus: 'ACCEPTED',
          isActive: true,
          invitationAcceptedAt: new Date(),
        },
      });
      console.log(`   ✅ Created DoctorClinic link`);
    }

    console.log('');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎉 FIX COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n✅ Both doctors are now properly linked to the clinic');
  console.log('✅ Registration numbers added:');
  console.log('   - Dr. Priya Sharma: MH-MED-12345');
  console.log('   - Dr. Amit Verma: MH-MED-54321');
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
