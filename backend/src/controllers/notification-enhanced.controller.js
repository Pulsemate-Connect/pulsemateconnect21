/**
 * ============================================================================
 * NOTIFICATION CONTROLLER
 * ============================================================================
 * Handles notification listing, marking as read, preferences, etc.
 * ============================================================================
 */

const prisma = require('../config/database');
const logger = require('../config/logger');
const { sendNotification } = require('../services/notification-enhanced.service');

// ─── Get User Notifications (Paginated) ──────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    const where = {
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Get notifications error:', error);
    next(error);
  }
};

// ─── Mark Notification as Read ───────────────────────────────────────────────
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Mark as read error:', error);
    next(error);
  }
};

// ─── Mark All as Read ────────────────────────────────────────────────────────
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Mark all as read error:', error);
    next(error);
  }
};

// ─── Delete Notification ─────────────────────────────────────────────────────
exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Delete notification error:', error);
    next(error);
  }
};

// ─── Get Unread Count ────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Get unread count error:', error);
    next(error);
  }
};

// ─── Get Notification Preferences ────────────────────────────────────────────
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default if doesn't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Get preferences error:', error);
    next(error);
  }
};

// ─── Update Notification Preferences ─────────────────────────────────────────
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      pushEnabled,
      inAppEnabled,
      appointmentReminders,
      queueUpdates,
      prescriptionAlerts,
      paymentAlerts,
      marketingEnabled,
      quietHoursStart,
      quietHoursEnd,
    } = req.body;

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        pushEnabled,
        inAppEnabled,
        appointmentReminders,
        queueUpdates,
        prescriptionAlerts,
        paymentAlerts,
        marketingEnabled,
        quietHoursStart,
        quietHoursEnd,
      },
      create: {
        userId,
        pushEnabled,
        inAppEnabled,
        appointmentReminders,
        queueUpdates,
        prescriptionAlerts,
        paymentAlerts,
        marketingEnabled,
        quietHoursStart,
        quietHoursEnd,
      },
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences,
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Update preferences error:', error);
    next(error);
  }
};

// ─── Test Notification (For Development) ─────────────────────────────────────
exports.testNotification = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test endpoint not available in production',
      });
    }

    const userId = req.user.id;
    const { type, variables } = req.body;

    const result = await sendNotification({
      userId,
      type: type || 'APPOINTMENT_BOOKED',
      variables: variables || { doctorName: 'Dr. Test', date: '2026-07-28', time: '10:00 AM' },
      referenceType: 'TEST',
      referenceId: 'test-' + Date.now(),
    });

    res.json({
      success: true,
      message: 'Test notification sent',
      result,
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Test notification error:', error);
    next(error);
  }
};

// ─── Search Notifications ────────────────────────────────────────────────────
exports.searchNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { query, type } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(type && { type }),
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ],
      }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('[NOTIFICATION] Search notifications error:', error);
    next(error);
  }
};
