const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const {
  notifyQueueCalled,
  notifyQueuePaused,
  notifyQueueResumed,
  notifyDoctorFollowUp,
  notifyReceptionistNewWalkIn,
  sendNotification,
} = require('../services/fcm.service');
const { emitClinicUpdate } = require('../socket');
const { addToQueue, recalculatePositions, getQueueSessionInfo } = require('../services/queue.service');
const { getOrCreateQueue } = require('../utils/getOrCreateQueue');

/**
 * Helper: today's date at UTC midnight for queue lookups.
 */
const todayUTC = () => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; };

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
 * Uses the shared queue engine — same as online booking and follow-up.
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
    if (!doctorProfile) return sendError(res, 'Doctor not found', 404);

    // Resolve session info for ETA
    let avgMins = doctorProfile.avgConsultationMins || 15;
    let sessionStartTime = null;
    if (sessionId) {
      const sess = await prisma.clinicSession.findUnique({ where: { id: sessionId } });
      if (sess) { avgMins = sess.avgConsultationMins || avgMins; sessionStartTime = sess.startTime; }
    }

    // Create appointment first
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        clinicId,
        ...(sessionId ? { sessionId } : {}),
        appointmentType: 'OFFLINE',
        appointmentDate: new Date(),
        status: 'IN_QUEUE',
        symptoms: symptoms || null,
        estimatedWaitMinutes: 0, // updated by addToQueue
      },
    });

    // Add to queue via shared engine
    const queueResult = await addToQueue({
      clinicId, doctorId,
      patientId: patient.id,
      appointmentId: appointment.id,
      appointmentDate: new Date(),
      sessionId: sessionId || null,
      isFollowUp: false,
      avgMins,
      sessionStartTime,
    });

    // Update appointment with queue info
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        queueNumber: queueResult.queueNumber,
        estimatedWaitMinutes: queueResult.estimatedWaitMinutes,
      },
    });

    // Socket update
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${clinicId}:${doctorId}:${today}`).emit('queue:updated', {
        type: 'PATIENT_ADDED',
        queueItem: { ...queueResult.queueItem, patient: { name: patient.name, mobile: patient.mobile } },
      });
      const queueLength = await prisma.queueItem.count({ where: { queueId: queueResult.queue.id, status: 'WAITING' } });
      emitClinicUpdate(io, clinicId, { type: 'queue-updated', queueLength });
    }

    // Notify receptionist
    try {
      const receptionists = await prisma.clinicStaff.findMany({
        where: { clinicId, role: 'RECEPTIONIST', isActive: true },
        select: { userId: true },
      });
      for (const r of receptionists) {
        notifyReceptionistNewWalkIn(r.userId, patient.name).catch(() => { });
      }
    } catch { /* non-critical */ }

    return sendSuccess(res, {
      appointment: { ...appointment, queueNumber: queueResult.queueNumber },
      queueItem: queueResult.queueItem,
      queueNumber: queueResult.queueNumber,
      position: queueResult.position,
      estimatedWaitMinutes: queueResult.estimatedWaitMinutes,
      estimatedAppointmentTime: queueResult.estimatedAppointmentTime,
    }, 'Walk-in patient added to queue', 201);
  } catch (error) {
    if (error.status === 400) return sendError(res, error.message, 400);
    next(error);
  }
};

/**
 * POST /api/reception/follow-up - Add a VERIFIED follow-up patient back to the queue.
 * Uses the shared queue engine. Follow-ups get priority position (before regular patients).
 * Only receptionists/owners can call this — patient follow-up goes through patient API.
 */
const addFollowUp = async (req, res, next) => {
  try {
    const { doctorId, clinicId, originalAppointmentId, symptoms, sessionId } = req.body;

    // Verify original appointment exists and belongs to this clinic
    const originalAppointment = await prisma.appointment.findUnique({
      where: { id: originalAppointmentId },
      include: { patient: { select: { id: true, name: true, mobile: true } } },
    });

    if (!originalAppointment) return sendError(res, 'Original appointment not found', 404);
    if (originalAppointment.clinicId !== clinicId) return sendError(res, 'Appointment does not belong to this clinic', 403);

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctorProfile) return sendError(res, 'Doctor not found', 404);

    // Validate follow-up settings (enabled + within validity period)
    const { getFollowUpSettings } = require('../services/followup.service');
    const fuSettings = await getFollowUpSettings(doctorId, clinicId);
    if (!fuSettings.followUpEnabled) {
      return sendError(res, 'Follow-up is not enabled for this doctor/clinic', 400);
    }
    if (originalAppointment.status !== 'COMPLETED') {
      return sendError(res, 'Previous appointment must be completed for a follow-up', 400);
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - fuSettings.followUpValidityDays);
    if (new Date(originalAppointment.appointmentDate) < cutoffDate) {
      return sendError(res, `Follow-up validity period has expired (${fuSettings.followUpValidityDays} days)`, 400);
    }

    // Prevent duplicate follow-up for the same previous visit
    const existingFollowUp = await prisma.appointment.findFirst({
      where: { followUpOfAppointmentId: originalAppointmentId, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
    });
    if (existingFollowUp) {
      return sendError(res, 'A follow-up has already been booked for this visit', 409);
    }

    const effectiveSessionId = sessionId || originalAppointment.sessionId || null;

    // Resolve session info for ETA
    let avgMins = doctorProfile.avgConsultationMins || 15;
    let sessionStartTime = null;
    if (effectiveSessionId) {
      const sess = await prisma.clinicSession.findUnique({ where: { id: effectiveSessionId } });
      if (sess) { avgMins = sess.avgConsultationMins || avgMins; sessionStartTime = sess.startTime; }
    }

    // Create follow-up appointment linked to previous visit
    const followUpAppointment = await prisma.appointment.create({
      data: {
        patientId: originalAppointment.patientId,
        doctorId, clinicId,
        ...(effectiveSessionId ? { sessionId: effectiveSessionId } : {}),
        appointmentType: 'OFFLINE',
        appointmentDate: new Date(),
        status: 'IN_QUEUE',
        appointmentKind: 'FOLLOW_UP',
        followUpOfAppointmentId: originalAppointmentId,
        symptoms: symptoms || `Follow-up from ${new Date(originalAppointment.appointmentDate).toLocaleDateString('en-IN')}`,
        estimatedWaitMinutes: 0,
      },
    });

    // Add to queue via shared engine with follow-up priority
    const queueResult = await addToQueue({
      clinicId, doctorId,
      patientId: originalAppointment.patientId,
      appointmentId: followUpAppointment.id,
      appointmentDate: new Date(),
      sessionId: effectiveSessionId,
      isFollowUp: true,
      followUpOf: originalAppointmentId,
      avgMins,
      sessionStartTime,
    });

    // Update appointment with queue info
    await prisma.appointment.update({
      where: { id: followUpAppointment.id },
      data: {
        queueNumber: queueResult.queueNumber,
        estimatedWaitMinutes: queueResult.estimatedWaitMinutes,
      },
    });

    // Socket update
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${clinicId}:${doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', {
        type: 'FOLLOW_UP_ADDED',
        queueItem: {
          ...queueResult.queueItem,
          patient: { name: originalAppointment.patient.name, mobile: originalAppointment.patient.mobile },
          isFollowUp: true,
        },
      });
      io.to(roomName).emit('queue:positionUpdated', { queueId: queueResult.queue.id });
      const queueLength = await prisma.queueItem.count({ where: { queueId: queueResult.queue.id, status: 'WAITING' } });
      emitClinicUpdate(io, clinicId, { type: 'queue-updated', queueLength });
    }

    // Notify doctor
    try {
      const doctorUser = await prisma.user.findFirst({
        where: { doctorProfile: { id: doctorId } }, select: { id: true },
      });
      if (doctorUser) notifyDoctorFollowUp(doctorUser.id, originalAppointment.patient.name).catch(() => { });
    } catch { /* non-critical */ }

    return sendSuccess(res, {
      appointment: { ...followUpAppointment, queueNumber: queueResult.queueNumber },
      queueItem: queueResult.queueItem,
      queueNumber: queueResult.queueNumber,
      position: queueResult.position,
      estimatedWaitMinutes: queueResult.estimatedWaitMinutes,
      estimatedAppointmentTime: queueResult.estimatedAppointmentTime,
    }, `Follow-up added with priority (position #${queueResult.position})`, 201);
  } catch (error) {
    if (error.status === 400) return sendError(res, error.message, 400);
    next(error);
  }
};

