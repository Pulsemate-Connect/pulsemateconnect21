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
 * Fetch ALL sessions (enabled and disabled) for the authenticated clinic owner's clinics.
 * Returns all so the owner can edit or delete sessions regardless of enabled state.
 */
exports.getMyClinicSessions = async (req, res) => {
  try {
    const userId = req.user.id;

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

    // Return ALL sessions (no enabled filter) so owner can edit/delete any session
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
    const { sessionType, name, startTime, endTime, maxPatients = 30, enabled = true } = req.body;
    const userId = req.user.id;

    // Enhanced logging for debugging
    logger.info('[CREATE SESSION] Request received', {
      clinicId,
      userId,
      body: req.body,
    });

    // Validation
    if (!sessionType || !name || !startTime || !endTime) {
      logger.warn('[CREATE SESSION] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Session type, name, start time, and end time are required',
      });
    }

    // Validate sessionType enum
    const validSessionTypes = ['MORNING', 'AFTERNOON', 'EVENING'];
    if (!validSessionTypes.includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session type. Must be MORNING, AFTERNOON, or EVENING',
      });
    }

    // ✅ NEW: Validate time ranges based on session type
    const timeValidation = validateSessionTimeRange(sessionType, startTime, endTime);
    if (!timeValidation.valid) {
      return res.status(400).json({
        success: false,
        message: timeValidation.message,
      });
    }

    // Verify clinic ownership
    logger.info('[CREATE SESSION] Verifying clinic ownership', { clinicId, userId });
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        ownerId: userId,
      },
    });

    if (!clinic) {
      logger.warn('[CREATE SESSION] Clinic not found or permission denied', { clinicId, userId });
      return res.status(403).json({
        success: false,
        message: 'Clinic not found or you do not have permission',
      });
    }

    logger.info('[CREATE SESSION] Clinic ownership verified', { clinicName: clinic.name });

    // Check for duplicate session type (unique constraint: clinicId + sessionType)
    const existingSession = await prisma.clinicSession.findFirst({
      where: {
        clinicId,
        sessionType,
      },
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: `${sessionType.charAt(0) + sessionType.slice(1).toLowerCase()} Session already exists for this clinic`,
      });
    }

    // Auto-assign sortOrder based on session type
    const sortOrderMap = {
      MORNING: 1,
      AFTERNOON: 2,
      EVENING: 3,
    };
    const sortOrder = sortOrderMap[sessionType];

    // Check for time conflicts with other sessions
    const existingSessions = await prisma.clinicSession.findMany({
      where: {
        clinicId,
        enabled: true,
        sessionType: { not: sessionType }, // Exclude same type (already checked for duplicates)
      },
    });

    logger.info('[CREATE SESSION] Existing sessions found', { count: existingSessions.length });

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
    logger.info('[CREATE SESSION] Creating new session', {
      clinicId,
      sessionType,
      name,
      startTime,
      endTime,
      maxPatients: parseInt(maxPatients, 10),
      enabled,
      sortOrder,
    });

    const newSession = await prisma.clinicSession.create({
      data: {
        clinicId,
        sessionType,
        name,
        startTime,
        endTime,
        maxPatients: parseInt(maxPatients, 10),
        enabled,
        sortOrder,
      },
    });

    logger.info('[CREATE SESSION] Session created successfully', {
      sessionId: newSession.id,
      clinicId,
      sessionType,
      name,
      userId,
    });

    return res.status(201).json({
      success: true,
      data: { session: newSession },
      message: 'Session created successfully',
    });
  } catch (error) {
    logger.error('[CREATE SESSION] Error creating clinic session', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      userId: req.user?.id,
      clinicId: req.params?.clinicId,
      body: req.body,
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message,
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
    const { sessionType, name, startTime, endTime, maxPatients, enabled } = req.body;
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

    // If sessionType is being changed, check for duplicates
    if (sessionType && sessionType !== session.sessionType) {
      const validSessionTypes = ['MORNING', 'AFTERNOON', 'EVENING'];
      if (!validSessionTypes.includes(sessionType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session type. Must be MORNING, AFTERNOON, or EVENING',
        });
      }

      const existingSession = await prisma.clinicSession.findFirst({
        where: {
          clinicId: session.clinicId,
          sessionType,
          id: { not: sessionId },
        },
      });

      if (existingSession) {
        return res.status(400).json({
          success: false,
          message: `${sessionType.charAt(0) + sessionType.slice(1).toLowerCase()} Session already exists for this clinic`,
        });
      }
    }

    // Check for time conflicts (excluding current session)
    if (startTime && endTime) {
      // ✅ NEW: Validate time range if both times provided
      const typeToValidate = sessionType || session.sessionType;
      const timeValidation = validateSessionTimeRange(typeToValidate, startTime, endTime);
      if (!timeValidation.valid) {
        return res.status(400).json({
          success: false,
          message: timeValidation.message,
        });
      }

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
    if (sessionType !== undefined) {
      updateData.sessionType = sessionType;
      // Auto-update sortOrder based on new session type
      const sortOrderMap = { MORNING: 1, AFTERNOON: 2, EVENING: 3 };
      updateData.sortOrder = sortOrderMap[sessionType];
    }
    if (name !== undefined) updateData.name = name;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (maxPatients !== undefined) updateData.maxPatients = parseInt(maxPatients, 10);
    if (enabled !== undefined) updateData.enabled = enabled;

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
 * Hard delete a session so the owner can recreate it with correct settings.
 */
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await prisma.clinicSession.findFirst({
      where: {
        id: sessionId,
        clinic: { ownerId: userId },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or you do not have permission',
      });
    }

    // Hard delete — frees up the sessionType slot for recreation
    await prisma.clinicSession.delete({
      where: { id: sessionId },
    });

    logger.info('Clinic session deleted', { sessionId, userId });

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

/**
 * ✅ NEW: Validate session time ranges based on session type
 * Enforces standard timing:
 * - MORNING: 6:00 AM - 12:00 PM
 * - AFTERNOON: 12:00 PM - 6:00 PM  
 * - EVENING: 6:00 PM - 11:00 PM
 */
function validateSessionTimeRange(sessionType, startTime, endTime) {
  const start = convertTimeToMinutes(startTime);
  const end = convertTimeToMinutes(endTime);

  // Basic validation: end must be after start
  if (end <= start) {
    return {
      valid: false,
      message: 'End time must be after start time',
    };
  }

  // Session type specific validation
  const ranges = {
    MORNING: { min: 6 * 60, max: 12 * 60, label: '6:00 AM - 12:00 PM' },
    AFTERNOON: { min: 12 * 60, max: 18 * 60, label: '12:00 PM - 6:00 PM' },
    EVENING: { min: 18 * 60, max: 23 * 60, label: '6:00 PM - 11:00 PM' },
  };

  const range = ranges[sessionType];
  
  if (start < range.min || start >= range.max) {
    return {
      valid: false,
      message: `${sessionType} session start time must be between ${range.label}`,
    };
  }

  if (end <= range.min || end > range.max) {
    return {
      valid: false,
      message: `${sessionType} session end time must be between ${range.label}`,
    };
  }

  return { valid: true };
}
