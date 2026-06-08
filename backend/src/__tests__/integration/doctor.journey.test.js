'use strict';
/**
 * Integration tests — Doctor journey
 * Doctor: Login → Queue → Start → Complete
 */

const request = require('supertest');
const { app } = require('../../server');

jest.mock('../../services/notification.service', () => ({
  notifyFollowUpReminder: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/fcm.service', () => ({
  notifyQueueCalled: jest.fn().mockResolvedValue(undefined),
  notifyQueuePaused: jest.fn().mockResolvedValue(undefined),
  notifyQueueResumed: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/token.service', () => ({
  generateAccessToken: jest.fn(() => 'doctor_access_token'),
  generateRefreshToken: jest.fn(() => 'doctor_refresh_token'),
  verifyAccessToken: jest.fn((t) => {
    if (t === 'doctor_access_token') return { sub: 'doctor-user-1', role: 'DOCTOR' };
    throw new Error('invalid');
  }),
}));

const DOCTOR_USER = {
  id: 'doctor-user-1', name: 'Dr. Rajesh', mobile: '9999900010',
  role: 'DOCTOR', isActive: true, approvalStatus: 'VERIFIED',
  patientProfile: null,
  doctorProfile: { id: 'dp1', approvalStatus: 'VERIFIED' },
  adminProfile: null,
  receptionistProfile: null,
  ownedClinics: [],
};

const authed = (agent) => agent.set('Authorization', 'Bearer doctor_access_token');

describe('Doctor Journey Integration', () => {
  // ── GET /doctor/today ────────────────────────────────────────────────────
  describe('GET /api/doctor/today', () => {
    test('returns today appointments for doctor', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(DOCTOR_USER);
      global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'dp1' });
      global.prismaMock.appointment.findMany.mockResolvedValueOnce([
        {
          id: 'a1', status: 'BOOKED', queueNumber: 1,
          appointmentDate: new Date(),
          patient: { id: 'p1', name: 'Alice', mobile: '9', patientProfile: null },
          clinic: { id: 'c1', name: 'Test Clinic' },
          queueItem: null,
        },
      ]);

      const res = await authed(request(app).get('/api/doctor/today'));
      expect(res.status).toBe(200);
      expect(res.body.data.appointments).toHaveLength(1);
    });
  });

  // ── PATCH /doctor/appointments/:id/start ──────────────────────────────────
  describe('PATCH /api/doctor/appointments/:id/start', () => {
    test('starts a consultation', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(DOCTOR_USER);
      global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'dp1' });
      global.prismaMock.appointment.findFirst.mockResolvedValueOnce({
        id: 'a1', status: 'BOOKED', queueItem: { id: 'qi1' },
      });
      global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a1', status: 'IN_CONSULTATION' });
      global.prismaMock.queueItem.update.mockResolvedValueOnce({ id: 'qi1', status: 'IN_CONSULTATION' });

      const res = await authed(request(app).patch('/api/doctor/appointments/a1/start'));
      expect(res.status).toBe(200);
    });
  });

  // ── PATCH /doctor/appointments/:id/complete ───────────────────────────────
  describe('PATCH /api/doctor/appointments/:id/complete', () => {
    test('completes a consultation', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(DOCTOR_USER);
      global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'dp1' });
      global.prismaMock.appointment.findFirst.mockResolvedValueOnce({
        id: 'a1', status: 'IN_CONSULTATION', queueItem: { id: 'qi1' },
      });
      global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a1', status: 'COMPLETED' });
      global.prismaMock.queueItem.update.mockResolvedValueOnce({ id: 'qi1', status: 'COMPLETED' });

      const res = await authed(request(app).patch('/api/doctor/appointments/a1/complete'));
      expect(res.status).toBe(200);
    });
  });
});
