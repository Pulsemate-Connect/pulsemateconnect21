const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addWorkingHours() {
  try {
    // Find the Pain Clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        name: {
          contains: 'Pain Clinic'
        }
      }
    });

    if (!clinic) {
      console.error('❌ Pain Clinic not found!');
      return;
    }

    console.log('✅ Found clinic:', clinic.name, '(ID:', clinic.id + ')');

    // Create working hours (Monday to Saturday: 9:30 AM – 1:00 PM and 4:00 PM – 8:00 PM)
    // Days: 0=Sunday, 1=Monday, ..., 6=Saturday
    const workingDays = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
    
    for (const dayOfWeek of workingDays) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Check if already exists
      const existing = await prisma.clinicWorkingHours.findUnique({
        where: {
          clinicId_dayOfWeek: {
            clinicId: clinic.id,
            dayOfWeek: dayOfWeek
          }
        }
      });

      if (existing) {
        console.log(`⚠️  Working hours for ${dayNames[dayOfWeek]} already exist, skipping`);
        continue;
      }

      await prisma.clinicWorkingHours.create({
        data: {
          clinicId: clinic.id,
          dayOfWeek: dayOfWeek,
          isOpen: true,
          morningStartTime: '09:30',
          morningEndTime: '13:00',
          eveningStartTime: '16:00',
          eveningEndTime: '20:00',
        }
      });

      console.log(`✅ Created working hours for ${dayNames[dayOfWeek]}`);
    }

    // Verify
    const allHours = await prisma.clinicWorkingHours.findMany({
      where: { clinicId: clinic.id },
      orderBy: { dayOfWeek: 'asc' }
    });

    console.log('\n📋 All Working Hours:');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    allHours.forEach(h => {
      console.log(`${dayNames[h.dayOfWeek]}: ${h.morningStartTime}-${h.morningEndTime}, ${h.eveningStartTime}-${h.eveningEndTime}`);
    });

    console.log('\n✅ All done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.meta) {
      console.error('Meta:', JSON.stringify(error.meta, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

addWorkingHours();
