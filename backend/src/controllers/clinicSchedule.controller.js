/**
 * Clinic Schedule & Timings Management Controller
 * Handles working hours, breaks, holidays, special hours, and temporary closures
 */

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

// ═══════════════════════════════════════════════════════════════════════════
// WORKING HOURS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/clinic/:clinicId/schedule/working-hours
 * Get weekly working hours for a clinic
 */
const getWorkingHours = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    const workingHours = await prisma.clinicWorkingHours.findMany({
      where: { clinicId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // If no working hours exist, create default schedule
    if (workingHours.length === 0) {
      const defaultSchedule = [];
      for (let day = 0; day <= 6; day++) {
        defaultSchedule.push({
          clinicId,
          dayOfWeek: day,
          isOpen: day !== 0, // Sunday closed by default
          morningStartTime: day !== 0 ? '09:00' : null,
          morningEndTime: day !== 0 ? '13:00' : null,
          eveningStartTime: day !== 0 ? '16:00' : null,
          eveningEndTime: day !== 0 ? '20:00' : null,
        });
      }

      const created = await prisma.clinicWorkingHours.createMany({
        data: defaultSchedule,
      });

      const newWorkingHours = await prisma.clinicWorkingHours.findMany({
        where: { clinicId },
        orderBy: { dayOfWeek: 'asc' },
      });

      return sendSuccess(res, newWorkingHours, 'Default working hours created');
    }

    return sendSuccess(res, workingHours);
  } catch (error) {
    logger.error('[getWorkingHours] Error:', error);
    next(error);
  }
};

/**
 * PUT /api/clinic/:clinicId/schedule/working-hours
 * Update weekly working hours
 */
const updateWorkingHours = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { workingHours } = req.body; // Array of working hours objects

    if (!Array.isArray(workingHours)) {
      return sendError(res, 'workingHours must be an array', 400);
    }

    // Update each day's working hours
    const updates = [];
    for (const daySchedule of workingHours) {
      const { dayOfWeek, isOpen, morningStartTime, morningEndTime, eveningStartTime, eveningEndTime, notes } = daySchedule;

      updates.push(
        prisma.clinicWorkingHours.upsert({
          where: {
            clinicId_dayOfWeek: { clinicId, dayOfWeek },
          },
          update: {
            isOpen,
            morningStartTime,
            morningEndTime,
            eveningStartTime,
            eveningEndTime,
            notes,
          },
          create: {
            clinicId,
            dayOfWeek,
            isOpen,
            morningStartTime,
            morningEndTime,
            eveningStartTime,
            eveningEndTime,
            notes,
          },
        })
      );
    }

    await prisma.$transaction(updates);

    const updated = await prisma.clinicWorkingHours.findMany({
      where: { clinicId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return sendSuccess(res, updated, 'Working hours updated successfully');
  } catch (error) {
    logger.error('[updateWorkingHours] Error:', error);
    next(error);
  }
};

/**
 * POST /api/clinic/:clinicId/schedule/copy-monday
 * Copy Monday's schedule to other days
 */
const copyMondayToAll = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { targetDays } = req.body; // Array of day numbers to copy to

    // Get Monday's schedule
    const mondaySchedule = await prisma.clinicWorkingHours.findUnique({
      where: { clinicId_dayOfWeek: { clinicId, dayOfWeek: 1 } },
    });

    if (!mondaySchedule) {
      return sendError(res, 'Monday schedule not found', 404);
    }

    // Copy to target days
    const updates = targetDays.map((dayOfWeek) =>
      prisma.clinicWorkingHours.upsert({
        where: { clinicId_dayOfWeek: { clinicId, dayOfWeek } },
        update: {
          isOpen: mondaySchedule.isOpen,
          morningStartTime: mondaySchedule.morningStartTime,
          morningEndTime: mondaySchedule.morningEndTime,
          eveningStartTime: mondaySchedule.eveningStartTime,
          eveningEndTime: mondaySchedule.eveningEndTime,
        },
        create: {
          clinicId,
          dayOfWeek,
          isOpen: mondaySchedule.isOpen,
          morningStartTime: mondaySchedule.morningStartTime,
          morningEndTime: mondaySchedule.morningEndTime,
          eveningStartTime: mondaySchedule.eveningStartTime,
          eveningEndTime: mondaySchedule.eveningEndTime,
        },
      })
    );

    await prisma.$transaction(updates);

    const updated = await prisma.clinicWorkingHours.findMany({
      where: { clinicId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return sendSuccess(res, updated, 'Monday schedule copied successfully');
  } catch (error) {
    logger.error('[copyMondayToAll] Error:', error);
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BREAKS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/clinic/:clinicId/schedule/breaks
 * Get all breaks for a clinic
 */
const getBreaks = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    const breaks = await prisma.clinicBreak.findMany({
      where: { clinicId },
      orderBy: { startTime: 'asc' },
    });

    return sendSuccess(res, breaks);
  } catch (error) {
    logger.error('[getBreaks] Error:', error);
    next(error);
  }
};

/**
 * POST /api/clinic/:clinicId/schedule/breaks
 * Create a new break
 */
const createBreak = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { name, startTime, endTime, applicableDays } = req.body;

    const breakEntry = await prisma.clinicBreak.create({
      data: {
        clinicId,
        name,
        startTime,
        endTime,
        applicableDays: applicableDays || [1, 2, 3, 4, 5, 6],
        isActive: true,
      },
    });

    return sendSuccess(res, breakEntry, 'Break created successfully', 201);
  } catch (error) {
    logger.error('[createBreak] Error:', error);
    next(error);
  }
};

/**
 * PUT /api/clinic/:clinicId/schedule/breaks/:breakId
 * Update a break
 */
const updateBreak = async (req, res, next) => {
  try {
    const { breakId } = req.params;
    const { name, startTime, endTime, applicableDays, isActive } = req.body;

    const breakEntry = await prisma.clinicBreak.update({
      where: { id: breakId },
      data: { name, startTime, endTime, applicableDays, isActive },
    });

    return sendSuccess(res, breakEntry, 'Break updated successfully');
  } catch (error) {
    logger.error('[updateBreak] Error:', error);
    next(error);
  }
};

/**
 * DELETE /api/clinic/:clinicId/schedule/breaks/:breakId
 * Delete a break
 */
const deleteBreak = async (req, res, next) => {
  try {
    const { breakId } = req.params;

    await prisma.clinicBreak.delete({
      where: { id: breakId },
    });

    return sendSuccess(res, null, 'Break deleted successfully');
  } catch (error) {
    logger.error('[deleteBreak] Error:', error);
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HOLIDAYS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/clinic/:clinicId/schedule/holidays
 * Get all holidays for a clinic
 */
const getHolidays = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { clinicId };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const holidays = await prisma.clinicHoliday.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return sendSuccess(res, holidays);
  } catch (error) {
    logger.error('[getHolidays] Error:', error);
    next(error);
  }
};

/**
 * POST /api/clinic/:clinicId/schedule/holidays
 * Create a new holiday
 */
const createHoliday = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { date, name, type, reason, isRecurring } = req.body;

    const holiday = await prisma.clinicHoliday.create({
      data: {
        clinicId,
        date: new Date(date),
        name,
        type,
        reason,
        isRecurring: isRecurring || false,
      },
    });

    return sendSuccess(res, holiday, 'Holiday created successfully', 201);
  } catch (error) {
    logger.error('[createHoliday] Error:', error);
    next(error);
  }
};

