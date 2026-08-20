// ─────────────────────────────────────────────────────────────────────────────
//  Appointment No-Show Auto-Cancellation Job — PulseMate Backend
//
//  Runs every 15 minutes. Automatically cancels appointments where:
//    • Appointment slot time has passed + 30-minute grace period
//    • Status is still BOOKED (patient never checked in)
//    • Sends notification to patient with rebooking option
//
//  Uses node-cron for scheduling.
//  Grace period can be configured (default: 30 minutes)
// ─────────────────────────────────────────────────────────────────────────────

const cron = require('node-cron');
const prisma = require('../config/database');
const { createNotification } = require('../services/notification.service');
const logger = require('../config/logger');

// Configuration
const GRACE_PERIOD_MINUTES = 30; // Minutes after appointment time to wait before auto-cancel
const CHECK_INTERVAL_MINUTES = 15; // How often to run the job

/**
 * Parse slot time (e.g., "09:00" or "09:00 AM") and appointment date
 * to create a full Date object for when the appointment was scheduled
 */
const getAppointmentDateTime = (appointmentDate, slotTime) => {
  if (!slotTime) return null;
  
  const date = new Date(appointmentDate);
  
  // Handle formats like "09:00" or "09:00 AM"
  const timeMatch = slotTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) return null;
  
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const meridiem = timeMatch[3];
  
  // Convert to 24-hour format if AM/PM is provided
  if (meridiem) {
    const isPM = meridiem.toUpperCase() === 'PM';
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  }
  
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Process no-show appointments and auto-cancel them
 */
