// ═════════════════════════════════════════════════════════════════════════════
//  Notification Controller — PulseMate Connect
// ═════════════════════════════════════════════════════════════════════════════
const { sendSuccess, sendError } = require('../utils/response');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require('../services/notification.service');

/**
 * GET /api/notifications
 * Get current user's notifications
 */
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    const notifications = await getUserNotifications(req.user.id, {
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
    });

    return sendSuccess(res, { notifications });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await getUnreadCount(req.user.id);
    return sendSuccess(res, { count });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
exports.markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await markAsRead(id, req.user.id);
    return sendSuccess(res, {}, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
exports.markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await markAllAsRead(req.user.id);
    return sendSuccess(res, { updated: result.count }, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};
