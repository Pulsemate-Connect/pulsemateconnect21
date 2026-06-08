'use strict';
/**
 * Integration tests — Admin journey (Phase 7)
 * Covers: dashboard, pending clinics, clinic approve/reject/request-changes,
 *         doctor approve, user management.
 *
 * Routes (admin.routes.js):
 *   GET  /api/admin/dashboard
 *   GET  /api/admin/pending-clinics
 *   PATCH /api/admin/clinics/:clinicId/approve
 *   PATCH /api/admin/clinics/:clinicId/reject
 *   PATCH /api/admin/clinics/:clinicId/request-changes
 *   PATCH /api/admin/doctors/:doctorId/approve
 *   PATCH /api/admin/doctors/:doctorId/reject
 *   GET  /api/admin/users
 *   PATCH /api/admin/users/:id/status
 */

const request = require('supertest');
const { app } = require('../../server');

jest.mock('../../services/email.service', () => ({
  sendClinicApprovedEmail: jest.fn().mockResolvedValue(undefined),
  sendClinicRejectedEmail: jest.fn().mockResolvedValue(undefined),
  sendClinicChangesRequestedEmail: jest.fn().mockResolvedValue(undefined),
  sendClinicSuspendedEmail: jest.fn().mockResolvedValue(undefined),
  sendTransactionalEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/audit.service', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/token.service', () => ({
  generateAccessToken: jest.fn(() => 'admin_token'),
  generateRefreshToken: jest.fn(() => 'admin_refresh'),
  verifyAccessToken: jest.fn((t) => {
    if (t === 'admin_token') return { sub: 'admin-1', role: 'SUPER_ADMIN' };
    throw new Error('invalid');
  }),
}));

// authenticateUser calls prisma.user.findUnique with include: { adminProfile, doctorProfile, ... }
// so every authed request needs a mock that includes adminProfile
const ADMIN_USER = {
  id: 'admin-1',
  name: 'Root Admin',
  mobile: '+919000000001',
  email: 'admin@pulsemate.in',
  role: 'SUPER_ADMIN',
  isActive: true,
  approvalStatus: 'VERIFIED',
  adminProfile: { id: 'ap1', level: 'ROOT' },  // ← required by requireSuperAdmin + requireAdminLevel
  doctorProfile: null,
  receptionistProfile: null,
  ownedClinics: [],
};

const authed = (req) => req.set('Authorization', 'Bearer admin_token');

// Helper: mock authenticateUser user lookup (always the first findUnique per request)
const mockAuth = () =>
  global.prismaMock.user.findUnique.mockResolvedValueOnce(ADMIN_USER);

// ── Clinic stub ───────────────────────────────────────────────────────────────
const PENDING_CLINIC = {
  id: 'clinic-1',
  name: 'City Clinic',
  ownerId: 'owner-1',
  approvalStatus: 'PENDING',
  owner: { id: 'owner-1', name: 'Dr. Owner', email: 'owner@clinic.com' },
};

// ─────────────────────────────────────────────────────────────────────────────
describe('Admin Journey Integration', () => {

  // ── GET /api/admin/dashboard ──────────────────────────────────────────────
  describe('GET /api/admin/dashboard', () => {
    test('returns dashboard stats and booking metrics', async () => {
      mockAuth();
      // getDashboard: 12 parallel queries
      global.prismaMock.user.count.mockResolvedValueOnce(120);
      global.prismaMock.clinic.count
        .mockResolvedValueOnce(3)   // PENDING
        .mockResolvedValueOnce(1)   // UNDER_REVIEW
        .mockResolvedValueOnce(5)   // VERIFIED
        .mockResolvedValueOnce(1)   // REJECTED
        .mockResolvedValueOnce(0)   // CHANGES_REQUIRED
        .mockResolvedValueOnce(0);  // SUSPENDED
      global.prismaMock.doctorProfile.count
        .mockResolvedValueOnce(2)   // pending doctors
        .mockResolvedValueOnce(8);  // verified doctors
      global.prismaMock.payment.count
        .mockResolvedValueOnce(10)  // freeBookings
        .mockResolvedValueOnce(45); // paidBookings
      global.prismaMock.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 450 } });

      const res = await authed(request(app).get('/api/admin/dashboard'));
      expect(res.status).toBe(200);
      expect(res.body.data.stats.totalUsers).toBe(120);
      expect(res.body.data.stats.verifiedClinics).toBe(5);
      expect(res.body.data.bookingMetrics.freeBookings).toBe(10);
      expect(res.body.data.bookingMetrics.paidBookings).toBe(45);
      expect(res.body.data.bookingMetrics.totalRevenue).toBe(450);
    });
  });

  // ── GET /api/admin/pending-clinics ────────────────────────────────────────
  describe('GET /api/admin/pending-clinics', () => {
    test('returns list of pending clinics', async () => {
      mockAuth();
      global.prismaMock.clinic.findMany.mockResolvedValueOnce([PENDING_CLINIC]);

      const res = await authed(request(app).get('/api/admin/pending-clinics'));
      expect(res.status).toBe(200);
      expect(res.body.data.clinics).toHaveLength(1);
      expect(res.body.data.clinics[0].approvalStatus).toBe('PENDING');
    });
  });

  // ── PATCH /api/admin/clinics/:clinicId/approve ────────────────────────────
  describe('PATCH /api/admin/clinics/:clinicId/approve', () => {
    test('approves a clinic successfully', async () => {
      mockAuth();
      global.prismaMock.clinic.findUnique.mockResolvedValueOnce(PENDING_CLINIC);
      // $transaction runs inline via setup.js — mock the three writes
      global.prismaMock.clinic.update.mockResolvedValueOnce({
        id: 'clinic-1', approvalStatus: 'VERIFIED', isVerified: true, isActive: true,
      });
      global.prismaMock.user.update.mockResolvedValueOnce({ id: 'owner-1', approvalStatus: 'VERIFIED' });
      // clinicVerificationLog.create — add to mockPrismaDb if missing
      if (!global.prismaMock.clinicVerificationLog) {
        global.prismaMock.clinicVerificationLog = { create: jest.fn().mockResolvedValue({}) };
      } else {
        global.prismaMock.clinicVerificationLog.create.mockResolvedValueOnce({});
      }

      const res = await authed(
        request(app).patch('/api/admin/clinics/clinic-1/approve')
      );
      expect(res.status).toBe(200);
    });

    test('returns 404 for unknown clinic', async () => {
      mockAuth();
      global.prismaMock.clinic.findUnique.mockResolvedValueOnce(null);

      const res = await authed(
        request(app).patch('/api/admin/clinics/ghost/approve')
      );
      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /api/admin/clinics/:clinicId/reject ─────────────────────────────
  describe('PATCH /api/admin/clinics/:clinicId/reject', () => {
    test('rejects a clinic with a reason', async () => {
      mockAuth();
      global.prismaMock.clinic.findUnique.mockResolvedValueOnce(PENDING_CLINIC);
      global.prismaMock.clinic.update.mockResolvedValueOnce({
        id: 'clinic-1', approvalStatus: 'REJECTED',
      });
      global.prismaMock.user.update.mockResolvedValueOnce({});
      if (!global.prismaMock.clinicVerificationLog) {
        global.prismaMock.clinicVerificationLog = { create: jest.fn().mockResolvedValue({}) };
      } else {
        global.prismaMock.clinicVerificationLog.create.mockResolvedValueOnce({});
      }

      const res = await authed(
        request(app)
          .patch('/api/admin/clinics/clinic-1/reject')
          .send({ rejectionReason: 'Documents not uploaded' })
      );
      expect(res.status).toBe(200);
    });
  });

  // ── PATCH /api/admin/clinics/:clinicId/request-changes ───────────────────
  describe('PATCH /api/admin/clinics/:clinicId/request-changes', () => {
    test('requests changes with a non-empty reason', async () => {
      mockAuth();
      global.prismaMock.clinic.findUnique.mockResolvedValueOnce(PENDING_CLINIC);
      global.prismaMock.clinic.update.mockResolvedValueOnce({
        id: 'clinic-1', approvalStatus: 'CHANGES_REQUIRED',
      });
      global.prismaMock.user.update.mockResolvedValueOnce({});
      if (!global.prismaMock.clinicVerificationLog) {
        global.prismaMock.clinicVerificationLog = { create: jest.fn().mockResolvedValue({}) };
      } else {
        global.prismaMock.clinicVerificationLog.create.mockResolvedValueOnce({});
      }

      const res = await authed(
        request(app)
          .patch('/api/admin/clinics/clinic-1/request-changes')
          .send({ reason: 'Please upload updated GST certificate' })
      );
      expect(res.status).toBe(200);
    });

    test('returns 400 when reason is empty', async () => {
      mockAuth();
      global.prismaMock.clinic.findUnique.mockResolvedValueOnce(PENDING_CLINIC);

      const res = await authed(
        request(app)
          .patch('/api/admin/clinics/clinic-1/request-changes')
          .send({ reason: '' })
      );
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /api/admin/doctors/:doctorId/approve ────────────────────────────
  describe('PATCH /api/admin/doctors/:doctorId/approve', () => {
    test('approves a doctor profile', async () => {
      mockAuth();
      global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({
        id: 'dp1', userId: 'doc-user-1', approvalStatus: 'PENDING',
      });
      global.prismaMock.doctorProfile.update.mockResolvedValueOnce({
        id: 'dp1', approvalStatus: 'VERIFIED', marketplaceVisible: true,
      });
      global.prismaMock.user.update.mockResolvedValueOnce({});

      const res = await authed(
        request(app).patch('/api/admin/doctors/dp1/approve')
      );
      expect(res.status).toBe(200);
    });

    test('returns 404 for unknown doctor', async () => {
      mockAuth();
      global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce(null);

      const res = await authed(
        request(app).patch('/api/admin/doctors/ghost/approve')
      );
      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/admin/users ──────────────────────────────────────────────────
  describe('GET /api/admin/users', () => {
    test('returns paginated user list', async () => {
      mockAuth();
      global.prismaMock.user.findMany.mockResolvedValueOnce([
        { id: 'u1', name: 'Alice', role: 'PATIENT', isActive: true, mobile: '9', adminProfile: null },
      ]);
      global.prismaMock.user.count.mockResolvedValueOnce(1);

      const res = await authed(request(app).get('/api/admin/users'));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  // ── PATCH /api/admin/users/:id/status ─────────────────────────────────────
  describe('PATCH /api/admin/users/:id/status', () => {
    test('disables a patient account', async () => {
      mockAuth();
      // updateUserStatus: findUnique target user
      global.prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'u2', role: 'PATIENT', isActive: true, adminProfile: null,
      });
      global.prismaMock.user.update.mockResolvedValueOnce({
        id: 'u2', name: 'Bob', role: 'PATIENT', isActive: false,
      });

      const res = await authed(
        request(app).patch('/api/admin/users/u2/status').send({ isActive: false })
      );
      expect(res.status).toBe(200);
    });

    test('returns 400 when admin tries to modify own account', async () => {
      mockAuth();

      const res = await authed(
        request(app).patch('/api/admin/users/admin-1/status').send({ isActive: false })
      );
      expect(res.status).toBe(400);
    });
  });

  // ── Unauthenticated request blocked ──────────────────────────────────────
  describe('Authorization guard', () => {
    test('returns 401 for missing token', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });

    test('returns 401 for tampered token', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer tampered.jwt');
      expect(res.status).toBe(401);
    });
  });
});
