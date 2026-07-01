/**
 * Session Availability Controller
 * 
 * Calculates real-time slot availability for clinic sessions
 * based on confirmed appointments.
 */

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

// Default slot duration (can be overridden by doctor's avgConsultationMins)
const DEFAULT_SLOT_DURATION_MIN = 15;

/**
 * Convert "HH:MM" time string to minutes since midnight
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Calculate total slots for a session based on duration and slot size
 */
const calculateTotalSlots = (startTime, endTime, slotDurationMin) => {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const sessionDuration = endMins - startMins;
  
  if (sessionDuration <= 0) return 0;
  
  return Math.floor(sessionDuration / slotDurationMin);
};

/**
 * Count booked appointments for a session on a specific date
 */
const countBookedSlots = async (clinicId, doctorId, date, sessionStart, sessionEnd) => {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);
  
  // Convert session times to Date objects for comparison
  const [startHour, startMin] = sessionStart.split(':').map(Number);
  const [endHour, endMin] = sessionEnd.split(':').map(Number);
  
  // Count appointments whose slotTime falls within this session's time range.
  // Only count appointments that have a slotTime — legacy rows without one are
  // excluded because we cannot reliably assign them to a session bucket.
  const count = await prisma.appointment.count({
    where: {
      clinicId,
      doctorId,
      appointmentDate: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        notIn: ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'],
      },
      slotTime: {
        gte: sessionStart,
        lt: sessionEnd,
      },
    },
  });
  
  return count;
};

/**
 * GET /api/clinics/:clinicId/sessions/availability
 * 
 * Calculate real-time slot availability for all sessions on a date
 * 
 * Query params:
 * - date (required): YYYY-MM-DD
 * - doctorId (optional): Filter by specific doctor
 */
const getClinicSessionAvailability = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { date, doctorId } = req.query;
    
    // Validation
    if (!date) {
      return sendError(res, 'Date parameter is required (format: YYYY-MM-DD)', 400);
    }
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return sendError(res, 'Invalid date format. Use YYYY-MM-DD', 400);
    }
    
    // Fetch all enabled sessions for this clinic
    const sessions = await prisma.clinicSession.findMany({
      where: {
        clinicId,
        enabled: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    
    if (sessions.length === 0) {
      return sendSuccess(res, {
        sessions: [],
        message: 'No sessions configured for this clinic',
      });
    }
    
    // Get doctor's slot duration if doctorId provided
    let slotDurationMin = DEFAULT_SLOT_DURATION_MIN;
    
    if (doctorId) {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        select: { avgConsultationMins: true },
      });
      
      if (doctor && doctor.avgConsultationMins > 0) {
        slotDurationMin = doctor.avgConsultationMins;
      }
    }
    
    // Calculate availability for each session
    const sessionsWithAvailability = await Promise.all(
      sessions.map(async (session) => {
        const totalSlots = calculateTotalSlots(
          session.startTime,
          session.endTime,
          slotDurationMin
        );
        
        // Count booked appointments for this session
        const bookedSlots = doctorId
          ? await countBookedSlots(
              clinicId,
              doctorId,
              date,
              session.startTime,
              session.endTime
            )
          : 0; // If no doctor specified, can't count bookings
        
        const availableSlots = Math.max(0, Math.min(totalSlots, session.maxPatients) - bookedSlots);
        
        return {
          id: session.id,
          sessionType: session.sessionType,
          name: session.name,
          startTime: session.startTime,
          endTime: session.endTime,
          maxPatients: session.maxPatients,
          enabled: session.enabled,
          sortOrder: session.sortOrder,
          // Calculated fields
          slotDurationMin,
          totalSlots,
          bookedSlots,
          availableSlots,
          isFullyBooked: availableSlots === 0,
          isAlmostFull: availableSlots > 0 && availableSlots <= 5,
        };
      })
    );
    
    return sendSuccess(res, {
      sessions: sessionsWithAvailability,
      date,
      clinicId,
      doctorId: doctorId || null,
    });
    
  } catch (error) {
    logger.error('[sessionAvailability] Error fetching clinic session availability', {
      error: error.message,
      stack: error.stack,
      clinicId: req.params.clinicId,
      date: req.query.date,
    });
    next(error);
  }
};

/**
 * GET /api/doctor/:doctorId/sessions/availability
 * 
 * Doctor-specific session availability
 * Filters sessions based on doctor's working hours from DoctorAvailability table
 * 
 * Query params:
 * - clinicId (required)
 * - date (required): YYYY-MM-DD
 */
const getDoctorSessionAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { clinicId, date } = req.query;
    
    // Validation
    if (!clinicId || !date) {
      return sendError(res, 'clinicId and date query parameters are required', 400);
    }
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return sendError(res, 'Invalid date format. Use YYYY-MM-DD', 400);
    }
    
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if doctor has availability configured for this day
    const doctorAvailability = await prisma.doctorAvailability.findUnique({
      where: {
        doctorId_clinicId_dayOfWeek: {
          doctorId,
          clinicId,
          dayOfWeek,
        },
      },
    });
    
    // If doctor not available on this day, return empty sessions
    if (!doctorAvailability || !doctorAvailability.isActive) {
      return sendSuccess(res, {
        sessions: [],
        message: 'Doctor is not available on this day',
        doctorAvailable: false,
        dayOfWeek,
      });
    }
    
    // Get doctor's slot duration
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { avgConsultationMins: true },
    });
    
    const slotDurationMin = doctor?.avgConsultationMins || doctorAvailability.slotDurationMin || DEFAULT_SLOT_DURATION_MIN;
    
    // Fetch clinic sessions
    const clinicSessions = await prisma.clinicSession.findMany({
      where: {
        clinicId,
        enabled: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    
    if (clinicSessions.length === 0) {
      return sendSuccess(res, {
        sessions: [],
        message: 'No sessions configured for this clinic',
        doctorAvailable: true,
      });
    }
    
    // Filter sessions that overlap with doctor's working hours
    const doctorStartMins = timeToMinutes(doctorAvailability.startTime);
    const doctorEndMins = timeToMinutes(doctorAvailability.endTime);
    
    const filteredSessions = clinicSessions.filter((session) => {
      const sessionStartMins = timeToMinutes(session.startTime);
      const sessionEndMins = timeToMinutes(session.endTime);
      
      // Check if session overlaps with doctor's working hours
      return sessionStartMins < doctorEndMins && sessionEndMins > doctorStartMins;
    });
    
    // Calculate availability for each session
    const sessionsWithAvailability = await Promise.all(
      filteredSessions.map(async (session) => {
        // Use the overlap window between doctor hours and session hours
        const effectiveStart = Math.max(
          timeToMinutes(session.startTime),
          doctorStartMins
        );
        const effectiveEnd = Math.min(
          timeToMinutes(session.endTime),
          doctorEndMins
        );
        
        const effectiveDuration = effectiveEnd - effectiveStart;
        const totalSlots = Math.floor(effectiveDuration / slotDurationMin);
        
        // Count booked appointments
        const bookedSlots = await countBookedSlots(
          clinicId,
          doctorId,
          date,
          session.startTime,
          session.endTime
        );
        
        const availableSlots = Math.max(0, Math.min(totalSlots, session.maxPatients) - bookedSlots);
        
        return {
          id: session.id,
          sessionType: session.sessionType,
          name: session.name,
          startTime: session.startTime,
          endTime: session.endTime,
          maxPatients: session.maxPatients,
          enabled: session.enabled,
          sortOrder: session.sortOrder,
          // Doctor-specific calculated fields
          doctorStartTime: doctorAvailability.startTime,
          doctorEndTime: doctorAvailability.endTime,
          slotDurationMin,
          totalSlots,
          bookedSlots,
          availableSlots,
          isFullyBooked: availableSlots === 0,
          isAlmostFull: availableSlots > 0 && availableSlots <= 5,
        };
      })
    );
    
    return sendSuccess(res, {
      sessions: sessionsWithAvailability,
      date,
      clinicId,
      doctorId,
      doctorAvailable: true,
      dayOfWeek,
    });
    
  } catch (error) {
    logger.error('[sessionAvailability] Error fetching doctor session availability', {
      error: error.message,
      stack: error.stack,
      doctorId: req.params.doctorId,
      clinicId: req.query.clinicId,
      date: req.query.date,
    });
    next(error);
  }
};

/**
 * POST /api/sessions/validate
 * 
 * Validate if a session has available slots before booking
 * Used to prevent race conditions
 * 
 * Body:
 * - clinicId
 * - doctorId
 * - sessionId
 * - date
 */
const validateSessionCapacity = async (req, res, next) => {
  try {
    const { clinicId, doctorId, sessionId, date } = req.body;
    
    // Validation
    if (!clinicId || !doctorId || !sessionId || !date) {
      return sendError(res, 'clinicId, doctorId, sessionId, and date are required', 400);
    }
    
    // Fetch session
    const session = await prisma.clinicSession.findUnique({
      where: { id: sessionId },
    });
    
    if (!session || !session.enabled) {
      return sendError(res, 'Session not found or disabled', 404);
    }
    
    // Get doctor's slot duration
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { avgConsultationMins: true },
    });
    
    const slotDurationMin = doctor?.avgConsultationMins || DEFAULT_SLOT_DURATION_MIN;
    
    // Calculate availability
    const totalSlots = calculateTotalSlots(
      session.startTime,
      session.endTime,
      slotDurationMin
    );
    
    const bookedSlots = await countBookedSlots(
      clinicId,
      doctorId,
      date,
      session.startTime,
      session.endTime
    );
    
    const availableSlots = Math.max(0, Math.min(totalSlots, session.maxPatients) - bookedSlots);
    
    return sendSuccess(res, {
      valid: availableSlots > 0,
      availableSlots,
      totalSlots,
      bookedSlots,
      sessionId,
      message: availableSlots > 0 
        ? `${availableSlots} slot(s) available`
        : 'Session is fully booked',
    });
    
  } catch (error) {
    logger.error('[sessionAvailability] Error validating session capacity', {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    next(error);
  }
};

module.exports = {
  getClinicSessionAvailability,
  getDoctorSessionAvailability,
  validateSessionCapacity,
};
