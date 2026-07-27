/**
 * ============================================================================
 * SOCKET.IO NOTIFICATION SERVICE
 * ============================================================================
 * Real-time notification delivery via Socket.IO
 * ============================================================================
 */

const logger = require('../config/logger');

let io = null;

// ─── Initialize Socket.IO ────────────────────────────────────────────────────
const initSocketNotifications = (socketIoInstance) => {
  io = socketIoInstance;
  logger.info('[SOCKET-NOTIFICATION] Socket.IO notification service initialized');
};

// ─── Send Real-time Notification to User ─────────────────────────────────────
const emitNotificationToUser = (userId, notification) => {
  if (!io) {
    logger.warn('[SOCKET-NOTIFICATION] Socket.IO not initialized');
    return false;
  }

  try {
    // Emit to specific user's room
    io.to(`user:${userId}`).emit('notification:new', {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      priority: notification.priority,
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
      data: notification.data,
      createdAt: notification.createdAt,
      isRead: false,
    });

    logger.debug(`[SOCKET-NOTIFICATION] Emitted to user:${userId}`);
    return true;
  } catch (error) {
    logger.error('[SOCKET-NOTIFICATION] Emit error:', error);
    return false;
  }
};

// ─── Send Queue Update ───────────────────────────────────────────────────────
const emitQueueUpdate = (userId, queueData) => {
  if (!io) return false;

  try {
    io.to(`user:${userId}`).emit('queue:update', queueData);
    logger.debug(`[SOCKET-NOTIFICATION] Queue update emitted to user:${userId}`);
    return true;
  } catch (error) {
    logger.error('[SOCKET-NOTIFICATION] Queue update error:', error);
    return false;
  }
};

// ─── Send Appointment Status Update ──────────────────────────────────────────
const emitAppointmentUpdate = (userId, appointmentData) => {
  if (!io) return false;

  try {
    io.to(`user:${userId}`).emit('appointment:update', appointmentData);
    logger.debug(`[SOCKET-NOTIFICATION] Appointment update emitted to user:${userId}`);
    return true;
  } catch (error) {
    logger.error('[SOCKET-NOTIFICATION] Appointment update error:', error);
    return false;
  }
};

// ─── Broadcast to Multiple Users ─────────────────────────────────────────────
const emitToMultipleUsers = (userIds, event, data) => {
  if (!io) return false;

  try {
    userIds.forEach((userId) => {
      io.to(`user:${userId}`).emit(event, data);
    });
    logger.debug(`[SOCKET-NOTIFICATION] Broadcast to ${userIds.length} users: ${event}`);
    return true;
  } catch (error) {
    logger.error('[SOCKET-NOTIFICATION] Broadcast error:', error);
    return false;
  }
};

// ─── Notify Unread Count Update ──────────────────────────────────────────────
const emitUnreadCountUpdate = (userId, count) => {
  if (!io) return false;

  try {
    io.to(`user:${userId}`).emit('notification:unread-count', { count });
    logger.debug(`[SOCKET-NOTIFICATION] Unread count ${count} emitted to user:${userId}`);
    return true;
  } catch (error) {
    logger.error('[SOCKET-NOTIFICATION] Unread count error:', error);
    return false;
  }
};

module.exports = {
  initSocketNotifications,
  emitNotificationToUser,
  emitQueueUpdate,
  emitAppointmentUpdate,
  emitToMultipleUsers,
  emitUnreadCountUpdate,
};
