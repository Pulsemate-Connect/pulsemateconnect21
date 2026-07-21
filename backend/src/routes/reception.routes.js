const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const prisma = require('../config/database');
const { sendError } = require('../utils/response');
const {
  getQueue,
  addWalkIn,
  addFollowUp,
  checkIn,
  checkInByAppointment,
  callNext,
  skipPatient,
  completePatient,
  pauseQueue,
  resumeQueue,
  closeQueue,
  getSessionQueueStats,
  getTodaysAppointments,
  searchPatients,
  getDashboardStats,
} = require('../controllers/reception.controller');

router.use(authenticate, authorize('RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'));

// ── Gate: verify user AND their clinic are active + verified ─────────────────
router.use(async (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') return next();

  // 1. User-level approval check
  if (req.user.approvalStatus !== 'VERIFIED') {
    return sendError(res, 'Clinic verification is required before using this feature.', 403);
  }

  // 2. Clinic-level check — find the clinic this user belongs to
  try {
    let clinicId = req.body.clinicId || req.query.clinicId;

    if (!clinicId) {
      if (req.user.role === 'RECEPTIONIST') {
        clinicId = req.user.receptionistProfile?.assignedClinicId;
      } else if (req.user.role === 'CLINIC_OWNER') {
        const clinic = await prisma.clinic.findFirst({
          where: { ownerId: req.user.id },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        clinicId = clinic?.id;
      }
    }

    if (!clinicId) return next(); // no clinic context found — let controller handle it

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { approvalStatus: true, isActive: true },
    });

    if (!clinic || clinic.approvalStatus !== 'VERIFIED' || !clinic.isActive) {
      return sendError(res, 'Clinic verification is required before using this feature.', 403);
    }

    next();
  } catch (err) {
    next(err);
  }
});

// ── Queue management ──────────────────────────────────────────────────────────
router.get('/queue/:doctorId', getQueue);
router.patch('/queue/:queueItemId/check-in', checkIn);           // legacy: check-in by queueItemId
router.patch('/queue/:queueId/call-next', callNext);
router.patch('/queue/:queueId/pause', pauseQueue);
router.patch('/queue/:queueId/resume', resumeQueue);
router.patch('/queue/:queueId/close', closeQueue);

// ── Queue item actions ────────────────────────────────────────────────────────
router.patch('/queue-item/:id/skip', skipPatient);
router.patch('/queue-item/:id/complete', completePatient);

// ── Booking flows ─────────────────────────────────────────────────────────────
router.post('/walk-in', addWalkIn);
router.post('/follow-up', addFollowUp);

// ── Check-in by appointment ID (primary — no UUID paste required from frontend)
router.patch('/appointments/:appointmentId/check-in', checkInByAppointment);

// ── Today's appointments + search ────────────────────────────────────────────
router.get('/appointments/today', getTodaysAppointments);
router.get('/patients/search', searchPatients);

// ── Dashboard stats ───────────────────────────────────────────────────────────
router.get('/dashboard-stats', getDashboardStats);

// ── Session-level live stats (clinic owner dashboard) ────────────────────────
router.get('/session-stats/:clinicId', getSessionQueueStats);

module.exports = router;
