// Quick script to check existing sessions
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSessions() {
  try {
    const sessions = await prisma.clinicSession.findMany({
      include: {
        clinic: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { clinicId: 'asc' },
        { sortOrder: 'asc' }
      ]
    });

    console.log(`\n📊 Found ${sessions.length} sessions:\n`);
    
    sessions.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`   Clinic: ${s.clinic.name}`);
      console.log(`   Time: ${s.startTime} - ${s.endTime}`);
      console.log(`   Max Patients: ${s.maxPatients}`);
      console.log(`   Enabled: ${s.enabled ? '✅' : '❌'}`);
      console.log(`   Sort Order: ${s.sortOrder}`);
      console.log('');
    });

    if (sessions.length === 0) {
      console.log('❌ No sessions found! Create sessions via web UI.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();
