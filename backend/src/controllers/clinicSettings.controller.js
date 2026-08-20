/**
 * Clinic Settings Controller
 * Handles appointment settings and queue settings
 */

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

// ═══════════════════════════════════════════════════════════════════════════
// APPOINTMENT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/clinic/:clinicId/settings/appointments
 * Get appointment settings for a clinic
 */
const getAppointmentSettings = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    let settings = await prisma.clinicAppointmentSettings.findUnique({
      where: { clinicId },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.clinicAppointmentSettings.create({
        data: {
          clinicId,
          slotDurationMinutes: 30,
          bookingOpenDaysBefore: 30,
          bookingCloseMinutesBefore: 30,
          sameDayBookingEnabled: true,
          onlineBookingEnabled: true,
          walkInEnabled: true,
          autoConfirmAppointments: false,
          bufferBetweenAppointments: 0,
        },
      });
    }

    return sendSuccess(res, settings);
  } catch (error) {
    logger.error('[getAppointmentSettings] Error:', error);
    next(error);
  }
};

/**
 * PUT /api/clinic/:clinicId/settings/appointments
 * Update appointment settings
 */
const updateAppointmentSettings = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const {
      slotDurationMinutes,
      maxAppointmentsPerSession,
      bookingOpenDaysBefore,
      bookingCloseMinutesBefore,
      sameDayBookingEnabled,
      onlineBookingEnabled,
      walkInEnabled,
      autoConfirmAppointments,
      bufferBetweenAppointments,
    } = req.body;

    const settings = await prisma.clinicAppointmentSettings.upsert({
      where: { clinicId },
      update: {
        slotDurationMinutes,
        maxAppointmentsPerSession,
        bookingOpenDaysBefore,
        bookingCloseMinutesBefore,
        sameDayBookingEnabled,
        onlineBookingEnabled,
        walkInEnabled,
        autoConfirmAppointments,
        bufferBetweenAppointments,
      },
      create: {
        clinicId,
        slotDurationMinutes: slotDurationMinutes || 30,
        maxAppointmentsPerSession,
        bookingOpenDaysBefore: bookingOpenDaysBefore || 30,
        bookingCloseMinutesBefore: bookingCloseMinutesBefore || 30,
        sameDayBookingEnabled: sameDayBookingEnabled !== undefined ? sameDayBookingEnabled : true,
        onlineBookingEnabled: onlineBookingEnabled !== undefined ? onlineBookingEnabled : true,
        walkInEnabled: walkInEnabled !== undefined ? walkInEnabled : true,
        autoConfirmAppointments: autoConfirmAppointments || false,
        bufferBetweenAppointments: bufferBetweenAppointments || 0,
      },
    });

    return sendSuccess(res, settings, 'Appointment settings updated successfully');
  } catch (error) {
    logger.error('[updateAppointmentSettings] Error:', error);
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/clinic/:clinicId/settings/queue
 * Get queue settings for a clinic
 */
const getQueueSettings = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    let settings = await prisma.clinicQueueSettings.findUnique({
      where: { clinicId },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.clinicQueueSettings.create({
        data: {
          clinicId,
          queueStartTime: '09:00',
          queueCloseTime: '20:00',
          walkInTokenEnabled: true,
          onlineBookingInQueue: true,
          estimatedConsultationMinutes: 15,
          autoTokenGenerationEnabled: true,
          tokenPrefix: 'T',
          notifyPatientMinutesBefore: 15,
        },
      });
    }

    return sendSuccess(res, settings);
  } catch (error) {
    logger.error('[getQueueSettings] Error:', error);
    next(error);
  }
};

/**
 * PUT /api/clinic/:clinicId/settings/queue
 * Update queue settings
 */
const updateQueueSettings = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const {
      queueStartTime,
      queueCloseTime,
      maxQueueCapacity,
      walkInTokenEnabled,
      onlineBookingInQueue,
      estimatedConsultationMinutes,
      autoTokenGenerationEnabled,
      tokenPrefix,
      notifyPatientMinutesBefore,
    } = req.body;

    const settings = await prisma.clinicQueueSettings.upsert({
      where: { clinicId },
      update: {
        queueStartTime,
        queueCloseTime,
        maxQueueCapacity,
        walkInTokenEnabled,
        onlineBookingInQueue,
        estimatedConsultationMinutes,
        autoTokenGenerationEnabled,
        tokenPrefix,
        notifyPatientMinutesBefore,
      },
      create: {
        clinicId,
        queueStartTime: queueStartTime || '09:00',
        queueCloseTime: queueCloseTime || '20:00',
        maxQueueCapacity,
        walkInTokenEnabled: walkInTokenEnabled !== undefined ? walkInTokenEnabled : true,
        onlineBookingInQueue: onlineBookingInQueue !== undefined ? onlineBookingInQueue : true,
        estimatedConsultationMinutes: estimatedConsultationMinutes || 15,
        autoTokenGenerationEnabled: autoTokenGenerationEnabled !== undefined ? autoTokenGenerationEnabled : true,
        tokenPrefix: tokenPrefix || 'T',
        notifyPatientMinutesBefore: notifyPatientMinutesBefore || 15,
      },
    });

    return sendSuccess(res, settings, 'Queue settings updated successfully');
  } catch (error) {
    logger.error('[updateQueueSettings] Error:', error);
    next(error);
  }
};

/**
 * GET /api/clinic/:clinicId/settings/summary
 * Get summary of all settings (for dashboard display)
 */
const getSettingsSummary = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    const [appointmentSettings, queueSettings] = await Promise.all([
      prisma.clinicAppointmentSettings.findUnique({ where: { clinicId } }),
      prisma.clinicQueueSettings.findUnique({ where: { clinicId } }),
    ]);

    return sendSuccess(res, {
      appointments: appointmentSettings || {
        slotDurationMinutes: 30,
        sameDayBookingEnabled: true,
        onlineBookingEnabled: true,
        walkInEnabled: true,
      },
      queue: queueSettings || {
        queueStartTime: '09:00',
        queueCloseTime: '20:00',
        walkInTokenEnabled: true,
        estimatedConsultationMinutes: 15,
      },
    });
  } catch (error) {
    logger.error('[getSettingsSummary] Error:', error);
    next(error);
  }
};

module.exports = {
  // Appointment Settings
  getAppointmentSettings,
  updateAppointmentSettings,
  
  // Queue Settings
  getQueueSettings,
  updateQueueSettings,
  
  // Summary
  getSettingsSummary,
};
