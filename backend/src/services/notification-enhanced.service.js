/**
 * =============================================================================
 * ENHANCED NOTIFICATION SERVICE - Production Ready
 * =============================================================================
 * Complete notification system with:
 * - Push notifications (FCM)
 * - In-app notifications
 * - Smart scheduling
 * - Delivery tracking
 * - Retry mechanism
 * - Template support
 * - User preferences
 * - Quiet hours
 * - Priority handling
 * =============================================================================
 */

const prisma = require('../config/database');
const logger = require('../config/logger');
const { isFirebaseReady } = require('../config/firebase');
const {
  emitNotificationToUser,
  emitUnreadCountUpdate,
} = require('./socket-notification.service');

// ─── Template Rendering ──────────────────────────────────────────────────────
const renderTemplate = (template, variables) => {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return rendered;
};

// ─── Check User Preferences & Quiet Hours ────────────────────────────────────
const canSendNotification = async (userId, notificationType) => {
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!prefs) return true; // Default: allow all

  // Check if notification type is enabled
  const typeMap = {
    APPOINTMENT_REMINDER_24H: 'appointmentReminders',
    APPOINTMENT_REMINDER_2H: 'appointmentReminders',
    APPOINTMENT_REMINDER_30M: 'appointmentReminders',
    QUEUE_UPDATE: 'queueUpdates',
    QUEUE_ALMOST_YOUR_TURN: 'queueUpdates',
    QUEUE_YOUR_TURN: 'queueUpdates',
    PRESCRIPTION_READY: 'prescriptionAlerts',
    PAYMENT_SUCCESS: 'paymentAlerts',
  };

  const prefKey = typeMap[notificationType];
  if (prefKey && !prefs[prefKey]) return false;

  // Check quiet hours
  if (prefs.quietHoursStart && prefs.quietHoursEnd) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (currentTime >= prefs.quietHoursStart && currentTime <= prefs.quietHoursEnd) {
      // During quiet hours - only send URGENT notifications
      const urgentTypes = ['QUEUE_YOUR_TURN', 'APPOINTMENT_REMINDER_30M'];
      return urgentTypes.includes(notificationType);
    }
  }

  return prefs.pushEnabled || prefs.inAppEnabled;
};

// ─── Get FCM Tokens for User ─────────────────────────────────────────────────
const getUserTokens = async (userId) => {
  const tokens = await prisma.fcmToken.findMany({
    where: { userId },
    select: { token: true, platform: true },
  });
  return tokens;
};

// ─── Send Push Notification via FCM ──────────────────────────────────────────
const sendPushToDevice = async (token, title, body, data = {}, priority = 'NORMAL') => {
  if (!isFirebaseReady()) {
    logger.warn(`[PUSH-MOCK] Token: ${token.substring(0, 20)}... | Title: ${title}`);
    return { success: false, reason: 'firebase_not_configured' };
  }

  try {
    const admin = require('firebase-admin');
    
    // Convert all data values to strings (FCM requirement)
    const stringData = {};
    for (const [k, v] of Object.entries(data)) {
      stringData[k] = String(v);
    }

    const message = {
      token: token,
      notification: { title, body },
      data: stringData,
      android: {
        priority: priority === 'URGENT' ? 'high' : 'normal',
        notification: {
          sound: 'default',
          channelId: 'default',
          priority: priority === 'URGENT' ? 'max' : 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const result = await admin.messaging().send(message);
    logger.info(`[PUSH] Sent successfully: ${result}`);
    return { success: true, messageId: result };
  } catch (error) {
    logger.error(`[PUSH] Failed for token ${token.substring(0, 20)}...:`, error.message);

    // Clean up invalid tokens
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      await prisma.fcmToken.deleteMany({ where: { token } }).catch(() => {});
    }

    return { success: false, error: error.message };
  }
};

// ─── Create Notification Record ──────────────────────────────────────────────
const createNotification = async ({
  userId,
  title,
  body,
  type,
  referenceType = null,
  referenceId = null,
  priority = 'NORMAL',
  data = {},
  scheduledFor = null,
}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        referenceType,
        referenceId,
        priority,
        data,
        scheduledFor,
        deliveryStatus: scheduledFor ? 'PENDING' : 'PENDING',
      },
    });

    logger.info(`[NOTIFICATION] Created: ${notification.id} for user ${userId}`);
    return notification;
  } catch (error) {
    logger.error('[NOTIFICATION] Create failed:', error);
    throw error;
  }
};

