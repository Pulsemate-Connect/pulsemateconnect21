// fix-doctors.js — Links Dr. Priya Menon and Dr. Arjun Nair to Sunrise Clinic
// and enables marketplace visibility so they show in the patient app.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the Sunrise clinic
  const clinic = await prisma.clinic.findFirst({
    where: { name: { contains: 'Sunrise', mode: 'insensitive' }, approvalStatus: 'VERIFIED' },
    select: { id: true, name: true, ownerId: true },
  });

  if (!clinic) {
    console.error('❌ Sunrise clinic not found or not verified. Approve it first.');
    process.exit(1);
  }
  console.log(`✅ Found clinic: ${clinic.name} (${clinic.id})`);

  // Find both doctor profiles
  const priya = await prisma.doctorProfile.findFirst({
    where: { user: { email: 'priya.menon@sunriseclinic.com' } },
    select: { id: true, userId: true },
  });
  const arjun = await prisma.doctorProfile.findFirst({
    where: { user: { email: 'arjun.nair@sunriseclinic.com' } },
    select: { id: true, userId: true },
  });

  if (!priya || !arjun) {
    console.error('❌ One or both doctor profiles not found.');
    process.exit(1);
  }
  console.log(`✅ Dr. Priya Menon profile: ${priya.id}`);
  console.log(`✅ Dr. Arjun Nair profile:  ${arjun.id}`);

  for (const doc of [priya, arjun]) {
    // 1. Set marketplaceVisible = true on doctorProfile
    await prisma.doctorProfile.update({
      where: { id: doc.id },
      data: { marketplaceVisible: true },
    });

    // 2. Upsert ClinicStaff entry
    await prisma.clinicStaff.upsert({
      where: { clinicId_userId: { clinicId: clinic.id, userId: doc.userId } },
      create: { clinicId: clinic.id, userId: doc.userId, role: 'DOCTOR' },
      update: { isActive: true },
    });

    // 3. Upsert DoctorClinic link with ACCEPTED status
    const existing = await prisma.doctorClinic.findFirst({
      where: { doctorId: doc.id, clinicId: clinic.id },
    });

    if (existing) {
      await prisma.doctorClinic.update({
        where: { id: existing.id },
        data: {
          inviteStatus: 'ACCEPTED',
          isActive: true,
          joinedAt: existing.joinedAt || new Date(),
        },
      });
    } else {
      await prisma.doctorClinic.create({
        data: {
          doctorId: doc.id,
          clinicId: clinic.id,
          inviteStatus: 'ACCEPTED',
          isActive: true,
          consultationFee: doc.id === priya.id ? 800 : 600,
          availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
          startTime: '09:00',
          endTime: '18:00',
          avgConsultationMins: 15,
          joinedAt: new Date(),
        },
      });
    }

    console.log(`✅ Doctor ${doc.id} linked to clinic and marketplace enabled.`);
  }

  console.log('\n🎉 Done! Both doctors should now appear in the patient app.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
