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

// All routes require authentication
router.use(authenticate);

router.get('/', getMyNotifications);
router.get('/my', getMyNotifications); // alias for older frontend builds
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/read-all', markAllNotificationsAsRead);

module.exports = router;
