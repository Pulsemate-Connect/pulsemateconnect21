const express = require('express');
const router = express.Router();
const {
  authenticate,
  authorize,
  requireApprovalStatuses,
  requireDoctorVerified,
} = require('../middleware/auth.middleware');
const {
  getTodayAppointments,
  getAppointments,
  startConsultation,
  completeConsultation,
  updateAvailability,
  getDoctorProfile,
  updateDoctorProfile,
  createPrescription,
  completeAppointment,
  getFollowUpSettings,
  updateFollowUpSettings,
} = require('../controllers/doctor.controller');

router.use(authenticate, authorize('DOCTOR', 'SUPER_ADMIN'));
router.use((req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') return next();
  return requireApprovalStatuses('VERIFIED')(req, res, () => requireDoctorVerified(req, res, next));
});

router.get('/today', getTodayAppointments);
router.get('/appointments', getAppointments);
router.patch('/appointments/:id/start', startConsultation);
router.patch('/appointments/:id/complete', completeConsultation);
router.patch('/availability', updateAvailability);
router.get('/profile', getDoctorProfile);
router.patch('/profile', updateDoctorProfile);
router.post('/prescription', createPrescription);
router.patch('/appointment/:id/complete', completeAppointment);

// ── Follow-up settings (doctor configures per-clinic) ─────────────────────────
router.get('/follow-up/settings', getFollowUpSettings);
router.patch('/follow-up/settings', updateFollowUpSettings);

module.exports = router;
