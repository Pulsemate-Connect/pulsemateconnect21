/**
 * Check ALL queues and queue items (including old ones)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllQueues() {
  try {
    console.log('🔍 Checking ALL queue items...\n');

    // Check queue items from last 7 days
    const items = await prisma.queueItem.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true,
          }
        },
        queue: {
          select: {
            date: true,
            doctor: {
              select: {
                user: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${items.length} queue items from last 7 days:\n`);
    console.log('═════════════════════════════════════\n');

    items.forEach((item) => {
      const displayName = item.patient?.name || '❌ Patient (NULL)';
      const icon = item.patient?.name ? '✅' : '❌';
      const queueDate = item.queue?.date?.toLocaleDateString() || 'Unknown';
      const doctor = item.queue?.doctor?.user?.name || 'Unknown';
      
      console.log(`${icon} Queue #${item.queueNumber}`);
      console.log(`   Name: ${displayName}`);
      console.log(`   Mobile: ${item.patient?.mobile || 'Unknown'}`);
      console.log(`   Doctor: ${doctor}`);
      console.log(`   Queue Date: ${queueDate}`);
      console.log(`   Status: ${item.status}`);
      console.log(`   Created: ${item.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Summary
    const withNames = items.filter(i => i.patient?.name).length;
    const withoutNames = items.filter(i => !i.patient?.name).length;
    
    console.log('═════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`✅ With names: ${withNames}`);
    console.log(`❌ Without names: ${withoutNames}`);
    console.log('═════════════════════════════════════\n');

    // Check specific mobiles
    console.log('Checking specific mobile numbers:');
    console.log('─────────────────────────────────────');
    
    const mobiles = ['9999999999', '9380328154', '+917022818878'];
    
    for (const mobile of mobiles) {
      const user = await prisma.user.findFirst({
        where: { mobile },
        select: { id: true, name: true, mobile: true }
      });
      
      if (user) {
        const queueCount = await prisma.queueItem.count({
          where: { patientId: user.id }
        });
        const icon = user.name ? '✅' : '❌';
        console.log(`${icon} ${mobile}: Name="${user.name || 'NULL'}" (${queueCount} queue items)`);
      } else {
        console.log(`⚠️  ${mobile}: Not found`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllQueues();
