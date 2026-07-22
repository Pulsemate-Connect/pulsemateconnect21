/**
 * PulseMate — Follow-Up Controller
 * Handles all follow-up CRUD and settings operations.
 * Roles: CLINIC_OWNER, DOCTOR, RECEPTIONIST, SUPER_ADMIN
 */
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const {
  getClinicFollowUpSettings,
  updateClinicFollowUpSettings,
  createFollowUp,
  updateFollowUp,
  cancelFollowUp,
  listClinicFollowUps,
  getPatientFollowUps,
  refreshFollowUpStatuses,
} = require('../services/followupManager.service');

// ─── Helper: resolve clinic for the current user ──────────────────────────────
const resolveClinicId = async (req, paramClinicId = null) => {
  if (paramClinicId) return paramClinicId;
  if (req.user.role === 'RECEPTIONIST') {
    return req.user.receptionistProfile?.assignedClinicId || null;
  }
  if (req.user.role === 'CLINIC_OWNER') {
    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return clinic?.id || null;
  }
  if (req.user.role === 'DOCTOR') {
    // Doctor resolves clinic from query or their primary clinic
    const dc = await prisma.doctorClinic.findFirst({
      where: {
        doctor: { userId: req.user.id },
        isActive: true,
      },
      select: { clinicId: true },
    });
    return dc?.clinicId || null;
  }
  return null;
};

// ─── CLINIC SETTINGS ─────────────────────────────────────────────────────────

/**
 * GET /api/follow-ups/clinic-settings?clinicId=
 * CLINIC_OWNER, DOCTOR (their clinic), RECEPTIONIST, SUPER_ADMIN
 */
const getSettings = async (req, res, next) => {
  try {
    const clinicId = req.query.clinicId || await resolveClinicId(req);
    if (!clinicId) return sendError(res, 'clinicId required', 400);

    // Authorization: must belong to this clinic
    if (req.user.role !== 'SUPER_ADMIN') {
      const access = await checkClinicAccess(req.user, clinicId);
      if (!access) return sendError(res, 'Access denied', 403);
    }

    const settings = await getClinicFollowUpSettings(clinicId);
    return sendSuccess(res, { settings });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/follow-ups/clinic-settings
 * CLINIC_OWNER, SUPER_ADMIN only
 */
const updateSettings = async (req, res, next) => {
  try {
    const clinicId = req.body.clinicId || await resolveClinicId(req);
    if (!clinicId) return sendError(res, 'clinicId required', 400);

    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!clinic) return sendError(res, 'Access denied — Clinic Owner only', 403);
    }

    const settings = await updateClinicFollowUpSettings(clinicId, req.body);
    return sendSuccess(res, { settings }, 'Follow-up settings updated');
  } catch (error) { next(error); }
};

// ─── CREATE FOLLOW-UP ─────────────────────────────────────────────────────────

/**
 * POST /api/follow-ups
 * CLINIC_OWNER, DOCTOR, RECEPTIONIST
 * Body: { clinicId?, doctorId, originalVisitId, followUpDays, note? }
 */
