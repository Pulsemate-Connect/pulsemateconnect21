'use strict';

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/sessions
 * Returns all active sessions for the authenticated user.
 */
const listSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id, isRevoked: false },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true, deviceInfo: true, ipAddress: true,
        lastUsedAt: true, createdAt: true, expiresAt: true,
      },
    });
    return sendSuccess(res, { sessions });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sessions/:sessionId
 * Revokes a specific session for the authenticated user.
 */
const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });
    if (!session) return sendError(res, 'Session not found', 404);

    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
    return sendSuccess(res, {}, 'Session revoked');
  } catch (error) {
    next(error);
  }
};

module.exports = { listSessions, revokeSession };
