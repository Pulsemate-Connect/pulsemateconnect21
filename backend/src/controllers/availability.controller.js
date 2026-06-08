'use strict';

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate all "HH:MM" slot strings between startTime and endTime
 * at slotDurationMin intervals (exclusive of endTime).
 */
const generateSlots = (startTime, endTime, slotDurationMin) => {
  const slots = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  for (let m = startMins; m < endMins; m += slotDurationMin) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return slots;
};

/** Convert "HH:MM" → "9:00 AM" display label */
const formatLabel = (time) => {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

/** Fetch booked slot times for a doctor+clinic on a specific date */
const fetchBookedSlots = async (doctorId, clinicId, dateStr) => {
  const startOfDay = new Date(dateStr); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateStr); endOfDay.setHours(23, 59, 59, 999);

  const booked = await prisma.appointment.findMany({
    where: {
      doctorId,
      clinicId,
      appointmentDate: { gte: startOfDay, lte: endOfDay },
      slotTime: { not: null },
      status: { notIn: ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'] },
    },
    select: { slotTime: true },
  });
  return new Set(booked.map((a) => a.slotTime));
};

/** Build the slot response array with available/booked/past flags */
const buildSlotArray = (allSlots, bookedSet, targetDate) => {
  const now = new Date();
  const isToday = new Date(targetDate).toDateString() === now.toDateString();

  return allSlots.map((time) => {
    let isPast = false;
    if (isToday) {
      const [h, m] = time.split(':').map(Number);
      const slotDt = new Date(targetDate);
      slotDt.setHours(h, m, 0, 0);
      isPast = slotDt <= now;
    }
    return {
      time,
      label: formatLabel(time),
      available: !bookedSet.has(time) && !isPast,
      booked: bookedSet.has(time),
      past: isPast,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/doctor/:doctorId/availability[?clinicId=]
 * Public — returns weekly availability schedule.
 */
const getDoctorAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { clinicId } = req.query;

    const where = { doctorId, isActive: true };
    if (clinicId) where.clinicId = clinicId;

    const availability = await prisma.doctorAvailability.findMany({
      where,
      orderBy: { dayOfWeek: 'asc' },
    });

    return sendSuccess(res, { availability });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/:doctorId/slots?clinicId=&date=YYYY-MM-DD
 * Public — returns available (unbooked, not-past) slots for a date.
 * Falls back to DoctorClinic schedule if no DoctorAvailability row exists.
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { clinicId, date } = req.query;

    if (!clinicId || !date) {
      return sendError(res, 'clinicId and date query params are required', 400);
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return sendError(res, 'Invalid date. Use YYYY-MM-DD format', 400);
    }

    const dayOfWeek = targetDate.getDay(); // 0 = Sunday

    // Try DoctorAvailability first
    const avail = await prisma.doctorAvailability.findUnique({
      where: { doctorId_clinicId_dayOfWeek: { doctorId, clinicId, dayOfWeek } },
    });

    if (avail && avail.isActive) {
      const allSlots = generateSlots(avail.startTime, avail.endTime, avail.slotDurationMin);
      const bookedSet = await fetchBookedSlots(doctorId, clinicId, date);
      const slots = buildSlotArray(allSlots, bookedSet, targetDate);

      return sendSuccess(res, {
        slots,
        slotDurationMin: avail.slotDurationMin,
        maxPatients: avail.maxPatients,
        bookedCount: bookedSet.size,
        source: 'doctorAvailability',
      });
    }

    // Fallback: DoctorClinic schedule
    const dc = await prisma.doctorClinic.findFirst({
      where: { doctorId, clinicId, isActive: true },
    });

    if (!dc || !dc.startTime || !dc.endTime) {
      return sendSuccess(res, {
        slots: [],
        slotDurationMin: 15,
        maxPatients: 20,
        bookedCount: 0,
        source: 'none',
        message: 'No availability configured for this doctor and clinic.',
      });
    }

    // Check if doctor works on this day (availableDays = ["Monday", ...])
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = DAY_NAMES[dayOfWeek];
    if (dc.availableDays?.length > 0 && !dc.availableDays.includes(dayName)) {
      return sendSuccess(res, {
        slots: [],
        slotDurationMin: dc.avgConsultationMins || 15,
        maxPatients: 20,
        bookedCount: 0,
        source: 'doctorClinic',
        message: `Doctor is not available on ${dayName}`,
      });
    }

    const allSlots = generateSlots(dc.startTime, dc.endTime, dc.avgConsultationMins || 15);
    const bookedSet = await fetchBookedSlots(doctorId, clinicId, date);
    const slots = buildSlotArray(allSlots, bookedSet, targetDate);

    return sendSuccess(res, {
      slots,
      slotDurationMin: dc.avgConsultationMins || 15,
      maxPatients: 20,
      bookedCount: bookedSet.size,
      source: 'doctorClinic',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/doctor/availability
 * Doctor sets (upserts) their schedule for a day at a clinic.
 */
const setAvailability = async (req, res, next) => {
  try {
    const { clinicId, dayOfWeek, startTime, endTime, slotDurationMin, maxPatients, isActive } = req.body;

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
    if (!doctorProfile) return sendError(res, 'Doctor profile not found', 404);

    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      return sendError(res, 'dayOfWeek must be an integer 0 (Sun) – 6 (Sat)', 400);
    }
    if (!startTime || !endTime) {
      return sendError(res, 'startTime and endTime are required (HH:MM)', 400);
    }

    const availability = await prisma.doctorAvailability.upsert({
      where: { doctorId_clinicId_dayOfWeek: { doctorId: doctorProfile.id, clinicId, dayOfWeek } },
      create: {
        doctorId: doctorProfile.id,
        clinicId,
        dayOfWeek,
        startTime: startTime,
        endTime: endTime,
        slotDurationMin: slotDurationMin ?? 15,
        maxPatients: maxPatients ?? 20,
        isActive: isActive ?? true,
      },
      update: {
        startTime,
        endTime,
        slotDurationMin: slotDurationMin ?? 15,
        maxPatients: maxPatients ?? 20,
        isActive: isActive ?? true,
      },
    });

    return sendSuccess(res, { availability }, 'Availability saved');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/doctor/availability/:id
 * Doctor updates a specific availability record.
 */
const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, slotDurationMin, maxPatients, isActive } = req.body;

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
    if (!doctorProfile) return sendError(res, 'Doctor profile not found', 404);

    const existing = await prisma.doctorAvailability.findFirst({
      where: { id, doctorId: doctorProfile.id },
    });
    if (!existing) return sendError(res, 'Availability record not found', 404);

    const updated = await prisma.doctorAvailability.update({
      where: { id },
      data: {
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(slotDurationMin !== undefined && { slotDurationMin }),
        ...(maxPatients !== undefined && { maxPatients }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return sendSuccess(res, { availability: updated }, 'Availability updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctorAvailability,
  getAvailableSlots,
  setAvailability,
  updateAvailability,
  // Exported for unit tests
  _generateSlots: generateSlots,
  _buildSlotArray: buildSlotArray,
};