const create = async (req, res, next) => {
  try {
    const { originalVisitId, followUpDays, note } = req.body;
    let { clinicId, doctorId } = req.body;

    // Resolve clinic
    if (!clinicId) clinicId = await resolveClinicId(req);
    if (!clinicId) return sendError(res, 'clinicId required', 400);

    // Resolve doctorId for doctor role
    if (req.user.role === 'DOCTOR' && !doctorId) {
      const dp = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      doctorId = dp?.id;
    }
    if (!doctorId) return sendError(res, 'doctorId required', 400);
    if (!originalVisitId) return sendError(res, 'originalVisitId required', 400);

    // Auth: user must belong to this clinic
    if (req.user.role !== 'SUPER_ADMIN') {
      const access = await checkClinicAccess(req.user, clinicId);
      if (!access) return sendError(res, 'Access denied', 403);
    }

    const followUp = await createFollowUp({
      clinicId, doctorId, originalVisitId,
      followUpDays, note,
      createdByUserId: req.user.id,
      createdByRole: req.user.role,
    });

    return sendSuccess(res, { followUp }, 'Follow-up created successfully', 201);
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
};

// ─── LIST FOLLOW-UPS ─────────────────────────────────────────────────────────

/**
 * GET /api/follow-ups
 * CLINIC_OWNER, DOCTOR, RECEPTIONIST — all see clinic's follow-ups
 * Query: clinicId?, status?, patientId?, doctorId?, page?, limit?, dateFrom?, dateTo?
 */
const list = async (req, res, next) => {
  try {
    let { clinicId, status, patientId, doctorId, page, limit, dateFrom, dateTo } = req.query;
    if (!clinicId) clinicId = await resolveClinicId(req);
    if (!clinicId) return sendError(res, 'clinicId required', 400);

    if (req.user.role !== 'SUPER_ADMIN') {
      const access = await checkClinicAccess(req.user, clinicId);
      if (!access) return sendError(res, 'Access denied', 403);
    }

    // Refresh statuses on list (lightweight)
    await refreshFollowUpStatuses(clinicId).catch(() => { });

    // Doctors only see their own patients' follow-ups
    if (req.user.role === 'DOCTOR' && !doctorId) {
      const dp = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      doctorId = dp?.id;
    }

    const result = await listClinicFollowUps(clinicId, { status, patientId, doctorId, page, limit, dateFrom, dateTo });
    return sendSuccess(res, result);
  } catch (error) { next(error); }
};

/**
 * GET /api/follow-ups/:id
 */
const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const followUp = await prisma.followUp.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, mobile: true } },
        doctor: { include: { user: { select: { id: true, name: true } } } },
        clinic: { select: { id: true, name: true } },
        originalVisit: { select: { id: true, appointmentDate: true, symptoms: true, notes: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        updatedBy: { select: { id: true, name: true, role: true } },
        cancelledBy: { select: { id: true, name: true, role: true } },
        bookedAppointment: { select: { id: true, appointmentDate: true, status: true } },
      },
    });

    if (!followUp) return sendError(res, 'Follow-up not found', 404);

    // Access check
    if (req.user.role !== 'SUPER_ADMIN') {
      const access = await checkClinicAccess(req.user, followUp.clinicId);
      if (!access) return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, { followUp });
  } catch (error) { next(error); }
};

// ─── UPDATE FOLLOW-UP ─────────────────────────────────────────────────────────

/**
 * PATCH /api/follow-ups/:id
 * Body: { followUpDays?, note? }
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { followUpDays, note } = req.body;

    const existing = await prisma.followUp.findUnique({ where: { id }, select: { clinicId: true } });
    if (!existing) return sendError(res, 'Follow-up not found', 404);

    if (req.user.role !== 'SUPER_ADMIN') {
      const access = await checkClinicAccess(req.user, existing.clinicId);
      if (!access) return sendError(res, 'Access denied', 403);
    }

    const followUp = await updateFollowUp(id, {
      followUpDays, note,
      updatedByUserId: req.user.id,
      updatedByRole: req.user.role,
      clinicId: existing.clinicId,
    });

    return sendSuccess(res, { followUp }, 'Follow-up updated');
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
};

// ─── CANCEL FOLLOW-UP ─────────────────────────────────────────────────────────

/**
 * PATCH /api/follow-ups/:id/cancel
 * Body: { cancellationReason? }
 */
const cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const existing = await prisma.followUp.findUnique({ where: { id }, select: { clinicId: true } });
    if (!existing) return sendError(res, 'Follow-up not found', 404);

    if (req.user.role !== 'SUPER_ADMIN') {
      const access = await checkClinicAccess(req.user, existing.clinicId);
      if (!access) return sendError(res, 'Access denied', 403);
    }

    const followUp = await cancelFollowUp(id, {
      cancelledByUserId: req.user.id,
      cancellationReason,
      clinicId: existing.clinicId,
    });

    return sendSuccess(res, { followUp }, 'Follow-up cancelled');
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
};

