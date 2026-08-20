/**
 * Doctor Dashboard Controller
 * Handles doctor-specific operations for logged-in doctors
 */

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

/**
 * GET /api/doctor/today - Get today's appointments for logged-in doctor
 */
const getTodayAppointments = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;

    // Get doctor profile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorProfile.id,
        appointmentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          notIn: ['CANCELLED', 'PENDING_PAYMENT'],
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true,
            patientProfile: {
              select: {
                age: true,
                gender: true,
                bloodGroup: true,
              },
            },
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { slotTime: 'asc' },
      ],
    });

    // Calculate stats
    const stats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
      booked: appointments.filter(a => a.status === 'BOOKED').length,
      confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    };

    logger.info(`[DoctorDashboard] Today's appointments for doctor ${doctorProfile.id}: ${appointments.length}`);

    return sendSuccess(res, { appointments, stats }, 'Today\'s appointments fetched');
  } catch (error) {
    logger.error('[DoctorDashboard] Get today appointments error:', error);
    next(error);
  }
};

/**
 * GET /api/doctor/appointments - Get all appointments with filters
 */
const getDoctorAppointments = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const { status, date, clinicId, page = 1, limit = 20 } = req.query;

    // Get doctor profile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    // Build where clause
    const where = {
      doctorId: doctorProfile.id,
    };

    if (status) {
      where.status = status;
    }

    if (clinicId) {
      where.clinicId = clinicId;
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Get appointments
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              mobile: true,
              patientProfile: {
                select: {
                  age: true,
                  gender: true,
                  bloodGroup: true,
                },
              },
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
            },
          },
        },
        orderBy: [
          { appointmentDate: 'desc' },
          { slotTime: 'desc' },
        ],
      }),
      prisma.appointment.count({ where }),
    ]);

    return res.json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('[DoctorDashboard] Get appointments error:', error);
    next(error);
  }
};

/**
 * GET /api/doctor/profile - Get doctor's own profile
 */
const getDoctorProfile = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: doctorUserId },
      include: {
        doctorProfile: {
          include: {
            doctorClinics: {
              where: { isActive: true },
              include: {
                clinic: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    state: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    return sendSuccess(res, { user, profile: user.doctorProfile }, 'Profile fetched');
  } catch (error) {
    logger.error('[DoctorDashboard] Get profile error:', error);
    next(error);
  }
};

/**
 * PATCH /api/doctor/profile - Update doctor's profile
 */
const updateDoctorProfile = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const updateData = req.body;

    // Get doctor profile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    // Allowed fields for update
    const allowedFields = [
      'bio',
      'consultationFee',
      'languagesKnown',
      'areasOfExpertise',
      'profilePhotoUrl',
      'avgConsultationMins',
    ];

    // Filter update data
    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return sendError(res, 'No valid fields to update', 400);
    }

    // Update profile
    const updatedProfile = await prisma.doctorProfile.update({
      where: { id: doctorProfile.id },
      data: filteredData,
    });

    logger.info(`[DoctorDashboard] Profile updated for doctor ${doctorProfile.id}`);

    return sendSuccess(res, { profile: updatedProfile }, 'Profile updated successfully');
  } catch (error) {
    logger.error('[DoctorDashboard] Update profile error:', error);
    next(error);
  }
};

/**
 * GET /api/doctor/:doctorId/availability - Get doctor's availability schedule
 */
const getDoctorAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { clinicId } = req.query;

    // Get doctor profile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor not found', 404);
    }

    // Build where clause
    const where = { doctorId };
    if (clinicId) {
      where.clinicId = clinicId;
    }

    // Get availability records
    const availability = await prisma.doctorAvailability.findMany({
      where,
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    return sendSuccess(res, { availability }, 'Availability fetched');
  } catch (error) {
    logger.error('[DoctorDashboard] Get availability error:', error);
    next(error);
  }
};

/**
 * POST /api/doctor/availability - Create or update availability
 */
const upsertDoctorAvailability = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const { clinicId, dayOfWeek, startTime, endTime, isAvailable } = req.body;

    // Get doctor profile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    // Validate required fields
    if (!clinicId || dayOfWeek === undefined) {
      return sendError(res, 'Clinic ID and day of week are required', 400);
    }

    // Check if record exists
    const existing = await prisma.doctorAvailability.findFirst({
      where: {
        doctorId: doctorProfile.id,
        clinicId,
        dayOfWeek: Number(dayOfWeek),
      },
    });

    let availability;
    if (existing) {
      // Update existing
      availability = await prisma.doctorAvailability.update({
        where: { id: existing.id },
        data: {
          startTime,
          endTime,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
        },
      });
    } else {
      // Create new
      availability = await prisma.doctorAvailability.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId,
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
        },
      });
    }

    logger.info(`[DoctorDashboard] Availability updated for doctor ${doctorProfile.id}`);

    return sendSuccess(res, { availability }, 'Availability updated successfully');
  } catch (error) {
    logger.error('[DoctorDashboard] Upsert availability error:', error);
    next(error);
  }
};

module.exports = {
  getTodayAppointments,
  getDoctorAppointments,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorAvailability,
  upsertDoctorAvailability,
};
