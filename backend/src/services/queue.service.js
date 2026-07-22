/**
 * PulseMate — Shared Queue Engine
 *
 * Used by:
 *   - Online booking  (patient.controller / payment.controller)
 *   - Walk-in booking (reception.controller)
 *   - Verified follow-up booking (patient.controller / reception.controller)
 *
 * All three paths produce the same output shape:
 *   { queueNumber, position, estimatedWaitMinutes, estimatedAppointmentTime }
 */
const prisma = require('../config/database');
const { getOrCreateQueue } = require('../utils/getOrCreateQueue');
const logger = require('../config/logger');

/**
 * Calculate dynamic ETA for a queue position.
 *
 * @param {number} position        - 1-based queue position (after all follow-ups)
 * @param {number} avgMins         - avgConsultationMins from ClinicSession or DoctorProfile
 * @param {string|null} sessionStartTime - "HH:MM" string, optional
 * @returns {{ estimatedWaitMinutes: number, estimatedAppointmentTime: string|null }}
 */
const calcEta = (position, avgMins, sessionStartTime = null) => {
  const estimatedWaitMinutes = position * avgMins;

  let estimatedAppointmentTime = null;
  if (sessionStartTime) {
    const [h, m] = sessionStartTime.split(':').map(Number);
    const totalMins = h * 60 + m + (position - 1) * avgMins;
    const estH = Math.floor(totalMins / 60) % 24;
    const estM = totalMins % 60;
    estimatedAppointmentTime = `${String(estH).padStart(2, '0')}:${String(estM).padStart(2, '0')}`;
  }

  return { estimatedWaitMinutes, estimatedAppointmentTime };
};

/**
 * Add a patient to the queue and return token info.
 * Safe against race conditions — wraps in a transaction.
 *
 * @param {object} opts
 * @param {string}  opts.clinicId
 * @param {string}  opts.doctorId        - DoctorProfile.id
 * @param {string}  opts.patientId
 * @param {string}  opts.appointmentId   - Already-created Appointment.id
 * @param {Date}    opts.appointmentDate
 * @param {string|null} opts.sessionId
 * @param {boolean} [opts.isFollowUp=false]
 * @param {string|null} [opts.followUpOf=null] - original appointmentId for follow-up
 * @param {number}  [opts.avgMins=15]
 * @param {string|null} [opts.sessionStartTime=null]
 *
 * @returns {{ queueItem, queueNumber, position, estimatedWaitMinutes, estimatedAppointmentTime, queue }}
 */
const addToQueue = async ({
  clinicId,
  doctorId,
  patientId,
  appointmentId,
  appointmentDate,
  sessionId = null,
  isFollowUp = false,
  followUpOf = null,
  avgMins = 15,
  sessionStartTime = null,
}) => {
  const day = new Date(appointmentDate);
  day.setUTCHours(0, 0, 0, 0);

  // Get or create queue (handles P2002 race condition internally)
  const queue = await getOrCreateQueue(clinicId, doctorId, day, sessionId);

  if (queue.status === 'CLOSED') {
    const err = new Error('Queue is closed for this session');
    err.status = 400;
    throw err;
  }

  // Prevent duplicate QueueItem for same appointment
  const existing = await prisma.queueItem.findUnique({
    where: { appointmentId },
  });
  if (existing) {
    logger.warn(`[QueueEngine] Duplicate QueueItem attempted for appointment ${appointmentId}`);
    const eta = calcEta(existing.position, avgMins, sessionStartTime);
    return {
      queueItem: existing,
      queueNumber: existing.queueNumber,
      position: existing.position,
      ...eta,
      queue,
      isDuplicate: true,
    };
  }

  const { queueItem, queueNumber, position } = await prisma.$transaction(async (tx) => {
    // Monotonically increasing queue number (never reused)
    const lastItem = await tx.queueItem.findFirst({
      where: { queueId: queue.id },
      orderBy: { queueNumber: 'desc' },
    });
    const nextQueueNumber = (lastItem?.queueNumber || 0) + 1;

    let insertPosition;

    if (isFollowUp) {
      // Follow-up patients join at the END of the queue like regular patients (no priority)
      // Their benefit is bypassing session capacity limits, not queue position
      const waitingCount = await tx.queueItem.count({
        where: { queueId: queue.id, status: 'WAITING' },
      });
      insertPosition = waitingCount + 1;
    } else {
      // Regular patients go at the end of waiting list
      const waitingCount = await tx.queueItem.count({
        where: { queueId: queue.id, status: 'WAITING' },
      });
      insertPosition = waitingCount + 1;
    }

    const item = await tx.queueItem.create({
      data: {
        queueId: queue.id,
        appointmentId,
        patientId,
        queueNumber: nextQueueNumber,
        status: 'WAITING',
        position: insertPosition,
        isFollowUp,
        followUpOf: followUpOf || null,
      },
    });

    return { queueItem: item, queueNumber: nextQueueNumber, position: insertPosition };
  });

  const eta = calcEta(position, avgMins, sessionStartTime);

  return {
    queueItem,
    queueNumber,
    position,
    ...eta,
    queue,
    isDuplicate: false,
  };
};

