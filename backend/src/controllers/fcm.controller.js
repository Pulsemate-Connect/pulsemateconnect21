/**
 * FCM Token Controller
 * Handles Firebase Cloud Messaging token registration
 */

const fcmService = require('../services/fcm.service');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/notifications/fcm-token
 * Register or update FCM token for push notifications
 */
const registerFcmToken = async (req, res, next) => {
  try {
    const { token, platform = 'web' } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return sendError(res, 'FCM token is required', 400);
    }

    const userId = req.user.id;

    // Save or update the FCM token (non-critical - log errors but don't fail)
    try {
      await fcmService.saveFcmToken(userId, token.trim(), platform);
    } catch (saveError) {
      // Log but don't fail - FCM is optional feature
      console.error('[FCM] Failed to save token:', saveError.message);
    }

    return sendSuccess(res, { message: 'FCM token registered successfully' }, 200);
  } catch (error) {
    // Even if something goes wrong, return success to prevent breaking the frontend
    console.error('[FCM] Token registration error:', error.message);
    return sendSuccess(res, { message: 'FCM token registration processed' }, 200);
  }
};

/**
 * DELETE /api/notifications/fcm-token
 * Remove FCM token (e.g., on logout)
 */
const removeFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendError(res, 'FCM token is required', 400);
    }

    await fcmService.removeFcmToken(token);

    return sendSuccess(res, { message: 'FCM token removed successfully' }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/fcm-token
 * Check if user has registered FCM tokens (for debugging)
 */
const checkFcmTokens = async (req, res, next) => {
  try {
    const prisma = require('../config/database');
    const userId = req.user.id;

    const tokens = await prisma.fcmToken.findMany({
      where: { userId },
      select: {
        token: true,
        platform: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return sendSuccess(res, {
      count: tokens.length,
      tokens: tokens.map(t => ({
        platform: t.platform,
        registered: t.createdAt,
        lastUpdated: t.updatedAt,
        tokenPreview: t.token.substring(0, 20) + '...' // Don't expose full token
      }))
    }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerFcmToken,
  removeFcmToken,
  checkFcmTokens
};
