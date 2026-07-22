const express = require('express');
const router = express.Router();
const {
  authenticate,
  authorize,
  requireApprovalStatuses,
  requireClinicVerified,
} = require('../middleware/auth.middleware');
const {
  createClinic,
  getMyClinics,
  getMyClinicStatus,
  resubmitClinic,
  getClinic,
  updateClinic,
  addStaff,
  getStaff,
  getDoctorInvites,
  updateStaffStatus,
  getClinicRevenue,
  getClinicBookingMetrics,
  getClinicAppointments,
  // Doctor Management
  createDoctor,
  getClinicDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  deleteDoctor,
  // ✅ NEW: Booking Control
  stopBookings,
  resumeBookings,
  getBookingStatus,
} = require('../controllers/clinic.controller');
const { createReceptionistHandler } = require('../controllers/auth.controller');
const { validate, createClinicSchema, updateClinicSchema, addStaffSchema } = require('../validators/clinic.validator');
const { getMyClinicSessions, createSession, updateSession, deleteSession } = require('../controllers/clinicSession.controller');

router.use(authenticate);

router.post('/', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'PATIENT'), validate(createClinicSchema), createClinic);
router.get('/my', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), getMyClinics);
router.get('/my-status', authorize('CLINIC_OWNER'), getMyClinicStatus);
router.patch('/my-resubmit', authorize('CLINIC_OWNER'), resubmitClinic);
router.post('/receptionists', authorize('CLINIC_OWNER'), requireApprovalStatuses('VERIFIED'), createReceptionistHandler);

// ── Doctor Management Routes ──────────────────────────────────────────────────
router.post('/doctors', authorize('CLINIC_OWNER'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, createDoctor);
router.get('/doctors', authorize('CLINIC_OWNER'), getClinicDoctors);
router.get('/doctors/:id', authorize('CLINIC_OWNER'), getDoctorById);
router.put('/doctors/:id', authorize('CLINIC_OWNER'), requireApprovalStatuses('VERIFIED'), updateDoctor);
router.patch('/doctors/:id/status', authorize('CLINIC_OWNER'), requireApprovalStatuses('VERIFIED'), updateDoctorStatus);
router.delete('/doctors/:id', authorize('CLINIC_OWNER'), requireApprovalStatuses('VERIFIED'), deleteDoctor);

// ── Clinic Session Management Routes ──────────────────────────────────────────
router.get('/my-sessions', authorize('CLINIC_OWNER'), getMyClinicSessions);
router.post('/:clinicId/sessions', authorize('CLINIC_OWNER'), requireApprovalStatuses('VERIFIED'), createSession);
router.put('/sessions/:sessionId', authorize('CLINIC_OWNER'), requireApprovalStatuses('VERIFIED'), updateSession);
router.delete('/sessions/:sessionId', authorize('CLINIC_OWNER'), requireApprovalStatuses('VERIFIED'), deleteSession);

router.get('/:id', getClinic);
router.patch('/:id', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), validate(updateClinicSchema), updateClinic);
router.post('/:id/staff', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, validate(addStaffSchema), addStaff);
router.get('/:id/staff', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'), getStaff);
router.get('/:id/doctor-invites', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, getDoctorInvites);
router.patch('/:id/staff/:staffId/status', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, updateStaffStatus);
router.get('/:id/revenue', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, getClinicRevenue);
router.get('/:id/booking-metrics', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, getClinicBookingMetrics);
router.get('/:id/appointments', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST'), getClinicAppointments);

// ── Follow-up settings per doctor at this clinic ──────────────────────────────
router.get('/:clinicId/doctors/:doctorId/follow-up', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { clinicId, doctorId } = req.params;
    const { getFollowUpSettings } = require('../services/followup.service');
    const settings = await getFollowUpSettings(doctorId, clinicId);
    const { sendSuccess } = require('../utils/response');
    return sendSuccess(res, { settings });
  } catch (err) { next(err); }
});

router.patch('/:clinicId/doctors/:doctorId/follow-up', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), async (req, res, next) => {
  try {
    const { clinicId, doctorId } = req.params;
    const { followUpEnabled, followUpValidityDays } = req.body;

    // Verify clinic ownership
    const prisma = require('../config/database');
    const { sendSuccess, sendError } = require('../utils/response');
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!clinic) return sendError(res, 'Access denied', 403);
    }

    const { updateFollowUpSettings } = require('../services/followup.service');
    const updated = await updateFollowUpSettings(doctorId, clinicId, {
      followUpEnabled,
      followUpValidityDays: followUpValidityDays ? parseInt(followUpValidityDays) : undefined,
    });
    return sendSuccess(res, { settings: updated }, 'Follow-up settings updated');
  } catch (err) { next(err); }
});

// ── Clinic Session Management Routes (moved below /:id) — already registered above ── ───────────────────────────────────────────────
router.post('/:id/bookings/stop', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), stopBookings);
router.post('/:id/bookings/resume', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), resumeBookings);
router.get('/:id/booking-status', getBookingStatus); // Public route

module.exports = router;