/**
 * PUT /api/clinic/:clinicId/schedule/holidays/:holidayId
 * Update a holiday
 */
const updateHoliday = async (req, res, next) => {
  try {
    const { holidayId } = req.params;
    const { date, name, type, reason, isRecurring } = req.body;

    const holiday = await prisma.clinicHoliday.update({
      where: { id: holidayId },
      data: { 
        date: date ? new Date(date) : undefined,
        name, 
        type, 
        reason, 
        isRecurring 
      },
    });

    return sendSuccess(res, holiday, 'Holiday updated successfully');
  } catch (error) {
    logger.error('[updateHoliday] Error:', error);
    next(error);
  }
};

/**
 * DELETE /api/clinic/:clinicId/schedule/holidays/:holidayId
 * Delete a holiday
 */
const deleteHoliday = async (req, res, next) => {
  try {
    const { holidayId } = req.params;

    await prisma.clinicHoliday.delete({
      where: { id: holidayId },
    });

    return sendSuccess(res, null, 'Holiday deleted successfully');
  } catch (error) {
    logger.error('[deleteHoliday] Error:', error);
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL HOURS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/clinic/:clinicId/schedule/special-hours
 * Get special hours for specific dates
 */
const getSpecialHours = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { clinicId };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const specialHours = await prisma.clinicSpecialHours.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return sendSuccess(res, specialHours);
  } catch (error) {
    logger.error('[getSpecialHours] Error:', error);
    next(error);
  }
};

