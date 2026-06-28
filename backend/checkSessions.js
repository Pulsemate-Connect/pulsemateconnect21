const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== CHECKING DATABASE ===\n');
    
    // Get all clinics
    const clinics = await prisma.clinic.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`Found ${clinics.length} clinics:`);
    clinics.forEach(c => console.log(`  - ${c.name} (${c.id})`));
    
    // Get all clinic sessions
    console.log('\n=== CLINIC SESSIONS ===');
    const sessions = await prisma.clinicSession.findMany({
      include: {
        clinic: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (sessions.length === 0) {
      console.log('  ❌ NO SESSIONS CONFIGURED!');
      console.log('\n  This is why the booking screen shows "Fully Booked".');
      console.log('  Sessions need to be created for each clinic.\n');
    } else {
      sessions.forEach(s => {
        console.log(`\n  Clinic: ${s.clinic.name}`);
        console.log(`    Session Type: ${s.sessionType}`);
        console.log(`    Name: ${s.name}`);
        console.log(`    Time: ${s.startTime} - ${s.endTime}`);
        console.log(`    Max Patients: ${s.maxPatients}`);
        console.log(`    Enabled: ${s.enabled}`);
        console.log(`    ID: ${s.id}`);
      });
    }
    
    // Check doctor availability
    console.log('\n=== DOCTOR AVAILABILITY ===');
    const availability = await prisma.doctorAvailability.findMany({
      include: {
        doctor: {
          include: {
            user: { select: { name: true } }
          }
        },
        clinic: { select: { name: true } }
      }
    });
    
    if (availability.length === 0) {
      console.log('  ⚠️  No DoctorAvailability records found.');
      console.log('  Will fall back to DoctorClinic schedules.');
    } else {
      availability.forEach(a => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        console.log(`\n  Doctor: Dr. ${a.doctor.user.name}`);
        console.log(`    Clinic: ${a.clinic.name}`);
        console.log(`    Day: ${dayNames[a.dayOfWeek]}`);
        console.log(`    Time: ${a.startTime} - ${a.endTime}`);
        console.log(`    Slot Duration: ${a.slotDurationMin} mins`);
        console.log(`    Max Patients: ${a.maxPatients}`);
        console.log(`    Active: ${a.isActive}`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
