/**
 * Test Notification Routes — PulseMate Connect
 * FOR DEVELOPMENT/TESTING ONLY
 * 
 * Endpoints to test push notification delivery
 */
const express = require('express');
const { authenticateUser } = require('../middleware/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');
const fcmService = require('../services/fcm.service');
const prisma = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

/**
 * POST /api/notifications/test
 * Send a test push notification to the authenticated user's devices
 */
router.post('/test', authenticateUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check if user has any FCM tokens registered
    const tokens = await prisma.fcmToken.findMany({
      where: { userId },
      select: { token: true, platform: true, createdAt: true },
    });

    if (tokens.length === 0) {
      return sendError(res, 'No FCM tokens registered for this user. Please ensure the mobile app has registered a device token.', 404);
    }

    logger.info('[NotificationTest] Sending test notification', {
      userId,
      tokenCount: tokens.length,
      platforms: tokens.map(t => t.platform),
    });

    // Send test notification via FCM service
    try {
      await fcmService.sendNotification(userId, {
        title: '🔔 Test Notification',
        body: `This is a test notification sent at ${new Date().toLocaleTimeString('en-IN')}`,
        data: {
          type: 'TEST',
          timestamp: new Date().toISOString(),
          source: 'test_endpoint',
        },
      });

      logger.info('[NotificationTest] Test notification sent successfully', {
        userId,
        tokenCount: tokens.length,
      });

      return sendSuccess(res, {
        tokenCount: tokens.length,
        tokens: tokens.map(t => ({
          platform: t.platform,
          registeredAt: t.createdAt,
          tokenPreview: `${t.token.substring(0, 20)}...`,
        })),
      }, 'Test notification sent successfully');
    } catch (fcmError) {
      logger.error('[NotificationTest] FCM send failed', {
        userId,
        error: fcmError.message,
        stack: fcmError.stack,
      });

      return sendError(res, `FCM send failed: ${fcmError.message}. Check if FIREBASE_SERVICE_ACCOUNT_JSON is configured.`, 500);
    }
  } catch (error) {
    logger.error('[NotificationTest] Test notification failed', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
});

/**
 * GET /api/notifications/tokens
 * Get all FCM tokens for the authenticated user
 */
router.get('/tokens', authenticateUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const tokens = await prisma.fcmToken.findMany({
      where: { userId },
      select: {
        id: true,
        token: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, {
      count: tokens.length,
      tokens: tokens.map(t => ({
        id: t.id,
        platform: t.platform,
        registeredAt: t.createdAt,
        lastUpdated: t.updatedAt,
        tokenPreview: `${t.token.substring(0, 30)}...${t.token.substring(t.token.length - 10)}`,
      })),
    }, `Found ${tokens.length} registered device(s)`);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/firebase-status
 * Check Firebase Admin SDK configuration status
 */
router.get('/firebase-status', authenticateUser, async (req, res, next) => {
  try {
    const hasFirebaseEnv = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    let firebaseInitialized = false;
    let firebaseError = null;
    
    if (hasFirebaseEnv) {
      try {
        const admin = require('firebase-admin');
        firebaseInitialized = admin.apps.length > 0;
      } catch (err) {
        firebaseError = err.message;
      }
    }

    return sendSuccess(res, {
      configured: hasFirebaseEnv,
      initialized: firebaseInitialized,
      error: firebaseError,
      mode: hasFirebaseEnv ? 'PRODUCTION' : 'DEVELOPMENT (Logs only)',
    }, 'Firebase status retrieved');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
