const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getSettings,
  updateSettings,
  create,
  list,
  getOne,
  update,
  cancel,
  getMyFollowUps,
  getCompletedVisits,
  getPatientFollowUpsStaff,
} = require('../controllers/followup.controller');

router.use(authenticate);

// ── Patient routes ────────────────────────────────────────────────────────────
// GET /api/follow-ups/my  — patient sees their own follow-ups
router.get('/my', authorize('PATIENT'), getMyFollowUps);

// ── Staff routes (CLINIC_OWNER, DOCTOR, RECEPTIONIST, SUPER_ADMIN) ───────────
router.use(authorize('CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST', 'SUPER_ADMIN'));

// Clinic follow-up settings — CLINIC_OWNER only can update, all staff can read
router.get('/clinic-settings', getSettings);
router.patch('/clinic-settings', authorize('CLINIC_OWNER', 'SUPER_ADMIN'), updateSettings);

// Completed visits for a patient — used when creating a follow-up
// GET /api/follow-ups/completed-visits?patientId=&clinicId=&doctorId=
router.get('/completed-visits', getCompletedVisits);

// Per-patient follow-up history (staff view)
// GET /api/follow-ups/patient/:patientId?clinicId=
router.get('/patient/:patientId', getPatientFollowUpsStaff);

// Follow-up CRUD
router.get('/', list);
router.post('/', create);
router.get('/:id', getOne);
router.patch('/:id', update);
router.patch('/:id/cancel', cancel);

module.exports = router;
