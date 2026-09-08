/**
 * URGENT FIX: Update NULL patient names in database
 * This fixes the "Patient" showing in queue instead of real names
 * 
 * Run: node fix-patient-names-now.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPatientNames() {
  console.log('🔧 Fixing patient names in database...\n');

  try {
    // Step 1: Check current state
    console.log('Step 1: Checking users with NULL names...');
    const usersWithNullNames = await prisma.user.findMany({
      where: {
        OR: [
          { name: null },
          { name: '' },
          { name: 'Patient' }
        ],
        role: 'PATIENT'
      },
      select: {
        id: true,
        mobile: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${usersWithNullNames.length} patients with missing names:\n`);
    usersWithNullNames.forEach((user, i) => {
      console.log(`${i+1}. Mobile: ${user.mobile} | Name: ${user.name || 'NULL'} | Created: ${user.createdAt.toLocaleDateString()}`);
    });

    if (usersWithNullNames.length === 0) {
      console.log('\n✅ All patients have names! Nothing to fix.');
      return;
    }

    // Step 2: Fix the specific user mentioned (9999999999)
    console.log('\n─────────────────────────────────────');
    console.log('Step 2: Fixing mobile 9999999999 → Sakshi...');
    
    const user1 = await prisma.user.findFirst({
      where: { mobile: '9999999999' }
    });

    if (user1) {
      const updated1 = await prisma.user.update({
        where: { id: user1.id },
        data: { 
          name: 'Sakshi',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated: ${updated1.mobile} → Name: ${updated1.name}`);
    } else {
      console.log('❌ User with mobile 9999999999 not found');
    }

    // Step 3: Check if mobile 9380328154 needs fixing
    console.log('\n─────────────────────────────────────');
    console.log('Step 3: Checking mobile 9380328154...');
    
    const user2 = await prisma.user.findFirst({
      where: { mobile: '9380328154' }
    });

    if (user2) {
      if (!user2.name || user2.name === '' || user2.name === 'Patient') {
        const updated2 = await prisma.user.update({
          where: { id: user2.id },
          data: { 
            name: 'Sahil',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Updated: ${updated2.mobile} → Name: ${updated2.name}`);
      } else {
        console.log(`✅ Already has name: ${user2.name}`);
      }
    }

    // Step 4: Verify queue will now show correct names
    console.log('\n═════════════════════════════════════');
    console.log('Step 4: Verifying queue items...\n');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const queueItems = await prisma.queueItem.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true,
          }
        }
      },
      orderBy: { queueNumber: 'asc' },
      take: 10,
    });

    console.log(`Recent queue items (last 24 hours):\n`);
    queueItems.forEach((item) => {
      const displayName = item.patient?.name || 'Patient';
      const status = item.patient?.name ? '✅' : '❌';
      console.log(`${status} Queue #${item.queueNumber}: ${displayName} (${item.patient?.mobile || 'No mobile'})`);
    });

    // Step 5: Final summary
    console.log('\n═════════════════════════════════════');
    console.log('📊 Final Summary\n');

    const stillNullNames = await prisma.user.count({
      where: {
        OR: [
          { name: null },
          { name: '' },
          { name: 'Patient' }
        ],
        role: 'PATIENT'
      }
    });

    const hasNames = await prisma.user.count({
      where: {
        role: 'PATIENT',
        name: {
          not: null,
          notIn: ['', 'Patient']
        }
      }
    });

    console.log(`✅ Patients with names: ${hasNames}`);
    console.log(`⚠️  Patients without names: ${stillNullNames}`);
    
    if (stillNullNames > 0) {
      console.log('\n⚠️  WARNING: Some patients still have NULL names.');
      console.log('   They will continue to show as "Patient" in the queue.');
      console.log('   Consider making name field mandatory during registration.');
    } else {
      console.log('\n🎉 SUCCESS! All patients now have names.');
    }

    console.log('\n─────────────────────────────────────');
    console.log('✅ Fix completed!');
    console.log('📝 Next step: Refresh the receptionist page (Ctrl+Shift+R)');
    console.log('─────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixPatientNames();
