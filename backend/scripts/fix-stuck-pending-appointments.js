/**
 * fix-stuck-pending-appointments.js
 *
 * Cancels all PENDING_PAYMENT appointments older than 30 minutes.
 * These are abandoned/failed payment sessions that block new bookings.
 *
 * Run from backend/ folder:
 *   node scripts/fix-stuck-pending-appointments.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStuckAppointments() {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find all stuck PENDING_PAYMENT appointments
    const stuck = await prisma.appointment.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: { lt: thirtyMinsAgo },
      },
      select: { id: true, patientId: true, doctorId: true, createdAt: true, appointmentDate: true },
    });

    if (stuck.length === 0) {
      console.log('✅  No stuck PENDING_PAYMENT appointments found.');
      return;
    }

    console.log(`Found ${stuck.length} stuck PENDING_PAYMENT appointment(s):\n`);
    stuck.forEach((a) => {
      console.log(`  ID: ${a.id}  |  Date: ${a.appointmentDate.toISOString().slice(0,10)}  |  Created: ${a.createdAt.toISOString()}`);
    });

    // Cancel them all
    const result = await prisma.appointment.updateMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: { lt: thirtyMinsAgo },
      },
      data: { status: 'CANCELLED' },
    });

    console.log(`\n✅  Cancelled ${result.count} stuck appointment(s). Booking should work now.`);
  } catch (err) {
    console.error('❌  Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixStuckAppointments();
