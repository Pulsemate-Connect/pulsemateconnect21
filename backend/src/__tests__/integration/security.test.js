'use strict';
/**
 * Security tests — JWT, authorization, IDOR, OTP abuse
 * Task 5.9
 */

const request = require('supertest');
const { app } = require('../../server');

jest.mock('../../services/token.service', () => ({
  generateAccessToken: jest.fn(() => 'valid_token'),
  generateRefreshToken: jest.fn(() => 'valid_refresh'),
  verifyAccessToken: jest.fn((t) => {
    if (t === 'valid_patient_token') return { sub: 'patient-1', role: 'PATIENT' };
    if (t === 'valid_doctor_token') return { sub: 'doctor-1', role: 'DOCTOR' };
    if (t === 'valid_patient2_token') return { sub: 'patient-2', role: 'PATIENT' };
    throw new Error('invalid or expired token');
  }),
}));

jest.mock('../../services/notification.service', () => ({
  notifyAppointmentBooked: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/fcm.service', () => ({}));

const PATIENT_1 = { id: 'patient-1', role: 'PATIENT', isActive: true, name: 'Alice' };
const PATIENT_2 = { id: 'patient-2', role: 'PATIENT', isActive: true, name: 'Bob' };
const DOCTOR_1 = { id: 'doctor-1', role: 'DOCTOR', isActive: true, name: 'Dr. T' };

describe('Security Tests', () => {
  // ── JWT validation ─────────────────────────────────────────────────────────
  describe('JWT attacks', () => {
    test('returns 401 for missing token', async () => {
      const res = await request(app).get('/api/patient/profile');
      expect(res.status).toBe(401);
    });

    test('returns 401 for tampered/invalid token', async () => {
      const res = await request(app)
        .get('/api/patient/profile')
        .set('Authorization', 'Bearer tampered.jwt.token');
      expect(res.status).toBe(401);
    });

    test('returns 401 for malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/patient/profile')
        .set('Authorization', 'NotBearer sometoken');
      expect(res.status).toBe(401);
    });
  });

  // ── Role-based authorization ───────────────────────────────────────────────
  describe('Broken authorization', () => {
    test('PATIENT cannot access admin routes', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(PATIENT_1);

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid_patient_token');

      expect(res.status).toBe(403);
    });

    test('DOCTOR cannot access admin clinic approval routes', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(DOCTOR_1);

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid_doctor_token');

      expect(res.status).toBe(403);
    });
  });

  // ── IDOR — Insecure Direct Object Reference ────────────────────────────────
  describe('IDOR prevention', () => {
    test("PATIENT cannot cancel another patient's appointment", async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(PATIENT_2);
      // findFirst with patientId filter returns null (not patient-2's appointment)
      global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/api/patient/appointments/a1/cancel')
        .set('Authorization', 'Bearer valid_patient2_token');

      expect(res.status).toBe(404);
    });
  });

  // ── Health check is public ─────────────────────────────────────────────────
  describe('Public routes', () => {
    test('GET /health returns 200 without authentication', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    test('Doctor search is public (no auth required)', async () => {
      global.prismaMock.doctorProfile.findMany.mockResolvedValueOnce([]);
      global.prismaMock.doctorProfile.count.mockResolvedValueOnce(0);

      const res = await request(app).get('/api/patient/doctors');
      expect(res.status).toBe(200);
    });
  });

  // ── Input validation ───────────────────────────────────────────────────────
  describe('Input validation', () => {
    test('returns 400 for invalid date in slot query', async () => {
      const res = await request(app)
        .get('/api/doctor/d1/slots?clinicId=c1&date=not-a-date');
      expect(res.status).toBe(400);
    });

    test('returns 400 when required params missing in slot query', async () => {
      const res = await request(app).get('/api/doctor/d1/slots');
      expect(res.status).toBe(400);
    });
  });
});
