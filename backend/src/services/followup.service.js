/**
 * PulseMate — Follow-Up Appointment Service
 *
 * A follow-up is based on the patient's PREVIOUS COMPLETED VISIT,
 * not on a prescription. Eligibility rules:
 *  1. Doctor/clinic must have follow-up ENABLED for that doctor+clinic pair
 *  2. Patient must have a COMPLETED appointment with that doctor (optionally at that clinic)
 *  3. The completed visit must be within the configured validity window
 *  4. No duplicate follow-up already exists for the same previous visit (prevent double-booking)
 */
const prisma = require('../config/database');

/**
 * Get follow-up settings for a doctor at a specific clinic.
 * @returns {{ followUpEnabled, followUpValidityDays }}
 */
const getFollowUpSettings = async (doctorId, clinicId) => {
  const dc = await prisma.doctorClinic.findUnique({
    where: { doctorId_clinicId: { doctorId, clinicId } },
    select: { followUpEnabled: true, followUpValidityDays: true },
  });
  // Defaults if no record found
  return {
    followUpEnabled: dc?.followUpEnabled ?? true,
    followUpValidityDays: dc?.followUpValidityDays ?? 30,
  };
};

/**
 * Update follow-up settings for a doctor at a clinic.
 * Only the doctor themselves or the clinic owner can call this.
 */
const updateFollowUpSettings = async (doctorId, clinicId, { followUpEnabled, followUpValidityDays }) => {
  return prisma.doctorClinic.update({
    where: { doctorId_clinicId: { doctorId, clinicId } },
    data: {
      ...(followUpEnabled !== undefined ? { followUpEnabled } : {}),
      ...(followUpValidityDays !== undefined ? { followUpValidityDays: parseInt(followUpValidityDays) } : {}),
    },
  });
};

/**
 * Check if a patient is eligible for a follow-up with a specific doctor (optionally at a clinic).
 * Returns eligible previous visits (most recent first).
 *
 * @param {string} patientId
 * @param {string} doctorId      - DoctorProfile.id
 * @param {string|null} clinicId - optional filter by clinic
 * @returns {{ isEligible, eligibleVisits, settings }}
 */
const checkFollowUpEligibility = async (patientId, doctorId, clinicId = null) => {
  // 1. Get follow-up settings (use clinic filter if provided)
  let settings;
  if (clinicId) {
    settings = await getFollowUpSettings(doctorId, clinicId);
  } else {
    // Find any active clinic relationship for this doctor
    const anyDc = await prisma.doctorClinic.findFirst({
      where: { doctorId, isActive: true, followUpEnabled: true },
      select: { followUpEnabled: true, followUpValidityDays: true, clinicId: true },
      orderBy: { joinedAt: 'desc' },
    });
    settings = {
      followUpEnabled: anyDc?.followUpEnabled ?? false,
      followUpValidityDays: anyDc?.followUpValidityDays ?? 30,
    };
  }

  if (!settings.followUpEnabled) {
    return { isEligible: false, eligibleVisits: [], settings, reason: 'Follow-up is not available for this doctor/clinic' };
  }

  // 2. Find completed visits within the validity window
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.followUpValidityDays);

  const where = {
    patientId,
    doctorId,
    status: 'COMPLETED',
    appointmentDate: { gte: cutoffDate },
  };
  if (clinicId) where.clinicId = clinicId;

  const completedVisits = await prisma.appointment.findMany({
    where,
    include: {
      clinic: { select: { id: true, name: true, city: true, clinicLogoUrl: true, approvalStatus: true, isActive: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      // Check if a follow-up was already booked for this visit
      followUpAppointments: {
        where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        select: { id: true, status: true },
      },
    },
    orderBy: { appointmentDate: 'desc' },
  });

  // 3. Filter: clinic must be active+verified, no active follow-up already booked
  const eligibleVisits = completedVisits
    .filter((v) => {
      if (!v.clinic || v.clinic.approvalStatus !== 'VERIFIED' || !v.clinic.isActive) return false;
      // No un-cancelled follow-up already exists
      if (v.followUpAppointments && v.followUpAppointments.length > 0) return false;
      return true;
    })
    .map((v) => ({
      appointmentId: v.id,
      appointmentDate: v.appointmentDate,
      followUpExpiresOn: new Date(new Date(v.appointmentDate).getTime() + settings.followUpValidityDays * 24 * 60 * 60 * 1000),
      doctor: { id: v.doctorId, name: v.doctor?.user?.name, specialization: v.doctor?.specialization },
      clinic: { id: v.clinicId, name: v.clinic.name, city: v.clinic.city, logoUrl: v.clinic.clinicLogoUrl },
      sessionId: v.sessionId,
      symptoms: v.symptoms,
    }));

  return {
    isEligible: eligibleVisits.length > 0,
    eligibleVisits,
    settings,
    reason: eligibleVisits.length === 0 ? 'No eligible completed visits within the follow-up validity period' : null,
  };
};

/**
 * Validate a follow-up booking request — backend authority.
 * Throws with .status set on error.
 *
 * @param {string} patientId
 * @param {string} previousAppointmentId
 * @returns {{ previousAppt, settings }}
 */
const validateFollowUpBooking = async (patientId, previousAppointmentId) => {
  // 1. Load previous appointment
  const prev = await prisma.appointment.findUnique({
    where: { id: previousAppointmentId },
    include: {
      clinic: { select: { id: true, approvalStatus: true, isActive: true } },
      followUpAppointments: {
        where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        select: { id: true },
      },
    },
  });

  if (!prev) { const e = new Error('Previous appointment not found'); e.status = 404; throw e; }
  if (prev.patientId !== patientId) { const e = new Error('Access denied'); e.status = 403; throw e; }
  if (prev.status !== 'COMPLETED') { const e = new Error('Previous appointment must be completed to book a follow-up'); e.status = 400; throw e; }
  if (!prev.clinic || prev.clinic.approvalStatus !== 'VERIFIED' || !prev.clinic.isActive) {
    const e = new Error('Clinic is not currently available'); e.status = 400; throw e;
  }

  // 2. Duplicate prevention
  if (prev.followUpAppointments && prev.followUpAppointments.length > 0) {
    const e = new Error('A follow-up has already been booked for this visit'); e.status = 409; throw e;
  }

  // 3. Check follow-up settings
  const settings = await getFollowUpSettings(prev.doctorId, prev.clinicId);
  if (!settings.followUpEnabled) {
    const e = new Error('Follow-up is not available for this doctor/clinic'); e.status = 400; throw e;
  }

  // 4. Check validity period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.followUpValidityDays);
  if (new Date(prev.appointmentDate) < cutoffDate) {
    const e = new Error(`Follow-up validity period has expired (${settings.followUpValidityDays} days)`); e.status = 400; throw e;
  }

  return { previousAppt: prev, settings };
};

module.exports = {
  getFollowUpSettings,
  updateFollowUpSettings,
  checkFollowUpEligibility,
  validateFollowUpBooking,
};
