const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');

/**
 * POST /api/clinic/:clinicId/holidays - Add holiday
 */
const addHoliday = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { date, name, reason, isRecurring } = req.body;

    // Verify ownership
    const clinic = await prisma.clinic.findFirst({
      where: { id: clinicId, ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found or access denied', 404);
    }

    // Check if holiday already exists
    const existing = await prisma.clinicHoliday.findUnique({
      where: { clinicId_date: { clinicId, date: new Date(date) } },
    });

    if (existing) {
      return sendError(res, 'Holiday already exists for this date', 409);
    }

    // Create holiday
    const holiday = await prisma.clinicHoliday.create({
      data: {
        clinicId,
        date: new Date(date),
        name,
        reason,
        isRecurring: isRecurring || false,
      },
    });

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'HOLIDAY_ADDED',
      entityType: 'ClinicHoliday',
      entityId: holiday.id,
      metadata: { clinicId, date, name },
      ipAddress: req.ip,
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const { emitClinicUpdate } = require('../socket');
      emitClinicUpdate(io, clinicId, { type: 'HOLIDAY_ADDED', holiday });
    }

    return sendSuccess(res, { holiday }, 'Holiday added successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinic/:clinicId/holidays - Get all holidays
 */
const getHolidays = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { year, month } = req.query;

    const where = { clinicId };

    // Filter by year/month if provided
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const holidays = await prisma.clinicHoliday.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return sendSuccess(res, { holidays });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/clinic/:clinicId/holidays/:holidayId - Delete holiday
 */
const deleteHoliday = async (req, res, next) => {
  try {
    const { clinicId, holidayId } = req.params;

    // Verify ownership
    const clinic = await prisma.clinic.findFirst({
      where: { id: clinicId, ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found or access denied', 404);
    }

    const holiday = await prisma.clinicHoliday.findUnique({
      where: { id: holidayId },
    });

    if (!holiday || holiday.clinicId !== clinicId) {
      return sendError(res, 'Holiday not found', 404);
    }

    await prisma.clinicHoliday.delete({
      where: { id: holidayId },
    });

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'HOLIDAY_DELETED',
      entityType: 'ClinicHoliday',
      entityId: holidayId,
      metadata: { clinicId, date: holiday.date, name: holiday.name },
      ipAddress: req.ip,
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const { emitClinicUpdate } = require('../socket');
      emitClinicUpdate(io, clinicId, { type: 'HOLIDAY_DELETED', holidayId });
    }

    return sendSuccess(res, {}, 'Holiday deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Check if date is a holiday
 */
const isHoliday = async (clinicId, date) => {
  const holiday = await prisma.clinicHoliday.findUnique({
    where: { clinicId_date: { clinicId, date: new Date(date) } },
  });
  return !!holiday;
};

module.exports = {
  addHoliday,
  getHolidays,
  deleteHoliday,
  isHoliday,
};
