const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireApprovalStatuses } = require('../middleware/auth.middleware');
const prisma = require('../config/database');
const { sendError } = require('../utils/response');
const {
  getQueue,
  addWalkIn,
  addFollowUp,
  checkIn,
  callNext,
  skipPatient,
  completePatient,
  pauseQueue,
  resumeQueue,
  getSessionQueueStats,
} = require('../controllers/reception.controller');

router.use(authenticate, authorize('RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'));

// ── Gate: verify user AND their clinic are active + verified ─────────────────
// requireApprovalStatuses checks the user's own approvalStatus.
// The additional middleware below checks the assigned clinic's status so that
// a receptionist/owner whose clinic is SUSPENDED cannot operate the queue.
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
      // For receptionists, look up their assigned clinic
      if (req.user.role === 'RECEPTIONIST') {
        const profile = await prisma.receptionistProfile.findUnique({
          where: { userId: req.user.id },
          select: { assignedClinicId: true },
        });
        clinicId = profile?.assignedClinicId;
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

router.get('/queue/:doctorId', getQueue);
router.post('/walk-in', addWalkIn);
router.post('/follow-up', addFollowUp);
router.patch('/queue/:queueItemId/check-in', checkIn);
router.patch('/queue/:queueId/call-next', callNext);
router.patch('/queue-item/:id/skip', skipPatient);
router.patch('/queue-item/:id/complete', completePatient);
router.patch('/queue/:queueId/pause', pauseQueue);
router.patch('/queue/:queueId/resume', resumeQueue);
// Session-level live stats for clinic owner dashboard (Req #13)
router.get('/session-stats/:clinicId', getSessionQueueStats);

module.exports = router;
