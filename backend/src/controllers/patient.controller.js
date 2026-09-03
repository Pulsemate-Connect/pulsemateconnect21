const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { createNotification } = require('../services/notification.service');
const { sendNotification } = require('../services/fcm.service');
const { getOrCreateQueue } = require('../utils/getOrCreateQueue');
const logger = require('../config/logger');

/**
 * GET /api/patient/doctors - Search doctors
 * Only returns doctors who are linked to at least one VERIFIED + active clinic.
 * The doctorClinics include only returns verified + active clinic entries.
 */
const searchDoctors = async (req, res, next) => {
  try {
    const { specialization, city, name, available, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Base filter — doctor must be verified, user active,
    // AND linked to at least one verified active clinic
    const verifiedClinicFilter = {
      some: {
        isActive: true,
        inviteStatus: 'ACCEPTED',
        clinic: { approvalStatus: 'VERIFIED', isActive: true },
      },
    };

    const where = {
      approvalStatus: 'VERIFIED',
      marketplaceVisible: true,
      user: { isActive: true, role: 'DOCTOR' },
      doctorClinics: verifiedClinicFilter,
    };

    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    if (available === 'true') {
      where.offlineAvailable = true;
    }

    if (name) {
      where.user = { ...where.user, name: { contains: name, mode: 'insensitive' } };
    }

    if (city) {
      where.doctorClinics = {
        some: {
          isActive: true,
          inviteStatus: 'ACCEPTED',
          clinic: {
            approvalStatus: 'VERIFIED',
            isActive: true,
            city: { contains: city, mode: 'insensitive' },
          },
        },
      };
    }

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, mobile: true } },
          doctorClinics: {
            // Only expose verified + active clinic relationships to the patient
            where: {
              isActive: true,
              inviteStatus: 'ACCEPTED',
              clinic: { approvalStatus: 'VERIFIED', isActive: true },
            },
            include: {
              clinic: {
                select: {
                  id: true, name: true, city: true, address: true,
                  isVerified: true, approvalStatus: true, clinicLogoUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.doctorProfile.count({ where }),
    ]);

    return sendPaginated(res, doctors.map(d => ({ 
      ...d, 
      profilePhotoUrl: d.profilePhotoUrl || d.profileImage || null 
    })), total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/doctors/:id - Get doctor profile
 * Only shows clinic relationships where the clinic is VERIFIED and active.
 */
const getDoctorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, mobile: true } },
        doctorClinics: {
          where: {
            isActive: true,
            inviteStatus: 'ACCEPTED',
            clinic: { approvalStatus: 'VERIFIED', isActive: true },
          },
          include: {
            clinic: {
              select: {
                id: true, name: true, city: true, address: true, phone: true,
                openingTime: true, closingTime: true,
                isVerified: true, approvalStatus: true,
                clinicLogoUrl: true, latitude: true, longitude: true,
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      return sendError(res, 'Doctor not found', 404);
    }

    // Map profileImage field to profilePhotoUrl for mobile app compatibility
    const doctorWithPhoto = {
      ...doctor,
      profilePhotoUrl: doctor.profilePhotoUrl || doctor.profileImage || null,
    };

    return sendSuccess(res, { doctor: doctorWithPhoto });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patient/appointments - Book appointment
 * Clinic must be VERIFIED and active before a booking is accepted.
 */
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, clinicId, appointmentType, appointmentDate, slotTime, symptoms, sessionId } = req.body;

    // Verify the clinic is approved and active
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, approvalStatus: true, isActive: true, name: true },
    });
    if (!clinic) return sendError(res, 'Clinic not found', 404);
    if (clinic.approvalStatus !== 'VERIFIED' || !clinic.isActive) {
      return sendError(res, 'Clinic is not currently active.', 403);
    }

    // Verify doctor-clinic relationship
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: { doctorId, clinicId, isActive: true },
      include: { doctor: true },
    });
    if (!doctorClinic) return sendError(res, 'Doctor is not available at this clinic', 400);

    const apptDate = new Date(appointmentDate);

    // Check clinic holiday
    const holidayDay = new Date(apptDate); holidayDay.setUTCHours(0,0,0,0);
    const holiday = await prisma.clinicHoliday.findFirst({
      where: { clinicId, date: holidayDay },
    });
    if (holiday) return sendError(res, `Clinic is closed on this date: ${holiday.name}`, 400);

    // Validate session if provided
    if (sessionId) {
      const session = await prisma.clinicSession.findUnique({ where: { id: sessionId } });
      if (!session) return sendError(res, 'Session not found', 404);
      if (!session.enabled) return sendError(res, 'This session is not currently active', 400);

      // ✅ BUG #2 FIX: Validate slotTime falls within session boundaries
      if (slotTime) {
        const [slotH, slotM] = slotTime.split(':').map(Number);
        const [startH, startM] = session.startTime.split(':').map(Number);
        const [endH, endM] = session.endTime.split(':').map(Number);

        const slotMins = slotH * 60 + slotM;
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        if (slotMins < startMins || slotMins >= endMins) {
          return sendError(res, 
            `Selected time ${slotTime} is outside the ${session.name} session hours (${session.startTime}-${session.endTime}). Please select a time within the session.`,
            400
          );
        }
      }

      // Check session capacity
      const bookedCount = await prisma.appointment.count({
        where: {
          clinicId, doctorId, sessionId,
          appointmentDate: {
            gte: new Date(new Date(appointmentDate).setUTCHours(0,0,0,0)),
            lte: new Date(new Date(appointmentDate).setUTCHours(23,59,59,999)),
          },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      });
      if (bookedCount >= session.maxPatients) {
        return sendError(res, 'This session is fully booked', 400);
      }
    }

    // Prevent duplicate slot booking (same doctor + clinic + date + slotTime)
    if (slotTime) {
      // ✅ CRITICAL: Validate slot is not in the past (TODAY only) - Use Asia/Kolkata timezone
      const apptDateTime = new Date(appointmentDate);
      
      // Get current time in Asia/Kolkata timezone (IST)
      const now = new Date();
      const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const apptDateIST = new Date(apptDateTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      
      const isToday = apptDateIST.toDateString() === istNow.toDateString();
      
      if (isToday) {
        const [slotH, slotM] = slotTime.split(':').map(Number);
        const slotDateTime = new Date(apptDateIST);
        slotDateTime.setHours(slotH, slotM, 0, 0);
        
        // 5-minute buffer - don't allow booking a slot that starts in less than 5 minutes
        const bufferMs = 5 * 60 * 1000;
        if (slotDateTime.getTime() - istNow.getTime() < bufferMs) {
          return sendError(res, 
            `This time slot (${slotTime}) has already passed or will start within 5 minutes. Please select the next available slot.`,
            400
          );
        }
      }
      
      const slotTaken = await prisma.appointment.findFirst({
        where: {
          doctorId, clinicId, slotTime,
          appointmentDate: {
            gte: new Date(new Date(appointmentDate).setUTCHours(0,0,0,0)),
            lte: new Date(new Date(appointmentDate).setUTCHours(23,59,59,999)),
          },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'] },
        },
      });
      if (slotTaken) return sendError(res, 'This time slot is already booked. Please choose another slot.', 409);
    }

    // Check for duplicate booking by same patient
    // Exclude PENDING_PAYMENT > 30 min old (abandoned payments allow rebooking)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        patientId: req.user.id,
        doctorId, clinicId,
        appointmentDate: {
          gte: new Date(new Date(appointmentDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(appointmentDate).setHours(23, 59, 59, 999)),
        },
        OR: [
          // Any confirmed/active booking — always block
          { status: { notIn: ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'] } },
          // Recent PENDING_PAYMENT only (within 30 min) — block double-tap
          { status: 'PENDING_PAYMENT', createdAt: { gte: thirtyMinsAgo } },
        ],
      },
      select: { id: true, queueNumber: true, slotTime: true, status: true },
    });
    if (existingBooking) {
      // Return the existing appointment details so the patient can see what they already have
      return sendError(res,
        `You already have a confirmed appointment with this doctor on this date (Token #${existingBooking.queueNumber || 'assigned at clinic'}, Slot: ${existingBooking.slotTime || 'walk-in'}). Check your appointments tab.`,
        409
      );
    }

    let appointment;
    let estimatedAppointmentTime = null;

    if (appointmentType === 'OFFLINE') {
      // ── Get or create Queue using atomic INSERT ON CONFLICT DO NOTHING ───
      const today = new Date(appointmentDate); today.setUTCHours(0, 0, 0, 0);
      const queue = await getOrCreateQueue(clinicId, doctorId, today, sessionId || null);
      if (queue.status === 'CLOSED') throw new Error('QUEUE_CLOSED');
      const resolvedQueueId = queue.id;

      // ── ATOMIC: assign queue number + create appointment ──────────────────
      appointment = await prisma.$transaction(async (tx) => {
        // ✅ BUG #4 FIX: Use PostgreSQL advisory lock to prevent queue number collisions
        // Convert UUID to numeric hash for pg_advisory_xact_lock (requires bigint)
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(resolvedQueueId).digest();
        const lockId = hash.readBigInt64BE(0); // Extract first 8 bytes as bigint
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockId}::bigint)`;
        
        // ✅ BUG #1 FIX: Re-check slot availability inside transaction WITH ROW LOCKING
        if (slotTime) {
          // Use FOR UPDATE to lock rows matching this slot, preventing concurrent bookings
          const existingSlot = await tx.$queryRaw`
            SELECT id FROM appointments 
            WHERE doctor_id = ${doctorId}
              AND clinic_id = ${clinicId}
              AND appointment_date >= ${new Date(new Date(appointmentDate).setUTCHours(0, 0, 0, 0))}
              AND appointment_date <= ${new Date(new Date(appointmentDate).setUTCHours(23, 59, 59, 999))}
              AND slot_time = ${slotTime}
              AND status NOT IN ('CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT')
            FOR UPDATE NOWAIT
          `;
          
          if (existingSlot && existingSlot.length > 0) {
            throw new Error('SLOT_ALREADY_BOOKED');
          }
        }
        
        const allItems = await tx.queueItem.findMany({
          where: { queueId: resolvedQueueId },
          orderBy: { queueNumber: 'desc' },
          take: 1,
        });
        const queueNumber = (allItems[0]?.queueNumber || 0) + 1;

        const waitingCount = await tx.queueItem.count({
          where: { queueId: resolvedQueueId, status: 'WAITING' },
        });

        const avgMins = doctorClinic.avgConsultationMins || 15;

        const created = await tx.appointment.create({
          data: {
            patientId: req.user.id,
            doctorId, clinicId,
            ...(sessionId ? { sessionId } : {}),
            appointmentType,
            appointmentDate: new Date(appointmentDate),
            slotTime: slotTime || null,
            symptoms: symptoms || null,
            status: 'BOOKED',
            queueNumber,
            estimatedWaitMinutes: waitingCount * avgMins,
          },
          include: {
            doctor: { include: { user: { select: { id: true, name: true } } } },
            clinic: { select: { id: true, name: true, address: true, city: true } },
          },
        });

        await tx.queueItem.create({
          data: {
            queueId: resolvedQueueId,
            appointmentId: created.id,
            patientId: req.user.id,
            queueNumber,
            status: 'WAITING',
            position: waitingCount + 1,
          },
        });

        return created;
      }, {
        isolationLevel: 'Serializable',  // Highest isolation for critical operations
        timeout: 10000,
      });

      // Estimated appointment time = the booked slot (most accurate)
      estimatedAppointmentTime = appointment.slotTime || null;

    } else {
      // Online appointment — no queue
      appointment = await prisma.appointment.create({
        data: {
          patientId: req.user.id,
          doctorId, clinicId,
          ...(sessionId ? { sessionId } : {}),
          appointmentType,
          appointmentDate: new Date(appointmentDate),
          slotTime: slotTime || null,
          symptoms: symptoms || null,
          status: 'BOOKED',
        },
        include: {
          doctor: { include: { user: { select: { id: true, name: true } } } },
          clinic: { select: { id: true, name: true, address: true, city: true } },
        },
      });
    }

    // Fire-and-forget notifications with proper error logging (creates DB record + sends FCM push)
    const doctorName = appointment.doctor?.user?.name || 'the doctor';
    
    createNotification({
      userId: req.user.id,
      type: 'BOOKING_CONFIRMED',
      title: '✅ Appointment Confirmed',
      message: `Your appointment with ${doctorName} on ${apptDate.toLocaleDateString('en-IN')} is confirmed. Token #${appointment.queueNumber || 'N/A'}`,
      metadata: {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        clinicId: appointment.clinicId,
        queueNumber: appointment.queueNumber,
        appointmentDate: appointmentDate,
        slotTime: appointment.slotTime,
      },
      priority: 'HIGH',
    }).catch((err) => {
      logger.error('[Patient] Patient booking notification failed', {
        patientId: req.user.id,
        appointmentId: appointment.id,
        error: err.message,
      });
    });
    
    // Notify doctor
    if (appointment.doctor?.user?.id) {
      createNotification({
        userId: appointment.doctor.user.id,
        type: 'BOOKING_CONFIRMED',
        title: '📅 New Appointment Booked',
        message: `${req.user.name || 'A patient'} booked an appointment for ${apptDate.toLocaleDateString('en-IN')}.`,
        metadata: {
          appointmentId: appointment.id,
          patientId: req.user.id,
          clinicId: appointment.clinicId,
        },
        priority: 'MEDIUM',
      }).catch((err) => {
        logger.error('[Patient] Doctor booking notification failed', {
          doctorUserId: appointment.doctor.user.id,
          appointmentId: appointment.id,
          error: err.message,
        });
      });
    }

    return sendSuccess(res, { appointment, estimatedAppointmentTime }, 'Appointment booked successfully', 201);
  } catch (error) {
    // ✅ Handle specific errors with user-friendly messages
    
    if (error.message === 'QUEUE_CLOSED') {
      return sendError(res, 'The queue for this session is closed', 400);
    }
    
    // BUG #1: Slot already booked
    if (error.message === 'SLOT_ALREADY_BOOKED') {
      return sendError(res, 
        'This time slot is no longer available. Please select another time slot.',
        409
      );
    }
    
    // BUG #1: Caught by database unique constraint
    if (error.code === 'P2002' && error.meta?.target?.includes('appointment_slot')) {
      return sendError(res, 
        'This time slot is no longer available. Please select another time slot.',
        409
      );
    }
    
    // BUG #1: Lock timeout - another user is booking this slot right now
    if (error.code === '55P03' || error.message?.includes('could not obtain lock')) {
      logger.warn('[bookAppointment] Lock timeout - concurrent booking attempt', {
        patientId: req.user.id,
        doctorId: req.body.doctorId,
        slotTime: req.body.slotTime,
      });
      return sendError(res, 
        'This time slot is being booked by another user. Please try again in a moment or select a different time.',
        409
      );
    }
    
    // BUG #4: Queue number collision (should not happen with advisory lock)
    if (error.code === 'P2002' && error.meta?.target?.includes('queue_number')) {
      logger.error('[bookAppointment] Queue number collision despite advisory lock', { 
        patientId: req.user.id,
        error 
      });
      return sendError(res, 
        'Unable to assign queue position. Please try again.',
        500
      );
    }
    
    next(error);
  }
};
const getMyAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = { patientId: req.user.id };
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          doctor: {
            include: {
              user: { select: { id: true, name: true } },
            },
            // include profileImage so avatars can be shown
          },
          clinic: { select: { id: true, name: true, address: true, city: true, phone: true, clinicLogoUrl: true } },
          queueItem: true,
          payment: { select: { id: true, status: true, amount: true, method: true } },
        },
        orderBy: { appointmentDate: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return sendPaginated(res, appointments, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/appointments/:id - Get appointment details
 */
const getAppointmentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: req.user.id },
      include: {
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        clinic: { select: { id: true, name: true, address: true, city: true, phone: true, latitude: true, longitude: true, clinicLogoUrl: true } },
        queueItem: true,
        payment: { select: { id: true, status: true, amount: true, method: true, paidAt: true, razorpayPaymentId: true } },
      },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    return sendSuccess(res, { appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/queue/:appointmentId - Get live queue status
 */
const getLiveQueue = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId: req.user.id },
      include: {
        queueItem: {
          include: { queue: true },
        },
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        clinic: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Always compute roomName so mobile can connect socket even before queue item exists
    const apptDateStr = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    const roomName = `queue:${appointment.clinicId}:${appointment.doctorId}:${apptDateStr}`;

    if (!appointment.queueItem) {
      return sendSuccess(res, {
        appointment,
        queueInfo: {
          queueNumber: appointment.queueNumber || null,
          position: null,
          status: appointment.status,
          estimatedWaitMinutes: appointment.estimatedWaitMinutes || null,
          patientsAhead: null,
          currentlyServing: null,
          queueStatus: 'ACTIVE',
          roomName,
          appointmentDate: appointment.appointmentDate,
        }
      });
    }

    // Get current consultation info
    const currentlyServing = await prisma.queueItem.findFirst({
      where: {
        queueId: appointment.queueItem.queueId,
        status: { in: ['CALLED', 'IN_CONSULTATION'] },
      },
      orderBy: { queueNumber: 'desc' },
    });

    // Count patients ahead
    const patientsAhead = await prisma.queueItem.count({
      where: {
        queueId: appointment.queueItem.queueId,
        status: 'WAITING',
        position: { lt: appointment.queueItem.position },
      },
    });

    // ── Compute estimated appointment time ──────────────────────────────────
    // Priority 1: Use the actual booked slotTime — this IS the appointment time.
    //   Patient booked 9:30 → show 9:30 (not a recalculated value).
    // Priority 2: If doctor is running late (current consultation started later
    //   than expected), adjust remaining slots forward by the delay.
    let estimatedAppointmentTime = null;
    try {
      // Use the booked slot time directly if available
      if (appointment.slotTime) {
        estimatedAppointmentTime = appointment.slotTime;
      }

      // Check if doctor is running late — adjust if current consultation started late
      const inConsultation = await prisma.queueItem.findFirst({
        where: {
          queueId: appointment.queueItem.queueId,
          status: 'IN_CONSULTATION',
        },
        include: { appointment: { select: { slotTime: true } } },
        orderBy: { calledAt: 'desc' },
      });

      if (inConsultation?.calledAt && inConsultation.appointment?.slotTime && appointment.slotTime) {
        // Calculate delay: when consultation actually started vs when it was scheduled
        const calledAt = inConsultation.calledAt;
        const [scheduledH, scheduledM] = inConsultation.appointment.slotTime.split(':').map(Number);
        const scheduledStartMins = scheduledH * 60 + scheduledM;
        const actualStartMins = calledAt.getHours() * 60 + calledAt.getMinutes();
        const delayMins = Math.max(0, actualStartMins - scheduledStartMins);

        if (delayMins > 0 && appointment.slotTime) {
          // Shift the patient's slot time forward by the accumulated delay
          const [slotH, slotM] = appointment.slotTime.split(':').map(Number);
          const adjustedMins = slotH * 60 + slotM + delayMins;
          const adjH = Math.floor(adjustedMins / 60);
          const adjM = adjustedMins % 60;
          estimatedAppointmentTime = `${String(adjH).padStart(2, '0')}:${String(adjM).padStart(2, '0')}`;
        }
      } else if (!appointment.slotTime) {
        // No slot time (walk-in or legacy) — calculate from queue position
        const doctorProfile = await prisma.doctorProfile.findUnique({
          where: { id: appointment.doctorId },
          select: { avgConsultationMins: true },
        });
        const avgMins = doctorProfile?.avgConsultationMins || 15;
        const clinicSessions = await prisma.clinicSession.findMany({
          where: { clinicId: appointment.clinicId, enabled: true },
          orderBy: { sortOrder: 'asc' },
        });
        if (clinicSessions.length > 0) {
          const firstSession = clinicSessions[0];
          const [startH, startM] = firstSession.startTime.split(':').map(Number);
          const sessionStartMins = startH * 60 + startM;
          const positionOffset = (appointment.queueItem.position - 1) * avgMins;
          const totalMins = sessionStartMins + positionOffset;
          const estH = Math.floor(totalMins / 60);
          const estM = totalMins % 60;
          estimatedAppointmentTime = `${String(estH).padStart(2, '0')}:${String(estM).padStart(2, '0')}`;
        }
      }
    } catch (_) { /* non-critical */ }

    const queueInfo = {
      queueNumber: appointment.queueItem.queueNumber,
      position: appointment.queueItem.position,
      status: appointment.queueItem.status,
      estimatedWaitMinutes: appointment.estimatedWaitMinutes,
      estimatedAppointmentTime, // ← NEW: "09:45" format
      patientsAhead,
      currentlyServing: currentlyServing?.queueNumber || null,
      queueStatus: appointment.queueItem.queue.status,
      roomName,
      appointmentDate: appointment.appointmentDate,
    };

    return sendSuccess(res, { appointment, queueInfo });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/patient/appointments/:id/cancel - Cancel appointment
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: req.user.id },
      include: {
        queueItem: true,
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    if (['COMPLETED', 'CANCELLED', 'IN_CONSULTATION'].includes(appointment.status)) {
      return sendError(res, `Cannot cancel appointment with status: ${appointment.status}`, 400);
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    if (appointment.queueItem) {
      await prisma.queueItem.update({
        where: { id: appointment.queueItem.id },
        data: { status: 'CANCELLED' },
      });
    }

    // Notify all stakeholders (fire-and-forget) - Creates DB records + sends FCM push
    try {
      const doctorName = appointment.doctor?.user?.name || 'the doctor';
      const date = appointment.appointmentDate;

      // 1. Notify patient
      createNotification({
        userId: req.user.id,
        type: 'BOOKING_CANCELLED',
        title: '❌ Appointment Cancelled',
        message: `Your appointment with ${doctorName} on ${new Date(date).toLocaleDateString('en-IN')} has been cancelled.`,
        metadata: {
          appointmentId: appointment.id,
          doctorId: appointment.doctorId,
          clinicId: appointment.clinicId,
        },
        priority: 'HIGH',
      }).catch(() => { });

      // 2. Notify doctor
      const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: appointment.doctorId }, select: { userId: true } });
      if (doctorProfile) {
        createNotification({
          userId: doctorProfile.userId,
          type: 'BOOKING_CANCELLED',
          title: '❌ Appointment Cancelled',
          message: `Patient cancelled appointment on ${new Date(date).toLocaleDateString('en-IN')}.`,
          metadata: {
            appointmentId: appointment.id,
            patientId: req.user.id,
            clinicId: appointment.clinicId,
          },
          priority: 'MEDIUM',
        }).catch(() => { });
      }

      // 3. Notify clinic owner + receptionists
      const clinic = await prisma.clinic.findUnique({ where: { id: appointment.clinicId }, select: { ownerId: true } });
      if (clinic) {
        // Notify owner
        createNotification({
          userId: clinic.ownerId,
          type: 'BOOKING_CANCELLED',
          title: '🚫 Booking Cancelled',
          message: `An appointment was cancelled by the patient.`,
          metadata: { appointmentId: appointment.id, clinicId: appointment.clinicId },
          priority: 'LOW',
        }).catch(() => { });
        
        // Notify receptionists
        const receptionists = await prisma.clinicStaff.findMany({ where: { clinicId: appointment.clinicId, role: 'RECEPTIONIST', isActive: true }, select: { userId: true } });
        receptionists.forEach(r => {
          createNotification({
            userId: r.userId,
            type: 'BOOKING_CANCELLED',
            title: '🚫 Booking Cancelled',
            message: `A patient cancelled their appointment.`,
            metadata: { appointmentId: appointment.id, clinicId: appointment.clinicId },
            priority: 'LOW',
          }).catch(() => { });
        });
      }
    } catch { }

    return sendSuccess(res, {}, 'Appointment cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate profile completion percentage
 */
const calcProfileCompletion = (user, profile) => {
  const checks = [
    { field: user?.name, weight: 20 },
    { field: profile?.gender, weight: 15 },
    { field: profile?.dob || profile?.age, weight: 15 },
    { field: profile?.city || profile?.address, weight: 10 },
    { field: profile?.emergencyContact, weight: 10 },
    { field: profile?.bloodGroup, weight: 10 },
    { field: profile?.allergies, weight: 5 },
    { field: profile?.existingDiseases, weight: 5 },
    { field: profile?.insuranceProvider, weight: 5 },
    { field: user?.email, weight: 5 },
  ];
  return checks.reduce((sum, c) => sum + (c.field ? c.weight : 0), 0);
};

/**
 * GET /api/patient/profile - Get patient profile (works for any role)
 * Returns profile with patient-specific name (not user table name)
 * This ensures patient profile is independent from doctor/admin/receptionist identity
 */
const getProfile = async (req, res, next) => {
  try {
    // Auto-create patientProfile if missing (e.g. for DOCTOR users using patient features)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { patientProfile: true },
    });

    if (!user.patientProfile) {
      await prisma.patientProfile.create({
        data: { userId: req.user.id },
      });
      // Re-fetch with profile
      const updated = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { patientProfile: true },
      });
      
      // Return with patient-specific name ("You" if not set, to override auth context name)
      const patientUser = {
        ...updated,
        name: updated.patientProfile?.patientName || "You", // Return "You" instead of null
      };
      
      const completion = calcProfileCompletion(patientUser, updated?.patientProfile);
      return sendSuccess(res, { user: patientUser, profileCompletion: completion });
    }

    // Return with patient-specific name ("You" if not set, to override auth context name)
    const patientUser = {
      ...user,
      name: user.patientProfile?.patientName || "You", // Return "You" instead of null
    };
    
    const completion = calcProfileCompletion(patientUser, user?.patientProfile);
    return sendSuccess(res, { user: patientUser, profileCompletion: completion });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/patient/profile - Update patient profile
 * Saves patient name to patientProfile.patientName (NOT user.name)
 * This keeps patient identity separate from admin/doctor/receptionist identity
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      name, email, age, dob, gender, address, city,
      emergencyContact, bloodGroup, allergies,
      existingDiseases, insuranceProvider,
    } = req.body;

    // Determine if required fields are complete after this update
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { patientProfile: true },
    });

    const mergedName = name || currentUser?.patientProfile?.patientName; // Use patientName from profile
    const mergedGender = gender || currentUser?.patientProfile?.gender;
    const mergedDob = dob || currentUser?.patientProfile?.dob;
    const mergedAge = age !== undefined ? age : currentUser?.patientProfile?.age;
    const mergedCity = city || currentUser?.patientProfile?.city;
    const mergedEmergency = emergencyContact || currentUser?.patientProfile?.emergencyContact;

    const profileCompleted = !!(
      mergedName && mergedGender && (mergedDob || mergedAge) && (mergedCity || address) && mergedEmergency
    );

    // Build profile update — only include fields that were actually sent in the request body
    const profileUpdate = {};
    if (name !== undefined) profileUpdate.patientName = name || null; // Save to patientName, NOT user.name
    if (age !== undefined) profileUpdate.age = age || null;
    if (dob !== undefined) profileUpdate.dob = dob ? new Date(dob) : null;
    if (gender !== undefined) profileUpdate.gender = gender || null;
    if (address !== undefined) profileUpdate.address = address || null;
    if (city !== undefined) profileUpdate.city = city || null;
    if (emergencyContact !== undefined) profileUpdate.emergencyContact = emergencyContact || null;
    if (bloodGroup !== undefined) profileUpdate.bloodGroup = bloodGroup || null;
    if (allergies !== undefined) profileUpdate.allergies = allergies || null;
    if (existingDiseases !== undefined) profileUpdate.existingDiseases = existingDiseases || null;
    if (insuranceProvider !== undefined) profileUpdate.insuranceProvider = insuranceProvider || null;
    profileUpdate.profileCompleted = profileCompleted;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        // Do NOT update user.name - keep admin/doctor identity separate
        ...(email && { email }),
        patientProfile: {
          upsert: {
            create: {
              patientName: name || null, // Save patient name here
              age: age || null,
              dob: dob ? new Date(dob) : null,
              gender: gender || null,
              address: address || null,
              city: city || null,
              emergencyContact: emergencyContact || null,
              bloodGroup: bloodGroup || null,
              allergies: allergies || null,
              existingDiseases: existingDiseases || null,
              insuranceProvider: insuranceProvider || null,
              profileCompleted,
            },
            update: profileUpdate,
          },
        },
      },
      include: { patientProfile: true },
    });

    // Return with patient-specific name
    const patientUser = {
      ...user,
      name: user.patientProfile?.patientName || null,
    };

    const completion = calcProfileCompletion(patientUser, user?.patientProfile);
    return sendSuccess(res, { user: patientUser, profileCompletion: completion }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Haversine distance in km between two lat/lng points
 */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * GET /api/patient/nearby?lat=xx&lng=yy&radius=10&type=clinics|doctors|all
 * Returns nearby verified clinics and/or doctors sorted by distance
 */
const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50, type = 'all', limit = 20 } = req.query;

    if (!lat || !lng) {
      return sendError(res, 'lat and lng query params are required', 400);
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    const maxResults = parseInt(limit);

    if (isNaN(userLat) || isNaN(userLng)) {
      return sendError(res, 'Invalid lat/lng values', 400);
    }

    const result = {};

    // ── Nearby Clinics ───────────────────────────────────────────────────────
    if (type === 'clinics' || type === 'all') {
      const clinics = await prisma.clinic.findMany({
        where: {
          approvalStatus: 'VERIFIED',
          isActive: true,
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true, name: true, address: true, city: true, district: true,
          latitude: true, longitude: true, phone: true, openingHours: true,
          specialties: true, clinicType: true, clinicLogoUrl: true,
          consultationModes: true,
          _count: { select: { appointments: true } },
        },
      });

      // Calculate distance for every clinic using Haversine (lat/lng only, no city matching)
      const withDist = clinics.map((c) => ({
        ...c,
        distanceKm: Math.round(haversineKm(userLat, userLng, c.latitude, c.longitude) * 10) / 10,
      })).sort((a, b) => a.distanceKm - b.distanceKm);

      // Progressive radius expansion — purely coordinate based
      // 50km → 100km → 250km → no limit (show all, sorted by distance)
      let nearbyClinics = [];
      for (const r of [radiusKm, 100, 250, Infinity]) {
        nearbyClinics = r === Infinity
          ? withDist.slice(0, maxResults)
          : withDist.filter((c) => c.distanceKm <= r).slice(0, maxResults);
        if (nearbyClinics.length > 0) break;
      }

      result.clinics = nearbyClinics;
    }

    // ── Nearby Doctors (via their clinics) ───────────────────────────────────
    if (type === 'doctors' || type === 'all') {
      const doctorClinics = await prisma.doctorClinic.findMany({
        where: {
          isActive: true,
          clinic: {
            approvalStatus: 'VERIFIED',
            latitude: { not: null },
            longitude: { not: null },
          },
          doctor: {
            approvalStatus: 'VERIFIED',
            user: { isActive: true },
          },
        },
        select: {
          consultationFee: true,
          clinic: {
            select: {
              id: true,
              name: true,
              city: true,
              latitude: true,
              longitude: true,
            },
          },
          doctor: {
            select: {
              id: true,
              specialization: true,
              experienceYears: true,
              offlineAvailable: true,
              onlineAvailable: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      });

      // Deduplicate doctors, keep closest clinic — coordinate based only
      const doctorMap = new Map();
      for (const dc of doctorClinics) {
        const distKm = haversineKm(userLat, userLng, dc.clinic.latitude, dc.clinic.longitude);
        const existing = doctorMap.get(dc.doctor.id);
        if (!existing || distKm < existing.distanceKm) {
          doctorMap.set(dc.doctor.id, {
            ...dc.doctor,
            nearestClinic: dc.clinic,
            consultationFee: dc.consultationFee,
            distanceKm: Math.round(distKm * 10) / 10,
          });
        }
      }

      // Progressive radius for doctors too
      const allDoctors = Array.from(doctorMap.values()).sort((a, b) => a.distanceKm - b.distanceKm);
      let nearbyDoctors = [];
      for (const r of [radiusKm, 100, 250, Infinity]) {
        nearbyDoctors = r === Infinity
          ? allDoctors.slice(0, maxResults)
          : allDoctors.filter((d) => d.distanceKm <= r).slice(0, maxResults);
        if (nearbyDoctors.length > 0) break;
      }

      result.doctors = nearbyDoctors;
    }

    return sendSuccess(res, result, 'Nearby results fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/patient/account
 * Google Play compliant account deletion.
 * Queues the account for deletion — hard purge happens after 10 days via cron.
 * User is immediately signed out and deactivated.
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.$transaction(async (tx) => {
      // 1. Cancel all active/upcoming appointments immediately
      await tx.appointment.updateMany({
        where: {
          patientId: userId,
          status: { in: ['BOOKED', 'PENDING_PAYMENT', 'CHECKED_IN', 'IN_QUEUE', 'CALLED'] },
        },
        data: { status: 'CANCELLED' },
      });

      // 2. Revoke all sessions / tokens immediately
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.fcmToken.deleteMany({ where: { userId } });

      // 3. Mark account as pending deletion — cron will hard-purge after 10 days
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          deletionRequestedAt: new Date(),
        },
      });
    });

    return sendSuccess(res, {}, 'Your account has been queued for deletion and will be permanently removed within 15 days.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/staff/patients/create - Create a new patient account (Staff only)
 * 
 * Allows DOCTOR, RECEPTIONIST, CLINIC_OWNER, or SUPER_ADMIN to create a new patient account.
 * 
 * Security Rules:
 * 1. Creates a COMPLETELY NEW user with role=PATIENT
 * 2. Patient is NOT the same as creator
 * 3. Patient gets own user ID, authentication, and permissions
 * 4. Creator relationship stored for audit only (does NOT grant permissions)
 * 5. Checks for duplicate mobile/email
 * 6. Patient must login with their OWN credentials
 */
const createPatientByStaff = async (req, res, next) => {
  try {
    const {
      name,
      mobile,
      email,
      gender,
      age,
      dob,
      emergencyContact,
      bloodGroup,
      clinicId,
    } = req.body;

    // Validation
    if (!name || !mobile) {
      return sendError(res, 'Name and mobile number are required', 400);
    }

    // Normalize mobile (remove +91 if present, validate 10 digits)
    const normalizedMobile = mobile.replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '');
    if (normalizedMobile.length !== 10) {
      return sendError(res, 'Mobile number must be exactly 10 digits', 400);
    }
    const fullMobile = `+91${normalizedMobile}`;

    // Security Check 1: Duplicate Detection
    // Check if mobile already exists (ANY role)
    const existingUser = await prisma.user.findFirst({
      where: { mobile: fullMobile },
      include: { 
        patientProfile: true,
        doctorProfile: true,
        receptionistProfile: true,
        adminProfile: true,
      },
    });

    if (existingUser) {
      if (existingUser.role === 'PATIENT') {
        return sendError(res, 'A patient with this mobile number already exists', 409);
      } else {
        return sendError(
          res,
          `This mobile number is registered as ${existingUser.role}. Cannot convert to PATIENT.`,
          409
        );
      }
    }

    // If email provided, check for duplicates
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email },
      });
      if (existingEmail) {
        return sendError(res, 'This email is already registered', 409);
      }
    }

    // Security Check 2: Verify clinic access (if clinicId provided)
    let verifiedClinicId = null;
    if (clinicId) {
      // Verify creator has access to this clinic
      if (req.user.role === 'CLINIC_OWNER') {
        const clinic = await prisma.clinic.findFirst({
          where: { id: clinicId, ownerId: req.user.id },
        });
        if (!clinic) {
          return sendError(res, 'You do not have access to this clinic', 403);
        }
        verifiedClinicId = clinicId;
      } else if (req.user.role === 'DOCTOR' || req.user.role === 'RECEPTIONIST') {
        const staff = await prisma.clinicStaff.findFirst({
          where: { clinicId, userId: req.user.id, isActive: true },
        });
        if (!staff) {
          return sendError(res, 'You do not have access to this clinic', 403);
        }
        verifiedClinicId = clinicId;
      } else if (req.user.role === 'SUPER_ADMIN') {
        // Admins can create patients for any clinic
        verifiedClinicId = clinicId;
      }
    }

    // Security Check 3: Creator Role Validation
    const allowedRoles = ['DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Only staff members can create patient accounts', 403);
    }

    // Create NEW patient user (SEPARATE identity from creator)
    const newPatient = await prisma.user.create({
      data: {
        name,
        mobile: fullMobile,
        email: email || null,
        role: 'PATIENT', // CRITICAL: Always PATIENT, never inherits creator role
        approvalStatus: 'VERIFIED',
        isActive: true,
        isPhoneVerified: true, // Staff-verified
        isEmailVerified: email ? false : null,
        authProvider: 'STAFF_CREATED',
      },
    });

    // Create patient profile with audit trail
    const patientProfile = await prisma.patientProfile.create({
      data: {
        userId: newPatient.id, // Links to NEW patient user, NOT creator
        age: age || null,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        emergencyContact: emergencyContact || null,
        bloodGroup: bloodGroup || null,
        profileCompleted: !!(name && gender && (age || dob) && emergencyContact),
        // Audit trail (for internal tracking only)
        createdByUserId: req.user.id, // Creator's ID
        createdByRole: req.user.role, // Creator's role
        registeredVia: req.user.role, // How patient was registered
        registeredClinicId: verifiedClinicId, // Which clinic (if any)
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PATIENT_CREATED_BY_STAFF',
        entityType: 'User',
        entityId: newPatient.id,
        metadata: {
          creatorRole: req.user.role,
          creatorName: req.user.name,
          patientName: name,
          patientMobile: fullMobile,
          clinicId: verifiedClinicId,
        },
      },
    });

    // Return patient info (WITHOUT creator's sensitive data)
    return sendSuccess(res, {
      patient: {
        id: newPatient.id,
        name: newPatient.name,
        mobile: newPatient.mobile,
        email: newPatient.email,
        role: newPatient.role, // Always PATIENT
        profile: {
          age: patientProfile.age,
          gender: patientProfile.gender,
          bloodGroup: patientProfile.bloodGroup,
          emergencyContact: patientProfile.emergencyContact,
        },
      },
      message: 'Patient account created successfully. Patient can login using mobile OTP.',
      instructions: {
        loginMethod: 'Mobile OTP',
        mobile: fullMobile,
        note: 'Patient should receive OTP on their mobile to login',
      },
    }, 201);

  } catch (error) {
    console.error('[createPatientByStaff] Error:', error);
    next(error);
  }
};

module.exports = {
  searchDoctors,
  getDoctorProfile,
  bookAppointment,
  getMyAppointments,
  getAppointmentDetails,
  getLiveQueue,
  cancelAppointment,
  getProfile,
  updateProfile,
  getNearby,
  deleteAccount,
  createPatientByStaff, // NEW: Staff-created patients
};
