/**
 * check-clinic-doctors.js
 * Check if doctors are properly linked to clinic
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Checking clinic and doctor links...\n');

  // Find the clinic
  const clinic = await prisma.clinic.findFirst({
    where: {
      name: 'HealthCare Plus Clinic',
    },
    include: {
      owner: {
        select: { name: true, email: true },
      },
    },
  });

  if (!clinic) {
    console.log('❌ Clinic not found!');
    return;
  }

  console.log('✅ Clinic found:');
  console.log(`   Name: ${clinic.name}`);
  console.log(`   ID: ${clinic.id}`);
  console.log(`   Owner: ${clinic.owner.name} (${clinic.owner.email})`);

  // Find doctors
  const doctors = await prisma.user.findMany({
    where: {
      role: 'DOCTOR',
    },
    include: {
      doctorProfile: true,
    },
  });

  console.log(`\n👨‍⚕️ Found ${doctors.length} doctor(s):\n`);
  for (const doctor of doctors) {
    console.log(`${doctor.name}`);
    console.log(`   Email: ${doctor.email}`);
    console.log(`   Mobile: ${doctor.mobile}`);
    console.log(`   License Number: ${doctor.doctorProfile?.licenseNumber || 'NOT SET'}`);
    console.log(`   Medical Reg. Number: ${doctor.doctorProfile?.medicalRegistrationNumber || 'NOT SET'}`);
    console.log('');
  }

  // Check ClinicStaff links (old way)
  console.log('\n📋 Checking ClinicStaff table (old)...');
  const staffLinks = await prisma.clinicStaff.findMany({
    where: {
      clinicId: clinic.id,
      role: 'DOCTOR',
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  console.log(`   Found ${staffLinks.length} link(s) in ClinicStaff`);
  staffLinks.forEach((link) => {
    console.log(`   - ${link.user.name} (${link.user.email})`);
  });

  // Check DoctorClinic links (new way)
  console.log('\n📋 Checking DoctorClinic table (new)...');
  const doctorClinicLinks = await prisma.doctorClinic.findMany({
    where: {
      clinicId: clinic.id,
    },
    include: {
      doctor: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  console.log(`   Found ${doctorClinicLinks.length} link(s) in DoctorClinic`);
  doctorClinicLinks.forEach((link) => {
    console.log(`   - ${link.doctor.user.name} (${link.doctor.user.email})`);
    console.log(`     Status: ${link.inviteStatus}`);
    console.log(`     Active: ${link.isActive}`);
  });

  console.log('\n✅ Done!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
