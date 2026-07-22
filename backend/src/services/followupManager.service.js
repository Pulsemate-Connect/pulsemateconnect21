/**
 * PulseMate — Follow-Up Manager Service
 *
 * Handles the full follow-up lifecycle:
 * - Explicit creation by doctor or receptionist
 * - Status computation (PENDING → UPCOMING → DUE → OVERDUE)
 * - Linking booked appointments
 * - Audit trail
 * - Clinic-level settings
 */
const prisma = require('../config/database');

// ─── Clinic Follow-Up Settings ────────────────────────────────────────────────

/**
 * Get or create clinic follow-up settings (upsert with defaults).
 */
const getClinicFollowUpSettings = async (clinicId) => {
  let settings = await prisma.clinicFollowUpSettings.findUnique({ where: { clinicId } });
  if (!settings) {
    // Auto-create defaults for clinics that don't have explicit settings yet
    settings = await prisma.clinicFollowUpSettings.create({
      data: { clinicId },
    });
  }
  return settings;
};

/**
 * Update clinic follow-up settings.
 */
const updateClinicFollowUpSettings = async (clinicId, data) => {
  const allowed = [
    'followUpEnabled', 'preset7DaysEnabled', 'preset15DaysEnabled',
    'preset30DaysEnabled', 'customDaysEnabled', 'defaultFollowUpDays', 'gracePeriodDays',
  ];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  if (update.defaultFollowUpDays) update.defaultFollowUpDays = parseInt(update.defaultFollowUpDays);
  if (update.gracePeriodDays) update.gracePeriodDays = parseInt(update.gracePeriodDays);

  return prisma.clinicFollowUpSettings.upsert({
    where: { clinicId },
    create: { clinicId, ...update },
    update,
  });
};

// ─── Follow-Up Status Computation ────────────────────────────────────────────

/**
 * Compute the current status of a follow-up based on date and grace period.
 * PENDING → UPCOMING (≤3 days) → DUE (today) → OVERDUE (past + grace) → OVERDUE
 * Does NOT auto-complete or auto-cancel.
 */
