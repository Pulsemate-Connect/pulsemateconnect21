'use strict';
/**
 * Integration tests — Patient full journey
 * Task 5.6: OTP → Login → Profile → Search → Book → Pay → Queue → Cancel
 *
 * Uses supertest against the real Express app with Prisma fully mocked.
 */

const request = require('supertest');
const { app } = require('../../server');

jest.mock('../../services/otp.service', () => ({
  sendOtp: jest.fn().mockResolvedValue({ success: true }),
  verifyOtp: jest.fn(),
}));
jest.mock('../../services/notification.service', () => ({
  notifyAppointmentBooked: jest.fn().mockResolvedValue(undefined),
  notifyFollowUpReminder: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/fcm.service', () => ({
  notifyAppointmentBooked: jest.fn().mockResolvedValue(undefined),
  notifyAppointmentCancelled: jest.fn().mockResolvedValue(undefined),
  notifyQueueCalled: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/token.service', () => ({
  generateAccessToken: jest.fn(() => 'test_access_token'),
  generateRefreshToken: jest.fn(() => 'test_refresh_token'),
  verifyAccessToken: jest.fn((t) => {
    if (t === 'test_access_token') return { sub: 'patient-1', role: 'PATIENT' };
    throw new Error('invalid');
  }),
}));

// Helper: set up authenticated request
const authed = (agent) => agent.set('Authorization', 'Bearer test_access_token');

const PATIENT_USER = {
  id: 'patient-1', name: 'Alice', mobile: '9999900001',
  role: 'PATIENT', isActive: true,
  patientProfile: { id: 'pp1', gender: 'FEMALE', emergencyContact: '9999900002', city: 'Bangalore', dob: null, age: 28, bloodGroup: null, allergies: null, existingDiseases: null, insuranceProvider: null, profileCompleted: true },
};

describe('Patient Journey Integration', () => {
  // ── GET /auth/me ──────────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    test('returns 401 with no token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('returns user when authenticated', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(PATIENT_USER); // authenticate
      global.prismaMock.user.findUnique.mockResolvedValueOnce(PATIENT_USER); // getMe

      const res = await authed(request(app).get('/api/auth/me'));
      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe('patient-1');
    });
  });

  // ── GET /patient/profile ──────────────────────────────────────────────────
  describe('GET /api/patient/profile', () => {
    test('returns patient profile', async () => {
      global.prismaMock.user.findUnique
        .mockResolvedValueOnce(PATIENT_USER)   // authenticate
        .mockResolvedValueOnce(PATIENT_USER);  // getProfile

      const res = await authed(request(app).get('/api/patient/profile'));
      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe('patient-1');
    });
  });

  // ── GET /patient/doctors ──────────────────────────────────────────────────
  describe('GET /api/patient/doctors', () => {
    test('returns doctor list without authentication', async () => {
      global.prismaMock.doctorProfile.findMany.mockResolvedValueOnce([]);
      global.prismaMock.doctorProfile.count.mockResolvedValueOnce(0);

      const res = await request(app).get('/api/patient/doctors');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── POST /payments/initiate → POST /payments/verify ───────────────────────
  describe('Booking + Payment flow', () => {
    test('initiates and verifies booking in dev mode', async () => {
      // Setup for initiatePayment
      // 1st: auth middleware user lookup
      // 2nd: initiatePayment patientUser (freeBookingUsed check)
      global.prismaMock.user.findUnique
        .mockResolvedValueOnce(PATIENT_USER)   // auth middleware
        .mockResolvedValueOnce({ ...PATIENT_USER, freeBookingUsed: true }); // patientUser check → paid path
      global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ id: 'dc1', doctor: { user: { name: 'Dr. T' } } });
      global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null); // no duplicate
      global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'a1', status: 'PENDING_PAYMENT', patientId: 'patient-1' });
      global.prismaMock.payment.create.mockResolvedValueOnce({ id: 'pay1' });

      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      const initRes = await authed(request(app).post('/api/payments/initiate'))
        .send({ doctorId: 'd1', clinicId: 'c1', appointmentType: 'OFFLINE', appointmentDate: '2026-12-01' });

      expect(initRes.status).toBe(200);
      expect(initRes.body.data.devMode).toBe(true);
      const { appointmentId, order } = initRes.body.data;

      // Setup for verifyPayment
      global.prismaMock.user.findUnique
        .mockResolvedValueOnce(PATIENT_USER)   // auth middleware
        .mockResolvedValueOnce({ name: 'Alice' }); // notifyStakeholders patientUser
      global.prismaMock.payment.findUnique.mockResolvedValueOnce({ appointmentId, status: 'PENDING' });
      global.prismaMock.appointment.findUnique.mockResolvedValueOnce({
        id: appointmentId, patientId: 'patient-1', doctorId: 'd1', clinicId: 'c1',
        appointmentType: 'OFFLINE', appointmentDate: new Date('2026-12-01'),
      });
      global.prismaMock.payment.update.mockResolvedValueOnce({ status: 'PAID' });
      global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ avgConsultationMins: 10 });
      global.prismaMock.queue.findFirst.mockResolvedValueOnce(null);
      global.prismaMock.queue.create.mockResolvedValueOnce({ id: 'q1' });
      global.prismaMock.queueItem.findFirst.mockResolvedValueOnce(null);
      global.prismaMock.queueItem.count.mockResolvedValueOnce(0);
      global.prismaMock.appointment.update.mockResolvedValueOnce({
        id: appointmentId, status: 'BOOKED', queueNumber: 1,
        doctor: { user: { id: 'd-user', name: 'Dr. T' } },
        clinic: { id: 'c1', name: 'Test Clinic' },
      });
      global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi1' });

      const verifyRes = await authed(request(app).post('/api/payments/verify'))
        .send({
          appointmentId,
          razorpayOrderId: order.id,
          razorpayPaymentId: `pay_dev_${Date.now()}`,
          razorpaySignature: 'dev_sig',
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.verified).toBe(true);
    });
  });

  // ── PATCH /patient/appointments/:id/cancel ────────────────────────────────
  describe('Cancel appointment', () => {
    test('cancels a BOOKED appointment', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(PATIENT_USER);
      global.prismaMock.appointment.findFirst.mockResolvedValueOnce({
        id: 'a1', status: 'BOOKED', queueItem: null,
        doctor: { user: { name: 'Dr. T' } }, appointmentDate: new Date(),
      });
      global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a1', status: 'CANCELLED' });

      const res = await authed(request(app).patch('/api/patient/appointments/a1/cancel'));
      expect(res.status).toBe(200);
    });
  });
});