const processNoShowAppointments = async () => {
  try {
    const now = new Date();
    
    // Calculate cutoff time: appointments that should have started at least GRACE_PERIOD_MINUTES ago
    const cutoffTime = new Date(now.getTime() - GRACE_PERIOD_MINUTES * 60 * 1000);
    
    // Find appointments that are past their time + grace period and still BOOKED
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'BOOKED', // Only auto-cancel if patient never checked in
        appointmentDate: {
          lte: cutoffTime, // Appointment date/time is in the past
        },
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { 
          include: { 
            user: { select: { name: true, id: true } } 
          } 
        },
        clinic: { select: { id: true, name: true, ownerId: true } },
        queueItem: true,
      },
    });
    
    let cancelledCount = 0;
    
    for (const appointment of appointments) {
      try {
        // Double-check if appointment time + grace period has actually passed
        const appointmentDateTime = getAppointmentDateTime(
          appointment.appointmentDate, 
          appointment.slotTime
        );
        
        if (!appointmentDateTime) {
          logger.warn(`[No-Show] Skipping appointment ${appointment.id} - invalid slot time format`);
          continue;
        }
        
        const gracePeriodEnd = new Date(appointmentDateTime.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000);
        
        if (now < gracePeriodEnd) {
          // Grace period hasn't ended yet, skip
          continue;
        }
        
        // Auto-cancel the appointment
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { 
            status: 'CANCELLED',
            // Optional: Add a reason field if your schema supports it
            // cancellationReason: 'NO_SHOW_AUTO_CANCELLED'
          },
        });
        
        // Cancel queue item if exists
        if (appointment.queueItem) {
          await prisma.queueItem.update({
            where: { id: appointment.queueItem.id },
            data: { status: 'CANCELLED' },
          });
        }
        
        cancelledCount++;
        
        const doctorName = appointment.doctor?.user?.name || 'Doctor';
        const clinicName = appointment.clinic?.name || 'the clinic';
        const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const timeStr = appointment.slotTime || '';
        
        // Notify patient about auto-cancellation with rebooking option
        await createNotification({
          userId: appointment.patient.id,
          type: 'APPOINTMENT_CANCELLED',
          title: '❌ Appointment Auto-Cancelled',
          message: `Your appointment with Dr. ${doctorName} at ${clinicName} on ${dateStr} ${timeStr} was automatically cancelled due to no-show. You can rebook for a different time slot.`,
          metadata: {
            appointmentId: appointment.id,
            doctorId: appointment.doctor?.id,
            clinicId: appointment.clinic?.id,
            reason: 'NO_SHOW',
            canRebook: true,
            appointmentDate: appointment.appointmentDate,
            slotTime: appointment.slotTime,
          },
          priority: 'HIGH',
        });
        
        // Notify doctor
        if (appointment.doctor?.user?.id) {
          await createNotification({
            userId: appointment.doctor.user.id,
            type: 'APPOINTMENT_CANCELLED',
            title: '🚫 No-Show Appointment',
            message: `Patient ${appointment.patient.name || 'Unknown'} did not arrive for ${dateStr} ${timeStr} appointment. Automatically cancelled.`,
            metadata: {
              appointmentId: appointment.id,
              patientId: appointment.patient.id,
              clinicId: appointment.clinic?.id,
              reason: 'NO_SHOW',
            },
            priority: 'LOW',
          });
        }
        
        // Notify clinic owner
        if (appointment.clinic?.ownerId) {
          await createNotification({
            userId: appointment.clinic.ownerId,
            type: 'APPOINTMENT_CANCELLED',
            title: '🚫 No-Show Appointment',
            message: `Appointment with Dr. ${doctorName} on ${dateStr} was auto-cancelled (no-show).`,
            metadata: {
              appointmentId: appointment.id,
              clinicId: appointment.clinic.id,
              reason: 'NO_SHOW',
            },
            priority: 'LOW',
          });
        }
        
        // Notify receptionists
        const receptionists = await prisma.clinicStaff.findMany({
          where: {
            clinicId: appointment.clinic?.id,
            role: 'RECEPTIONIST',
            isActive: true,
          },
          select: { userId: true },
        });
        
        for (const receptionist of receptionists) {
          await createNotification({
            userId: receptionist.userId,
            type: 'APPOINTMENT_CANCELLED',
            title: '🚫 No-Show Appointment',
            message: `Appointment with Dr. ${doctorName} on ${dateStr} was auto-cancelled (no-show).`,
            metadata: {
              appointmentId: appointment.id,
              clinicId: appointment.clinic?.id,
              reason: 'NO_SHOW',
            },
            priority: 'LOW',
          });
        }
        
        logger.info(`[No-Show] Auto-cancelled appointment ${appointment.id} for patient ${appointment.patient.name}`);
        
      } catch (error) {
        logger.error(`[No-Show] Failed to cancel appointment ${appointment.id}:`, {
          error: error.message,
          stack: error.stack,
        });
      }
    }
    
    if (cancelledCount > 0) {
      logger.info(`[No-Show] Auto-cancelled ${cancelledCount} no-show appointment(s)`);
    }
    
  } catch (error) {
    logger.error('[No-Show] Job failed:', {
      error: error.message,
      stack: error.stack,
    });
  }
};

/**
 * Start the no-show auto-cancellation job
 * Runs every 15 minutes
 */
const startNoShowJob = () => {
  // Run every 15 minutes: "*/15 * * * *"
  const run = async () => {
    logger.debug('[No-Show] Running no-show appointment check...');
    await processNoShowAppointments();
  };
  
  // Schedule: every 15 minutes
  cron.schedule(`*/${CHECK_INTERVAL_MINUTES} * * * *`, run, { 
    timezone: 'Asia/Kolkata' 
  });
  
  // Fire once shortly after boot (5 seconds delay)
  setTimeout(run, 5_000);
  
  logger.info(`[No-Show] Auto-cancellation job scheduled (every ${CHECK_INTERVAL_MINUTES} minutes, IST)`);
  logger.info(`[No-Show] Grace period: ${GRACE_PERIOD_MINUTES} minutes after appointment time`);
};

module.exports = { 
  startNoShowJob,
  processNoShowAppointments,
  GRACE_PERIOD_MINUTES,
};
