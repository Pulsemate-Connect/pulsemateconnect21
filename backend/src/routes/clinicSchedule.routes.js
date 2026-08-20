/**
 * Clinic Schedule & Timings Routes
 * All routes for managing clinic schedules, breaks, holidays, and settings
 */

const express = require('express');
const router = express.Router();
const {
  authenticate,
  authorize,
  requireApprovalStatuses,
} = require('../middleware/auth.middleware');

const scheduleController = require('../controllers/clinicSchedule.controller');
const settingsController = require('../controllers/clinicSettings.controller');

// All routes require authentication
router.use(authenticate);

// ═══════════════════════════════════════════════════════════════════════════
// WORKING HOURS ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  '/:clinicId/schedule/working-hours',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'),
  scheduleController.getWorkingHours
);

router.put(
  '/:clinicId/schedule/working-hours',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.updateWorkingHours
);

router.post(
  '/:clinicId/schedule/copy-monday',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.copyMondayToAll
);

// ═══════════════════════════════════════════════════════════════════════════
// BREAKS ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  '/:clinicId/schedule/breaks',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'),
  scheduleController.getBreaks
);

router.post(
  '/:clinicId/schedule/breaks',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.createBreak
);

router.put(
  '/:clinicId/schedule/breaks/:breakId',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.updateBreak
);

router.delete(
  '/:clinicId/schedule/breaks/:breakId',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.deleteBreak
);

// ═══════════════════════════════════════════════════════════════════════════
// HOLIDAYS ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  '/:clinicId/schedule/holidays',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'),
  scheduleController.getHolidays
);

router.post(
  '/:clinicId/schedule/holidays',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.createHoliday
);

router.put(
  '/:clinicId/schedule/holidays/:holidayId',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.updateHoliday
);

router.delete(
  '/:clinicId/schedule/holidays/:holidayId',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.deleteHoliday
);

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL HOURS ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  '/:clinicId/schedule/special-hours',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'),
  scheduleController.getSpecialHours
);

router.post(
  '/:clinicId/schedule/special-hours',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.createSpecialHours
);

router.put(
  '/:clinicId/schedule/special-hours/:specialHoursId',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.updateSpecialHours
);

router.delete(
  '/:clinicId/schedule/special-hours/:specialHoursId',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.deleteSpecialHours
);

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORARY CLOSURE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  '/:clinicId/schedule/temporary-closure',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'),
  scheduleController.getTemporaryClosure
);

router.post(
  '/:clinicId/schedule/temporary-closure',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.createTemporaryClosure
);

router.post(
  '/:clinicId/schedule/reopen',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  scheduleController.reopenClinic
);

// ═══════════════════════════════════════════════════════════════════════════
// STATUS & TODAY'S SCHEDULE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  '/:clinicId/schedule/status',
  scheduleController.getClinicStatus
);

router.get(
  '/:clinicId/schedule/today',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'),
  scheduleController.getTodaySchedule
);

// ═══════════════════════════════════════════════════════════════════════════
// APPOINTMENT SETTINGS ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  '/:clinicId/settings/appointments',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'),
  settingsController.getAppointmentSettings
);

router.put(
  '/:clinicId/settings/appointments',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  settingsController.updateAppointmentSettings
);

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE SETTINGS ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  '/:clinicId/settings/queue',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'),
  settingsController.getQueueSettings
);

router.put(
  '/:clinicId/settings/queue',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  requireApprovalStatuses('VERIFIED'),
  settingsController.updateQueueSettings
);

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS SUMMARY ROUTE
// ═══════════════════════════════════════════════════════════════════════════

router.get(
  '/:clinicId/settings/summary',
  authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'),
  settingsController.getSettingsSummary
);

module.exports = router;
