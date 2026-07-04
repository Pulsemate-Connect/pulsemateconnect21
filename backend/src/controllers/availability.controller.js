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

/** Build the slot response array with available/booked/past flags.
 * Adds a 5-minute buffer — slots starting within the next 5 minutes are also
 * treated as past so patients can't book a slot that's essentially already started.
 */
const buildSlotArray = (allSlots, bookedSet, targetDate) => {
  const now = new Date();
  const isToday = new Date(targetDate).toDateString() === now.toDateString();
  // 5-minute booking buffer — don't allow booking a slot < 5 minutes away
  const bufferMs = 5 * 60 * 1000;

  return allSlots.map((time) => {
    let isPast = false;
    if (isToday) {
      const [h, m] = time.split(':').map(Number);
      const slotDt = new Date(targetDate);
      slotDt.setHours(h, m, 0, 0);
      isPast = slotDt.getTime() - now.getTime() < bufferMs;
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
 *
 * Slots are clipped to the clinic's configured session windows so that a
 * doctor whose availability spans 06:00–18:00 only produces slots inside
 * whichever ClinicSession(s) exist for that clinic.
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

    // ── Fetch clinic sessions (used to clip slots to valid windows) ──────────
    const clinicSessions = await prisma.clinicSession.findMany({
      where: { clinicId, enabled: true },
      orderBy: { sortOrder: 'asc' },
    });

    // ── Resolve doctor working hours ─────────────────────────────────────────
    let workStart = null;
    let workEnd = null;
    let slotDurationMin = 15;
    let maxPatients = 20;
    let source = 'none';

    // Try DoctorAvailability first
    const avail = await prisma.doctorAvailability.findUnique({
      where: { doctorId_clinicId_dayOfWeek: { doctorId, clinicId, dayOfWeek } },
    });

    if (avail && avail.isActive) {
      workStart = avail.startTime;
      workEnd = avail.endTime;
      slotDurationMin = avail.slotDurationMin;
      maxPatients = avail.maxPatients;
      source = 'doctorAvailability';
    } else {
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

      // Check if doctor works on this day
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

      workStart = dc.startTime;
      workEnd = dc.endTime;
      slotDurationMin = dc.avgConsultationMins || 15;
      source = 'doctorClinic';
    }

    // ── Build slot windows ────────────────────────────────────────────────────
    // If clinic has sessions configured, clip the doctor's hours to each session
    // window individually so slots always belong to a real session bucket.
    // If no sessions exist, fall back to the full doctor window.
    const [wsh, wsm] = workStart.split(':').map(Number);
    const [weh, wem] = workEnd.split(':').map(Number);
    const workStartMins = wsh * 60 + wsm;
    const workEndMins = weh * 60 + wem;

    let allSlots;

    if (clinicSessions.length > 0) {
      // Generate slots only within the intersection of doctor hours and each session
      const merged = [];
      for (const sess of clinicSessions) {
        const [ssh, ssm] = sess.startTime.split(':').map(Number);
        const [seh, sem] = sess.endTime.split(':').map(Number);
        const sessStartMins = ssh * 60 + ssm;
        const sessEndMins = seh * 60 + sem;

        const effectiveStart = Math.max(workStartMins, sessStartMins);
        const effectiveEnd = Math.min(workEndMins, sessEndMins);

        if (effectiveEnd > effectiveStart) {
          const padTime = (m) =>
            `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
          merged.push(...generateSlots(padTime(effectiveStart), padTime(effectiveEnd), slotDurationMin));
        }
      }
      allSlots = merged;
    } else {
      allSlots = generateSlots(workStart, workEnd, slotDurationMin);
    }

    if (allSlots.length === 0) {
      return sendSuccess(res, {
        slots: [],
        slotDurationMin,
        maxPatients,
        bookedCount: 0,
        source,
        message: 'No slots available — doctor hours do not overlap with any clinic session.',
      });
    }

    const bookedSet = await fetchBookedSlots(doctorId, clinicId, date);
    const slots = buildSlotArray(allSlots, bookedSet, targetDate);

    return sendSuccess(res, {
      slots,
      slotDurationMin,
      maxPatients,
      bookedCount: bookedSet.size,
      source,
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

    // ── Validation ──────────────────────────────────────────────────────────
    if (!clinicId) {
      return sendError(res, 'clinicId is required', 400);
    }

    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      return sendError(res, 'dayOfWeek must be an integer 0 (Sun) – 6 (Sat)', 400);
    }

    if (!startTime || !endTime) {
      return sendError(res, 'startTime and endTime are required (HH:MM format)', 400);
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      return sendError(res, 'startTime must be in HH:MM format (00:00 to 23:59)', 400);
    }
    if (!timeRegex.test(endTime)) {
      return sendError(res, 'endTime must be in HH:MM format (00:00 to 23:59)', 400);
    }

    // Validate endTime > startTime
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    if (endMins <= startMins) {
      return sendError(res, 'endTime must be after startTime', 400);
    }

    // Validate slot duration
    const slotDur = slotDurationMin ?? 15;
    if (slotDur < 5 || slotDur > 120) {
      return sendError(res, 'slotDurationMin must be between 5 and 120 minutes', 400);
    }

    // Validate maxPatients
    const maxPat = maxPatients ?? 20;
    if (maxPat < 1 || maxPat > 200) {
      return sendError(res, 'maxPatients must be between 1 and 200', 400);
    }

    // ── Authorization ───────────────────────────────────────────────────────
    const doctorProfile = await prisma.doctorProfile.findUnique({ 
      where: { userId: req.user.id } 
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    // Verify doctor belongs to this clinic
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: {
        doctorId: doctorProfile.id,
        clinicId: clinicId,
        isActive: true,
      },
    });

    if (!doctorClinic) {
      return sendError(res, 'You are not associated with this clinic', 403);
    }

    // ── Upsert availability ─────────────────────────────────────────────────
    const availability = await prisma.doctorAvailability.upsert({
      where: { 
        doctorId_clinicId_dayOfWeek: { 
          doctorId: doctorProfile.id, 
          clinicId, 
          dayOfWeek 
        } 
      },
      create: {
        doctorId: doctorProfile.id,
        clinicId,
        dayOfWeek,
        startTime,
        endTime,
        slotDurationMin: slotDur,
        maxPatients: maxPat,
        isActive: isActive ?? true,
      },
      update: {
        startTime,
        endTime,
        slotDurationMin: slotDur,
        maxPatients: maxPat,
        isActive: isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return sendSuccess(res, { availability }, 'Availability saved successfully');
  } catch (error) {
    console.error('[setAvailability] Error:', error);
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

    // ── Authorization ───────────────────────────────────────────────────────
    const doctorProfile = await prisma.doctorProfile.findUnique({ 
      where: { userId: req.user.id } 
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const existing = await prisma.doctorAvailability.findFirst({
      where: { id, doctorId: doctorProfile.id },
    });

    if (!existing) {
      return sendError(res, 'Availability record not found or access denied', 404);
    }

    // ── Validation ──────────────────────────────────────────────────────────
    const updateData = {};

    if (startTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        return sendError(res, 'startTime must be in HH:MM format (00:00 to 23:59)', 400);
      }
      updateData.startTime = startTime;
    }

    if (endTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(endTime)) {
        return sendError(res, 'endTime must be in HH:MM format (00:00 to 23:59)', 400);
      }
      updateData.endTime = endTime;
    }

    // Validate endTime > startTime if both are provided or one is being updated
    const finalStart = startTime ?? existing.startTime;
    const finalEnd = endTime ?? existing.endTime;
    const [sh, sm] = finalStart.split(':').map(Number);
    const [eh, em] = finalEnd.split(':').map(Number);
    if ((eh * 60 + em) <= (sh * 60 + sm)) {
      return sendError(res, 'endTime must be after startTime', 400);
    }

    if (slotDurationMin !== undefined) {
      if (slotDurationMin < 5 || slotDurationMin > 120) {
        return sendError(res, 'slotDurationMin must be between 5 and 120 minutes', 400);
      }
      updateData.slotDurationMin = slotDurationMin;
    }

    if (maxPatients !== undefined) {
      if (maxPatients < 1 || maxPatients > 200) {
        return sendError(res, 'maxPatients must be between 1 and 200', 400);
      }
      updateData.maxPatients = maxPatients;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    updateData.updatedAt = new Date();

    // ── Update ──────────────────────────────────────────────────────────────
    const updated = await prisma.doctorAvailability.update({
      where: { id },
      data: updateData,
    });

    return sendSuccess(res, { availability: updated }, 'Availability updated successfully');
  } catch (error) {
    console.error('[updateAvailability] Error:', error);
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
