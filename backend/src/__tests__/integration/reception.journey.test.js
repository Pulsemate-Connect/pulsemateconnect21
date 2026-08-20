'use strict';
/**
 * Integration tests — Reception journey
 * Task 5.8: Login → Walk-in → Check-in → Call Next → Complete Patient
 */

const request = require('supertest');
const { app } = require('../../server');

jest.mock('../../services/notification.service', () => ({
  notifyQueueCalled: jest.fn().mockResolvedValue(undefined),
  notifyQueuePaused: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/fcm.service', () => ({
  notifyQueueCalled: jest.fn().mockResolvedValue(undefined),
  notifyQueueResumed: jest.fn().mockResolvedValue(undefined),
  notifyDoctorFollowUp: jest.fn().mockResolvedValue(undefined),
  notifyReceptionistNewWalkIn: jest.fn().mockResolvedValue(undefined),
  notifyQueuePaused: jest.fn().mockResolvedValue(undefined),
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/audit.service', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/token.service', () => ({
  generateAccessToken: jest.fn(() => 'reception_token'),
  generateRefreshToken: jest.fn(() => 'reception_refresh'),
  verifyAccessToken: jest.fn((t) => {
    if (t === 'reception_token') return { sub: 'recept-1', role: 'RECEPTIONIST' };
    throw new Error('invalid');
  }),
}));

// RECEPT_USER must include:
//   - approvalStatus: 'VERIFIED'  (for requireApprovalStatuses middleware)
//   - receptionistProfile         (included by authenticateUser via includeUserProfile)
const RECEPT_USER = {
  id: 'recept-1', name: 'Priya', mobile: '9999900020',
  role: 'RECEPTIONIST', isActive: true, approvalStatus: 'VERIFIED',
  doctorProfile: null,
  adminProfile: null,
  receptionistProfile: {
    id: 'rp1', assignedClinicId: 'c1',
    assignedClinic: { id: 'c1', name: 'Test Clinic', approvalStatus: 'VERIFIED', isActive: true },
  },
  ownedClinics: [],
};

// Clinic stub used for the middleware clinic-level check
const VERIFIED_CLINIC = { id: 'c1', approvalStatus: 'VERIFIED', isActive: true };

const authed = (agent) => agent.set('Authorization', 'Bearer reception_token');

/**
 * The reception route middleware does:
 *  1. authenticate  → user.findUnique (consumed by auth)
 *  2. authorize(RECEPTIONIST) → reads req.user.role
 *  3. requireApprovalStatuses('VERIFIED') → reads req.user.approvalStatus
 *  4. Custom middleware: if no clinicId in body/query, lookup receptionistProfile
 *     then clinic.findUnique to verify it's VERIFIED
 *
 * For routes that don't include clinicId in body (check-in, call-next, complete),
 * the middleware queries both receptionistProfile AND clinic.
 * For routes that include clinicId in body (walk-in), only clinic.findUnique is called.
 */
const mockReceptionistClinicCheck = () => {
  // receptionistProfile.findUnique to get assignedClinicId
  global.prismaMock.receptionistProfile.findUnique.mockResolvedValueOnce({ assignedClinicId: 'c1' });
  // clinic.findUnique to verify it's VERIFIED + active
  global.prismaMock.clinic.findUnique.mockResolvedValueOnce(VERIFIED_CLINIC);
};

const mockClinicCheck = () => {
  // For routes with clinicId in body — only clinic.findUnique is needed
  global.prismaMock.clinic.findUnique.mockResolvedValueOnce(VERIFIED_CLINIC);
};

describe('Reception Journey Integration', () => {
  // ── POST /reception/walk-in ───────────────────────────────────────────────
  describe('POST /api/reception/walk-in', () => {
    test('adds a walk-in patient to queue', async () => {
      global.prismaMock.user.findUnique
        .mockResolvedValueOnce(RECEPT_USER)                                // authenticate
        .mockResolvedValueOnce({ id: 'p1', name: 'Bob', mobile: '9999' }); // find patient by mobile
      // walk-in sends clinicId in body → only clinic check needed
      mockClinicCheck();
      global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'dp1', avgConsultationMins: 10 });
      global.prismaMock.queue.findFirst.mockResolvedValueOnce(null);
      global.prismaMock.queue.create.mockResolvedValueOnce({ id: 'q1', status: 'ACTIVE', clinicId: 'c1', doctorId: 'dp1' });
      global.prismaMock.queueItem.findFirst.mockResolvedValueOnce(null);
      global.prismaMock.queueItem.count.mockResolvedValueOnce(0);
      global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'a1', queueNumber: 1 });
      global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi1', queueNumber: 1, position: 1 });
      global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([]);

      const res = await authed(request(app).post('/api/reception/walk-in'))
        .send({ doctorId: 'dp1', clinicId: 'c1', patientMobile: '9999', patientName: 'Bob' });

      expect(res.status).toBe(201);
      expect(res.body.data.queueNumber).toBe(1);
    });
  });

  // ── PATCH /reception/queue/:queueItemId/check-in ─────────────────────────
  describe('PATCH /api/reception/queue/:queueItemId/check-in', () => {
    test('checks in a waiting patient', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
      // check-in has no clinicId in body → needs receptionistProfile + clinic check
      mockReceptionistClinicCheck();
      global.prismaMock.queueItem.findUnique.mockResolvedValueOnce({
        id: 'qi1', status: 'WAITING', appointmentId: 'a1',
        queue: { id: 'q1', clinicId: 'c1', doctorId: 'dp1' },
      });
      global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a1', status: 'CHECKED_IN' });

      const res = await authed(request(app).patch('/api/reception/queue/qi1/check-in'));
      expect(res.status).toBe(200);
    });

    test('returns 400 if patient is not in WAITING status', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
      mockClinicCheck();
      global.prismaMock.queueItem.findUnique.mockResolvedValueOnce({
        id: 'qi1', status: 'CALLED', appointmentId: 'a1',
        queue: { id: 'q1', clinicId: 'c1', doctorId: 'dp1' },
      });

      const res = await authed(request(app).patch('/api/reception/queue/qi1/check-in'));
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /reception/queue/:queueId/call-next ─────────────────────────────
  describe('PATCH /api/reception/queue/:queueId/call-next', () => {
    test('calls next patient and returns 200', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
      // call-next has no clinicId in params → middleware looks up receptionistProfile + clinic
      mockReceptionistClinicCheck();
      global.prismaMock.queue.findUnique.mockResolvedValueOnce({
        id: 'q1', status: 'ACTIVE', clinicId: 'c1', doctorId: 'dp1',
        doctor: { user: { name: 'Dr. T' }, avgConsultationMins: 10 },
      });
      global.prismaMock.queueItem.findFirst
        .mockResolvedValueOnce(null)    // no IN_CONSULTATION
        .mockResolvedValueOnce(null)    // no CALLED
        .mockResolvedValueOnce({        // next WAITING
          id: 'qi2', queueNumber: 2, patientId: 'p1', isFollowUp: false,
          appointmentId: 'a2',
          patient: { id: 'p1', name: 'Bob', mobile: '9999' },
          appointment: {},
        });
      global.prismaMock.queueItem.update.mockResolvedValueOnce({ id: 'qi2', status: 'CALLED' });
      global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a2', status: 'CALLED' });
      // recalculatePositions — returns empty WAITING list after calling
      global.prismaMock.queueItem.findMany.mockResolvedValueOnce([]);

      const res = await authed(request(app).patch('/api/reception/queue/q1/call-next'));
      expect(res.status).toBe(200);
    });
  });

  // ── PATCH /reception/queue-item/:id/complete ──────────────────────────────
  describe('PATCH /api/reception/queue-item/:id/complete', () => {
    test('marks patient as completed', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
      mockClinicCheck();
      global.prismaMock.queueItem.findUnique.mockResolvedValueOnce({
        id: 'qi1', queueNumber: 1, appointmentId: 'a1',
        queue: { id: 'q1', clinicId: 'c1', doctorId: 'dp1' },
      });
      global.prismaMock.queueItem.update.mockResolvedValueOnce({ id: 'qi1', status: 'COMPLETED' });
      global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a1', status: 'COMPLETED' });

      const res = await authed(request(app).patch('/api/reception/queue-item/qi1/complete'));
      expect(res.status).toBe(200);
    });
  });
});
