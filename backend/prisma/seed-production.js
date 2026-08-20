/**
 * seed-production.js
 *
 * Safe production seed — only creates accounts if they don't exist.
 * Never deletes existing data. Safe to run on every deploy.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function upsertUser(data) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email },
        { mobile: data.mobile },
      ],
    },
  });

  if (existing) {
    console.log(`  ✓ Already exists: ${data.email}`);
    return existing;
  }

  const user = await prisma.user.create({ data, include: { doctorProfile: true, receptionistProfile: true } });
  console.log(`  ✅ Created: ${data.email}`);
  return user;
}

async function main() {
  console.log('\n🌱 Running production seed (safe — no data deletion)...\n');

  const passwordHash = await bcrypt.hash('Demo@123456', 12);

  // ── Super Admin ────────────────────────────────────────────────────────────
  console.log('Creating admin accounts...');

  const rootAdmin = await upsertUser({
    name: 'Sahil Naik',
    mobile: '+919000000001',
    email: 'sahilnaik1515@gmail.com',
    role: 'SUPER_ADMIN',
    approvalStatus: 'VERIFIED',
    passwordHash: await bcrypt.hash('Demo@123456', 12),
    isPhoneVerified: true,
    isEmailVerified: true,
    adminProfile: { create: { level: 'ROOT' } },
  });

  await upsertUser({
    name: 'Platform Admin',
    mobile: '+919000000000',
    email: 'admin@pulsemate.com',
    role: 'SUPER_ADMIN',
    approvalStatus: 'VERIFIED',
    passwordHash,
    isPhoneVerified: true,
    isEmailVerified: true,
    adminProfile: { create: { level: 'SUPER_ADMIN', createdById: rootAdmin.id } },
  });

  // ── Clinic Owner ────────────────────────────────────────────────────────────
  console.log('Creating clinic owner...');

  const clinicOwner = await upsertUser({
    name: 'Dr. Rajesh Sharma',
    mobile: '+919000000002',
    email: 'owner@pulsemate.com',
    role: 'CLINIC_OWNER',
    approvalStatus: 'VERIFIED',
    passwordHash,
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  // ── Clinic ─────────────────────────────────────────────────────────────────
  console.log('Creating clinic...');

  let clinic = await prisma.clinic.findFirst({
    where: { ownerId: clinicOwner.id },
  });

  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: 'Spine Clinic',
        ownerId: clinicOwner.id,
        phone: '+918000000001',
        address: '100 Health Street, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        latitude: 12.9352,
        longitude: 77.6245,
        isVerified: true,
        approvalStatus: 'VERIFIED',
        openingTime: '09:00',
        closingTime: '20:00',
        openingHours: 'Mon-Sat 09:00-20:00',
        clinicLicenseDocument: 'https://example.com/licenses/spine-clinic.pdf',
        specialties: ['Physiotherapy', 'Rehabilitation'],
        description: 'A modern multi-specialty clinic.',
      },
    });
    console.log('  ✅ Created: Spine Clinic');
  } else {
    console.log('  ✓ Already exists: Spine Clinic');
  }

  // ── Doctors ─────────────────────────────────────────────────────────────────
  console.log('Creating doctor accounts...');

  const doctorPooja = await upsertUser({
    name: 'Pooja',
    mobile: '+919000000011',
    email: 'pooja@pulsemate.com',
    role: 'DOCTOR',
    approvalStatus: 'VERIFIED',
    passwordHash,
    isPhoneVerified: true,
    doctorProfile: {
      create: {
        approvalStatus: 'VERIFIED',
        qualification: 'BPT',
        specialization: 'Physiotherapy',
        experienceYears: 6,
        consultationFee: 600,
        onlineAvailable: true,
        offlineAvailable: true,
        medicalRegistrationNumber: 'PM-DR-0001',
        marketplaceVisible: true,
      },
    },
  });

  const doctorArjun = await upsertUser({
    name: 'Arjun Upadhyay',
    mobile: '+919000000013',
    email: 'arjun@pulsemate.com',
    role: 'DOCTOR',
    approvalStatus: 'VERIFIED',
    passwordHash,
    isPhoneVerified: true,
    doctorProfile: {
      create: {
        approvalStatus: 'VERIFIED',
        qualification: 'MPT',
        specialization: 'Physiotherapy',
        experienceYears: 8,
        consultationFee: 600,
        onlineAvailable: false,
        offlineAvailable: true,
        medicalRegistrationNumber: 'PM-DR-0002',
        marketplaceVisible: true,
      },
    },
  });

  // ── Receptionist ────────────────────────────────────────────────────────────
  console.log('Creating receptionist...');

  const receptionist = await upsertUser({
    name: 'Sunita Verma',
    mobile: '+919000000005',
    email: 'reception@pulsemate.com',
    role: 'RECEPTIONIST',
    approvalStatus: 'VERIFIED',
    passwordHash,
    isPhoneVerified: true,
    receptionistProfile: {
      create: {
        assignedClinicId: clinic.id,
        createdByOwnerId: clinicOwner.id,
      },
    },
  });

  // ── Clinic Staff + DoctorClinics ───────────────────────────────────────────
  console.log('Linking staff to clinic...');

  const staffToAdd = [
    { userId: clinicOwner.id, role: 'OWNER' },
    { userId: receptionist.id, role: 'RECEPTIONIST' },
  ];

  // Add doctors if they have profiles
  const poojaFull = await prisma.user.findUnique({ where: { id: doctorPooja.id }, include: { doctorProfile: true } });
  const arjunFull = await prisma.user.findUnique({ where: { id: doctorArjun.id }, include: { doctorProfile: true } });

  if (poojaFull?.doctorProfile) staffToAdd.push({ userId: doctorPooja.id, role: 'DOCTOR' });
  if (arjunFull?.doctorProfile) staffToAdd.push({ userId: doctorArjun.id, role: 'DOCTOR' });

  for (const staff of staffToAdd) {
    const exists = await prisma.clinicStaff.findFirst({
      where: { clinicId: clinic.id, userId: staff.userId },
    });
    if (!exists) {
      await prisma.clinicStaff.create({
        data: { clinicId: clinic.id, userId: staff.userId, role: staff.role },
      });
    }
  }

  // ── DoctorClinics (required for marketplace visibility) ────────────────────
  console.log('Linking doctors to clinic (doctorClinics)...');

  if (poojaFull?.doctorProfile) {
    const exists = await prisma.doctorClinic.findFirst({
      where: { doctorId: poojaFull.doctorProfile.id, clinicId: clinic.id },
    });
    if (!exists) {
      await prisma.doctorClinic.create({
        data: {
          doctorId: poojaFull.doctorProfile.id,
          clinicId: clinic.id,
          inviteStatus: 'ACCEPTED',
          consultationFee: 600,
          availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
          startTime: '09:00',
          endTime: '18:00',
          avgConsultationMins: 25,
          joinedAt: new Date(),
        },
      });
      console.log('  ✅ Linked: Pooja → Spine Clinic');
    } else {
      console.log('  ✓ Already linked: Pooja → Spine Clinic');
    }
  }

  if (arjunFull?.doctorProfile) {
    const exists = await prisma.doctorClinic.findFirst({
      where: { doctorId: arjunFull.doctorProfile.id, clinicId: clinic.id },
    });
    if (!exists) {
      await prisma.doctorClinic.create({
        data: {
          doctorId: arjunFull.doctorProfile.id,
          clinicId: clinic.id,
          inviteStatus: 'ACCEPTED',
          consultationFee: 600,
          availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
          startTime: '10:00',
          endTime: '19:00',
          avgConsultationMins: 30,
          joinedAt: new Date(),
        },
      });
      console.log('  ✅ Linked: Arjun → Spine Clinic');
    } else {
      console.log('  ✓ Already linked: Arjun → Spine Clinic');
    }
  }

  console.log('\n✅ Seed completed!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  LOGIN CREDENTIALS (all passwords: Demo@123456)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Super Admin : sahilnaik1515@gmail.com');
  console.log('  Super Admin : admin@pulsemate.com');
  console.log('  Clinic Owner: owner@pulsemate.com');
  console.log('  Doctor      : pooja@pulsemate.com');
  console.log('  Doctor      : arjun@pulsemate.com');
  console.log('  Receptionist: reception@pulsemate.com');
  console.log('  Password    : Demo@123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
