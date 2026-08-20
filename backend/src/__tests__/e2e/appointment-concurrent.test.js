/**
 * E2E Test: Concurrent Booking Prevention
 * 
 * Tests that duplicate slot bookings are prevented when:
 * - Two patients try to book the same slot simultaneously
 * - Three+ patients race for the same slot
 * - Free booking race condition (two simultaneous first bookings)
 * - Queue number collision prevention
 */

const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/database');
const { generateToken } = require('../../services/token.service');

describe('E2E: Concurrent Booking Prevention', () => {
  let clinic, doctor, session;
  let patientTokens = [];
  let testDate;
  
  beforeAll(async () => {
    // Clean test data
    await prisma.appointment.deleteMany({ where: { clinic: { name: 'Concurrent Test Clinic' } } });
    await prisma.queueItem.deleteMany({});
    await prisma.queue.deleteMany({});
    
    // Create test clinic
    const owner = await prisma.user.create({
      data: {
        name: 'Test Owner Concurrent',
        mobile: '+919900000200',
        role: 'CLINIC_OWNER',
        approvalStatus: 'VERIFIED',
        isActive: true,
      },
    });
    
    clinic = await prisma.clinic.create({
      data: {
        name: 'Concurrent Test Clinic',
        city: 'Mumbai',
        approvalStatus: 'VERIFIED',
        isActive: true,
        address: 'Test Address',
        ownerId: owner.id,
      },
    });
    
    // Create session
    session = await prisma.clinicSession.create({
      data: {
        clinicId: clinic.id,
        name: 'Morning',
        sessionType: 'MORNING',
        startTime: '09:00',
        endTime: '12:00',
        maxPatients: 50,
        avgConsultationMins: 10,
        enabled: true,
        sortOrder: 1,
      },
    });
    
    // Create doctor
    const doctorUser = await prisma.user.create({
      data: {
        name: 'Dr. Concurrent Test',
        mobile: '+919900000201',
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        isActive: true,
      },
    });
    
    doctor = await prisma.doctorProfile.create({
      data: {
        userId: doctorUser.id,
        approvalStatus: 'VERIFIED',
        specialization: 'General Physician',
        consultationFee: 500,
        avgConsultationMins: 10,
        marketplaceVisible: true,
      },
    });
    
    await prisma.doctorClinic.create({
      data: {
        doctorId: doctor.id,
        clinicId: clinic.id,
        inviteStatus: 'ACCEPTED',
        isActive: true,
        avgConsultationMins: 10,
      },
    });
    
    // Doctor availability (Monday)
    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctor.id,
        clinicId: clinic.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDurationMin: 10,
        maxPatients: 50,
        isActive: true,
      },
    });
    
    // Create 10 test patients
    for (let i = 1; i <= 10; i++) {
      const user = await prisma.user.create({
        data: {
          name: `Concurrent Patient ${i}`,
          mobile: `+9199000003${String(i).padStart(2, '0')}`,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isActive: true,
          freeBookingUsed: false,
        },
      });
      
      await prisma.patientProfile.create({
        data: {
          userId: user.id,
          age: 25,
          gender: 'Male',
          city: 'Mumbai',
        },
      });
      
      const token = generateToken({ sub: user.id, role: 'PATIENT' });
      patientTokens.push({ userId: user.id, token });
    }
    
    // Calculate next Monday
    testDate = new Date();
    testDate.setDate(testDate.getDate() + 1);
    testDate.setHours(0, 0, 0, 0);
    while (testDate.getDay() !== 1) {
      testDate.setDate(testDate.getDate() + 1);
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
    await prisma.doctorProfile.deleteMany({ where: { id: doctor.id } });
    await prisma.user.deleteMany({ where: { name: { contains: 'Concurrent' } } });
    await prisma.clinic.deleteMany({ where: { name: 'Concurrent Test Clinic' } });
    await prisma.$disconnect();
  });
  
  describe('Duplicate Slot Prevention', () => {
    test('Two patients booking same slot - only one succeeds', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      const targetSlot = '09:30';
      
      // Fire two booking requests simultaneously
      const bookingPromises = [
        request(app)
          .post('/api/payments/initiate')
          .set('Authorization', `Bearer ${patientTokens[0].token}`)
          .send({
            doctorId: doctor.id,
            clinicId: clinic.id,
            appointmentType: 'OFFLINE',
            appointmentDate: dateStr,
            slotTime: targetSlot,
            sessionId: session.id,
            symptoms: 'Concurrent test 1',
          }),
        
        request(app)
          .post('/api/payments/initiate')
          .set('Authorization', `Bearer ${patientTokens[1].token}`)
          .send({
            doctorId: doctor.id,
            clinicId: clinic.id,
            appointmentType: 'OFFLINE',
            appointmentDate: dateStr,
            slotTime: targetSlot,
            sessionId: session.id,
            symptoms: 'Concurrent test 2',
          }),
      ];
      
      const results = await Promise.allSettled(bookingPromises);
      
      // Count successful bookings
      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      
      const failed = results.filter(
        r => r.status === 'fulfilled' && r.value.status !== 200
      );
      
      // CRITICAL: Only ONE booking should succeed
      expect(successful.length).toBe(1);
      expect(failed.length).toBe(1);
      
      // Verify database has only ONE appointment for this slot
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          clinicId: clinic.id,
          appointmentDate: { gte: new Date(dateStr), lte: new Date(dateStr + 'T23:59:59Z') },
          slotTime: targetSlot,
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'] },
        },
      });
      
      expect(appointments).toHaveLength(1);
      
      // Verify the failed request got proper error message
      const failedResponse = failed[0].value;
      expect(failedResponse.body.message).toMatch(/no longer available|already booked/i);
    });
    
    test('Three patients racing for same slot - only one succeeds', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      const targetSlot = '10:00';
      
      // Fire THREE requests at once
      const bookingPromises = [
        request(app)
          .post('/api/payments/initiate')
          .set('Authorization', `Bearer ${patientTokens[2].token}`)
          .send({
            doctorId: doctor.id,
            clinicId: clinic.id,
            appointmentType: 'OFFLINE',
            appointmentDate: dateStr,
            slotTime: targetSlot,
            sessionId: session.id,
          }),
        
        request(app)
          .post('/api/payments/initiate')
          .set('Authorization', `Bearer ${patientTokens[3].token}`)
          .send({
            doctorId: doctor.id,
            clinicId: clinic.id,
            appointmentType: 'OFFLINE',
            appointmentDate: dateStr,
            slotTime: targetSlot,
            sessionId: session.id,
          }),
        
        request(app)
          .post('/api/payments/initiate')
          .set('Authorization', `Bearer ${patientTokens[4].token}`)
          .send({
            doctorId: doctor.id,
            clinicId: clinic.id,
            appointmentType: 'OFFLINE',
            appointmentDate: dateStr,
            slotTime: targetSlot,
            sessionId: session.id,
          }),
      ];
      
      const results = await Promise.allSettled(bookingPromises);
      
      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      
      // Only ONE should succeed
      expect(successful.length).toBe(1);
      
      // Verify database
      const appointments = await prisma.appointment.count({
        where: {
          doctorId: doctor.id,
          appointmentDate: { gte: new Date(dateStr) },
          slotTime: targetSlot,
          status: 'BOOKED',
        },
      });
      
      expect(appointments).toBe(1);
    });
  });
  
  describe('Free Booking Race Condition', () => {
    test('User cannot exploit free booking with concurrent requests', async () => {
      // Create a fresh user with freeBookingUsed = false
      const newUser = await prisma.user.create({
        data: {
          name: 'Free Booking Test User',
          mobile: '+919900000299',
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isActive: true,
          freeBookingUsed: false, // First booking should be free
        },
      });
      
      await prisma.patientProfile.create({
        data: {
          userId: newUser.id,
          age: 30,
          gender: 'Male',
          city: 'Mumbai',
        },
      });
      
      const token = generateToken({ sub: newUser.id, role: 'PATIENT' });
      const dateStr = testDate.toISOString().split('T')[0];
      
      // Try to book TWO appointments simultaneously as "free"
      const bookingPromises = [
        request(app)
          .post('/api/payments/initiate')
          .set('Authorization', `Bearer ${token}`)
          .send({
            doctorId: doctor.id,
            clinicId: clinic.id,
            appointmentType: 'OFFLINE',
            appointmentDate: dateStr,
            slotTime: '11:00',
            sessionId: session.id,
          }),
        
        request(app)
          .post('/api/payments/initiate')
          .set('Authorization', `Bearer ${token}`)
          .send({
            doctorId: doctor.id,
            clinicId: clinic.id,
            appointmentType: 'OFFLINE',
            appointmentDate: dateStr,
            slotTime: '11:10',
            sessionId: session.id,
          }),
      ];
      
      const results = await Promise.allSettled(bookingPromises);
      
      // Both might succeed (different slots), but only ONE should be free
      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      
      const freeBookings = successful.filter(
        r => r.value.body.data?.isFree === true
      );
      
      // CRITICAL: Only ONE booking can be free
      expect(freeBookings.length).toBeLessThanOrEqual(1);
      
      // Verify user's freeBookingUsed flag
      const updatedUser = await prisma.user.findUnique({
        where: { id: newUser.id },
        select: { freeBookingUsed: true, freeBookingUsedAt: true },
      });
      
      expect(updatedUser.freeBookingUsed).toBe(true);
      expect(updatedUser.freeBookingUsedAt).toBeDefined();
    });
  });
  
  describe('Queue Number Collision Prevention', () => {
    test('Concurrent bookings get unique queue numbers', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      
      // Book 5 appointments concurrently
      const bookingPromises = [];
      for (let i = 5; i < 10; i++) {
        bookingPromises.push(
          request(app)
            .post('/api/payments/initiate')
            .set('Authorization', `Bearer ${patientTokens[i].token}`)
            .send({
              doctorId: doctor.id,
              clinicId: clinic.id,
              appointmentType: 'OFFLINE',
              appointmentDate: dateStr,
              slotTime: `09:${40 + (i - 5) * 2}`, // 09:40, 09:42, 09:44, etc.
              sessionId: session.id,
            })
        );
      }
      
      const results = await Promise.allSettled(bookingPromises);
      
      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      
      expect(successful.length).toBeGreaterThan(0);
      
      // Fetch all appointments
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          clinicId: clinic.id,
          appointmentDate: { gte: new Date(dateStr) },
          status: 'BOOKED',
        },
        select: { id: true, queueNumber: true },
      });
      
      // Extract queue numbers
      const queueNumbers = appointments.map(a => a.queueNumber).filter(q => q !== null);
      
      // Verify all queue numbers are unique
      const uniqueNumbers = new Set(queueNumbers);
      expect(uniqueNumbers.size).toBe(queueNumbers.length);
      
      console.log('Queue numbers assigned:', queueNumbers);
    });
  });
  
  describe('Slot Refresh After Booking', () => {
    test('Booked slot immediately disappears from availability', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      
      // Check slot availability BEFORE booking
      const beforeSlots = await request(app)
        .get(`/api/doctor/${doctor.id}/slots`)
        .query({ clinicId: clinic.id, date: dateStr });
      
      const slot1050 = beforeSlots.body.data.slots.find(s => s.time === '10:50');
      expect(slot1050?.available).toBe(true);
      
      // Book the slot
      await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[9].token}`)
        .send({
          doctorId: doctor.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '10:50',
          sessionId: session.id,
        });
      
      // Check slot availability AFTER booking
      const afterSlots = await request(app)
        .get(`/api/doctor/${doctor.id}/slots`)
        .query({ clinicId: clinic.id, date: dateStr });
      
      const slot1050After = afterSlots.body.data.slots.find(s => s.time === '10:50');
      expect(slot1050After.booked).toBe(true);
      expect(slot1050After.available).toBe(false);
    });
  });
});