/**
 * Recalculate queue positions and ETA for all WAITING items after a state change.
 * Fixes the existing bug where newEstimatedTime was computed but never written.
 *
 * @param {string} queueId
 * @param {number} [avgMins=15]
 * @param {string|null} [sessionStartTime=null]
 */
const recalculatePositions = async (queueId, avgMins = 15, sessionStartTime = null) => {
  // Fetch waiting items — natural order by position (follow-ups no longer get priority)
  const waitingItems = await prisma.queueItem.findMany({
    where: { queueId, status: 'WAITING' },
    orderBy: { position: 'asc' },
    include: { appointment: { select: { slotTime: true } } },
  });

  if (waitingItems.length === 0) return;

  // Calculate delay from current IN_CONSULTATION item (if any)
  let delayMins = 0;
  const inConsultation = await prisma.queueItem.findFirst({
    where: { queueId, status: 'IN_CONSULTATION' },
    include: { appointment: { select: { slotTime: true } } },
    orderBy: { calledAt: 'desc' },
  });

  if (inConsultation?.calledAt && inConsultation.appointment?.slotTime) {
    const calledAt = new Date(inConsultation.calledAt);
    const [scheduledH, scheduledM] = inConsultation.appointment.slotTime.split(':').map(Number);
    const scheduledStartMins = scheduledH * 60 + scheduledM;
    const actualStartMins = calledAt.getHours() * 60 + calledAt.getMinutes();
    delayMins = Math.max(0, actualStartMins - scheduledStartMins);
  }

  const updates = [];
  for (let i = 0; i < waitingItems.length; i++) {
    const item = waitingItems[i];
    const newPosition = i + 1;
    const estimatedWaitMinutes = newPosition * avgMins;

    // Compute estimated appointment time
    let estimatedSlotTime = null;
    if (sessionStartTime) {
      const [sh, sm] = sessionStartTime.split(':').map(Number);
      const totalMins = sh * 60 + sm + (newPosition - 1) * avgMins + delayMins;
      const estH = Math.floor(totalMins / 60) % 24;
      const estM = totalMins % 60;
      estimatedSlotTime = `${String(estH).padStart(2, '0')}:${String(estM).padStart(2, '0')}`;
    } else if (item.appointment?.slotTime && delayMins > 0) {
      // Slot-based: shift by delay
      const [slotH, slotM] = item.appointment.slotTime.split(':').map(Number);
      const adjustedMins = slotH * 60 + slotM + delayMins;
      const adjH = Math.floor(adjustedMins / 60) % 24;
      const adjM = adjustedMins % 60;
      estimatedSlotTime = `${String(adjH).padStart(2, '0')}:${String(adjM).padStart(2, '0')}`;
    }

    updates.push(
      prisma.queueItem.update({
        where: { id: item.id },
        data: { position: newPosition },
      })
    );

    if (item.appointmentId) {
      updates.push(
        prisma.appointment.update({
          where: { id: item.appointmentId },
          data: {
            estimatedWaitMinutes,
            // FIX: actually write the adjusted slot time back (was a no-op bug before)
            ...(estimatedSlotTime ? { slotTime: estimatedSlotTime } : {}),
          },
        })
      );
    }
  }

  await Promise.all(updates);
  return waitingItems;
};

/**
 * Get the avgConsultationMins and sessionStartTime for a given queue.
 * Used to populate recalculatePositions correctly.
 */
const getQueueSessionInfo = async (queue) => {
  let avgMins = 15;
  let sessionStartTime = null;

  try {
    if (queue.sessionId) {
      const sess = await prisma.clinicSession.findUnique({ where: { id: queue.sessionId } });
      if (sess) {
        avgMins = sess.avgConsultationMins || 15;
        sessionStartTime = sess.startTime;
      }
    } else {
      const dp = await prisma.doctorProfile.findUnique({ where: { id: queue.doctorId } });
      if (dp) avgMins = dp.avgConsultationMins || 15;
    }
  } catch (_) { /* non-critical */ }

  return { avgMins, sessionStartTime };
};

module.exports = { addToQueue, recalculatePositions, calcEta, getQueueSessionInfo };