/**
 * PATCH /api/reception/appointments/:appointmentId/check-in
 * Check in a booked patient by appointment ID (no UUID paste needed from frontend).
 * - Validates appointment belongs to receptionist's clinic
 * - Creates QueueItem if not already in queue (idempotent)
 * - Updates appointment status to CHECKED_IN / IN_QUEUE
 */
const checkInByAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    // Resolve receptionist's clinic
    let clinicId = req.body.clinicId || req.query.clinicId;
    if (!clinicId && req.user.role === 'RECEPTIONIST') {
      clinicId = req.user.receptionistProfile?.assignedClinicId;
    }
    if (!clinicId && req.user.role === 'CLINIC_OWNER') {
      const ownerClinic = await prisma.clinic.findFirst({
        where: { ownerId: req.user.id },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      clinicId = ownerClinic?.id;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, mobile: true } },
        doctor: { select: { id: true, avgConsultationMins: true, user: { select: { name: true } } } },
        queueItem: true,
      },
    });

    if (!appointment) return sendError(res, 'Appointment not found', 404);

    // IDOR guard — must belong to receptionist's clinic
    if (req.user.role !== 'SUPER_ADMIN' && appointment.clinicId !== clinicId) {
      return sendError(res, 'Access denied', 403);
    }

    // Validate eligible statuses
    const eligible = ['BOOKED', 'CHECKED_IN'];
    if (!eligible.includes(appointment.status)) {
      return sendError(res, `Cannot check in appointment with status ${appointment.status}`, 400);
    }

    // If already fully in queue, return existing data (idempotent)
    if (appointment.queueItem) {
      return sendSuccess(res, {
        alreadyInQueue: true,
        queueNumber: appointment.queueItem.queueNumber,
        position: appointment.queueItem.position,
        queueItemId: appointment.queueItem.id,
      }, 'Patient is already in the queue');
    }

    // Get or create queue for this doctor + session
    const effectiveSessionId = appointment.sessionId || null;
    const queue = await getOrCreateQueue(appointment.clinicId, appointment.doctorId, effectiveSessionId);

    if (queue.status === 'CLOSED') {
      return sendError(res, 'Queue is closed for today', 400);
    }

    // Fetch session avgConsultationMins
    let avgMins = appointment.doctor?.avgConsultationMins || 10;
    if (effectiveSessionId) {
      const sess = await prisma.clinicSession.findUnique({ where: { id: effectiveSessionId } });
      if (sess?.avgConsultationMins) avgMins = sess.avgConsultationMins;
    }

    // Get next queue number and position
    const [lastItem, waitingCount] = await Promise.all([
      prisma.queueItem.findFirst({
        where: { queueId: queue.id },
        orderBy: { queueNumber: 'desc' },
      }),
      prisma.queueItem.count({ where: { queueId: queue.id, status: 'WAITING' } }),
    ]);
    const queueNumber = (lastItem?.queueNumber || 0) + 1;
    const position = waitingCount + 1;

    // Transactional update
    const [updatedAppt, queueItem] = await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'IN_QUEUE',
          queueNumber,
          estimatedWaitMinutes: position * avgMins,
        },
      }),
      prisma.queueItem.create({
        data: {
          queueId: queue.id,
          appointmentId,
          patientId: appointment.patientId,
          queueNumber,
          status: 'WAITING',
          position,
          isFollowUp: false,
        },
      }),
    ]);

    // Socket update
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${appointment.clinicId}:${appointment.doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', {
        type: 'PATIENT_CHECKED_IN',
        queueItem: {
          ...queueItem,
          patient: { name: appointment.patient.name, mobile: appointment.patient.mobile },
        },
      });
      const queueLength = await prisma.queueItem.count({ where: { queueId: queue.id, status: 'WAITING' } });
      emitClinicUpdate(io, appointment.clinicId, { type: 'queue-updated', queueLength });
    }

    return sendSuccess(res, {
      alreadyInQueue: false,
      queueNumber,
      position,
      queueItemId: queueItem.id,
      estimatedWaitMinutes: position * avgMins,
    }, 'Patient checked in and added to queue');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueItemId/check-in - Check in booked patient (legacy)
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

    // Update both QueueItem and Appointment status
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: queueItem.appointmentId },
        data: { status: 'CHECKED_IN' },
      }),
    ]);

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

    // Recalculate positions for remaining waiting patients using shared engine
    const { avgMins: sessionAvgMins, sessionStartTime } = await getQueueSessionInfo(queue);
    await recalculatePositions(queueId, sessionAvgMins, sessionStartTime);

    // ── Req #10/#12: Detect doctor delay and notify waiting patients ──────
    // If the called appointment's scheduled slotTime has passed, doctor is late
    if (nextItem.appointment?.slotTime) {
      const [scheduledH, scheduledM] = nextItem.appointment.slotTime.split(':').map(Number);
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const scheduledMins = scheduledH * 60 + scheduledM;
      const delayMins = nowMins - scheduledMins;

      if (delayMins >= 10) {
        // Doctor is running 10+ minutes late — notify all waiting patients
        const waitingItems = await prisma.queueItem.findMany({
          where: { queueId, status: 'WAITING' },
          select: { patientId: true, queueNumber: true },
        });
        waitingItems.forEach(({ patientId }) => {
          sendNotification(patientId, {
            title: '⏰ Doctor Running Late',
            body: `Your doctor is running approximately ${delayMins} minutes behind schedule. Your appointment time has been adjusted.`,
            data: { type: 'DOCTOR_RUNNING_LATE', queueId, delayMins: String(delayMins) },
          }).catch(() => { });
        });

        // Emit delay update to socket room
        const io = req.app.get('io');
        if (io) {
          const today = new Date().toISOString().split('T')[0];
          io.to(`queue:${queue.clinicId}:${queue.doctorId}:${today}`).emit('queue:delay', {
            delayMins,
            message: `Doctor is running ~${delayMins} minutes late`,
          });
        }
      }
    }

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
      include: {
        queue: {
          include: {
            session: { select: { avgConsultationMins: true } },
            doctor: { select: { avgConsultationMins: true } },
          },
        },
      },
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

    // Use session avgConsultationMins if available, fall back to doctor's, then 15
    const avgMins =
      queueItem.queue?.session?.avgConsultationMins ||
      queueItem.queue?.doctor?.avgConsultationMins ||
      15;

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

