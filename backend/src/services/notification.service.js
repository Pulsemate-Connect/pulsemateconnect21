// ═════════════════════════════════════════════════════════════════════════════
//  Notification Service — PulseMate Connect
//  ✅ Quick Win: Basic notification system foundation
// ═════════════════════════════════════════════════════════════════════════════
const prisma = require('../config/database');
const logger = require('../config/logger');
const fcmService = require('./fcm.service');

/**
 * Notification types enum (maps to Prisma schema enum)
 */
const NotificationType = {
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  BOOKING_CONFIRMED: 'APPOINTMENT_BOOKED', // Alias for compatibility
  BOOKING_CANCELLED: 'APPOINTMENT_CANCELLED', // Alias for compatibility
  BOOKING_COMPLETED: 'BOOKING_COMPLETED',
  BOOKING_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  QUEUE_CALLED: 'QUEUE_YOUR_TURN',
  QUEUE_UPDATED: 'QUEUE_UPDATE',
  QUEUE_PAUSED: 'QUEUE_UPDATE',
  QUEUE_RESUMED: 'QUEUE_UPDATE',
  DOCTOR_JOINED: 'DOCTOR_PATIENT_CHECKED_IN',
  DOCTOR_LEFTDOCTOR_LEFT: 'DOCTOR_APPOINTMENT_CANCELLED',
  RECEPTIONIST_ADDED: 'RECEPTIONIST_WALK_IN_ADDED',
  SESSION_CREATED: 'QUEUE_UPDATE',
  SESSION_CANCELLED: 'APPOINTMENT_CANCELLED',
  PAYMENT_RECEIVED: 'PAYMENT_SUCCESS',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  CLINIC_VERIFIED: 'CLINIC_VERIFIED',
  CLINIC_REJECTED: 'CLINIC_REJECTED',
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER_24H', // Will be mapped dynamically
};

/**
 * ✅ Create a notification
 * @param {Object} data - Notification data
 * @param {string} data.userId - Recipient user ID
 * @param {string} data.type - Notification type
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message (will be mapped to body)
 * @param {Object} data.metadata - Additional data (appointmentId, etc.) - will be mapped to data
 * @param {string} data.priority - LOW | MEDIUM | HIGH
 * @returns {Promise<Object>} Created notification
 */
async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {},
  priority = 'MEDIUM',
}) {
  try {
    // Map priority to schema enum (LOW->LOW, MEDIUM->NORMAL, HIGH->HIGH)
    const schemaPriority = priority === 'MEDIUM' ? 'NORMAL' : priority;
    
    // Map type to schema enum (handle aliases)
    let schemaType = type;
    if (NotificationType[type]) {
      schemaType = NotificationType[type];
    }
    
    // Special handling for reminder types
    if (type === 'APPOINTMENT_REMINDER' && metadata.reminderType) {
      schemaType = metadata.reminderType === '24h' ? 'APPOINTMENT_REMINDER_24H' : 'APPOINTMENT_REMINDER_2H';
    }
    
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: schemaType,
        title,
        body: message, // Schema uses 'body' not 'message'
        data: metadata, // Schema uses 'data' not 'metadata'
        priority: schemaPriority,
        isRead: false,
      },
    });

    logger.info('[Notification] Created', {
      id: notification.id,
      userId,
      type,
      priority,
    });

    // ✅ CRITICAL FIX: Send push notification immediately after database notification
    try {
      await fcmService.sendNotification(userId, {
        title,
        body: message,
        data: {
          notificationId: notification.id,
          type,
          ...metadata,
        },
      });
      logger.info('[Notification] Push notification sent', {
        notificationId: notification.id,
        userId,
        type,
      });
    } catch (pushError) {
      // Log error but don't throw - database notification still succeeded
      logger.error('[Notification] Push notification failed', {
        notificationId: notification.id,
        userId,
        type,
        error: pushError.message,
        stack: pushError.stack,
      });
    }

    // TODO: Send email if important (priority === 'HIGH')
    // TODO: Send SMS if critical (priority === 'HIGH' and specific types)

    return notification;
  } catch (error) {
    logger.error('[Notification] Failed to create', {
      error: error.message,
      userId,
      type,
    });
    throw error;
  }
}

