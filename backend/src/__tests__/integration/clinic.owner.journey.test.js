'use strict';
/**
 * Integration tests — Clinic Owner journey (Phase 6)
 * Covers: my clinics, revenue, booking metrics, appointments, staff list
 *
 * Routes (clinic.routes.js mounted at /api/clinic AND /api/clinics):
 *   GET  /api/clinics/my
 *   GET  /api/clinic/:id/revenue
 *   GET  /api/clinic/:id/booking-metrics
 *   GET  /api/clinic/:id/appointments
 *   GET  /api/clinics/:id/staff
 *
 * Middleware chain for :id routes with requireClinicVerified:
 *   authenticate → findUnique(userId, include:{adminProfile,...})
 *   authorize('CLINIC_OWNER') → checks role
 *   requireApprovalStatuses('VERIFIED') → checks user.approvalStatus
 *   requireClinicVerified → findUnique(clinicId) — needs VERIFIED + active clinic
 *   controller
 */

const request = require('supertest');
const { app } = require('../../server');

jest.mock('../../services/audit.service', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/token.service', () => ({
  generateAccessToken: jest.fn(() => 'owner_token'),
  generateRefreshToken: jest.fn(() => 'owner_refresh'),
  verifyAccessToken: jest.fn((t) => {
    if (t === 'owner_token') return { sub: 'owner-1', role: 'CLINIC_OWNER' };
    throw new Error('invalid');
  }),
}));

const OWNER_USER = {
  id: 'owner-1', name: 'Clinic Owner', mobile: '9999900030',
  role: 'CLINIC_OWNER', isActive: true, approvalStatus: 'VERIFIED',
  adminProfile: null,
  doctorProfile: null,
  receptionistProfile: null,
  ownedClinics: [{ id: 'clinic-1', name: 'Test Clinic', approvalStatus: 'VERIFIED', isActive: true }],
};

// A VERIFIED active clinic — returned by requireClinicVerified middleware
const VERIFIED_CLINIC = {
  id: 'clinic-1', name: 'Test Clinic',
  ownerId: 'owner-1',
  approvalStatus: 'VERIFIED',
  isActive: true,
};

const authed = (req) => req.set('Authorization', 'Bearer owner_token');

// Mock sequence for routes with requireClinicVerified:
//   1. authenticate  → user.findUnique (returns OWNER_USER)
//   2. requireClinicVerified → clinic.findUnique (returns VERIFIED_CLINIC)
const mockAuthAndClinic = () => {
  global.prismaMock.user.findUnique.mockResolvedValueOnce(OWNER_USER);
  global.prismaMock.clinic.findUnique.mockResolvedValueOnce(VERIFIED_CLINIC);
};

