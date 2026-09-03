// ═════════════════════════════════════════════════════════════════════════════
//  Notification Routes — PulseMate Connect
// ═════════════════════════════════════════════════════════════════════════════
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notification.controller');
const {
  registerFcmToken,
  removeFcmToken,
  checkFcmTokens
} = require('../controllers/fcm.controller');

// All routes require authentication
router.use(authenticate);

// Notification list and read status
router.get('/', getMyNotifications);
router.get('/my', getMyNotifications); // alias for older frontend builds
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/read-all', markAllNotificationsAsRead);

// FCM token management
router.post('/fcm-token', registerFcmToken);
router.delete('/fcm-token', removeFcmToken);
router.get('/fcm-token', checkFcmTokens);

module.exports = router;
