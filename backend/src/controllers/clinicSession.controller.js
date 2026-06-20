'use strict';

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// ── Helper: verify clinic belongs to authenticated owner ───────────────────────
const getOwnedClinic = async (clinicId, userId) => {
  const clinic = await prisma.clinic.findFirst({
    where: { id: clinicId, ownerId: userId },
    select: { id: true },
  });
  return clinic;
};

/**
 * GET /clinics/:clinicId/sessions
 * Public — patients fetch active sessions for booking.
 * Clinic owner fetches all (including inactive).
 */
const getSessions = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const isOwner = req.user?.id &&
      await prisma.clinic.count({ where: { id: clinicId, ownerId: req.user.id } }) > 0;

    const sessions = await prisma.clinicSession.findMany({
      where: { clinicId, ...(isOwner ? {} : { isActive: true }) },
      orderBy: { startTime: 'asc' },
    });

    return sendSuccess(res, { sessions });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /clinics/:clinicId/sessions
 * Clinic owner creates a new session.
 */
const createSession = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { sessionName, startTime, endTime, maxAppointments, isActive } = req.body;

    if (!sessionName || !startTime || !endTime) {
      return sendError(res, 'sessionName, startTime and endTime are required', 400);
    }

    const clinic = await getOwnedClinic(clinicId, req.user.id);
    if (!clinic) return sendError(res, 'Clinic not found or not yours', 404);

    const session = await prisma.clinicSession.create({
      data: {
        clinicId,
        sessionName: sessionName.trim(),
        startTime,
        endTime,
        maxAppointments: maxAppointments ?? 20,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return sendSuccess(res, { session }, 'Session created', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /sessions/:sessionId
 * Clinic owner updates a session.
 */
const updateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { sessionName, startTime, endTime, maxAppointments, isActive } = req.body;

    const existing = await prisma.clinicSession.findUnique({
      where: { id: sessionId },
      include: { clinic: { select: { ownerId: true } } },
    });
    if (!existing) return sendError(res, 'Session not found', 404);
    if (existing.clinic.ownerId !== req.user.id) return sendError(res, 'Forbidden', 403);

    const session = await prisma.clinicSession.update({
      where: { id: sessionId },
      data: {
        ...(sessionName !== undefined && { sessionName: sessionName.trim() }),
        ...(startTime   !== undefined && { startTime }),
        ...(endTime     !== undefined && { endTime }),
        ...(maxAppointments !== undefined && { maxAppointments }),
        ...(isActive    !== undefined && { isActive }),
      },
    });

    return sendSuccess(res, { session }, 'Session updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /sessions/:sessionId
 * Clinic owner deletes a session.
 */
const deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const existing = await prisma.clinicSession.findUnique({
      where: { id: sessionId },
      include: { clinic: { select: { ownerId: true } } },
    });
    if (!existing) return sendError(res, 'Session not found', 404);
    if (existing.clinic.ownerId !== req.user.id) return sendError(res, 'Forbidden', 403);

    await prisma.clinicSession.delete({ where: { id: sessionId } });
    return sendSuccess(res, {}, 'Session deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { getSessions, createSession, updateSession, deleteSession };
