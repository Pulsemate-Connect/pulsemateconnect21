/**
 * Check current queue and patient names
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQueue() {
  try {
    console.log('🔍 Checking current queue...\n');

    // Find today's queues
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const queues = await prisma.queue.findMany({
      where: {
        date: today
      },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } }
          }
        },
        clinic: {
          select: { name: true }
        },
        queueItems: {
          orderBy: { queueNumber: 'asc' },
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                mobile: true,
              }
            }
          }
        }
      }
    });

    if (queues.length === 0) {
      console.log('No queues found for today.');
      return;
    }

    queues.forEach((queue) => {
      console.log('═════════════════════════════════════');
      console.log(`Queue ID: ${queue.id}`);
      console.log(`Clinic: ${queue.clinic?.name}`);
      console.log(`Doctor: ${queue.doctor?.user?.name}`);
      console.log(`Status: ${queue.status}`);
      console.log(`Items: ${queue.queueItems.length}`);
      console.log('─────────────────────────────────────');

      if (queue.queueItems.length === 0) {
        console.log('  (Empty queue)');
      } else {
        queue.queueItems.forEach((item) => {
          const displayName = item.patient?.name || '❌ Patient (NULL)';
          const icon = item.patient?.name ? '✅' : '❌';
          console.log(`  ${icon} #${item.queueNumber}: ${displayName} - ${item.patient?.mobile || 'No mobile'} (${item.status})`);
        });
      }
      console.log('');
    });

    // Also check recent queue items from last 24 hours
    console.log('\n═════════════════════════════════════');
    console.log('Recent Queue Items (Last 24 hours)');
    console.log('═════════════════════════════════════\n');

    const recentItems = await prisma.queueItem.findMany({
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
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    recentItems.forEach((item) => {
      const displayName = item.patient?.name || '❌ NULL';
      const icon = item.patient?.name ? '✅' : '❌';
      const created = item.createdAt.toLocaleString();
      console.log(`${icon} Queue #${item.queueNumber}: ${displayName} (${item.patient?.mobile}) - Created: ${created}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQueue();
