/**
 * Test script to check if patient names are being returned by the queue API
 * Run: node TEST_QUEUE_API_PATIENT_NAMES.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQueuePatientNames() {
  console.log('🔍 Testing Queue Patient Names...\n');

  try {
    // Step 1: Find recent queue items
    console.log('Step 1: Checking recent queue items...');
    const recentQueues = await prisma.queueItem.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        appointment: {
          select: {
            id: true,
            patientId: true,
          },
        },
      },
    });

    console.log(`Found ${recentQueues.length} queue items from last 24 hours\n`);

    // Step 2: Check each queue item
    for (const item of recentQueues) {
      console.log('─────────────────────────────────────');
      console.log(`Queue Item ID: ${item.id}`);
      console.log(`Queue Number: ${item.queueNumber || 'N/A'}`);
      console.log(`Patient ID in queue_items: ${item.patientId}`);
      console.log(`Patient ID in appointment: ${item.appointment?.patientId || 'N/A'}`);
      console.log(`Patient name from join: ${item.patient?.name || 'NULL'}`);
      console.log(`Patient mobile: ${item.patient?.mobile || 'NULL'}`);
      
      // Cross-check: fetch patient directly
      if (item.patientId) {
        const directPatient = await prisma.user.findUnique({
          where: { id: item.patientId },
          select: { id: true, name: true, mobile: true },
        });
        console.log(`Patient name (direct query): ${directPatient?.name || 'NOT FOUND'}`);
        
        if (!item.patient) {
          console.log('❌ ERROR: Patient relation returned NULL but patient exists!');
        } else if (item.patient.name !== directPatient?.name) {
          console.log('❌ ERROR: Name mismatch between join and direct query!');
        } else if (!directPatient?.name || directPatient.name === 'Patient') {
          console.log('⚠️  WARNING: Patient name is missing or default');
        } else {
          console.log('✅ Patient name is correct');
        }
      }
      console.log('');
    }

    // Step 3: Check specific mobile number from user's issue
    console.log('\n═══════════════════════════════════════');
    console.log('Step 3: Checking mobile 9999999999 (Sakshi)...\n');
    
    const sakshiUser = await prisma.user.findFirst({
      where: { mobile: '9999999999' },
      select: { id: true, name: true, mobile: true },
    });

    if (sakshiUser) {
      console.log(`User found: ${sakshiUser.name} (ID: ${sakshiUser.id})`);
      
      // Find queue items for this user
      const sakshiQueueItems = await prisma.queueItem.findMany({
        where: { patientId: sakshiUser.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          patient: { select: { id: true, name: true, mobile: true } },
        },
      });

      console.log(`Found ${sakshiQueueItems.length} queue items for this user`);
      sakshiQueueItems.forEach((qi) => {
        console.log(`  - Queue #${qi.queueNumber || 'N/A'}: ${qi.patient?.name || 'NULL'} (Created: ${qi.createdAt.toLocaleString()})`);
      });
    } else {
      console.log('❌ User with mobile 9999999999 not found');
    }

    // Step 4: Simulate API response structure
    console.log('\n═══════════════════════════════════════');
    console.log('Step 4: Simulating API response structure...\n');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const queue = await prisma.queue.findFirst({
      where: {
        date: today,
      },
      include: {
        queueItems: {
          orderBy: [{ isFollowUp: 'desc' }, { position: 'asc' }],
          include: {
            patient: { select: { id: true, name: true, mobile: true } },
            appointment: {
              select: {
                id: true,
                symptoms: true,
              },
            },
          },
        },
      },
    });

    if (queue) {
      console.log(`Queue ID: ${queue.id}`);
      console.log(`Items in queue: ${queue.queueItems.length}\n`);
      
      queue.queueItems.slice(0, 3).forEach((item) => {
        console.log(`Queue #${item.queueNumber}:`);
        console.log(`  Patient object:`, JSON.stringify(item.patient, null, 2));
        console.log(`  Display name: ${item.patient?.name || 'Patient'}`);
        console.log('');
      });
    } else {
      console.log('No queue found for today');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueuePatientNames();
