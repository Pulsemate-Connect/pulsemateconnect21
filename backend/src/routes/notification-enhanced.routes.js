/**
 * ============================================================================
 * NOTIFICATION ROUTES
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification-enhanced.controller');

// ── All routes require authentication ────────────────────────────────────────
router.use(protect);

// ── Notification Management ──────────────────────────────────────────────────
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/search', notificationController.searchNotifications);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

// ── Preferences ──────────────────────────────────────────────────────────────
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', notificationController.updatePreferences);

// ── Test (Development Only) ──────────────────────────────────────────────────
router.post('/test', notificationController.testNotification);

module.exports = router;
