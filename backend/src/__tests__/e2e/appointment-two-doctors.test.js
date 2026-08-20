/**
 * E2E Test: Two Doctors - Same Clinic
 * 
 * Tests that appointments for different doctors remain isolated:
 * - Doctor A's slots don't leak into Doctor B
 * - Doctor A's queue doesn't include Doctor B's patients
 * - Sessions work independently per doctor
 */

const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/database');
const { generateToken } = require('../../services/token.service');

describe('E2E: Two Doctors - Same Clinic', () => {
  let clinic, doctorA, doctorB;
  let patientTokens = [];
  let morningSession, afternoonSession, eveningSession;
  
  beforeAll(async () => {
    // Clean test data
    await prisma.appointment.deleteMany({ where: { clinic: { name: 'Test Clinic A' } } });
    await prisma.queueItem.deleteMany({});
    await prisma.queue.deleteMany({});
    
    // Create test clinic
    clinic = await prisma.clinic.create({
      data: {
        name: 'Test Clinic A',
        city: 'Mumbai',
        approvalStatus: 'VERIFIED',
        isActive: true,
        address: 'Test Address',
        ownerId: 'test-owner-id', // You'll need to create this
      },
    });
    
    // Create 3 sessions
    morningSession = await prisma.clinicSession.create({
      data: {
        clinicId: clinic.id,
        name: 'Morning',
        sessionType: 'MORNING',
        startTime: '09:00',
        endTime: '12:00',
        maxPatients: 20,
        avgConsultationMins: 10,
        enabled: true,
        sortOrder: 1,
      },
    });
    
    afternoonSession = await prisma.clinicSession.create({
      data: {
        clinicId: clinic.id,
        name: 'Afternoon',
        sessionType: 'AFTERNOON',
        startTime: '14:00',
        endTime: '17:00',
        maxPatients: 15,
        avgConsultationMins: 10,
        enabled: true,
        sortOrder: 2,
      },
    });

    
    eveningSession = await prisma.clinicSession.create({
      data: {
        clinicId: clinic.id,
        name: 'Evening',
        sessionType: 'EVENING',
        startTime: '18:00',
        endTime: '21:00',
        maxPatients: 10,
        avgConsultationMins: 10,
        enabled: true,
        sortOrder: 3,
      },
    });
    
    // Create Doctor A
    const userA = await prisma.user.create({
      data: {
        name: 'Dr. Test A',
        mobile: '+919900000101',
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        isActive: true,
      },
    });
    
    doctorA = await prisma.doctorProfile.create({
      data: {
        userId: userA.id,
        approvalStatus: 'VERIFIED',
        specialization: 'General Physician',
        consultationFee: 500,
        avgConsultationMins: 10,
        marketplaceVisible: true,
      },
    });
    
    await prisma.doctorClinic.create({
      data: {
        doctorId: doctorA.id,
        clinicId: clinic.id,
        inviteStatus: 'ACCEPTED',
        isActive: true,
        avgConsultationMins: 10,
      },
    });
    
    // Doctor A availability: 09:00-18:00 (Monday)
    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctorA.id,
        clinicId: clinic.id,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '18:00',
        slotDurationMin: 10,
        maxPatients: 30,
        isActive: true,
      },
    });
    
    // Create Doctor B
    const userB = await prisma.user.create({
      data: {
        name: 'Dr. Test B',
        mobile: '+919900000102',
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        isActive: true,
      },
    });
    
    doctorB = await prisma.doctorProfile.create({
      data: {
        userId: userB.id,
        approvalStatus: 'VERIFIED',
        specialization: 'Cardiologist',
        consultationFee: 800,
        avgConsultationMins: 15,
        marketplaceVisible: true,
      },
    });
    
    await prisma.doctorClinic.create({
      data: {
        doctorId: doctorB.id,
        clinicId: clinic.id,
        inviteStatus: 'ACCEPTED',
        isActive: true,
        avgConsultationMins: 15,
      },
    });
    
    // Doctor B availability: 10:00-19:00 (Monday) - different hours
    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctorB.id,
        clinicId: clinic.id,
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '19:00',
        slotDurationMin: 15,
        maxPatients: 20,
        isActive: true,
      },
    });
    
    // Create 6 test patients
    for (let i = 1; i <= 6; i++) {
      const user = await prisma.user.create({
        data: {
          name: `Test Patient ${i}`,
          mobile: `+9199000002${String(i).padStart(2, '0')}`,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isActive: true,
          freeBookingUsed: false, // First booking will be free
        },
      });
      
      await prisma.patientProfile.create({
        data: {
          userId: user.id,
          age: 25 + i,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          city: 'Mumbai',
        },
      });
      
      const token = generateToken({ sub: user.id, role: 'PATIENT' });
      patientTokens.push({ userId: user.id, token });
    }
  });
  
  afterAll(async () => {
    // Cleanup
    await prisma.appointment.deleteMany({ where: { clinicId: clinic.id } });
    await prisma.queueItem.deleteMany({});
    await prisma.queue.deleteMany({ where: { clinicId: clinic.id } });
    await prisma.doctorAvailability.deleteMany({ where: { clinicId: clinic.id } });
    await prisma.doctorClinic.deleteMany({ where: { clinicId: clinic.id } });
    await prisma.clinicSession.deleteMany({ where: { clinicId: clinic.id } });
    await prisma.doctorProfile.deleteMany({ where: { id: { in: [doctorA.id, doctorB.id] } } });
    await prisma.user.deleteMany({ where: { name: { startsWith: 'Test Patient' } } });
    await prisma.user.deleteMany({ where: { name: { startsWith: 'Dr. Test' } } });
    await prisma.clinic.deleteMany({ where: { name: 'Test Clinic A' } });
    await prisma.$disconnect();
  });
  
  describe('Slot Generation - Doctor Isolation', () => {
    test('Doctor A slots are independent from Doctor B', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Get Monday
      while (tomorrow.getDay() !== 1) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      // Fetch Doctor A slots
      const resA = await request(app)
        .get(`/api/doctor/${doctorA.id}/slots`)
        .query({ clinicId: clinic.id, date: dateStr });
      
      expect(resA.status).toBe(200);
      expect(resA.body.success).toBe(true);
      
      const slotsA = resA.body.data.slots;
      expect(slotsA.length).toBeGreaterThan(0);
      
      // Fetch Doctor B slots
      const resB = await request(app)
        .get(`/api/doctor/${doctorB.id}/slots`)
        .query({ clinicId: clinic.id, date: dateStr });
      
      expect(resB.status).toBe(200);
      
      const slotsB = resB.body.data.slots;
      expect(slotsB.length).toBeGreaterThan(0);
      
      // Verify different slot durations
      expect(resA.body.data.slotDurationMin).toBe(10); // Doctor A
      expect(resB.body.data.slotDurationMin).toBe(15); // Doctor B
      
      // Verify Doctor A has 09:00 slot (starts at 09:00)
      const slot9am = slotsA.find(s => s.time === '09:00');
      expect(slot9am).toBeDefined();
      
      // Verify Doctor B does NOT have 09:00 slot (starts at 10:00)
      const slot9amB = slotsB.find(s => s.time === '09:00');
      expect(slot9amB).toBeUndefined();
    });
    
    test('Booking Doctor A slot does not affect Doctor B availability', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      while (tomorrow.getDay() !== 1) tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      // Patient 1 books Doctor A at 10:00
      const bookingRes = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[0].token}`)
        .send({
          doctorId: doctorA.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '10:00',
          sessionId: morningSession.id,
          symptoms: 'Test symptoms',
        });
      
      expect(bookingRes.status).toBe(200);
      expect(bookingRes.body.data.isFree).toBe(true); // First booking free
      
      // Check Doctor A slots - 10:00 should be booked
      const resA = await request(app)
        .get(`/api/doctor/${doctorA.id}/slots`)
        .query({ clinicId: clinic.id, date: dateStr });
      
      const slot10A = resA.body.data.slots.find(s => s.time === '10:00');
      expect(slot10A.booked).toBe(true);
      expect(slot10A.available).toBe(false);
      
      // Check Doctor B slots - 10:00 should still be available
      const resB = await request(app)
        .get(`/api/doctor/${doctorB.id}/slots`)
        .query({ clinicId: clinic.id, date: dateStr });
      
      const slot10B = resB.body.data.slots.find(s => s.time === '10:00');
      expect(slot10B).toBeDefined();
      expect(slot10B.booked).toBe(false);
      expect(slot10B.available).toBe(true);
    });
  });
  
  describe('Queue Isolation', () => {
    test('Doctor A queue does not include Doctor B patients', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      while (tomorrow.getDay() !== 1) tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      // Patient 2 books Doctor A at 11:00
      await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[1].token}`)
        .send({
          doctorId: doctorA.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '11:00',
          sessionId: morningSession.id,
        });
      
      // Patient 3 books Doctor B at 11:00
      await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[2].token}`)
        .send({
          doctorId: doctorB.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '11:00',
          sessionId: morningSession.id,
        });
      
      // Fetch Doctor A queue
      const queueA = await request(app)
        .get(`/api/reception/queue/${doctorA.id}`)
        .query({ clinicId: clinic.id, sessionId: morningSession.id });
      
      expect(queueA.status).toBe(200);
      expect(queueA.body.data.queueItems).toBeDefined();
      
      // Should have 2 patients (from previous test + this test)
      const patientIds = queueA.body.data.queueItems.map(item => item.patientId);
      expect(patientIds).toContain(patientTokens[0].userId); // Patient 1
      expect(patientIds).toContain(patientTokens[1].userId); // Patient 2
      expect(patientIds).not.toContain(patientTokens[2].userId); // Patient 3 - Doctor B
      
      // Fetch Doctor B queue
      const queueB = await request(app)
        .get(`/api/reception/queue/${doctorB.id}`)
        .query({ clinicId: clinic.id, sessionId: morningSession.id });
      
      expect(queueB.status).toBe(200);
      const patientIdsB = queueB.body.data.queueItems.map(item => item.patientId);
      expect(patientIdsB).toContain(patientTokens[2].userId); // Patient 3
      expect(patientIdsB).not.toContain(patientTokens[0].userId); // Patient 1 - Doctor A
    });
  });
  
  describe('Session Separation Per Doctor', () => {
    test('Morning appointments do not appear in afternoon session', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      while (tomorrow.getDay() !== 1) tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      // Patient 4 books Doctor A - Afternoon at 14:30
      await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[3].token}`)
        .send({
          doctorId: doctorA.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '14:30',
          sessionId: afternoonSession.id,
        });
      
      // Fetch morning queue
      const morningQueue = await request(app)
        .get(`/api/reception/queue/${doctorA.id}`)
        .query({ clinicId: clinic.id, sessionId: morningSession.id });
      
      const morningPatients = morningQueue.body.data.queueItems.map(item => item.patientId);
      expect(morningPatients).not.toContain(patientTokens[3].userId); // Patient 4 not in morning
      
      // Fetch afternoon queue
      const afternoonQueue = await request(app)
        .get(`/api/reception/queue/${doctorA.id}`)
        .query({ clinicId: clinic.id, sessionId: afternoonSession.id });
      
      const afternoonPatients = afternoonQueue.body.data.queueItems.map(item => item.patientId);
      expect(afternoonPatients).toContain(patientTokens[3].userId); // Patient 4 in afternoon
    });
  });
});
