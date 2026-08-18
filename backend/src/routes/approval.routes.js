const express = require('express');
const {
  listPendingClinics,
  listPendingDoctors,
  decideClinicApproval,
  decideDoctorApproval,
} = require('../controllers/approval.controller');
const { authenticateUser, requireSuperAdmin, requireAdminLevel } = require('../middleware/auth.middleware');

const router = express.Router();

// Use the same middleware as admin routes
router.use(authenticateUser, requireSuperAdmin);

router.get('/clinics/pending', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), listPendingClinics);
router.get('/doctors/pending', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), listPendingDoctors);
router.patch('/clinics/:clinicId', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), decideClinicApproval);
router.patch('/doctors/:doctorUserId', requireAdminLevel('ROOT', 'SUPER_ADMIN', 'SUPPORT'), decideDoctorApproval);

module.exports = router;
