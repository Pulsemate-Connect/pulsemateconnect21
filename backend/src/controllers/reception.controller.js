const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const {
  notifyQueueCalled,
  notifyQueuePaused,
  notifyQueueResumed,
  notifyDoctorFollowUp,
  notifyReceptionistNewWalkIn,
} = require('../services/fcm.service');
const { emitClinicUpdate } = require('../socket');

/**
 * Helper: Get or create today's queue for a doctor in a clinic, scoped to a session.
 * If sessionId is provided, creates a per-session queue.
 * Falls back to legacy behaviour (no sessionId) for backwards compat.
 */
const getOrCreateQueue = async (clinicId, doctorId, sessionId = null) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const whereClause = sessionId
    ? { clinicId, doctorId, date: today, sessionId }
    : { clinicId, doctorId, date: today, sessionId: null };

  let queue = await prisma.queue.findFirst({ where: whereClause });

  if (!queue) {
    queue = await prisma.queue.create({
      data: { clinicId, doctorId, date: today, status: 'ACTIVE', ...(sessionId ? { sessionId } : {}) },
    });
  }

  return queue;
};

/**
 * Helper: Recalculate positions for waiting items in a queue.
 * Follow-up patients are sorted BEFORE regular patients at the same position tier.
 * Priority order: follow-up WAITING first, then regular WAITING — both sorted by queueNumber.
 */
const recalculatePositions = async (queueId, doctorAvgMins = 10) => {
  const waitingItems = await prisma.queueItem.findMany({
    where: { queueId, status: 'WAITING' },
    orderBy: [
      { isFollowUp: 'desc' }, // follow-ups first
      { queueNumber: 'asc' },
    ],
  });

  for (let i = 0; i < waitingItems.length; i++) {
    await prisma.queueItem.update({
      where: { id: waitingItems[i].id },
      data: { position: i + 1 },
    });

    if (waitingItems[i].appointmentId) {
      await prisma.appointment.update({
        where: { id: waitingItems[i].appointmentId },
        data: { estimatedWaitMinutes: (i + 1) * doctorAvgMins },
      });
    }
  }

  return waitingItems;
};