// ─── Send Notification (Complete Flow) ───────────────────────────────────────
const sendNotification = async ({
  userId,
  type,
  variables = {},
  referenceType = null,
  referenceId = null,
  scheduledFor = null,
  skipPreferences = false,
}) => {
  try {
    // Check if user wants this notification
    if (!skipPreferences) {
      const allowed = await canSendNotification(userId, type);
      if (!allowed) {
        logger.info(`[NOTIFICATION] Skipped (preferences): ${type} for user ${userId}`);
        return { success: false, reason: 'user_preferences' };
      }
    }

    // Get template
    const template = await prisma.notificationTemplate.findUnique({
      where: { type },
    });

    if (!template || !template.isActive) {
      logger.warn(`[NOTIFICATION] Template not found or inactive: ${type}`);
      return { success: false, reason: 'template_not_found' };
    }

    // Render title and body
    const title = renderTemplate(template.titleTemplate, variables);
    const body = renderTemplate(template.bodyTemplate, variables);
    const priority = template.defaultPriority;

    // Create notification record
    const notification = await createNotification({
      userId,
      title,
      body,
      type,
      referenceType,
      referenceId,
      priority,
      data: { ...variables, icon: template.icon },
      scheduledFor,
    });

    // If scheduled, don't send now
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      logger.info(`[NOTIFICATION] Scheduled for ${scheduledFor}: ${notification.id}`);
      return { success: true, notification, scheduled: true };
    }

    // Send push notifications to all devices
    const tokens = await getUserTokens(userId);
    const results = await Promise.allSettled(
      tokens.map((t) => sendPushToDevice(t.token, title, body, {
        notificationId: notification.id,
        type,
        referenceType,
        referenceId,
        ...variables,
      }, priority))
    );

    // Log delivery attempts
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const token = tokens[i];
      
      await prisma.notificationDeliveryLog.create({
        data: {
          notificationId: notification.id,
          attemptNumber: 1,
          deliveryChannel: 'PUSH',
          status: result.status === 'fulfilled' && result.value.success ? 'DELIVERED' : 'FAILED',
          fcmMessageId: result.status === 'fulfilled' ? result.value.messageId : null,
          errorMessage: result.status === 'rejected' ? result.reason : (result.value?.error || null),
          deviceToken: token.token.substring(0, 50),
        },
      });
    }

    // Update notification status
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        sentAt: new Date(),
        deliveryStatus: successCount > 0 ? 'SENT' : 'FAILED',
      },
    });

    logger.info(`[NOTIFICATION] Sent ${successCount}/${tokens.length} push notifications for ${notification.id}`);
    
    // Send real-time notification via Socket.IO
    emitNotificationToUser(userId, notification);
    
    // Update unread count
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    emitUnreadCountUpdate(userId, unreadCount);
    
    return { success: true, notification, deliveredCount: successCount, totalDevices: tokens.length };
  } catch (error) {
    logger.error('[NOTIFICATION] Send failed:', error);
    return { success: false, error: error.message };
  }
};

// ─── Schedule Appointment Reminders ──────────────────────────────────────────
const scheduleAppointmentReminders = async (appointment) => {
  const { id, patientId, appointmentDate, slotTime, doctor } = appointment;
  const appointmentDateTime = new Date(appointmentDate);

  // Extract doctor name
  const doctorName = doctor?.user?.name || 'your doctor';

  const reminders = [
    {
      type: 'APPOINTMENT_REMINDER_24H',
      offsetHours: 24,
    },
    {
      type: 'APPOINTMENT_REMINDER_2H',
      offsetHours: 2,
    },
    {
      type: 'APPOINTMENT_REMINDER_30M',
      offsetMinutes: 30,
    },
  ];

  for (const reminder of reminders) {
    const scheduledFor = new Date(appointmentDateTime);
    if (reminder.offsetHours) {
      scheduledFor.setHours(scheduledFor.getHours() - reminder.offsetHours);
    } else if (reminder.offsetMinutes) {
      scheduledFor.setMinutes(scheduledFor.getMinutes() - reminder.offsetMinutes);
    }

    // Only schedule if in the future
    if (scheduledFor > new Date()) {
      await prisma.scheduledNotification.upsert({
        where: {
          appointmentId_reminderType: {
            appointmentId: id,
            reminderType: reminder.type,
          },
        },
        update: {
          scheduledFor,
          status: 'PENDING',
        },
        create: {
          appointmentId: id,
          reminderType: reminder.type,
          scheduledFor,
        },
      });

      logger.info(`[SCHEDULED] ${reminder.type} for appointment ${id} at ${scheduledFor}`);
    }
  }
};

// ─── Process Scheduled Notifications (Cron Job) ──────────────────────────────
const processScheduledNotifications = async () => {
  try {
    const now = new Date();
    
    // Get due scheduled notifications
    const dueNotifications = await prisma.scheduledNotification.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: now },
      },
      include: {
        appointment: {
          include: {
            doctor: { include: { user: true } },
            patient: true,
          },
        },
      },
      take: 100,
    });

    logger.info(`[SCHEDULER] Processing ${dueNotifications.length} due notifications`);

    for (const scheduled of dueNotifications) {
      const { appointment, reminderType } = scheduled;
      
      // Skip if appointment is cancelled or completed
      if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
        await prisma.scheduledNotification.update({
          where: { id: scheduled.id },
          data: { status: 'CANCELLED' },
        });
        continue;
      }

      const doctorName = appointment.doctor?.user?.name || 'your doctor';
      const time = appointment.slotTime || new Date(appointment.appointmentDate).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Send notification
      const result = await sendNotification({
        userId: appointment.patientId,
        type: reminderType,
        variables: {
          doctorName,
          time,
          date: new Date(appointment.appointmentDate).toLocaleDateString('en-IN'),
        },
        referenceType: 'APPOINTMENT',
        referenceId: appointment.id,
      });

      // Update scheduled notification
      await prisma.scheduledNotification.update({
        where: { id: scheduled.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          sentAt: new Date(),
          notificationId: result.notification?.id,
        },
      });
    }

    logger.info(`[SCHEDULER] Completed processing scheduled notifications`);
  } catch (error) {
    logger.error('[SCHEDULER] Error processing notifications:', error);
  }
};

