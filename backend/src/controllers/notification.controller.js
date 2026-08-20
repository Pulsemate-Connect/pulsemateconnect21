// ═════════════════════════════════════════════════════════════════════════════
//  Notification Controller — PulseMate Connect
// ═════════════════════════════════════════════════════════════════════════════
const { sendSuccess, sendError } = require('../utils/response');
const prisma = require('../config/database');

/**
 * GET /api/notifications (also /api/notifications/my)
 * Get current user's notifications from UserNotification table (campaign-based)
 */
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const notifications = await prisma.userNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    return sendSuccess(res, { notifications });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.userNotification.count({
      where: { userId: req.user.id, isRead: false },
    });
    return sendSuccess(res, { count });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
exports.markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.userNotification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    return sendSuccess(res, {}, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all
 */
exports.markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await prisma.userNotification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return sendSuccess(res, { updated: result.count }, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};
