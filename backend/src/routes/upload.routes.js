const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../services/upload.service');
const {
  uploadClinicLogo,
  uploadClinicCover,
  uploadClinicDocument,
  uploadDoctorPhoto,
  uploadDoctorDocument,
  uploadDoctorProfilePhoto,
} = require('../controllers/upload.controller');

// Clinic uploads (owner only)
router.post('/clinic-logo',
  authenticate,
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  upload.single('logo'),
  uploadClinicLogo
);

router.post('/clinic-cover',
  authenticate,
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  upload.single('cover'),
  uploadClinicCover
);

router.post('/clinic-document',
  authenticate,
  authorize('CLINIC_OWNER', 'SUPER_ADMIN'),
  upload.single('document'),
  uploadClinicDocument
);

// Doctor uploads
router.post('/doctor-photo',
  authenticate,
  authorize('DOCTOR'),
  upload.single('photo'),
  uploadDoctorPhoto
);

// Doctor document uploads (public - uses invitation token in request body)
router.post('/doctor-document',
  upload.single('document'),
  uploadDoctorDocument
);

// Doctor profile photo upload (public - uses invitation token)
router.post('/doctor-profile-photo',
  upload.single('photo'),
  uploadDoctorProfilePhoto
);

module.exports = router;
