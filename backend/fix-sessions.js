#!/usr/bin/env node
/**
 * Fix "Fully Booked" Issue - Production Database Fixer
 * 
 * This script will:
 * 1. Fix clinic session timings (Morning 4:51 PM → 8:00 AM)
 * 2. Create DoctorAvailability records for all active doctors
 * 3. Ensure DoctorClinic fallback schedules are configured
 * 
 * Usage: node fix-sessions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Session timing standards
const SESSION_TIMINGS = {
  MORNING: { startTime: '08:00', endTime: '12:00' },
  AFTERNOON: { startTime: '12:00', endTime: '17:00' },
  EVENING: { startTime: '17:00', endTime: '21:00' },
};

async function fixClinicSessions() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  STEP 1: Fixing Clinic Session Timings');
  console.log('═══════════════════════════════════════════════════════\n');

  const sessions = await prisma.clinicSession.findMany({
    include: { clinic: { select: { name: true } } },
  });

  console.log(`Found ${sessions.length} clinic sessions\n`);

  let fixedCount = 0;
  for (const session of sessions) {
    const standardTiming = SESSION_TIMINGS[session.sessionType];
    if (!standardTiming) continue;

    const needsFix =
      session.startTime !== standardTiming.startTime ||
      session.endTime !== standardTiming.endTime;

    if (needsFix) {
      console.log(`❌ ${session.clinic.name} - ${session.sessionType}:`);
      console.log(`   OLD: ${session.startTime} - ${session.endTime}`);
      console.log(`   NEW: ${standardTiming.startTime} - ${standardTiming.endTime}`);

      await prisma.clinicSession.update({
        where: { id: session.id },
        data: {
          startTime: standardTiming.startTime,
          endTime: standardTiming.endTime,
        },
      });

      fixedCount++;
      console.log(`   ✅ Fixed!\n`);
    } else {
      console.log(`✅ ${session.clinic.name} - ${session.sessionType}: Already correct\n`);
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} clinic sessions\n`);
}

async function createDoctorAvailability() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  STEP 2: Creating Doctor Availability Records');
  console.log('═══════════════════════════════════════════════════════\n');

  // Get all active doctor-clinic pairs
  const doctorClinics = await prisma.doctorClinic.findMany({
    where: { isActive: true },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
        },
      },
      clinic: { select: { name: true } },
    },
  });

  console.log(`Found ${doctorClinics.length} active doctor-clinic relationships\n`);

  let createdCount = 0;

  for (const dc of doctorClinics) {
    const doctorName = dc.doctor.user.name;
    const clinicName = dc.clinic.name;

    console.log(`\n📋 Dr. ${doctorName} at ${clinicName}:`);

    // Create availability for Monday-Friday (days 1-5)
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      const existing = await prisma.doctorAvailability.findUnique({
        where: {
          doctorId_clinicId_dayOfWeek: {
            doctorId: dc.doctorId,
            clinicId: dc.clinicId,
            dayOfWeek,
          },
        },
      });

      if (existing) {
        console.log(`   ✅ ${DAY_NAMES[dayOfWeek]}: Already configured`);
      } else {
        await prisma.doctorAvailability.create({
          data: {
            doctorId: dc.doctorId,
            clinicId: dc.clinicId,
            dayOfWeek,
            startTime: '09:00',
            endTime: '18:00',
            slotDurationMin: 15,
            maxPatients: 30,
            isActive: true,
          },
        });
        console.log(`   ✅ ${DAY_NAMES[dayOfWeek]}: Created (9 AM - 6 PM, 15-min slots)`);
        createdCount++;
      }
    }
  }

  console.log(`\n✅ Created ${createdCount} new DoctorAvailability records\n`);
}

async function fixDoctorClinicSchedules() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  STEP 3: Ensuring DoctorClinic Fallback Schedules');
  console.log('═══════════════════════════════════════════════════════\n');

  const doctorClinics = await prisma.doctorClinic.findMany({
    where: { isActive: true },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
        },
      },
      clinic: { select: { name: true } },
    },
  });

  let updatedCount = 0;

  for (const dc of doctorClinics) {
    const needsUpdate =
      !dc.startTime ||
      !dc.endTime ||
      !dc.avgConsultationMins ||
      !dc.availableDays ||
      dc.availableDays.length === 0;

    if (needsUpdate) {
      console.log(`❌ Dr. ${dc.doctor.user.name} at ${dc.clinic.name}:`);
      console.log(`   Missing schedule fallback`);

      await prisma.doctorClinic.update({
        where: { id: dc.id },
        data: {
          startTime: dc.startTime || '09:00',
          endTime: dc.endTime || '18:00',
          avgConsultationMins: dc.avgConsultationMins || 15,
          availableDays: dc.availableDays?.length
            ? dc.availableDays
            : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      });

      console.log(`   ✅ Set fallback schedule (9 AM - 6 PM, Mon-Fri)\n`);
      updatedCount++;
    } else {
      console.log(`✅ Dr. ${dc.doctor.user.name} at ${dc.clinic.name}: Already configured\n`);
    }
  }

  console.log(`\n✅ Updated ${updatedCount} DoctorClinic records\n`);
}

async function verifyFix() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VERIFICATION: Checking Final State');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check clinic sessions
  const sessions = await prisma.clinicSession.findMany({
    where: { enabled: true },
    include: { clinic: { select: { name: true } } },
    orderBy: { sortOrder: 'asc' },
  });

  console.log('📅 CLINIC SESSIONS:');
  for (const session of sessions) {
    const standardTiming = SESSION_TIMINGS[session.sessionType];
    const isCorrect =
      standardTiming &&
      session.startTime === standardTiming.startTime &&
      session.endTime === standardTiming.endTime;

    const status = isCorrect ? '✅' : '⚠️';
    console.log(
      `${status} ${session.clinic.name} - ${session.sessionType}: ${session.startTime} - ${session.endTime}`
    );
  }

  // Check doctor availability
  const doctorClinics = await prisma.doctorClinic.findMany({
    where: { isActive: true },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
        },
      },
      clinic: { select: { name: true } },
    },
  });
  
  // Fetch availability separately
  const availabilityMap = new Map();
  for (const dc of doctorClinics) {
    const availability = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: dc.doctorId,
        clinicId: dc.clinicId,
        isActive: true,
      },
    });
    availabilityMap.set(`${dc.doctorId}-${dc.clinicId}`, availability);
  }

  console.log('\n👨‍⚕️ DOCTOR AVAILABILITY:');
  for (const dc of doctorClinics) {
    const availability = availabilityMap.get(`${dc.doctorId}-${dc.clinicId}`) || [];
    const availCount = availability.length;
    const status = availCount > 0 ? '✅' : '⚠️';
    console.log(
      `${status} Dr. ${dc.doctor.user.name} at ${dc.clinic.name}: ${availCount} days configured`
    );
  }

  console.log('\n');
}

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║   FIX "FULLY BOOKED" ISSUE - PRODUCTION DATABASE     ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // Step 1: Fix clinic sessions
    await fixClinicSessions();

    // Step 2: Create doctor availability
    await createDoctorAvailability();

    // Step 3: Fix DoctorClinic fallback
    await fixDoctorClinicSchedules();

    // Step 4: Verify
    await verifyFix();

    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║   ✅ ALL FIXES APPLIED SUCCESSFULLY!                 ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('Next Steps:');
    console.log('1. Build and deploy the mobile app');
    console.log('2. Test booking screen - should now show available slots');
    console.log('3. Verify slots API: GET /doctor/{id}/slots?clinicId={id}&date=2026-06-28\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