/**
 * ✅ Create notification for booking confirmation
 */
async function notifyBookingConfirmed(appointment) {
  try {
    const doctorName = appointment.doctor?.user?.name || 'Doctor';
    const date = new Date(appointment.appointmentDate).toLocaleDateString('en-IN');
    const time = appointment.slotTime || 'scheduled time';

    await createNotification({
      userId: appointment.patientId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: '✅ Appointment Confirmed',
      message: `Your appointment with Dr. ${doctorName} is confirmed for ${date} at ${time}.`,
      metadata: {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        clinicId: appointment.clinicId,
        appointmentDate: appointment.appointmentDate,
        slotTime: appointment.slotTime,
      },
      priority: 'HIGH',
    });

    // Also notify clinic owner
    const clinic = await prisma.clinic.findUnique({
      where: { id: appointment.clinicId },
      select: { ownerId: true },
    });

    if (clinic) {
      await createNotification({
        userId: clinic.ownerId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: '📅 New Booking',
        message: `New appointment booked with Dr. ${doctorName} for ${date}.`,
        metadata: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
        },
        priority: 'MEDIUM',
      });
    }
  } catch (error) {
    logger.error('[Notification] Booking confirmed notification failed', error);
  }
}

/**
 * ✅ Create notification for booking cancellation
 */
async function notifyBookingCancelled(appointment) {
  try {
    const doctorName = appointment.doctor?.user?.name || 'Doctor';
    const date = new Date(appointment.appointmentDate).toLocaleDateString('en-IN');

    await createNotification({
      userId: appointment.patientId,
      type: NotificationType.BOOKING_CANCELLED,
      title: '❌ Appointment Cancelled',
      message: `Your appointment with Dr. ${doctorName} on ${date} has been cancelled.`,
      metadata: {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        clinicId: appointment.clinicId,
      },
      priority: 'HIGH',
    });

    // Notify clinic
    const clinic = await prisma.clinic.findUnique({
      where: { id: appointment.clinicId },
      select: { ownerId: true },
    });

    if (clinic) {
      await createNotification({
        userId: clinic.ownerId,
        type: NotificationType.BOOKING_CANCELLED,
        title: '🚫 Booking Cancelled',
        message: `Appointment with Dr. ${doctorName} on ${date} was cancelled.`,
        metadata: { appointmentId: appointment.id },
        priority: 'MEDIUM',
      });
    }
  } catch (error) {
    logger.error('[Notification] Booking cancelled notification failed', error);
  }
}

/**
 * ✅ Create notification for queue call
 */
async function notifyQueueCalled(queueItem) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: queueItem.appointmentId },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    if (!appointment) return;

    const doctorName = appointment.doctor?.user?.name || 'Doctor';

    await createNotification({
      userId: appointment.patientId,
      type: NotificationType.QUEUE_CALLED,
      title: '🔔 Your Turn!',
      message: `Please proceed to Dr. ${doctorName}'s consultation room. Token #${queueItem.position}`,
      metadata: {
        queueId: queueItem.id,
        appointmentId: appointment.id,
        position: queueItem.position,
      },
      priority: 'HIGH',
    });
  } catch (error) {
    logger.error('[Notification] Queue called notification failed', error);
  }
}

/**
 * ✅ Get user notifications
 */
async function getUserNotifications(userId, { limit = 20, unreadOnly = false } = {}) {
  const where = { userId };
  if (unreadOnly) where.isRead = false;

  return await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * ✅ Mark notification as read
 */
async function markAsRead(notificationId, userId) {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * ✅ Mark all notifications as read
 */
async function markAllAsRead(userId) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * ✅ Get unread count
 */
async function getUnreadCount(userId) {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * ✅ Delete old notifications (cleanup job)
 */
async function deleteOldNotifications(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isRead: true,
    },
  });

  logger.info(`[Notification] Deleted ${result.count} old notifications`);
  return result.count;
}

module.exports = {
  NotificationType,
  createNotification,
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyQueueCalled,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteOldNotifications,
};