// ─── Retry Failed Notifications ──────────────────────────────────────────────
const retryFailedNotifications = async () => {
  try {
    const failedNotifications = await prisma.notification.findMany({
      where: {
        deliveryStatus: 'FAILED',
        retryCount: { lt: prisma.notification.fields.maxRetries },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
      include: { user: { include: { fcmTokens: true } } },
      take: 50,
    });

    logger.info(`[RETRY] Processing ${failedNotifications.length} failed notifications`);

    for (const notification of failedNotifications) {
      const tokens = notification.user.fcmTokens;
      
      if (tokens.length === 0) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { deliveryStatus: 'EXPIRED' },
        });
        continue;
      }

      const results = await Promise.allSettled(
        tokens.map((t) => sendPushToDevice(
          t.token,
          notification.title,
          notification.body,
          notification.data || {},
          notification.priority
        ))
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          retryCount: { increment: 1 },
          deliveryStatus: successCount > 0 ? 'SENT' : 'FAILED',
        },
      });
    }
  } catch (error) {
    logger.error('[RETRY] Error retrying notifications:', error);
  }
};

// ─── Convenience Functions for Specific Notification Types ───────────────────

const notifyAppointmentBooked = async (appointment) => {
  const doctorName = appointment.doctor?.user?.name || 'your doctor';
  const date = new Date(appointment.appointmentDate).toLocaleDateString('en-IN');
  const time = appointment.slotTime || 'TBD';

  await sendNotification({
    userId: appointment.patientId,
    type: 'APPOINTMENT_BOOKED',
    variables: { doctorName, date, time },
    referenceType: 'APPOINTMENT',
    referenceId: appointment.id,
  });

  // Schedule reminders
  await scheduleAppointmentReminders(appointment);
};

const notifyQueueUpdate = async (userId, patientsAhead, waitTime, appointmentId) => {
  await sendNotification({
    userId,
    type: 'QUEUE_UPDATE',
    variables: { patientsAhead: String(patientsAhead), waitTime: String(waitTime) },
    referenceType: 'APPOINTMENT',
    referenceId: appointmentId,
  });
};

const notifyYourTurn = async (userId, doctorName, appointmentId) => {
  await sendNotification({
    userId,
    type: 'QUEUE_YOUR_TURN',
    variables: { doctorName },
    referenceType: 'APPOINTMENT',
    referenceId: appointmentId,
    skipPreferences: true, // Always send this critical notification
  });
};

const notifyAlmostYourTurn = async (userId, doctorName, appointmentId) => {
  await sendNotification({
    userId,
    type: 'QUEUE_ALMOST_YOUR_TURN',
    variables: { doctorName },
    referenceType: 'APPOINTMENT',
    referenceId: appointmentId,
  });
};

const notifyPaymentSuccess = async (userId, amount, appointmentId) => {
  await sendNotification({
    userId,
    type: 'PAYMENT_SUCCESS',
    variables: { amount: String(amount) },
    referenceType: 'PAYMENT',
    referenceId: appointmentId,
  });
};

const notifyPrescriptionReady = async (userId, doctorName, appointmentId) => {
  await sendNotification({
    userId,
    type: 'PRESCRIPTION_READY',
    variables: { doctorName },
    referenceType: 'PRESCRIPTION',
    referenceId: appointmentId,
  });
};

const notifyAppointmentCancelled = async (userId, doctorName, date, appointmentId) => {
  await sendNotification({
    userId,
    type: 'APPOINTMENT_CANCELLED',
    variables: { doctorName, date },
    referenceType: 'APPOINTMENT',
    referenceId: appointmentId,
  });
};

const notifyDoctorNewAppointment = async (doctorUserId, patientName, date, time, appointmentId) => {
  await sendNotification({
    userId: doctorUserId,
    type: 'DOCTOR_NEW_APPOINTMENT',
    variables: { patientName, date, time },
    referenceType: 'APPOINTMENT',
    referenceId: appointmentId,
  });
};

module.exports = {
  sendNotification,
  createNotification,
  scheduleAppointmentReminders,
  processScheduledNotifications,
  retryFailedNotifications,
  canSendNotification,
  
  // Convenience functions
  notifyAppointmentBooked,
  notifyQueueUpdate,
  notifyYourTurn,
  notifyAlmostYourTurn,
  notifyPaymentSuccess,
  notifyPrescriptionReady,
  notifyAppointmentCancelled,
  notifyDoctorNewAppointment,
};