// ─────────────────────────────────────────────────────────────────────────────
describe('Clinic Owner Journey Integration', () => {

  // ── GET /api/clinics/my ───────────────────────────────────────────────────
  describe('GET /api/clinics/my', () => {
    test('returns list of owner clinics', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(OWNER_USER);
      global.prismaMock.clinic.findMany.mockResolvedValueOnce([
        { ...VERIFIED_CLINIC, _count: { clinicStaff: 3, appointments: 25 } },
      ]);

      const res = await authed(request(app).get('/api/clinics/my'));
      expect(res.status).toBe(200);
      expect(res.body.data.clinics).toHaveLength(1);
      expect(res.body.data.clinics[0].name).toBe('Test Clinic');
    });
  });

  // ── GET /api/clinic/:id/revenue ───────────────────────────────────────────
  describe('GET /api/clinic/:id/revenue', () => {
    test('returns revenue breakdown for today', async () => {
      mockAuthAndClinic();
      // getClinicRevenue: clinic.findFirst (access check), then payment.findMany, appointment.count x2, payment.count
      global.prismaMock.clinic.findFirst.mockResolvedValueOnce(VERIFIED_CLINIC);
      global.prismaMock.payment.findMany.mockResolvedValueOnce([
        {
          id: 'pay-1', amount: 10, status: 'PAID', method: 'RAZORPAY', paidAt: new Date(),
          appointment: {
            id: 'a1', slotTime: '10:00', appointmentDate: new Date(),
            doctor: { user: { name: 'Dr. Test' } },
          },
          patient: { id: 'p1', name: 'Alice', mobile: '9' },
        },
      ]);
      global.prismaMock.appointment.count
        .mockResolvedValueOnce(8)   // totalAppointments
        .mockResolvedValueOnce(5);  // completedToday
      global.prismaMock.payment.count.mockResolvedValueOnce(1); // pendingPayments

      const res = await authed(
        request(app).get('/api/clinic/clinic-1/revenue?period=today')
      );
      expect(res.status).toBe(200);
      expect(res.body.data.totalRevenue).toBe(10);
      expect(res.body.data.transactionCount).toBe(1);
      expect(res.body.data.stats.totalAppointments).toBe(8);
    });

    test('returns 403 when owner accesses a clinic they do not own', async () => {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(OWNER_USER);
      // requireClinicVerified: clinic exists but belongs to another owner
      global.prismaMock.clinic.findUnique.mockResolvedValueOnce({
        ...VERIFIED_CLINIC, ownerId: 'other-owner',
      });
      // getClinicRevenue access check: clinic.findFirst returns null (not owner)
      global.prismaMock.clinic.findFirst.mockResolvedValueOnce(null);

      const res = await authed(
        request(app).get('/api/clinic/clinic-1/revenue')
      );
      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/clinic/:id/booking-metrics ───────────────────────────────────
  describe('GET /api/clinic/:id/booking-metrics', () => {
    test('returns free vs paid booking breakdown', async () => {
      mockAuthAndClinic();
      global.prismaMock.clinic.findFirst.mockResolvedValueOnce(VERIFIED_CLINIC);
      global.prismaMock.payment.count
        .mockResolvedValueOnce(5)    // freeBookings (amount=0)
        .mockResolvedValueOnce(20);  // paidBookings (amount>0)

      const res = await authed(
        request(app).get('/api/clinic/clinic-1/booking-metrics')
      );
      expect(res.status).toBe(200);
      expect(res.body.data.freeBookings).toBe(5);
      expect(res.body.data.paidBookings).toBe(20);
      expect(res.body.data.totalBookings).toBe(25);
      expect(res.body.data.freeBookingRate).toBe(20); // round(5/25*100)
    });
  });

  // ── GET /api/clinic/:id/appointments ──────────────────────────────────────
  describe('GET /api/clinic/:id/appointments', () => {
    test('returns appointments for the clinic', async () => {
      // getClinicAppointments does NOT use requireClinicVerified — only authenticate + authorize
      global.prismaMock.user.findUnique.mockResolvedValueOnce(OWNER_USER);
      // Access check inside controller: clinic.findFirst (owner match)
      global.prismaMock.clinic.findFirst.mockResolvedValueOnce(VERIFIED_CLINIC);
      global.prismaMock.appointment.findMany.mockResolvedValueOnce([
        {
          id: 'a1', status: 'BOOKED', queueNumber: 1,
          patient: { id: 'p1', name: 'Alice', mobile: '9' },
          doctor: { user: { id: 'd-user', name: 'Dr. T' } },
          queueItem: null,
        },
      ]);
      global.prismaMock.appointment.count.mockResolvedValueOnce(1);

      const today = new Date().toISOString().split('T')[0];
      const res = await authed(
        request(app).get(`/api/clinic/clinic-1/appointments?date=${today}`)
      );
      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/clinics/:id/staff ────────────────────────────────────────────
  describe('GET /api/clinics/:id/staff', () => {
    test('returns staff list for the clinic', async () => {
      // getStaff: authenticate + authorize (CLINIC_OWNER | SUPER_ADMIN | RECEPTIONIST) — no requireClinicVerified
      global.prismaMock.user.findUnique.mockResolvedValueOnce(OWNER_USER);
      global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([
        {
          id: 'cs1', role: 'DOCTOR', isActive: true,
          user: {
            id: 'd-user', name: 'Dr. Test', mobile: '9', role: 'DOCTOR',
            doctorProfile: { id: 'dp1', specialization: 'General' },
          },
        },
      ]);

      const res = await authed(request(app).get('/api/clinics/clinic-1/staff'));
      expect(res.status).toBe(200);
      expect(res.body.data.staff).toHaveLength(1);
      expect(res.body.data.staff[0].role).toBe('DOCTOR');
    });
  });

  // ── Unauthenticated access blocked ────────────────────────────────────────
  describe('Authorization guard', () => {
    test('returns 401 for missing token', async () => {
      const res = await request(app).get('/api/clinics/my');
      expect(res.status).toBe(401);
    });
  });
});