const computeStatus = (followUp, gracePeriodDays = 7) => {
  // Keep terminal states as-is
  if (['BOOKED', 'COMPLETED', 'CANCELLED'].includes(followUp.status)) {
    return followUp.status;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(followUp.followUpDate);
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const daysUntilDue = Math.round((dueDateOnly - today) / (1000 * 60 * 60 * 24));

  if (daysUntilDue > 3) return 'PENDING';
  if (daysUntilDue > 0) return 'UPCOMING';
  if (daysUntilDue === 0) return 'DUE';
  return 'OVERDUE'; // past due
};

/**
 * Refresh computed status for all active follow-ups in a clinic.
 * Called by a background job or on-demand.
 */
const refreshFollowUpStatuses = async (clinicId) => {
  const settings = await getClinicFollowUpSettings(clinicId);
  const activeFollowUps = await prisma.followUp.findMany({
    where: {
      clinicId,
      status: { notIn: ['BOOKED', 'COMPLETED', 'CANCELLED'] },
    },
    select: { id: true, followUpDate: true, status: true },
  });

  const updates = [];
  for (const fu of activeFollowUps) {
    const computed = computeStatus(fu, settings.gracePeriodDays);
    if (computed !== fu.status) {
      updates.push(
        prisma.followUp.update({
          where: { id: fu.id },
          data: { status: computed },
        })
      );
    }
  }

  if (updates.length > 0) await Promise.all(updates);
  return updates.length;
};

// ─── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Create a follow-up record (doctor or receptionist).
 * Validates:
 *  - Clinic follow-up feature is enabled
 *  - Preset/custom days allowed by clinic settings
 *  - originalVisitId is a COMPLETED appointment
 *  - No active follow-up already exists for this visit
 */
const createFollowUp = async ({
  clinicId,
  doctorId,       // DoctorProfile.id
  originalVisitId,
  followUpDays,
  note,
  createdByUserId,
  createdByRole,  // 'CLINIC_OWNER' | 'DOCTOR' | 'RECEPTIONIST'
}) => {
  // 1. Clinic settings check
  const settings = await getClinicFollowUpSettings(clinicId);
  if (!settings.followUpEnabled) {
    const e = new Error('Follow-up feature is not enabled for this clinic'); e.status = 400; throw e;
  }

  // 2. Validate days against preset permissions
  const days = parseInt(followUpDays);
  if (!days || days <= 0) {
    const e = new Error('Follow-up days must be a positive number'); e.status = 400; throw e;
  }

  // Doctors must use clinic presets; receptionists can enter any value
  if (createdByRole === 'DOCTOR') {
    const isPreset7 = days === 7 && settings.preset7DaysEnabled;
    const isPreset15 = days === 15 && settings.preset15DaysEnabled;
    const isPreset30 = days === 30 && settings.preset30DaysEnabled;
    const isCustom = ![7, 15, 30].includes(days) && settings.customDaysEnabled;
    if (!isPreset7 && !isPreset15 && !isPreset30 && !isCustom) {
      const e = new Error(`${days}-day follow-up is not allowed by clinic settings`); e.status = 400; throw e;
    }
  }

  // 3. Validate original visit
  const originalVisit = await prisma.appointment.findUnique({
    where: { id: originalVisitId },
    include: { patient: { select: { id: true, name: true } } },
  });
  if (!originalVisit) { const e = new Error('Original visit not found'); e.status = 404; throw e; }
  if (originalVisit.clinicId !== clinicId) { const e = new Error('Visit does not belong to this clinic'); e.status = 403; throw e; }
  if (originalVisit.status !== 'COMPLETED') { const e = new Error('Follow-up can only be created for COMPLETED visits'); e.status = 400; throw e; }

  // 4. Duplicate prevention — one active follow-up per original visit
  const existing = await prisma.followUp.findFirst({
    where: {
      originalVisitId,
      status: { notIn: ['CANCELLED'] },
    },
  });
  if (existing) {
    const e = new Error('An active follow-up already exists for this visit. Cancel it first to create a new one.'); e.status = 409; throw e;
  }

  // 5. Calculate follow-up date from visit completion date (NOT current date)
  const visitDate = new Date(originalVisit.appointmentDate);
  visitDate.setUTCHours(0, 0, 0, 0);
  const followUpDate = new Date(visitDate);
  followUpDate.setDate(followUpDate.getDate() + days);

  // 6. Create follow-up
  const followUp = await prisma.followUp.create({
    data: {
      patientId: originalVisit.patientId,
      clinicId,
      doctorId,
      originalVisitId,
      followUpDays: days,
      followUpDate,
      status: 'PENDING',
      note: note || null,
      createdByUserId,
      createdByRole,
    },
    include: {
      patient: { select: { id: true, name: true, mobile: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      originalVisit: { select: { id: true, appointmentDate: true, symptoms: true } },
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });

  // Compute and apply initial status
  const computedStatus = computeStatus(followUp, settings.gracePeriodDays);
  if (computedStatus !== 'PENDING') {
    await prisma.followUp.update({ where: { id: followUp.id }, data: { status: computedStatus } });
    followUp.status = computedStatus;
  }

  // Notify patient (fire-and-forget)
  try {
    const { notifyFollowUpCreated } = require('./fcm.service');
    const doctorName = followUp.doctor?.user?.name || 'your doctor';
    notifyFollowUpCreated(followUp.patientId, doctorName, followUp.followUpDate, days).catch(() => { });
  } catch { }

  return followUp;
};

/**
 * Update a follow-up (doctor or receptionist can edit days/note).
 * Preserves audit trail.
 */
const updateFollowUp = async (followUpId, { followUpDays, note, updatedByUserId, updatedByRole, clinicId }) => {
  const existing = await prisma.followUp.findUnique({ where: { id: followUpId } });
  if (!existing) { const e = new Error('Follow-up not found'); e.status = 404; throw e; }
  if (existing.clinicId !== clinicId) { const e = new Error('Access denied'); e.status = 403; throw e; }
  if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
    const e = new Error(`Cannot edit a ${existing.status.toLowerCase()} follow-up`); e.status = 400; throw e;
  }

  const updateData = { updatedByUserId };

  if (followUpDays !== undefined) {
    const days = parseInt(followUpDays);
    if (!days || days <= 0) { const e = new Error('Follow-up days must be a positive number'); e.status = 400; throw e; }

    if (updatedByRole === 'DOCTOR') {
      const settings = await getClinicFollowUpSettings(clinicId);
      const isPreset7 = days === 7 && settings.preset7DaysEnabled;
      const isPreset15 = days === 15 && settings.preset15DaysEnabled;
      const isPreset30 = days === 30 && settings.preset30DaysEnabled;
      const isCustom = ![7, 15, 30].includes(days) && settings.customDaysEnabled;
      if (!isPreset7 && !isPreset15 && !isPreset30 && !isCustom) {
        const e = new Error(`${days}-day follow-up is not allowed by clinic settings`); e.status = 400; throw e;
      }
    }

    // Recalculate follow-up date from the original visit date
    const originalVisit = await prisma.appointment.findUnique({ where: { id: existing.originalVisitId }, select: { appointmentDate: true } });
    const visitDate = new Date(originalVisit.appointmentDate);
    visitDate.setUTCHours(0, 0, 0, 0);
    const newFollowUpDate = new Date(visitDate);
    newFollowUpDate.setDate(newFollowUpDate.getDate() + days);

    updateData.followUpDays = days;
    updateData.followUpDate = newFollowUpDate;
  }

  if (note !== undefined) updateData.note = note;

  const updated = await prisma.followUp.update({
    where: { id: followUpId },
    data: updateData,
    include: {
      patient: { select: { id: true, name: true, mobile: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      originalVisit: { select: { id: true, appointmentDate: true, symptoms: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      updatedBy: { select: { id: true, name: true, role: true } },
    },
  });

  // Recompute status after date change
  const settings = await getClinicFollowUpSettings(clinicId);
  const computedStatus = computeStatus(updated, settings.gracePeriodDays);
  if (computedStatus !== updated.status && !['BOOKED', 'COMPLETED', 'CANCELLED'].includes(updated.status)) {
    await prisma.followUp.update({ where: { id: followUpId }, data: { status: computedStatus } });
    updated.status = computedStatus;
  }

  return updated;
};

/**
 * Cancel a follow-up.
 */
const cancelFollowUp = async (followUpId, { cancelledByUserId, cancellationReason, clinicId }) => {
  const existing = await prisma.followUp.findUnique({ where: { id: followUpId } });
  if (!existing) { const e = new Error('Follow-up not found'); e.status = 404; throw e; }
  if (existing.clinicId !== clinicId) { const e = new Error('Access denied'); e.status = 403; throw e; }
  if (existing.status === 'CANCELLED') { const e = new Error('Follow-up is already cancelled'); e.status = 400; throw e; }
  if (existing.status === 'COMPLETED') { const e = new Error('Cannot cancel a completed follow-up'); e.status = 400; throw e; }

  return prisma.followUp.update({
    where: { id: followUpId },
    data: {
      status: 'CANCELLED',
      cancelledByUserId,
      cancelledAt: new Date(),
      cancellationReason: cancellationReason || null,
      updatedByUserId: cancelledByUserId,
    },
    include: {
      patient: { select: { id: true, name: true, mobile: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      cancelledBy: { select: { id: true, name: true, role: true } },
    },
  });
};

/**
 * Link a booked appointment to a follow-up, updating status to BOOKED.
 * Called when a patient books an appointment tagged as follow-up.
 */
const markFollowUpBooked = async (followUpId, bookedAppointmentId, updatedByUserId) => {
  return prisma.followUp.update({
    where: { id: followUpId },
    data: {
      status: 'BOOKED',
      bookedAppointmentId,
      updatedByUserId,
    },
  });
};

/**
 * Mark a follow-up as COMPLETED when the booked visit is completed.
 */
const markFollowUpCompleted = async (followUpId, updatedByUserId) => {
  const fu = await prisma.followUp.findUnique({ where: { id: followUpId } });
  if (!fu) return null;
  if (fu.status === 'CANCELLED') return fu; // don't override cancelled
  return prisma.followUp.update({
    where: { id: followUpId },
    data: { status: 'COMPLETED', updatedByUserId },
  });
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List follow-ups for a clinic with filters + pagination.
 */
const listClinicFollowUps = async (clinicId, {
  status, patientId, doctorId, page = 1, limit = 30,
  dateFrom, dateTo,
} = {}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { clinicId };
  if (status) where.status = status;
  if (patientId) where.patientId = patientId;
  if (doctorId) where.doctorId = doctorId;
  if (dateFrom || dateTo) {
    where.followUpDate = {};
    if (dateFrom) where.followUpDate.gte = new Date(dateFrom);
    if (dateTo) where.followUpDate.lte = new Date(dateTo);
  }

  const [followUps, total] = await Promise.all([
    prisma.followUp.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        patient: { select: { id: true, name: true, mobile: true } },
        doctor: { include: { user: { select: { id: true, name: true } } } },
        originalVisit: { select: { id: true, appointmentDate: true, symptoms: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        updatedBy: { select: { id: true, name: true, role: true } },
        cancelledBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { followUpDate: 'asc' },
    }),
    prisma.followUp.count({ where }),
  ]);

  return { followUps, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Get follow-ups for a specific patient.
 */
const getPatientFollowUps = async (patientId, clinicId = null) => {
  const where = { patientId, status: { notIn: ['CANCELLED'] } };
  if (clinicId) where.clinicId = clinicId;

  return prisma.followUp.findMany({
    where,
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      clinic: { select: { id: true, name: true, city: true, clinicLogoUrl: true } },
      originalVisit: { select: { id: true, appointmentDate: true, symptoms: true } },
    },
    orderBy: { followUpDate: 'asc' },
  });
};

module.exports = {
  getClinicFollowUpSettings,
  updateClinicFollowUpSettings,
  computeStatus,
  refreshFollowUpStatuses,
  createFollowUp,
  updateFollowUp,
  cancelFollowUp,
  markFollowUpBooked,
  markFollowUpCompleted,
  listClinicFollowUps,
  getPatientFollowUps,
};
