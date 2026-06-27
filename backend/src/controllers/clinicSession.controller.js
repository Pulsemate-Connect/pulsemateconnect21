// ─────────────────────────────────────────────────────────────────────────────
//  Clinic Session Controller — PulseMate Connect
//  Handles CRUD operations for clinic sessions (Morning, Evening, etc.)
// ─────────────────────────────────────────────────────────────────────────────
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

/**
 * GET /api/clinics/:clinicId/sessions
 * Fetch all sessions for a specific clinic (public route)
 */
exports.getClinicSessions = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const sessions = await prisma.clinicSession.findMany({
      where: {
        clinicId,
        enabled: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return res.json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    logger.error('Error fetching clinic sessions', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch clinic sessions',
    });
  }
};

/**
 * GET /api/clinic/my-sessions
 * Fetch sessions for the authenticated clinic owner's clinics
 */
exports.getMyClinicSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's clinics
    const clinics = await prisma.clinic.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (clinics.length === 0) {
      return res.json({
        success: true,
        data: { sessions: [] },
        message: 'No clinics found',
      });
    }

    const clinicIds = clinics.map(c => c.id);

    // Get all sessions for user's clinics
    const sessions = await prisma.clinicSession.findMany({
      where: {
        clinicId: { in: clinicIds },
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { clinicId: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    return res.json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    logger.error('Error fetching my clinic sessions', { error: error.message, stack: error.stack, userId: req.user?.id });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your clinic sessions',
    });
  }
};

/**
 * POST /api/clinic/:clinicId/sessions
 * Create a new session for a clinic (clinic owner only)
 */
exports.createSession = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { name, startTime, endTime, maxPatients = 30, enabled = true, sortOrder = 0 } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Session name, start time, and end time are required',
      });
    }

    // Verify clinic ownership
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        ownerId: userId,
      },
    });

    if (!clinic) {
      return res.status(403).json({
        success: false,
        message: 'Clinic not found or you do not have permission',
      });
    }

    // Check for time conflicts
    const existingSessions = await prisma.clinicSession.findMany({
      where: {
        clinicId,
        enabled: true,
      },
    });

    const newStart = convertTimeToMinutes(startTime);
    const newEnd = convertTimeToMinutes(endTime);

    for (const session of existingSessions) {
      const sessStart = convertTimeToMinutes(session.startTime);
      const sessEnd = convertTimeToMinutes(session.endTime);
      
      if (
        (newStart >= sessStart && newStart < sessEnd) ||
        (newEnd > sessStart && newEnd <= sessEnd) ||
        (newStart <= sessStart && newEnd >= sessEnd)
      ) {
        return res.status(400).json({
          success: false,
          message: `Time conflict with existing session: ${session.name} (${session.startTime} - ${session.endTime})`,
        });
      }
    }

    // Create session
    const newSession = await prisma.clinicSession.create({
      data: {
        clinicId,
        name,
        startTime,
        endTime,
        maxPatients: parseInt(maxPatients, 10),
        enabled,
        sortOrder: parseInt(sortOrder, 10),
      },
    });

    logger.info('Clinic session created', {
      sessionId: newSession.id,
      clinicId,
      name,
      userId,
    });

    return res.status(201).json({
      success: true,
      data: { session: newSession },
      message: 'Session created successfully',
    });
  } catch (error) {
    logger.error('Error creating clinic session', { error: error.message, stack: error.stack, userId: req.user?.id });
    return res.status(500).json({
      success: false,
      message: 'Failed to create session',
    });
  }
};

/**
 * PUT /api/clinic/sessions/:sessionId
 * Update an existing session
 */
exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, startTime, endTime, maxPatients, enabled, sortOrder } = req.body;
    const userId = req.user.id;

    // Fetch the session with clinic ownership check
    const session = await prisma.clinicSession.findFirst({
      where: {
        id: sessionId,
        clinic: {
          ownerId: userId,
        },
      },
      include: {
        clinic: {
          select: { id: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or you do not have permission',
      });
    }

    // Check for time conflicts (excluding current session)
    if (startTime && endTime) {
      const existingSessions = await prisma.clinicSession.findMany({
        where: {
          clinicId: session.clinicId,
          enabled: true,
          id: { not: sessionId },
        },
      });

      const newStart = convertTimeToMinutes(startTime);
      const newEnd = convertTimeToMinutes(endTime);

      for (const sess of existingSessions) {
        const sessStart = convertTimeToMinutes(sess.startTime);
        const sessEnd = convertTimeToMinutes(sess.endTime);
        
        if (
          (newStart >= sessStart && newStart < sessEnd) ||
          (newEnd > sessStart && newEnd <= sessEnd) ||
          (newStart <= sessStart && newEnd >= sessEnd)
        ) {
          return res.status(400).json({
            success: false,
            message: `Time conflict with existing session: ${sess.name} (${sess.startTime} - ${sess.endTime})`,
          });
        }
      }
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (maxPatients !== undefined) updateData.maxPatients = parseInt(maxPatients, 10);
    if (enabled !== undefined) updateData.enabled = enabled;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10);

    const updatedSession = await prisma.clinicSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    logger.info('Clinic session updated', {
      sessionId,
      updates: Object.keys(updateData),
      userId,
    });

    return res.json({
      success: true,
      data: { session: updatedSession },
      message: 'Session updated successfully',
    });
  } catch (error) {
    logger.error('Error updating clinic session', { error: error.message, stack: error.stack, sessionId: req.params.sessionId });
    return res.status(500).json({
      success: false,
      message: 'Failed to update session',
    });
  }
};

/**
 * DELETE /api/clinic/sessions/:sessionId
 * Delete a session (soft delete by setting enabled = false)
 */
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Fetch the session with clinic ownership check
    const session = await prisma.clinicSession.findFirst({
      where: {
        id: sessionId,
        clinic: {
          ownerId: userId,
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or you do not have permission',
      });
    }

    // Soft delete (set enabled = false)
    await prisma.clinicSession.update({
      where: { id: sessionId },
      data: { enabled: false },
    });

    logger.info('Clinic session deleted (soft)', {
      sessionId,
      userId,
    });

    return res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting clinic session', { error: error.message, stack: error.stack, sessionId: req.params.sessionId });
    return res.status(500).json({
      success: false,
      message: 'Failed to delete session',
    });
  }
};

// ─── Helper Functions ──────────────────────────────────────────────────────────
/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function convertTimeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}
