const request = require('supertest');
const { app } = require('../../server');
const prisma = require('../../config/database');

describe('Booking Control Endpoints', () => {
  let testClinic;
  let testUser;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: 'Clinic Owner',
        email: 'owner-booking@test.com',
        phone: '8888888888',
        role: 'CLINIC_OWNER',
        isVerified: true,
      },
    });

    // Create test clinic
    testClinic = await prisma.clinic.create({
      data: {
        name: 'Booking Control Test Clinic',
        address: '789 Control St',
        city: 'Control City',
        state: 'Control State',
        pincode: '789012',
        phone: '7777777777',
        email: 'control@test.com',
        isVerified: true,
        isActive: true,
        userId: testUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.clinic.delete({ where: { id: testClinic.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/clinic/:id/bookings/stop', () => {
    it('should stop accepting bookings', async () => {
      const response = await request(app)
        .post(`/api/clinic/${testClinic.id}/bookings/stop`)
        .send({ reason: 'Emergency maintenance' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('stopped');
      expect(response.body.clinic.isActive).toBe(false);
      expect(response.body.clinic.suspendedReason).toBe('Emergency maintenance');

      // Verify in database
      const updated = await prisma.clinic.findUnique({
        where: { id: testClinic.id },
      });
      expect(updated.isActive).toBe(false);
      expect(updated.suspendedReason).toBe('Emergency maintenance');
    });

    it('should work without reason', async () => {
      const response = await request(app)
        .post(`/api/clinic/${testClinic.id}/bookings/stop`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clinic.isActive).toBe(false);
    });

    it('should return 404 for non-existent clinic', async () => {
      const response = await request(app)
        .post('/api/clinic/non-existent-id/bookings/stop')
        .send({ reason: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should be idempotent', async () => {
      // Stop twice
      await request(app)
        .post(`/api/clinic/${testClinic.id}/bookings/stop`)
        .send({ reason: 'First stop' })
        .expect(200);

      const response = await request(app)
        .post(`/api/clinic/${testClinic.id}/bookings/stop`)
        .send({ reason: 'Second stop' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clinic.isActive).toBe(false);
    });
  });

  describe('POST /api/clinic/:id/bookings/resume', () => {
    beforeEach(async () => {
      // Ensure clinic is stopped before each test
      await prisma.clinic.update({
        where: { id: testClinic.id },
        data: { isActive: false, suspendedReason: 'Test suspension' },
      });
    });

    it('should resume accepting bookings', async () => {
      const response = await request(app)
        .post(`/api/clinic/${testClinic.id}/bookings/resume`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('resumed');
      expect(response.body.clinic.isActive).toBe(true);
      expect(response.body.clinic.suspendedReason).toBeNull();

      // Verify in database
      const updated = await prisma.clinic.findUnique({
        where: { id: testClinic.id },
      });
      expect(updated.isActive).toBe(true);
      expect(updated.suspendedReason).toBeNull();
    });

    it('should return 404 for non-existent clinic', async () => {
      const response = await request(app)
        .post('/api/clinic/non-existent-id/bookings/resume')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should be idempotent', async () => {
      // Resume twice
      await request(app)
        .post(`/api/clinic/${testClinic.id}/bookings/resume`)
        .expect(200);

      const response = await request(app)
        .post(`/api/clinic/${testClinic.id}/bookings/resume`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clinic.isActive).toBe(true);
    });
  });

  describe('GET /api/clinic/:id/booking-status', () => {
    it('should return true when clinic is active', async () => {
      // Ensure clinic is active
      await prisma.clinic.update({
        where: { id: testClinic.id },
        data: { isActive: true, suspendedReason: null },
      });

      const response = await request(app)
        .get(`/api/clinic/${testClinic.id}/booking-status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.acceptingBookings).toBe(true);
      expect(response.body.clinic.isActive).toBe(true);
      expect(response.body.message).toContain('accepting bookings');
    });

    it('should return false when clinic is suspended', async () => {
      // Stop bookings
      await prisma.clinic.update({
        where: { id: testClinic.id },
        data: { isActive: false, suspendedReason: 'Maintenance' },
      });

      const response = await request(app)
        .get(`/api/clinic/${testClinic.id}/booking-status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.acceptingBookings).toBe(false);
      expect(response.body.clinic.isActive).toBe(false);
      expect(response.body.message).toBe('Maintenance');
    });

    it('should return 404 for non-existent clinic', async () => {
      const response = await request(app)
        .get('/api/clinic/non-existent-id/booking-status')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should be a public endpoint (no auth required)', async () => {
      const response = await request(app)
        .get(`/api/clinic/${testClinic.id}/booking-status`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Booking Control Workflow', () => {
    it('should complete stop → check → resume workflow', async () => {
      // 1. Stop bookings
      const stopResponse = await request(app)
        .post(`/api/clinic/${testClinic.id}/bookings/stop`)
        .send({ reason: 'Testing workflow' })
        .expect(200);

      expect(stopResponse.body.clinic.isActive).toBe(false);

      // 2. Check status
      const statusResponse = await request(app)
        .get(`/api/clinic/${testClinic.id}/booking-status`)
        .expect(200);

      expect(statusResponse.body.acceptingBookings).toBe(false);
      expect(statusResponse.body.message).toBe('Testing workflow');

      // 3. Resume bookings
      const resumeResponse = await request(app)
        .post(`/api/clinic/${testClinic.id}/bookings/resume`)
        .expect(200);

      expect(resumeResponse.body.clinic.isActive).toBe(true);

      // 4. Verify status is back to normal
      const finalStatusResponse = await request(app)
        .get(`/api/clinic/${testClinic.id}/booking-status`)
        .expect(200);

      expect(finalStatusResponse.body.acceptingBookings).toBe(true);
    });
  });
});
