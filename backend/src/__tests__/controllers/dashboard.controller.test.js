const request = require('supertest');
const { app } = require('../../server');
const prisma = require('../../config/database');

describe('Dashboard Controller', () => {
  let testClinic;
  let testDoctor;
  let testAppointments;

  beforeAll(async () => {
    // Create test clinic
    testClinic = await prisma.clinic.create({
      data: {
        name: 'Test Dashboard Clinic',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        phone: '1234567890',
        email: 'dashboard@test.com',
        isVerified: true,
        isActive: true,
        userId: 'test-user-id',
      },
    });

    // Create test doctor
    testDoctor = await prisma.user.create({
      data: {
        name: 'Dr. Test',
        email: 'doctor@test.com',
        phone: '9876543210',
        role: 'DOCTOR',
        isVerified: true,
      },
    });

    // Link doctor to clinic
    await prisma.doctorClinic.create({
      data: {
        doctorId: testDoctor.id,
        clinicId: testClinic.id,
        isActive: true,
      },
    });

    // Create test appointments for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    testAppointments = await Promise.all([
      prisma.appointment.create({
        data: {
          patientId: 'patient-1',
          clinicId: testClinic.id,
          doctorId: testDoctor.id,
          appointmentDate: today,
          slotTime: '10:00 AM',
          status: 'CONFIRMED',
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: 'patient-2',
          clinicId: testClinic.id,
          doctorId: testDoctor.id,
          appointmentDate: today,
          slotTime: '11:00 AM',
          status: 'COMPLETED',
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: 'patient-3',
          clinicId: testClinic.id,
          doctorId: testDoctor.id,
          appointmentDate: today,
          slotTime: '12:00 PM',
          status: 'CANCELLED',
        },
      }),
    ]);

    // Create test transactions
    await Promise.all([
      prisma.transaction.create({
        data: {
          appointmentId: testAppointments[0].id,
          amount: 500,
          status: 'SUCCESS',
          transactionDate: today,
        },
      }),
      prisma.transaction.create({
        data: {
          appointmentId: testAppointments[1].id,
          amount: 500,
          status: 'SUCCESS',
          transactionDate: today,
        },
      }),
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.transaction.deleteMany({
      where: { appointmentId: { in: testAppointments.map(a => a.id) } },
    });
    await prisma.appointment.deleteMany({
      where: { clinicId: testClinic.id },
    });
    await prisma.doctorClinic.deleteMany({
      where: { clinicId: testClinic.id },
    });
    await prisma.clinic.delete({
      where: { id: testClinic.id },
    });
    await prisma.user.delete({
      where: { id: testDoctor.id },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/dashboard/clinic/:clinicId', () => {
    it('should return complete dashboard data', async () => {
      const response = await request(app)
        .get(`/api/dashboard/clinic/${testClinic.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('clinic');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('recentAppointments');

      // Verify clinic data
      expect(response.body.data.clinic.id).toBe(testClinic.id);
      expect(response.body.data.clinic.name).toBe(testClinic.name);

      // Verify stats structure
      const { stats } = response.body.data;
      expect(stats).toHaveProperty('today');
      expect(stats).toHaveProperty('totals');
      expect(stats).toHaveProperty('revenue');

      // Verify today's stats
      expect(stats.today.appointments).toBe(3);
      expect(stats.today.completed).toBe(1);
      expect(stats.today.pending).toBe(1);
      expect(stats.today.cancelled).toBe(1);
      expect(stats.today.revenue).toBe(1000);
      expect(stats.today.transactions).toBe(2);

      // Verify totals
      expect(stats.totals.doctors).toBe(1);
      expect(stats.totals.activeDoctors).toBe(1);

      // Verify recent appointments
      expect(Array.isArray(response.body.data.recentAppointments)).toBe(true);
      expect(response.body.data.recentAppointments.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent clinic', async () => {
      const response = await request(app)
        .get('/api/dashboard/clinic/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should handle clinic with no data gracefully', async () => {
      // Create empty clinic
      const emptyClinic = await prisma.clinic.create({
        data: {
          name: 'Empty Clinic',
          address: '456 Empty St',
          city: 'Empty City',
          state: 'Empty State',
          pincode: '654321',
          phone: '0000000000',
          email: 'empty@test.com',
          isVerified: true,
          isActive: true,
          userId: 'empty-user-id',
        },
      });

      const response = await request(app)
        .get(`/api/dashboard/clinic/${emptyClinic.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.today.appointments).toBe(0);
      expect(response.body.data.stats.today.revenue).toBe(0);
      expect(response.body.data.stats.totals.doctors).toBe(0);
      expect(response.body.data.recentAppointments).toEqual([]);

      // Cleanup
      await prisma.clinic.delete({ where: { id: emptyClinic.id } });
    });
  });

  describe('GET /api/dashboard/clinic/:clinicId/quick', () => {
    it('should return quick stats', async () => {
      const response = await request(app)
        .get(`/api/dashboard/clinic/${testClinic.id}/quick`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('todayAppointments');
      expect(response.body.data).toHaveProperty('activeDoctors');
      expect(response.body.data).toHaveProperty('activeQueue');

      expect(response.body.data.todayAppointments).toBe(3);
      expect(response.body.data.activeDoctors).toBe(1);
      expect(response.body.data.activeQueue).toBe(0);
    });

    it('should be faster than full dashboard', async () => {
      const startQuick = Date.now();
      await request(app)
        .get(`/api/dashboard/clinic/${testClinic.id}/quick`)
        .expect(200);
      const quickTime = Date.now() - startQuick;

      const startFull = Date.now();
      await request(app)
        .get(`/api/dashboard/clinic/${testClinic.id}`)
        .expect(200);
      const fullTime = Date.now() - startFull;

      // Quick endpoint should be faster
      expect(quickTime).toBeLessThan(fullTime);
    });

    it('should return 404 for non-existent clinic', async () => {
      const response = await request(app)
        .get('/api/dashboard/clinic/non-existent-id/quick')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Dashboard Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app).get(`/api/dashboard/clinic/${testClinic.id}`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should complete within acceptable time', async () => {
      const start = Date.now();
      await request(app)
        .get(`/api/dashboard/clinic/${testClinic.id}`)
        .expect(200);
      const duration = Date.now() - start;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
