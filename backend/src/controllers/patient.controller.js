const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { notifyAppointmentBooked, notifyAppointmentCancelled, notifyDoctorNewBooking, sendNotification } = require('../services/fcm.service');
const { getOrCreateQueue } = require('../utils/getOrCreateQueue');

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

    return sendPaginated(res, doctors.map(d => ({ ...d, profilePhotoUrl: d.profileImage || null })), total, page, limit);
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
      profilePhotoUrl: doctor.profileImage || null,
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
    const holidayDay = new Date(apptDate); holidayDay.setUTCHours(0, 0, 0, 0);
    const holiday = await prisma.clinicHoliday.findFirst({
      where: { clinicId, date: holidayDay },
    });
    if (holiday) return sendError(res, `Clinic is closed on this date: ${holiday.name}`, 400);

    // Validate session if provided
    if (sessionId) {
      const session = await prisma.clinicSession.findUnique({ where: { id: sessionId } });
      if (!session) return sendError(res, 'Session not found', 404);
      if (!session.enabled) return sendError(res, 'This session is not currently active', 400);

      // Check session capacity
      const bookedCount = await prisma.appointment.count({
        where: {
          clinicId, doctorId, sessionId,
          appointmentDate: {
            gte: new Date(new Date(appointmentDate).setUTCHours(0, 0, 0, 0)),
            lte: new Date(new Date(appointmentDate).setUTCHours(23, 59, 59, 999)),
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
      const slotTaken = await prisma.appointment.findFirst({
        where: {
          doctorId, clinicId, slotTime,
          appointmentDate: {
            gte: new Date(new Date(appointmentDate).setUTCHours(0, 0, 0, 0)),
            lte: new Date(new Date(appointmentDate).setUTCHours(23, 59, 59, 999)),
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
    let queueInfo = null;

    if (appointmentType === 'OFFLINE') {
      const { addToQueue } = require('../services/queue.service');

      // Resolve session ETA info
      let avgMins = doctorClinic.avgConsultationMins || 15;
      let sessionStartTime = null;
      if (sessionId) {
        const sess = await prisma.clinicSession.findUnique({ where: { id: sessionId } });
        if (sess) { avgMins = sess.avgConsultationMins || avgMins; sessionStartTime = sess.startTime; }
      }

      // Create appointment first (status BOOKED — queue number assigned next)
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
          estimatedWaitMinutes: 0,
        },
        include: {
          doctor: { include: { user: { select: { id: true, name: true } } } },
          clinic: { select: { id: true, name: true, address: true, city: true } },
        },
      });

      // Add to queue via shared engine (handles race conditions + follow-up priority)
      queueInfo = await addToQueue({
        clinicId, doctorId,
        patientId: req.user.id,
        appointmentId: appointment.id,
        appointmentDate: new Date(appointmentDate),
        sessionId: sessionId || null,
        isFollowUp: false,
        avgMins,
        sessionStartTime,
      });

      // Update appointment with queue number
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          queueNumber: queueInfo.queueNumber,
          estimatedWaitMinutes: queueInfo.estimatedWaitMinutes,
        },
      });

      appointment = { ...appointment, queueNumber: queueInfo.queueNumber };
      estimatedAppointmentTime = queueInfo.estimatedAppointmentTime || slotTime || null;

    } else {
      // ONLINE appointment — no physical queue needed
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

    // Fire-and-forget notifications
    notifyAppointmentBooked(req.user.id, appointment.doctor?.user?.name || 'the doctor', appointmentDate, appointment.queueNumber).catch(() => { });
    if (appointment.doctor?.user?.id) {
      notifyDoctorNewBooking(appointment.doctor.user.id, req.user.name || 'A patient', appointmentDate).catch(() => { });
    }

    return sendSuccess(res, {
      appointment,
      estimatedAppointmentTime,
      ...(queueInfo ? {
        queueNumber: queueInfo.queueNumber,
        position: queueInfo.position,
        estimatedWaitMinutes: queueInfo.estimatedWaitMinutes,
        etaNote: 'This is an estimate. Actual time may vary based on live queue conditions. Please arrive 10–15 minutes before your estimated time and monitor the live queue.',
      } : {}),
    }, 'Appointment booked successfully', 201);
  } catch (error) {
    if (error.message === 'QUEUE_CLOSED') return sendError(res, 'The queue for this session is closed', 400);
    if (error.status === 400) return sendError(res, error.message, 400);
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
          // Include prescription to show follow-up recommendation to patient
          prescriptions: { select: { id: true, requiresFollowUp: true, followUpDate: true, diagnosis: true } },
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

    // Notify all stakeholders (fire-and-forget)
    try {
      const doctorName = appointment.doctor?.user?.name || 'the doctor';
      const date = appointment.appointmentDate;

      // 1. Notify patient
      notifyAppointmentCancelled(req.user.id, doctorName, date).catch(() => { });

      // 2. Notify doctor
      const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: appointment.doctorId }, select: { userId: true } });
      if (doctorProfile) {
        sendNotification(doctorProfile.userId, {
          title: '❌ Appointment Cancelled',
          body: `Patient cancelled appointment on ${new Date(date).toLocaleDateString('en-IN')}.`,
          data: { type: 'APPOINTMENT_CANCELLED', appointmentId: appointment.id },
        }).catch(() => { });
      }

      // 3. Notify clinic owner + receptionists
      const clinic = await prisma.clinic.findUnique({ where: { id: appointment.clinicId }, select: { ownerId: true } });
      if (clinic) {
        const cancelMsg = { title: '❌ Appointment Cancelled', body: `An appointment was cancelled by the patient.`, data: { type: 'APPOINTMENT_CANCELLED' } };
        sendNotification(clinic.ownerId, cancelMsg).catch(() => { });
        const receptionists = await prisma.clinicStaff.findMany({ where: { clinicId: appointment.clinicId, role: 'RECEPTIONIST', isActive: true }, select: { userId: true } });
        receptionists.forEach(r => sendNotification(r.userId, cancelMsg).catch(() => { }));
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
      const completion = calcProfileCompletion(updated, updated?.patientProfile);
      return sendSuccess(res, { user: updated, profileCompletion: completion });
    }

    const completion = calcProfileCompletion(user, user?.patientProfile);
    return sendSuccess(res, { user, profileCompletion: completion });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/patient/profile - Update patient profile
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

    const mergedName = name || currentUser?.name;
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
        ...(name && { name }),
        ...(email && { email }),
        patientProfile: {
          upsert: {
            create: {
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

    const completion = calcProfileCompletion(user, user?.patientProfile);
    return sendSuccess(res, { user, profileCompletion: completion }, 'Profile updated successfully');
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
 * GET /api/patient/follow-up/eligible
 * Check if the authenticated patient has any eligible follow-up appointments.
 * Eligibility is based on PREVIOUS COMPLETED VISITS — no prescription required.
 * Doctor/clinic must have follow-up ENABLED (configurable per doctor+clinic).
 */
const getFollowUpEligibility = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { doctorId, clinicId } = req.query;
    const { checkFollowUpEligibility } = require('../services/followup.service');
    const result = await checkFollowUpEligibility(patientId, doctorId || null, clinicId || null);
    return sendSuccess(res, {
      isEligible: result.isEligible,
      count: result.eligibleVisits.length,
      followUps: result.eligibleVisits,
      settings: result.settings,
      reason: result.reason,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patient/follow-up/book
 * Patient books a follow-up based on a previous COMPLETED VISIT.
 * Backend validates: visit belongs to patient, completed, follow-up enabled,
 * within validity period, no duplicate follow-up for same visit.
 */
const bookFollowUp = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { previousAppointmentId, symptoms, appointmentDate, slotTime, sessionId } = req.body;

    if (!previousAppointmentId) return sendError(res, 'previousAppointmentId is required', 400);

    const { validateFollowUpBooking } = require('../services/followup.service');
    const { addToQueue } = require('../services/queue.service');

    // Backend validates all eligibility rules
    const { previousAppt } = await validateFollowUpBooking(patientId, previousAppointmentId);

    const clinicId = previousAppt.clinicId;
    const doctorId = previousAppt.doctorId;
    const effectiveSessionId = sessionId || previousAppt.sessionId || null;
    const bookingDate = appointmentDate ? new Date(appointmentDate) : new Date();

    // Resolve session ETA info
    let avgMins = 15;
    let sessionStartTime = null;
    if (effectiveSessionId) {
      const sess = await prisma.clinicSession.findUnique({ where: { id: effectiveSessionId } });
      if (sess) { avgMins = sess.avgConsultationMins || avgMins; sessionStartTime = sess.startTime; }
    }

    // Create follow-up appointment — linked to previous visit
    const followUpAppt = await prisma.appointment.create({
      data: {
        patientId, doctorId, clinicId,
        ...(effectiveSessionId ? { sessionId: effectiveSessionId } : {}),
        appointmentType: 'OFFLINE',
        appointmentDate: bookingDate,
        slotTime: slotTime || null,
        symptoms: symptoms || 'Follow-up visit',
        status: 'BOOKED',
        appointmentKind: 'FOLLOW_UP',
        followUpOfAppointmentId: previousAppointmentId,
        estimatedWaitMinutes: 0,
      },
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        clinic: { select: { id: true, name: true, city: true } },
      },
    });

    // Add to queue with follow-up priority
    const queueResult = await addToQueue({
      clinicId, doctorId, patientId,
      appointmentId: followUpAppt.id,
      appointmentDate: bookingDate,
      sessionId: effectiveSessionId,
      isFollowUp: true,
      followUpOf: previousAppointmentId,
      avgMins, sessionStartTime,
    });

    await prisma.appointment.update({
      where: { id: followUpAppt.id },
      data: { queueNumber: queueResult.queueNumber, estimatedWaitMinutes: queueResult.estimatedWaitMinutes },
    });

    // Socket update
    const io = req.app.get('io');
    if (io) {
      const today = bookingDate.toISOString().split('T')[0];
      io.to(`queue:${clinicId}:${doctorId}:${today}`).emit('queue:updated', {
        type: 'FOLLOW_UP_ADDED',
        queueItem: { ...queueResult.queueItem, isFollowUp: true },
      });
    }

    notifyDoctorNewBooking(followUpAppt.doctor?.user?.id, req.user.name || 'Patient', bookingDate).catch(() => { });

    return sendSuccess(res, {
      appointment: { ...followUpAppt, queueNumber: queueResult.queueNumber },
      previousAppointmentId,
      queueNumber: queueResult.queueNumber,
      position: queueResult.position,
      estimatedWaitMinutes: queueResult.estimatedWaitMinutes,
      estimatedAppointmentTime: queueResult.estimatedAppointmentTime,
      etaNote: 'ETA is an estimate. Please arrive 10–15 minutes early and monitor the live queue.',
    }, 'Follow-up booked successfully', 201);
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
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
  getFollowUpEligibility,
  bookFollowUp,
};
