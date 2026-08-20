const request = require('supertest');
const { app } = require('../../server');
const prisma = require('../../config/database');

describe('Session Time Validation', () => {
  let testClinic;
  let testUser;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        name: 'Session Test Owner',
        email: 'session-test@test.com',
        phone: '6666666666',
        role: 'CLINIC_OWNER',
        isVerified: true,
      },
    });

    testClinic = await prisma.clinic.create({
      data: {
        name: 'Session Validation Clinic',
        address: '321 Session St',
        city: 'Session City',
        state: 'Session State',
        pincode: '321654',
        phone: '5555555555',
        email: 'session@test.com',
        isVerified: true,
        isActive: true,
        userId: testUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.clinicSession.deleteMany({
      where: { clinicId: testClinic.id },
    });
    await prisma.clinic.delete({ where: { id: testClinic.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('MORNING session validation', () => {
    it('should accept valid morning times (6AM-12PM)', async () => {
      const validMorningTimes = [
        { startTime: '06:00', endTime: '12:00' },
        { startTime: '08:00', endTime: '11:00' },
        { startTime: '09:00', endTime: '12:00' },
      ];

      for (const times of validMorningTimes) {
        const response = await request(app)
          .post('/api/clinic-sessions')
          .send({
            clinicId: testClinic.id,
            sessionType: 'MORNING',
            ...times,
            maxPatients: 20,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        
        // Cleanup
        await prisma.clinicSession.delete({
          where: { id: response.body.session.id },
        });
      }
    });

    it('should reject morning session starting before 6AM', async () => {
      const response = await request(app)
        .post('/api/clinic-sessions')
        .send({
          clinicId: testClinic.id,
          sessionType: 'MORNING',
          startTime: '05:00',
          endTime: '10:00',
          maxPatients: 20,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('MORNING session start time must be between 6:00 AM - 12:00 PM');
    });

    it('should reject morning session starting after 12PM', async () => {
      const response = await request(app)
        .post('/api/clinic-sessions')
        .send({
          clinicId: testClinic.id,
          sessionType: 'MORNING',
          startTime: '14:00',
          endTime: '16:00',
          maxPatients: 20,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('MORNING session start time must be between 6:00 AM - 12:00 PM');
    });
  });

  describe('AFTERNOON session validation', () => {
    it('should accept valid afternoon times (12PM-6PM)', async () => {
      const validAfternoonTimes = [
        { startTime: '12:00', endTime: '18:00' },
        { startTime: '13:00', endTime: '17:00' },
        { startTime: '14:00', endTime: '18:00' },
      ];

      for (const times of validAfternoonTimes) {
        const response = await request(app)
          .post('/api/clinic-sessions')
          .send({
            clinicId: testClinic.id,
            sessionType: 'AFTERNOON',
            ...times,
            maxPatients: 20,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        
        await prisma.clinicSession.delete({
          where: { id: response.body.session.id },
        });
      }
    });

    it('should reject afternoon session starting before 12PM', async () => {
      const response = await request(app)
        .post('/api/clinic-sessions')
        .send({
          clinicId: testClinic.id,
          sessionType: 'AFTERNOON',
          startTime: '11:00',
          endTime: '15:00',
          maxPatients: 20,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('AFTERNOON session start time must be between 12:00 PM - 6:00 PM');
    });

    it('should reject afternoon session starting after 6PM', async () => {
      const response = await request(app)
        .post('/api/clinic-sessions')
        .send({
          clinicId: testClinic.id,
          sessionType: 'AFTERNOON',
          startTime: '19:00',
          endTime: '21:00',
          maxPatients: 20,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('AFTERNOON session start time must be between 12:00 PM - 6:00 PM');
    });
  });

  describe('EVENING session validation', () => {
    it('should accept valid evening times (6PM-11PM)', async () => {
      const validEveningTimes = [
        { startTime: '18:00', endTime: '23:00' },
        { startTime: '19:00', endTime: '22:00' },
        { startTime: '20:00', endTime: '23:00' },
      ];

      for (const times of validEveningTimes) {
        const response = await request(app)
          .post('/api/clinic-sessions')
          .send({
            clinicId: testClinic.id,
            sessionType: 'EVENING',
            ...times,
            maxPatients: 20,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        
        await prisma.clinicSession.delete({
          where: { id: response.body.session.id },
        });
      }
    });

    it('should reject evening session starting before 6PM', async () => {
      const response = await request(app)
        .post('/api/clinic-sessions')
        .send({
          clinicId: testClinic.id,
          sessionType: 'EVENING',
          startTime: '16:00',
          endTime: '20:00',
          maxPatients: 20,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('EVENING session start time must be between 6:00 PM - 11:00 PM');
    });

    it('should reject evening session starting after 11PM', async () => {
      const response = await request(app)
        .post('/api/clinic-sessions')
        .send({
          clinicId: testClinic.id,
          sessionType: 'EVENING',
          startTime: '23:30',
          endTime: '01:00',
          maxPatients: 20,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('EVENING session start time must be between 6:00 PM - 11:00 PM');
    });
  });

  describe('Session update validation', () => {
    let testSession;

    beforeEach(async () => {
      testSession = await prisma.clinicSession.create({
        data: {
          clinicId: testClinic.id,
          sessionType: 'MORNING',
          startTime: '08:00',
          endTime: '12:00',
          maxPatients: 20,
        },
      });
    });

    afterEach(async () => {
      await prisma.clinicSession.deleteMany({
        where: { clinicId: testClinic.id },
      });
    });

    it('should validate on update', async () => {
      const response = await request(app)
        .put(`/api/clinic-sessions/${testSession.id}`)
        .send({
          startTime: '16:00', // Invalid for MORNING
          endTime: '20:00',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('MORNING session start time must be between 6:00 AM - 12:00 PM');
    });

    it('should accept valid update', async () => {
      const response = await request(app)
        .put(`/api/clinic-sessions/${testSession.id}`)
        .send({
          startTime: '09:00',
          endTime: '11:00',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session.startTime).toBe('09:00');
    });
  });
});