// ─── PATIENT-FACING ──────────────────────────────────────────────────────────

/**
 * GET /api/follow-ups/my
 * Patient sees their own follow-ups.
 */
const getMyFollowUps = async (req, res, next) => {
  try {
    const { clinicId } = req.query;
    const followUps = await getPatientFollowUps(req.user.id, clinicId || null);

    // Compute status for display
    const withStatus = followUps.map((fu) => ({
      ...fu,
      displayStatus: fu.status,
    }));

    return sendSuccess(res, { followUps: withStatus });
  } catch (error) { next(error); }
};

// ─── Helper ──────────────────────────────────────────────────────────────────

const checkClinicAccess = async (user, clinicId) => {
  if (user.role === 'CLINIC_OWNER') {
    return prisma.clinic.findFirst({ where: { id: clinicId, ownerId: user.id } });
  }
  if (user.role === 'DOCTOR' || user.role === 'RECEPTIONIST') {
    return prisma.clinicStaff.findFirst({ where: { clinicId, userId: user.id, isActive: true } });
  }
  return false;
};

// ─── COMPLETED VISITS (for follow-up creation UI) ────────────────────────────

/**
 * GET /api/follow-ups/completed-visits
 * Returns COMPLETED appointments for a patient at this clinic.
 * Used by doctor/receptionist when creating a new follow-up — they pick the visit.
 * Query: patientId (required), clinicId?, doctorId?, limit?
 */
const getCompletedVisits = async (req, res, next) => {
  try {
    let { patientId, clinicId, doctorId, limit = 10 } = req.query;

    if (!patientId) return sendError(res, 'patientId required', 400);
    if (!clinicId) clinicId = await resolveClinicId(req);
    if (!clinicId) return sendError(res, 'clinicId required', 400);

    if (req.user.role !== 'SUPER_ADMIN') {
      const access = await checkClinicAccess(req.user, clinicId);
      if (!access) return sendError(res, 'Access denied', 403);
    }

    const where = {
      patientId,
      clinicId,
      status: 'COMPLETED',
    };
    if (doctorId) where.doctorId = doctorId;

    const visits = await prisma.appointment.findMany({
      where,
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        // Show whether a follow-up already exists for this visit
        followUpRecords: {
          where: { status: { notIn: ['CANCELLED'] } },
          select: { id: true, status: true, followUpDate: true, followUpDays: true },
        },
      },
      orderBy: { appointmentDate: 'desc' },
      take: parseInt(limit),
    });

    return sendSuccess(res, { visits });
  } catch (error) { next(error); }
};

/**
 * GET /api/follow-ups/patient/:patientId
 * All follow-ups for a specific patient (staff view — includes cancelled).
 * Query: clinicId?
 */
const getPatientFollowUpsStaff = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    let { clinicId } = req.query;
    if (!clinicId) clinicId = await resolveClinicId(req);
    if (!clinicId) return sendError(res, 'clinicId required', 400);

    if (req.user.role !== 'SUPER_ADMIN') {
      const access = await checkClinicAccess(req.user, clinicId);
      if (!access) return sendError(res, 'Access denied', 403);
    }

    const followUps = await prisma.followUp.findMany({
      where: { patientId, clinicId },
      include: {
        patient: { select: { id: true, name: true, mobile: true } },
        doctor: { include: { user: { select: { id: true, name: true } } } },
        originalVisit: { select: { id: true, appointmentDate: true, symptoms: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        updatedBy: { select: { id: true, name: true, role: true } },
        cancelledBy: { select: { id: true, name: true, role: true } },
        bookedAppointment: { select: { id: true, appointmentDate: true, status: true } },
      },
      orderBy: { followUpDate: 'asc' },
    });

    return sendSuccess(res, { followUps });
  } catch (error) { next(error); }
};

module.exports = {
  getSettings,
  updateSettings,
  create,
  list,
  getOne,
  update,
  cancel,
  getMyFollowUps,
  getCompletedVisits,
  getPatientFollowUpsStaff,
};