/**
 * GET /api/reception/queue/:clinicId/session-stats
 * Returns per-session live stats for the clinic owner dashboard.
 * Shows booked / completed / pending / walk-ins / avg wait / utilization % per session.
 */
const getSessionQueueStats = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // Verify clinic ownership or staff access
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!clinic) {
        const staff = await prisma.clinicStaff.findFirst({ where: { clinicId, userId: req.user.id, isActive: true } });
        if (!staff) return sendError(res, 'Access denied', 403);
      }
    }

    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);

    // Get all enabled sessions for this clinic
    const sessions = await prisma.clinicSession.findMany({
      where: { clinicId, enabled: true },
      orderBy: { sortOrder: 'asc' },
    });

    const sessionStats = await Promise.all(sessions.map(async (sess) => {
      // Get all today's appointments for this session
      const appointments = await prisma.appointment.findMany({
        where: {
          clinicId,
          sessionId: sess.id,
          appointmentDate: { gte: today, lte: todayEnd },
          status: { notIn: ['PENDING_PAYMENT'] },
        },
        select: { id: true, status: true, slotTime: true, estimatedWaitMinutes: true },
      });

      const booked = appointments.filter(a => ['BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'CALLED', 'IN_CONSULTATION'].includes(a.status)).length;
      const completed = appointments.filter(a => a.status === 'COMPLETED').length;
      const cancelled = appointments.filter(a => ['CANCELLED', 'NO_SHOW'].includes(a.status)).length;
      const walkIns = appointments.filter(a => !a.slotTime).length; // walk-ins have no booked slot
      const total = booked + completed + cancelled;

      // Average wait from completed appointments
      const completedWithWait = appointments.filter(a => a.status === 'COMPLETED' && a.estimatedWaitMinutes);
      const avgWait = completedWithWait.length > 0
        ? Math.round(completedWithWait.reduce((s, a) => s + a.estimatedWaitMinutes, 0) / completedWithWait.length)
        : null;

      // Utilization: how full is the session
      const utilizationPct = sess.maxPatients > 0
        ? Math.round((total / sess.maxPatients) * 100)
        : 0;

      // Get live queue for this session
      const queue = await prisma.queue.findFirst({
        where: { clinicId, sessionId: sess.id, date: today },
        select: { id: true, status: true },
      });

      let currentToken = null;
      let totalWaiting = 0;
      if (queue) {
        const current = await prisma.queueItem.findFirst({
          where: { queueId: queue.id, status: { in: ['CALLED', 'IN_CONSULTATION'] } },
          orderBy: { queueNumber: 'desc' },
        });
        currentToken = current?.queueNumber || null;
        totalWaiting = await prisma.queueItem.count({
          where: { queueId: queue.id, status: 'WAITING' },
        });
      }

      return {
        sessionId: sess.id,
        sessionName: sess.name,
        sessionType: sess.sessionType,
        startTime: sess.startTime,
        endTime: sess.endTime,
        maxPatients: sess.maxPatients,
        avgConsultationMins: sess.avgConsultationMins,
        stats: {
          booked,
          completed,
          cancelled,
          walkIns,
          pending: booked, // pending = still active
          total,
          avgWaitMins: avgWait,
          utilizationPct: Math.min(utilizationPct, 100),
        },
        liveQueue: {
          status: queue?.status || 'NOT_STARTED',
          currentToken,
          totalWaiting,
        },
      };
    }));

    return sendSuccess(res, { date: today, sessionStats });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reception/queue/:queueId/close - Close queue (end of session/day)
 * Prevents further operations on a closed queue.
 */
const closeQueue = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { clinic: { select: { id: true, ownerId: true } } },
    });

    if (!queue) return sendError(res, 'Queue not found', 404);

    // IDOR guard
    if (req.user.role !== 'SUPER_ADMIN') {
      const staff = await prisma.clinicStaff.findFirst({
        where: { clinicId: queue.clinicId, userId: req.user.id, isActive: true },
      });
      if (!staff && queue.clinic.ownerId !== req.user.id) {
        return sendError(res, 'Access denied', 403);
      }
    }

    if (queue.status === 'CLOSED') {
      return sendError(res, 'Queue is already closed', 400);
    }

    const updatedQueue = await prisma.queue.update({
      where: { id: queueId },
      data: { status: 'CLOSED' },
    });

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${queue.clinicId}:${queue.doctorId}:${today}`).emit('queue:updated', {
        type: 'QUEUE_CLOSED',
        queueId,
      });
      emitClinicUpdate(io, queue.clinicId, { type: 'queue-closed', queueId });
    }

    return sendSuccess(res, { queue: updatedQueue }, 'Queue closed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reception/appointments/today
 * Returns today's appointments for the receptionist's authorized clinic.
 * Supports search (patient name, mobile) and status filter.
 */
const getTodaysAppointments = async (req, res, next) => {
  try {
    const { search, status, doctorId, sessionId } = req.query;

    // Resolve clinic
    let clinicId = req.query.clinicId;
    if (!clinicId && req.user.role === 'RECEPTIONIST') {
      clinicId = req.user.receptionistProfile?.assignedClinicId;
    }
    if (!clinicId && req.user.role === 'CLINIC_OWNER') {
      const ownerClinic = await prisma.clinic.findFirst({
        where: { ownerId: req.user.id },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      clinicId = ownerClinic?.id;
    }

    if (!clinicId) return sendError(res, 'Clinic not found', 400);

    // IDOR guard
    if (req.user.role !== 'SUPER_ADMIN') {
      const staff = await prisma.clinicStaff.findFirst({
        where: { clinicId, userId: req.user.id, isActive: true },
      });
      const isOwner = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!staff && !isOwner) return sendError(res, 'Access denied', 403);
    }

    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);

    const where = {
      clinicId,
      appointmentDate: { gte: today, lte: todayEnd },
      status: { notIn: ['PENDING_PAYMENT'] },
    };

    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (sessionId) where.sessionId = sessionId;

    // Patient search
    if (search) {
      const trimmed = search.trim();
      where.patient = {
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { mobile: { contains: trimmed } },
        ],
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, mobile: true } },
        doctor: { include: { user: { select: { id: true, name: true } } } },
        queueItem: { select: { id: true, status: true, position: true, queueNumber: true, isFollowUp: true } },
        payment: { select: { status: true, amount: true, method: true } },
      },
      orderBy: [{ slotTime: 'asc' }, { queueNumber: 'asc' }, { createdAt: 'asc' }],
    });

    return sendSuccess(res, { appointments, total: appointments.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reception/patients/search
 * Search patients by mobile or name.
 * Returns patient + their recent appointments at the receptionist's clinic (for follow-up selection).
 */
const searchPatients = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return sendError(res, 'Search query must be at least 2 characters', 400);
    }

    // Resolve clinic
    let clinicId = req.query.clinicId;
    if (!clinicId && req.user.role === 'RECEPTIONIST') {
      clinicId = req.user.receptionistProfile?.assignedClinicId;
    }
    if (!clinicId && req.user.role === 'CLINIC_OWNER') {
      const ownerClinic = await prisma.clinic.findFirst({
        where: { ownerId: req.user.id },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      clinicId = ownerClinic?.id;
    }
    if (!clinicId) return sendError(res, 'Clinic not found', 400);

    // IDOR guard
    if (req.user.role !== 'SUPER_ADMIN') {
      const staff = await prisma.clinicStaff.findFirst({
        where: { clinicId, userId: req.user.id, isActive: true },
      });
      const isOwner = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!staff && !isOwner) return sendError(res, 'Access denied', 403);
    }

    const trimmed = q.trim();

    // Find patients who have had appointments at this clinic
    const patients = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { mobile: { contains: trimmed } },
        ],
        appointments: {
          some: { clinicId },
        },
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        patientProfile: { select: { age: true, gender: true, bloodGroup: true } },
      },
      take: 10,
    });

    // For each patient, return their recent eligible appointments at this clinic
    // (eligible = COMPLETED / IN_QUEUE / CHECKED_IN — makes sense as "original" for follow-up)
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);

    const results = await Promise.all(patients.map(async (patient) => {
      const appointments = await prisma.appointment.findMany({
        where: {
          clinicId,
          patientId: patient.id,
          appointmentDate: { gte: today, lte: todayEnd },
          status: { in: ['COMPLETED', 'IN_QUEUE', 'CHECKED_IN', 'CALLED', 'IN_CONSULTATION', 'BOOKED'] },
        },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      return { ...patient, appointments };
    }));

    return sendSuccess(res, { patients: results });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reception/dashboard
 * Returns today's operational stats for the reception dashboard.
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Resolve clinic
    let clinicId = req.query.clinicId;
    if (!clinicId && req.user.role === 'RECEPTIONIST') {
      clinicId = req.user.receptionistProfile?.assignedClinicId;
    }
    if (!clinicId && req.user.role === 'CLINIC_OWNER') {
      const ownerClinic = await prisma.clinic.findFirst({
        where: { ownerId: req.user.id },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      clinicId = ownerClinic?.id;
    }
    if (!clinicId) return sendError(res, 'Clinic not found', 400);

    // IDOR guard
    if (req.user.role !== 'SUPER_ADMIN') {
      const staff = await prisma.clinicStaff.findFirst({
        where: { clinicId, userId: req.user.id, isActive: true },
      });
      const isOwner = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!staff && !isOwner) return sendError(res, 'Access denied', 403);
    }

    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);

    const [
      totalToday,
      checkedIn,
      completed,
      noShow,
      waitingCount,
      pendingPayments,
      currentlyServing,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { clinicId, appointmentDate: { gte: today, lte: todayEnd }, status: { notIn: ['PENDING_PAYMENT'] } },
      }),
      prisma.appointment.count({
        where: { clinicId, appointmentDate: { gte: today, lte: todayEnd }, status: { in: ['CHECKED_IN', 'IN_QUEUE', 'CALLED', 'IN_CONSULTATION'] } },
      }),
      prisma.appointment.count({
        where: { clinicId, appointmentDate: { gte: today, lte: todayEnd }, status: 'COMPLETED' },
      }),
      prisma.appointment.count({
        where: { clinicId, appointmentDate: { gte: today, lte: todayEnd }, status: 'NO_SHOW' },
      }),
      prisma.queueItem.count({
        where: { queue: { clinicId, date: today }, status: 'WAITING' },
      }),
      prisma.payment.count({
        where: { status: 'PENDING', appointment: { clinicId, appointmentDate: { gte: today, lte: todayEnd } } },
      }),
      prisma.queueItem.findFirst({
        where: { queue: { clinicId, date: today }, status: { in: ['CALLED', 'IN_CONSULTATION'] } },
        include: { patient: { select: { name: true } } },
        orderBy: { calledAt: 'desc' },
      }),
    ]);

    return sendSuccess(res, {
      date: today,
      totalToday,
      checkedIn,
      waiting: waitingCount,
      completed,
      noShow,
      pendingPayments,
      currentlyServing: currentlyServing
        ? { patientName: currentlyServing.patient?.name, queueNumber: currentlyServing.queueNumber, status: currentlyServing.status }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueue,
  addWalkIn,
  addFollowUp,
  checkIn,
  checkInByAppointment,
  callNext,
  skipPatient,
  completePatient,
  pauseQueue,
  resumeQueue,
  closeQueue,
  getSessionQueueStats,
  getTodaysAppointments,
  searchPatients,
  getDashboardStats,
};