/**
 * POST /api/clinic/:clinicId/schedule/special-hours
 * Create special hours for a date
 */
const createSpecialHours = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { date, name, morningStartTime, morningEndTime, eveningStartTime, eveningEndTime, isClosed, notes } = req.body;

    const specialHours = await prisma.clinicSpecialHours.create({
      data: {
        clinicId,
        date: new Date(date),
        name,
        morningStartTime,
        morningEndTime,
        eveningStartTime,
        eveningEndTime,
        isClosed,
        notes,
      },
    });

    return sendSuccess(res, specialHours, 'Special hours created successfully', 201);
  } catch (error) {
    logger.error('[createSpecialHours] Error:', error);
    next(error);
  }
};

/**
 * PUT /api/clinic/:clinicId/schedule/special-hours/:specialHoursId
 * Update special hours
 */
const updateSpecialHours = async (req, res, next) => {
  try {
    const { specialHoursId } = req.params;
    const { name, morningStartTime, morningEndTime, eveningStartTime, eveningEndTime, isClosed, notes } = req.body;

    const specialHours = await prisma.clinicSpecialHours.update({
      where: { id: specialHoursId },
      data: { name, morningStartTime, morningEndTime, eveningStartTime, eveningEndTime, isClosed, notes },
    });

    return sendSuccess(res, specialHours, 'Special hours updated successfully');
  } catch (error) {
    logger.error('[updateSpecialHours] Error:', error);
    next(error);
  }
};

/**
 * DELETE /api/clinic/:clinicId/schedule/special-hours/:specialHoursId
 * Delete special hours
 */
