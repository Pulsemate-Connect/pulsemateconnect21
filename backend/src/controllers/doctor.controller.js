const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { emitAppointmentUpdate } = require('../socket');

/**
 * GET /api/doctor/today - Today's appointments
 */
const getTodayAppointments = async (req, res, next) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorProfile.id,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      include: {
        patient: {
          include: { patientProfile: true },
        },
        clinic: { select: { id: true, name: true } },
        queueItem: true,
      },
      orderBy: [{ queueNumber: 'asc' }, { slotTime: 'asc' }],
    });

    return sendSuccess(res, { appointments, total: appointments.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/appointments - All appointments with filters
 */
const getAppointments = async (req, res, next) => {
  try {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const { status, date, clinicId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = { doctorId: doctorProfile.id };
    if (status) where.status = status;
    if (clinicId) where.clinicId = clinicId;
    if (date) {
      const d = new Date(date);
      where.appointmentDate = {
        gte: new Date(new Date(d).setUTCHours(0, 0, 0, 0)),
        lte: new Date(new Date(d).setUTCHours(23, 59, 59, 999)),
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          patient: {
            include: { patientProfile: true },
          },
          clinic: { select: { id: true, name: true } },
          queueItem: true,
        },
        orderBy: { appointmentDate: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return sendSuccess(res, { appointments, total });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/doctor/appointments/:id/start - Start consultation
 */
const startConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, doctorId: doctorProfile.id },
      include: { queueItem: true },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'IN_CONSULTATION' },
    });

    if (appointment.queueItem) {
      await prisma.queueItem.update({
        where: { id: appointment.queueItem.id },
        data: { status: 'IN_CONSULTATION', calledAt: new Date() },
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${appointment.clinicId}:${doctorProfile.id}:${today}`).emit('queue:updated', {
        type: 'CONSULTATION_STARTED',
        appointmentId: id,
      });
    }

    return sendSuccess(res, { appointment: updated }, 'Consultation started');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/doctor/appointments/:id/complete - Complete consultation
 */
const completeConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, doctorId: doctorProfile.id },
      include: { queueItem: true },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'COMPLETED', notes },
    });

    if (appointment.queueItem) {
      await prisma.queueItem.update({
        where: { id: appointment.queueItem.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      io.to(`queue:${appointment.clinicId}:${doctorProfile.id}:${today}`).emit('queue:updated', {
        type: 'CONSULTATION_COMPLETED',
        appointmentId: id,
      });
    }

    return sendSuccess(res, { appointment: updated }, 'Consultation completed');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/doctor/availability - Toggle availability
 */
const updateAvailability = async (req, res, next) => {
  try {
    const { onlineAvailable, offlineAvailable } = req.body;

    const profile = await prisma.doctorProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(onlineAvailable !== undefined && { onlineAvailable }),
        ...(offlineAvailable !== undefined && { offlineAvailable }),
      },
    });

    return sendSuccess(res, { profile }, 'Availability updated');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/profile - Get/update doctor profile
 */
const getDoctorProfile = async (req, res, next) => {
  try {
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { id: true, name: true, mobile: true, email: true } },
        doctorClinics: {
          where: { isActive: true },
          include: { clinic: { select: { id: true, name: true, city: true } } },
        },
      },
    });

    if (!profile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    return sendSuccess(res, { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/doctor/profile - Update doctor profile
 */
const updateDoctorProfile = async (req, res, next) => {
  try {
    const {
      specialization,
      experienceYears,
      education,
      consultationFee,
      bio,
      avgConsultationMins,
      profileImage,
      gender,
      licenseNumber,
      medicalRegistrationNumber,
      qualification,
      languagesKnown,
      onlineAvailable,
      offlineAvailable,
    } = req.body;

    const updateData = {};
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experienceYears !== undefined) updateData.experienceYears = experienceYears;
    if (education !== undefined) updateData.education = education;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
    if (bio !== undefined) updateData.bio = bio;
    if (avgConsultationMins !== undefined) updateData.avgConsultationMins = avgConsultationMins;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (gender !== undefined) updateData.gender = gender;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (medicalRegistrationNumber !== undefined) updateData.medicalRegistrationNumber = medicalRegistrationNumber;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (languagesKnown !== undefined) updateData.languagesKnown = languagesKnown;
    if (onlineAvailable !== undefined) updateData.onlineAvailable = onlineAvailable;
    if (offlineAvailable !== undefined) updateData.offlineAvailable = offlineAvailable;

    // Check if profile is now complete
    const currentProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    // Profile is complete if all required fields are filled
    const isComplete =
      (updateData.specialization || currentProfile.specialization) &&
      (updateData.qualification || currentProfile.qualification) &&
      (updateData.experienceYears !== undefined || currentProfile.experienceYears !== null) &&
      (updateData.consultationFee !== undefined || currentProfile.consultationFee !== null);

    if (isComplete && currentProfile.profileStatus === 'INCOMPLETE') {
      updateData.profileStatus = 'COMPLETE';
    }

    const profile = await prisma.doctorProfile.update({
      where: { userId: req.user.id },
      data: updateData,
    });

    return sendSuccess(res, { profile }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/doctor/prescription - Create prescription
 */
const createPrescription = async (req, res, next) => {
  try {
    const {
      appointmentId,
      patientId,
      symptoms,
      diagnosis,
      medicines,
      instructions,
      followUpRequired,
      followUpDate,
    } = req.body;

    // Verify doctor is assigned to this appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (appointment.doctorId !== doctorProfile.id) {
      return sendError(res, 'Unauthorized', 403);
    }

    // Create prescription
    const prescription = await prisma.prescriptions.create({
      data: {
        appointmentId,
        doctorId: doctorProfile.id,
        patientId,
        diagnosis,
        medicines: JSON.stringify(medicines),
        instructions,
        requiresFollowUp: followUpRequired,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        updatedAt: new Date(),
      },
    });

    return sendSuccess(res, { prescription }, 'Prescription created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/doctor/appointment/:id/complete - Complete appointment
 */
const completeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify the requesting doctor owns this appointment
    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    if (appointment.doctorId !== doctorProfile.id) {
      return sendError(res, 'You are not authorized to complete this appointment', 403);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      emitAppointmentUpdate(io, id, updated);
    }

    return sendSuccess(res, { appointment: updated }, 'Appointment completed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodayAppointments,
  getAppointments,
  startConsultation,
  completeConsultation,
  updateAvailability,
  getDoctorProfile,
  updateDoctorProfile,
  createPrescription,
  completeAppointment,
};
