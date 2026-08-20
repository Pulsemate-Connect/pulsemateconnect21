const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  addHoliday,
  getHolidays,
  deleteHoliday,
} = require('../controllers/holiday.controller');

// Clinic owner can manage holidays
router.post('/clinic/:clinicId/holidays',
  authenticate,
  authorize(['CLINIC_OWNER', 'SUPER_ADMIN']),
  addHoliday
);

router.get('/clinic/:clinicId/holidays',
  getHolidays
);

router.delete('/clinic/:clinicId/holidays/:holidayId',
  authenticate,
  authorize(['CLINIC_OWNER', 'SUPER_ADMIN']),
  deleteHoliday
);

module.exports = router;