const deleteSpecialHours = async (req, res, next) => {
  try {
    const { specialHoursId } = req.params;

    await prisma.clinicSpecialHours.delete({
      where: { id: specialHoursId },
    });

    return sendSuccess(res, null, 'Special hours deleted successfully');
  } catch (error) {
    logger.error('[deleteSpecialHours] Error:', error);
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORARY CLOSURE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/clinic/:clinicId/schedule/temporary-closure
 * Get active temporary closure
 */
const getTemporaryClosure = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    const closure = await prisma.clinicTemporaryClosure.findFirst({
      where: {
        clinicId,
        isActive: true,
        OR: [
          { endTime: null },
          { endTime: { gt: new Date() } },
        ],
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return sendSuccess(res, closure);
  } catch (error) {
    logger.error('[getTemporaryClosure] Error:', error);
    next(error);
  }
};

/**
 * POST /api/clinic/:clinicId/schedule/temporary-closure
 * Create temporary closure
 */
const createTemporaryClosure = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Deactivate any existing active closures
    await prisma.clinicTemporaryClosure.updateMany({
      where: { clinicId, isActive: true },
      data: { isActive: false, endTime: new Date() },
    });

    // Create new closure
    const closure = await prisma.clinicTemporaryClosure.create({
      data: {
        clinicId,
        startTime: new Date(),
        reason,
        isActive: true,
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return sendSuccess(res, closure, 'Clinic closed temporarily', 201);
  } catch (error) {
    logger.error('[createTemporaryClosure] Error:', error);
    next(error);
  }
};

/**
 * POST /api/clinic/:clinicId/schedule/reopen
 * Reopen clinic (end temporary closure)
 */
const reopenClinic = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    await prisma.clinicTemporaryClosure.updateMany({
      where: { clinicId, isActive: true },
      data: { isActive: false, endTime: new Date() },
    });

    return sendSuccess(res, null, 'Clinic reopened successfully');
  } catch (error) {
    logger.error('[reopenClinic] Error:', error);
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CLINIC STATUS & TODAY'S SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/clinic/:clinicId/schedule/status
 * Get current clinic status (open/closed) and today's schedule
 */
const getClinicStatus = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check temporary closure
    const temporaryClosure = await prisma.clinicTemporaryClosure.findFirst({
      where: {
        clinicId,
        isActive: true,
        OR: [
          { endTime: null },
          { endTime: { gt: now } },
        ],
      },
    });

    if (temporaryClosure) {
      return sendSuccess(res, {
        isOpen: false,
        status: 'TEMPORARILY_CLOSED',
        reason: temporaryClosure.reason,
        closedSince: temporaryClosure.startTime,
        message: `Clinic is temporarily closed: ${temporaryClosure.reason}`,
      });
    }

    // Check today's date for holidays or special hours
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const holiday = await prisma.clinicHoliday.findFirst({
      where: {
        clinicId,
        date: today,
      },
    });

    if (holiday) {
      return sendSuccess(res, {
        isOpen: false,
        status: 'HOLIDAY',
        holidayName: holiday.name,
        holidayType: holiday.type,
        reason: holiday.reason,
        message: `Clinic closed for ${holiday.name}`,
      });
    }

    // Check special hours for today
    const specialHours = await prisma.clinicSpecialHours.findFirst({
      where: {
        clinicId,
        date: today,
      },
    });

    if (specialHours) {
      if (specialHours.isClosed) {
        return sendSuccess(res, {
          isOpen: false,
          status: 'SPECIAL_CLOSURE',
          name: specialHours.name,
          notes: specialHours.notes,
          message: specialHours.name || 'Clinic closed (special closure)',
        });
      }

      // Use special hours for today
      const isCurrentlyOpen = 
        (specialHours.morningStartTime && specialHours.morningEndTime && 
         currentTime >= specialHours.morningStartTime && currentTime <= specialHours.morningEndTime) ||
        (specialHours.eveningStartTime && specialHours.eveningEndTime && 
         currentTime >= specialHours.eveningStartTime && currentTime <= specialHours.eveningEndTime);

      return sendSuccess(res, {
        isOpen: isCurrentlyOpen,
        status: isCurrentlyOpen ? 'OPEN' : 'CLOSED',
        specialHours: true,
        schedule: {
          morningSession: specialHours.morningStartTime && specialHours.morningEndTime
            ? `${specialHours.morningStartTime} - ${specialHours.morningEndTime}`
            : null,
          eveningSession: specialHours.eveningStartTime && specialHours.eveningEndTime
            ? `${specialHours.eveningStartTime} - ${specialHours.eveningEndTime}`
            : null,
        },
        notes: specialHours.notes,
      });
    }

    // Use regular working hours
    const workingHours = await prisma.clinicWorkingHours.findUnique({
      where: {
        clinicId_dayOfWeek: { clinicId, dayOfWeek },
      },
    });

    if (!workingHours || !workingHours.isOpen) {
      return sendSuccess(res, {
        isOpen: false,
        status: 'CLOSED',
        message: 'Clinic closed today (weekly off)',
      });
    }

    // Check if currently in break
    const breaks = await prisma.clinicBreak.findMany({
      where: {
        clinicId,
        isActive: true,
        applicableDays: {
          has: dayOfWeek,
        },
      },
    });

    const inBreak = breaks.some(
      (b) => currentTime >= b.startTime && currentTime <= b.endTime
    );

    if (inBreak) {
      const currentBreak = breaks.find(
        (b) => currentTime >= b.startTime && currentTime <= b.endTime
      );
      return sendSuccess(res, {
        isOpen: false,
        status: 'BREAK',
        breakName: currentBreak.name,
        breakTime: `${currentBreak.startTime} - ${currentBreak.endTime}`,
        message: `On break: ${currentBreak.name}`,
        nextOpening: currentBreak.endTime,
      });
    }

    // Check if currently in operating hours
    const isCurrentlyOpen =
      (workingHours.morningStartTime && workingHours.morningEndTime &&
       currentTime >= workingHours.morningStartTime && currentTime <= workingHours.morningEndTime) ||
      (workingHours.eveningStartTime && workingHours.eveningEndTime &&
       currentTime >= workingHours.eveningStartTime && currentTime <= workingHours.eveningEndTime);

    let nextOpening = null;
    if (!isCurrentlyOpen) {
      if (currentTime < workingHours.morningStartTime) {
        nextOpening = workingHours.morningStartTime;
      } else if (workingHours.eveningStartTime && currentTime < workingHours.eveningStartTime) {
        nextOpening = workingHours.eveningStartTime;
      }
    }

    return sendSuccess(res, {
      isOpen: isCurrentlyOpen,
      status: isCurrentlyOpen ? 'OPEN' : 'CLOSED',
      schedule: {
        morningSession: workingHours.morningStartTime && workingHours.morningEndTime
          ? `${workingHours.morningStartTime} - ${workingHours.morningEndTime}`
          : null,
        eveningSession: workingHours.eveningStartTime && workingHours.eveningEndTime
          ? `${workingHours.eveningStartTime} - ${workingHours.eveningEndTime}`
          : null,
      },
      nextOpening,
      breaks: breaks.map(b => ({
        name: b.name,
        time: `${b.startTime} - ${b.endTime}`,
      })),
    });
  } catch (error) {
    logger.error('[getClinicStatus] Error:', error);
    next(error);
  }
};

/**
 * GET /api/clinic/:clinicId/schedule/today
 * Get complete schedule for today including doctors
 */
const getTodaySchedule = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = now.getDay();

    // Get clinic status
    const statusResponse = await getClinicStatus(req, res, () => {});
    
    // Get doctor schedules for today
    const doctorAvailabilities = await prisma.doctorAvailability.findMany({
      where: {
        clinicId,
        dayOfWeek,
        isActive: true,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Get appointment counts
    const appointmentCount = await prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        status: { notIn: ['CANCELLED', 'PENDING_PAYMENT'] },
      },
    });

    // Get queue stats
    const queueStats = await prisma.queueItem.aggregate({
      where: {
        queue: { clinicId },
        status: { in: ['WAITING', 'IN_CONSULTATION'] },
      },
      _count: true,
    });

    return sendSuccess(res, {
      status: statusResponse,
      doctors: doctorAvailabilities.map(da => ({
        id: da.doctor.id,
        name: da.doctor.user.name,
        specialization: da.doctor.primarySpecialization,
        availability: {
          startTime: da.startTime,
          endTime: da.endTime,
          isAvailable: da.isActive,
        },
      })),
      stats: {
        appointmentsToday: appointmentCount,
        patientsInQueue: queueStats._count || 0,
      },
    });
  } catch (error) {
    logger.error('[getTodaySchedule] Error:', error);
    next(error);
  }
};

// Export all functions
module.exports = {
  // Working Hours
  getWorkingHours,
  updateWorkingHours,
  copyMondayToAll,
  
  // Breaks
  getBreaks,
  createBreak,
  updateBreak,
  deleteBreak,
  
  // Holidays
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  
  // Special Hours
  getSpecialHours,
  createSpecialHours,
  updateSpecialHours,
  deleteSpecialHours,
  
  // Temporary Closure
  getTemporaryClosure,
  createTemporaryClosure,
  reopenClinic,
  
  // Status & Today's Schedule
  getClinicStatus,
  getTodaySchedule,
};
