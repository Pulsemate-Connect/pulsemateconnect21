// ─────────────────────────────────────────────────────────────────────────────
//  Test Script — Verify clinic_sessions table exists and is functional
// ─────────────────────────────────────────────────────────────────────────────
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testClinicSessions() {
  try {
    console.log('🔍 Testing clinic_sessions table...\n');

    // Test 1: Check if table exists by querying it
    console.log('1️⃣  Checking if table exists...');
    const count = await prisma.clinicSession.count();
    console.log(`✅ Table exists! Current session count: ${count}\n`);

    // Test 2: Try to find sessions (should return empty array if none exist)
    console.log('2️⃣  Fetching all sessions...');
    const sessions = await prisma.clinicSession.findMany();
    console.log(`✅ Found ${sessions.length} sessions\n`);

    if (sessions.length > 0) {
      console.log('📋 Existing sessions:');
      sessions.forEach(s => {
        console.log(`   - ${s.name} (${s.startTime} - ${s.endTime}) at clinic ${s.clinicId}`);
      });
    }

    console.log('\n✅ All tests passed! Database is ready for clinic sessions.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing clinic_sessions:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testClinicSessions();