const getQueue = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { clinicId, sessionId } = req.query;

    if (!clinicId) {
      return sendError(res, 'clinicId query param is required', 400);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Build where clause — scope to session if provided
    const whereClause = sessionId
      ? { clinicId, doctorId, date: today, sessionId }
      : sessionId === ''
        ? { clinicId, doctorId, date: today, sessionId: null }
        : { clinicId, doctorId, date: today }; // legacy: any queue for this doctor today

    const queue = await prisma.queue.findFirst({
      where: whereClause,
      include: {
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        session: { select: { id: true, name: true, startTime: true, endTime: true, avgConsultationMins: true, sessionType: true } },
        queueItems: {
          orderBy: [{ isFollowUp: 'desc' }, { position: 'asc' }],
          include: {
            patient: { select: { id: true, name: true, mobile: true } },
            appointment: {
              select: {
                id: true,
                symptoms: true,
                appointmentType: true,
                slotTime: true,
                estimatedWaitMinutes: true,
                sessionId: true,
                doctor: {
                  select: { consultationFee: true },
                },
                payment: {
                  select: { status: true, amount: true, method: true },
                },
              },
            },
          },
        },
      },
    });

    if (!queue) {
      return sendSuccess(res, { queue: null, queueItems: [] });
    }

    // ── Compute estimated appointment time per queue item ─────────────────────
    // Use session's start time and avgConsultationMins if available
    let sessionStartMinutes = null;
    let avgMins = 15;
    try {
      if (queue.session) {
        const [h, m] = queue.session.startTime.split(':').map(Number);
        sessionStartMinutes = h * 60 + m;
        avgMins = queue.session.avgConsultationMins || 15;
      } else {
        // Legacy: fetch first session
        const clinicSessions = await prisma.clinicSession.findMany({
          where: { clinicId, enabled: true },
          orderBy: { sortOrder: 'asc' },
        });
        if (clinicSessions.length > 0) {
          const [h, m] = clinicSessions[0].startTime.split(':').map(Number);
          sessionStartMinutes = h * 60 + m;
          avgMins = clinicSessions[0].avgConsultationMins || 15;
        }
      }
    } catch (_) { /* non-critical */ }

    const enrichedItems = queue.queueItems.map((item) => {
      let estimatedAppointmentTime = null;
      if (sessionStartMinutes !== null && item.position > 0) {
        const totalMins = sessionStartMinutes + (item.position - 1) * avgMins;
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        estimatedAppointmentTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
      return { ...item, estimatedAppointmentTime };
    });

    return sendSuccess(res, { queue, queueItems: enrichedItems });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reception/walk-in - Add walk-in patient
 */
const addWalkIn = async (req, res, next) => {
  try {
    const { doctorId, clinicId, patientMobile, patientName, symptoms, sessionId } = req.body;

    // Find or create patient
    let patient = await prisma.user.findUnique({ where: { mobile: patientMobile } });

    if (!patient) {
      patient = await prisma.user.create({
        data: {
          mobile: patientMobile,
          name: patientName || 'Walk-in Patient',
          role: 'PATIENT',
          patientProfile: { create: {} },
        },
      });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctorProfile) {
      return sendError(res, 'Doctor not found', 404);
    }

    const queue = await getOrCreateQueue(clinicId, doctorId, sessionId || null);

    if (queue.status === 'CLOSED') {
      return sendError(res, 'Queue is closed for today', 400);
    }

    // Get next queue number
    const lastItem = await prisma.queueItem.findFirst({
      where: { queueId: queue.id },
      orderBy: { queueNumber: 'desc' },
    });
    const queueNumber = (lastItem?.queueNumber || 0) + 1;

    // Count waiting patients for position (regular walk-ins go after follow-ups)
    const waitingCount = await prisma.queueItem.count({
      where: { queueId: queue.id, status: 'WAITING' },
    });

    // Compute estimated appointment time from session start
    let estimatedAppointmentTimeWalkIn = null;
    try {
      if (sessionId) {
        const sess = await prisma.clinicSession.findUnique({ where: { id: sessionId } });
        if (sess) {
          const avgSess = sess.avgConsultationMins || doctorProfile.avgConsultationMins || 15;
          const [startH, startM] = sess.startTime.split(':').map(Number);
          const totalMins = startH * 60 + startM + waitingCount * avgSess;
          const estH = Math.floor(totalMins / 60);
          const estM = totalMins % 60;
          estimatedAppointmentTimeWalkIn = `${String(estH).padStart(2, '0')}:${String(estM).padStart(2, '0')}`;
        }
      }
    } catch (_) { /* non-critical */ }

    // Create appointment for walk-in
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        clinicId,
        ...(sessionId ? { sessionId } : {}),
        appointmentType: 'OFFLINE',
        appointmentDate: new Date(),
        status: 'IN_QUEUE',
        queueNumber,
        symptoms,
        estimatedWaitMinutes: (waitingCount + 1) * (doctorProfile.avgConsultationMins || 10),
      },
    });

    const queueItem = await prisma.queueItem.create({
      data: {
        queueId: queue.id,
        appointmentId: appointment.id,
        patientId: patient.id,
        queueNumber,
        status: 'WAITING',
        position: waitingCount + 1,
        isFollowUp: false,
      },
    });

    // Emit socket update
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${clinicId}:${doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', {
        type: 'PATIENT_ADDED',
        queueItem: { ...queueItem, patient: { name: patient.name, mobile: patient.mobile } },
      });

      // Notify clinic dashboard of queue change
      const queueLength = await prisma.queueItem.count({
        where: { queueId: queue.id, status: 'WAITING' },
      });
      emitClinicUpdate(io, clinicId, { type: 'queue-updated', queueLength });
    }

    // Notify receptionist of new walk-in (find receptionist for this clinic)
    try {
      const receptionists = await prisma.clinicStaff.findMany({
        where: { clinicId, role: 'RECEPTIONIST', isActive: true },
        select: { userId: true },
      });
      for (const r of receptionists) {
        notifyReceptionistNewWalkIn(r.userId, patient.name).catch(() => { });
      }
    } catch { /* non-critical */ }

    return sendSuccess(res, { appointment, queueItem, queueNumber, estimatedAppointmentTime: estimatedAppointmentTimeWalkIn }, 'Walk-in patient added to queue', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reception/follow-up - Add a follow-up patient back to the queue with priority
 * This is called when a patient returns after tests/BP/X-ray etc.
 * Follow-up patients are inserted AHEAD of regular waiting patients.
 */
const addFollowUp = async (req, res, next) => {
  try {
    const { doctorId, clinicId, originalAppointmentId, symptoms, sessionId } = req.body;

    // Verify original appointment exists
    const originalAppointment = await prisma.appointment.findUnique({
      where: { id: originalAppointmentId },
      include: {
        patient: { select: { id: true, name: true, mobile: true } },
      },
    });

    if (!originalAppointment) {
      return sendError(res, 'Original appointment not found', 404);
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctorProfile) {
      return sendError(res, 'Doctor not found', 404);
    }

    // Use sessionId from request, or inherit from original appointment
    const effectiveSessionId = sessionId || originalAppointment.sessionId || null;

    const queue = await getOrCreateQueue(clinicId, doctorId, effectiveSessionId);

    if (queue.status === 'CLOSED') {
      return sendError(res, 'Queue is closed for today', 400);
    }

    // Get next queue number (follow-ups get an F-prefix conceptually but same int sequence)
    const lastItem = await prisma.queueItem.findFirst({
      where: { queueId: queue.id },
      orderBy: { queueNumber: 'desc' },
    });
    const queueNumber = (lastItem?.queueNumber || 0) + 1;

    // Count ONLY regular (non-follow-up) waiting patients — follow-up goes before them
    // (used for position calculation context — follow-ups precede regular patients)

    // Follow-up position = number of other follow-ups already waiting + 1
    const followUpWaitingCount = await prisma.queueItem.count({
      where: { queueId: queue.id, status: 'WAITING', isFollowUp: true },
    });

    const position = followUpWaitingCount + 1; // goes before regular patients

    // Create a new appointment for the follow-up visit
    const followUpAppointment = await prisma.appointment.create({
      data: {
        patientId: originalAppointment.patientId,
        doctorId,
        clinicId,
        ...(effectiveSessionId ? { sessionId: effectiveSessionId } : {}),
        appointmentType: 'OFFLINE',
        appointmentDate: new Date(),
        status: 'IN_QUEUE',
        queueNumber,
        symptoms: symptoms || `Follow-up from appointment ${originalAppointmentId}`,
        estimatedWaitMinutes: position * (doctorProfile.avgConsultationMins || 10),
      },
    });

    const queueItem = await prisma.queueItem.create({
      data: {
        queueId: queue.id,
        appointmentId: followUpAppointment.id,
        patientId: originalAppointment.patientId,
        queueNumber,
        status: 'WAITING',
        position,
        isFollowUp: true,
        followUpOf: originalAppointmentId,
      },
    });

    // Push regular patients' positions down by 1
    await prisma.queueItem.updateMany({
      where: {
        queueId: queue.id,
        status: 'WAITING',
        isFollowUp: false,
      },
      data: { position: { increment: 1 } },
    });

    // Update estimated wait for all regular waiting patients — single updateMany
    // We can't use a subquery join in Prisma for this, but we can batch the IDs
    const regularWaiting = await prisma.queueItem.findMany({
      where: { queueId: queue.id, status: 'WAITING', isFollowUp: false },
      select: { id: true, position: true, appointmentId: true },
    });

    // Batch update appointments using updateMany per position group
    // Group by position to minimize queries
    const positionGroups = {};
    for (const item of regularWaiting) {
      if (item.appointmentId) {
        const estWait = item.position * (doctorProfile.avgConsultationMins || 10);
        if (!positionGroups[estWait]) positionGroups[estWait] = [];
        positionGroups[estWait].push(item.appointmentId);
      }
    }
    await Promise.all(
      Object.entries(positionGroups).map(([estWait, apptIds]) =>
        prisma.appointment.updateMany({
          where: { id: { in: apptIds } },
          data: { estimatedWaitMinutes: parseInt(estWait) },
        })
      )
    );

    // Emit socket update
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${clinicId}:${doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', {
        type: 'FOLLOW_UP_ADDED',
        queueItem: {
          ...queueItem,
          patient: {
            name: originalAppointment.patient.name,
            mobile: originalAppointment.patient.mobile,
          },
          isFollowUp: true,
        },
      });
      io.to(roomName).emit('queue:positionUpdated', { queueId: queue.id });

      // Notify clinic dashboard of queue change
      const queueLength = await prisma.queueItem.count({
        where: { queueId: queue.id, status: 'WAITING' },
      });
      emitClinicUpdate(io, clinicId, { type: 'queue-updated', queueLength });
    }

    // Notify the doctor about the follow-up patient
    try {
      const doctorUser = await prisma.user.findFirst({
        where: { doctorProfile: { id: doctorId } },
        select: { id: true },
      });
      if (doctorUser) {
        notifyDoctorFollowUp(doctorUser.id, originalAppointment.patient.name).catch(() => { });
      }
    } catch { /* non-critical */ }

    return sendSuccess(
      res,
      { appointment: followUpAppointment, queueItem, queueNumber },
      `Follow-up patient added with priority (position #${position})`,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueItemId/check-in - Check in booked patient
 */
const checkIn = async (req, res, next) => {
  try {
    const { queueItemId } = req.params;

    const queueItem = await prisma.queueItem.findUnique({
      where: { id: queueItemId },
      include: { queue: true, appointment: true },
    });

    if (!queueItem) {
      return sendError(res, 'Queue item not found', 404);
    }

    if (queueItem.status !== 'WAITING') {
      return sendError(res, 'Patient is not in waiting status', 400);
    }

    await prisma.appointment.update({
      where: { id: queueItem.appointmentId },
      data: { status: 'CHECKED_IN' },
    });

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queueItem.queue.clinicId}:${queueItem.queue.doctorId}:${today}`).emit('queue:updated', {
        type: 'PATIENT_CHECKED_IN',
        queueItemId,
      });
    }

    return sendSuccess(res, { queueItem }, 'Patient checked in');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueId/call-next - Call next patient
 * Follow-up patients are called before regular patients.
 */
const callNext = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { doctor: { include: { user: { select: { name: true } } } } },
    });

    if (!queue) {
      return sendError(res, 'Queue not found', 404);
    }

    if (queue.status === 'PAUSED') {
      return sendError(res, 'Queue is paused', 400);
    }

    // Mark current IN_CONSULTATION as completed if any
    const currentConsultation = await prisma.queueItem.findFirst({
      where: { queueId, status: 'IN_CONSULTATION' },
    });

    if (currentConsultation) {
      await prisma.queueItem.update({
        where: { id: currentConsultation.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      if (currentConsultation.appointmentId) {
        await prisma.appointment.update({
          where: { id: currentConsultation.appointmentId },
          data: { status: 'COMPLETED' },
        });

        // Emit appointment-completed to clinic dashboard
        const io = req.app.get('io');
        if (io) {
          // Calculate completion rate for the clinic today
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          const [totalToday, completedToday] = await Promise.all([
            prisma.appointment.count({
              where: { clinicId: queue.clinicId, appointmentDate: { gte: today } },
            }),
            prisma.appointment.count({
              where: { clinicId: queue.clinicId, appointmentDate: { gte: today }, status: 'COMPLETED' },
            }),
          ]);
          const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

          emitClinicUpdate(io, queue.clinicId, {
            type: 'appointment-completed',
            appointmentId: currentConsultation.appointmentId,
            completionRate,
          });
        }
      }
    }

    // Mark current CALLED as IN_CONSULTATION
    const calledItem = await prisma.queueItem.findFirst({
      where: { queueId, status: 'CALLED' },
    });

    if (calledItem) {
      await prisma.queueItem.update({
        where: { id: calledItem.id },
        data: { status: 'IN_CONSULTATION' },
      });
      if (calledItem.appointmentId) {
        await prisma.appointment.update({
          where: { id: calledItem.appointmentId },
          data: { status: 'IN_CONSULTATION' },
        });
      }
    }

    // Get next WAITING patient — follow-ups first, then by position
    const nextItem = await prisma.queueItem.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: [
        { isFollowUp: 'desc' }, // follow-ups first
        { position: 'asc' },
      ],
      include: {
        patient: { select: { id: true, name: true, mobile: true } },
        appointment: true,
      },
    });

    if (!nextItem) {
      return sendSuccess(res, { message: 'No more patients in queue' });
    }

    // Call the next patient
    await prisma.queueItem.update({
      where: { id: nextItem.id },
      data: { status: 'CALLED', calledAt: new Date() },
    });

    if (nextItem.appointmentId) {
      await prisma.appointment.update({
        where: { id: nextItem.appointmentId },
        data: { status: 'CALLED' },
      });
    }

    // Recalculate positions for remaining waiting patients
    const avgMins = queue.doctor?.avgConsultationMins || 10;
    await recalculatePositions(queueId, avgMins);

    // Send FCM push notification to the called patient
    notifyQueueCalled(
      nextItem.patientId,
      nextItem.queueNumber
    ).catch(() => { });

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${queue.clinicId}:${queue.doctorId}:${today}`;

      io.to(roomName).emit('queue:called', {
        patientId: nextItem.patientId,
        queueNumber: nextItem.queueNumber,
        patientName: nextItem.patient.name,
        isFollowUp: nextItem.isFollowUp,
      });

      io.to(roomName).emit('queue:positionUpdated', {
        queueId,
        calledQueueNumber: nextItem.queueNumber,
      });

      // Notify clinic dashboard of queue change
      const queueLength = await prisma.queueItem.count({
        where: { queueId, status: 'WAITING' },
      });
      emitClinicUpdate(io, queue.clinicId, { type: 'queue-updated', queueLength });
    }

    return sendSuccess(
      res,
      { calledPatient: nextItem },
      `Patient #${nextItem.queueNumber} called${nextItem.isFollowUp ? ' (Follow-up)' : ''}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue-item/:id/skip - Skip patient
 */
const skipPatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queueItem = await prisma.queueItem.findUnique({
      where: { id },
      include: { queue: true },
    });

    if (!queueItem) {
      return sendError(res, 'Queue item not found', 404);
    }

    await prisma.queueItem.update({
      where: { id },
      data: { status: 'SKIPPED' },
    });

    if (queueItem.appointmentId) {
      await prisma.appointment.update({
        where: { id: queueItem.appointmentId },
        data: { status: 'NO_SHOW' },
      });
    }

    const avgMins = 10;
    await recalculatePositions(queueItem.queueId, avgMins);

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queueItem.queue.clinicId}:${queueItem.queue.doctorId}:${today}`).emit('queue:updated', {
        type: 'PATIENT_SKIPPED',
        queueItemId: id,
      });

      // Notify clinic dashboard of queue change
      const queueLength = await prisma.queueItem.count({
        where: { queueId: queueItem.queueId, status: 'WAITING' },
      });
      emitClinicUpdate(io, queueItem.queue.clinicId, { type: 'queue-updated', queueLength });
    }

    return sendSuccess(res, {}, 'Patient skipped');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue-item/:id/complete - Mark patient complete
 */
const completePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queueItem = await prisma.queueItem.findUnique({
      where: { id },
      include: { queue: true },
    });

    if (!queueItem) {
      return sendError(res, 'Queue item not found', 404);
    }

    await prisma.queueItem.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    if (queueItem.appointmentId) {
      await prisma.appointment.update({
        where: { id: queueItem.appointmentId },
        data: { status: 'COMPLETED' },
      });
    }

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queueItem.queue.clinicId}:${queueItem.queue.doctorId}:${today}`).emit('queue:completed', {
        queueItemId: id,
        queueNumber: queueItem.queueNumber,
      });

      // Emit appointment-completed to clinic dashboard
      if (queueItem.appointmentId) {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const [totalToday, completedToday] = await Promise.all([
          prisma.appointment.count({
            where: { clinicId: queueItem.queue.clinicId, appointmentDate: { gte: todayStart } },
          }),
          prisma.appointment.count({
            where: { clinicId: queueItem.queue.clinicId, appointmentDate: { gte: todayStart }, status: 'COMPLETED' },
          }),
        ]);
        const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

        emitClinicUpdate(io, queueItem.queue.clinicId, {
          type: 'appointment-completed',
          appointmentId: queueItem.appointmentId,
          completionRate,
        });
      }

      // Emit queue-updated to clinic dashboard
      const queueLength = await prisma.queueItem.count({
        where: { queueId: queueItem.queueId, status: 'WAITING' },
      });
      emitClinicUpdate(io, queueItem.queue.clinicId, { type: 'queue-updated', queueLength });
    }

    return sendSuccess(res, {}, 'Patient marked as completed');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueId/pause - Pause queue
 */
const pauseQueue = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: { status: 'PAUSED' },
      include: { doctor: { include: { user: { select: { name: true } } } } },
    });

    // Notify all waiting patients
    const waitingItems = await prisma.queueItem.findMany({
      where: { queueId, status: 'WAITING' },
      select: { patientId: true },
    });
    const patientIds = [...new Set(waitingItems.map((i) => i.patientId))];
    const doctorName = queue.doctor?.user?.name || 'the doctor';
    await notifyQueuePaused(patientIds, doctorName);

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queue.clinicId}:${queue.doctorId}:${today}`).emit('queue:paused', { queueId });
    }

    return sendSuccess(res, { queue }, 'Queue paused');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueId/resume - Resume queue
 */
const resumeQueue = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: { status: 'ACTIVE' },
    });

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queue.clinicId}:${queue.doctorId}:${today}`).emit('queue:resumed', { queueId });
    }

    // Notify all waiting patients that queue has resumed
    try {
      const resumedQueue = await prisma.queue.findUnique({
        where: { id: queueId },
        include: { doctor: { include: { user: { select: { name: true } } } } },
      });
      const waitingPatients = await prisma.queueItem.findMany({
        where: { queueId, status: 'WAITING' },
        select: { patientId: true },
      });
      const doctorName = resumedQueue?.doctor?.user?.name || 'the doctor';
      const uniquePatientIds = [...new Set(waitingPatients.map((i) => i.patientId))];
      for (const patientId of uniquePatientIds) {
        notifyQueueResumed(patientId, doctorName).catch(() => { });
      }
    } catch { /* notification failure must not break the main flow */ }

    return sendSuccess(res, { queue }, 'Queue resumed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueue,
  addWalkIn,
  addFollowUp,
  checkIn,
  callNext,
  skipPatient,
  completePatient,
  pauseQueue,
  resumeQueue,
};
