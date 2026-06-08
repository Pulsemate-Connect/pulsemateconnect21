const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  registerFcmToken,
  removeFcmToken,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/my', getMyNotifications);
router.post('/fcm-token', registerFcmToken);
router.delete('/fcm-token', removeFcmToken);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
