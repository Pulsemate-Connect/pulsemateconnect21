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
} = require('../controllers/clinic.controller');
const { createReceptionistHandler } = require('../controllers/auth.controller');
const { validate, createClinicSchema, updateClinicSchema, addStaffSchema } = require('../validators/clinic.validator');

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

router.get('/:id', getClinic);
router.patch('/:id', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), validate(updateClinicSchema), updateClinic);
router.post('/:id/staff', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, validate(addStaffSchema), addStaff);
router.get('/:id/staff', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'RECEPTIONIST'), getStaff);
router.get('/:id/doctor-invites', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, getDoctorInvites);
router.patch('/:id/staff/:staffId/status', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, updateStaffStatus);
router.get('/:id/revenue', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, getClinicRevenue);
router.get('/:id/booking-metrics', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), requireApprovalStatuses('VERIFIED'), requireClinicVerified, getClinicBookingMetrics);
router.get('/:id/appointments', authorize('CLINIC_OWNER', 'SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST'), getClinicAppointments);

module.exports = router;
