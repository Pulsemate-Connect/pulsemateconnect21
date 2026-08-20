/**
 * E2E CONCURRENCY TESTS - Critical Bug Fixes
 * 
 * Tests all 4 critical bugs under concurrent load:
 * - BUG #1: Duplicate slot booking prevention
 * - BUG #2: Session boundary validation  
 * - BUG #3: Free booking exploit prevention
 * - BUG #4: Queue number collision prevention
 * 
 * CRITICAL: These tests MUST pass before production deployment
 */

const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/database');
const { generateToken } = require('../../services/token.service');

describe('CRITICAL BUG FIXES - Concurrency Tests', () => {
  let clinic, doctorA, doctorB;
  let morningSession, afternoonSession, eveningSession;
  let patientTokens = [];
  let testDate;
  
  beforeAll(async () => {
    // Clean test data
    await prisma.appointment.deleteMany({ where: { clinic: { name: 'Concurrency Test Clinic' } } });
    await prisma.queueItem.deleteMany({});
    await prisma.queue.deleteMany({});
    
    // Create owner
    const owner = await prisma.user.create({
      data: {
        name: 'Concurrency Test Owner',
        mobile: '+919900001000',
        role: 'CLINIC_OWNER',
        approvalStatus: 'VERIFIED',
        isActive: true,
      },
    });
    
    // Create clinic
    clinic = await prisma.clinic.create({
      data: {
        name: 'Concurrency Test Clinic',
        city: 'Mumbai',
        approvalStatus: 'VERIFIED',
        isActive: true,
        address: 'Test Address',
        ownerId: owner.id,
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
        maxPatients: 100,
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
        maxPatients: 100,
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
        maxPatients: 100,
        avgConsultationMins: 10,
        enabled: true,
        sortOrder: 3,
      },
    });
    
    // Create Doctor A
    const userA = await prisma.user.create({
      data: {
        name: 'Dr. Concurrency A',
        mobile: '+919900001001',
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
    
    // Doctor A availability (Monday)
    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctorA.id,
        clinicId: clinic.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '21:00',
        slotDurationMin: 10,
        maxPatients: 100,
        isActive: true,
      },
    });
    
    // Create Doctor B  
    const userB = await prisma.user.create({
      data: {
        name: 'Dr. Concurrency B',
        mobile: '+919900001002',
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
    
    // Doctor B availability (Monday)
    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctorB.id,
        clinicId: clinic.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '21:00',
        slotDurationMin: 15,
        maxPatients: 100,
        isActive: true,
      },
    });
    
    // Create 60 test patients (for 50+ concurrent test)
    for (let i = 1; i <= 60; i++) {
      const user = await prisma.user.create({
        data: {
          name: `Concurrency Patient ${i}`,
          mobile: `+9199000${String(i + 1000).padStart(4, '0')}`,
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
    await prisma.doctorProfile.deleteMany({ where: { id: { in: [doctorA.id, doctorB.id] } } });
    await prisma.user.deleteMany({ where: { name: { contains: 'Concurrency' } } });
    await prisma.clinic.deleteMany({ where: { name: 'Concurrency Test Clinic' } });
    await prisma.$disconnect();
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUG #1: DUPLICATE SLOT BOOKING PREVENTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('BUG #1: Duplicate Slot Booking Prevention', () => {
    test('10 concurrent bookings for same slot - only 1 succeeds', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      const targetSlot = '09:30';
      
      console.log('\n🧪 Testing BUG #1: 10 concurrent requests for same slot...');
      
      // Fire 10 simultaneous requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/payments/initiate')
            .set('Authorization', `Bearer ${patientTokens[i].token}`)
            .send({
              doctorId: doctorA.id,
              clinicId: clinic.id,
              appointmentType: 'OFFLINE',
              appointmentDate: dateStr,
              slotTime: targetSlot,
              sessionId: morningSession.id,
              symptoms: `Concurrency test ${i + 1}`,
            })
        );
      }
      
      const results = await Promise.allSettled(promises);
      
      // Count successes and failures
      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      
      const conflicts = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 409
      );
      
      console.log(`✅ Successful: ${successful.length}`);
      console.log(`⚠️  Conflicts (409): ${conflicts.length}`);
      console.log(`❌ Errors: ${10 - successful.length - conflicts.length}`);
      
      // ✅ CRITICAL: Only ONE booking must succeed
      expect(successful.length).toBe(1);
      expect(conflicts.length).toBeGreaterThan(0);
      
      // Verify database has exactly ONE appointment for this slot
      const dbAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctorA.id,
          clinicId: clinic.id,
          appointmentDate: { gte: new Date(dateStr), lte: new Date(dateStr + 'T23:59:59Z') },
          slotTime: targetSlot,
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'] },
        },
      });
      
      expect(dbAppointments).toHaveLength(1);
      
      // Verify conflict responses have correct message
      if (conflicts.length > 0) {
        const conflictResponse = conflicts[0].value;
        expect(conflictResponse.body.message).toMatch(/no longer available|already booked/i);
      }
      
      console.log('✅ BUG #1 TEST PASSED: Duplicate bookings prevented');
    }, 30000);  // 30 second timeout
    
    test('50 concurrent bookings for same slot - only 1 succeeds', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      const targetSlot = '10:00';
      
      console.log('\n🧪 Testing BUG #1: 50 concurrent requests for same slot...');
      
      // Fire 50 simultaneous requests
      const promises = [];
      for (let i = 10; i < 60; i++) {
        promises.push(
          request(app)
            .post('/api/payments/initiate')
            .set('Authorization', `Bearer ${patientTokens[i].token}`)
            .send({
              doctorId: doctorA.id,
              clinicId: clinic.id,
              appointmentType: 'OFFLINE',
              appointmentDate: dateStr,
              slotTime: targetSlot,
              sessionId: morningSession.id,
            })
        );
      }
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      
      const conflicts = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 409
      );
      
      console.log(`✅ Successful: ${successful.length}`);
      console.log(`⚠️  Conflicts (409): ${conflicts.length}`);
      
      // ✅ CRITICAL: Only ONE booking must succeed
      expect(successful.length).toBe(1);
      expect(conflicts.length).toBe(49);
      
      // Verify database
      const dbCount = await prisma.appointment.count({
        where: {
          doctorId: doctorA.id,
          appointmentDate: { gte: new Date(dateStr) },
          slotTime: targetSlot,
          status: 'BOOKED',
        },
      });
      
      expect(dbCount).toBe(1);
      
      console.log('✅ BUG #1 STRESS TEST PASSED: 50 concurrent requests handled correctly');
    }, 60000);  // 60 second timeout
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUG #2: SESSION BOUNDARY VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('BUG #2: Session Boundary Validation', () => {
    test('Cannot book morning slot (09:30) with evening sessionId', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      
      console.log('\n🧪 Testing BUG #2: Session boundary validation...');
      
      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[0].token}`)
        .send({
          doctorId: doctorB.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '09:30',  // Morning time
          sessionId: eveningSession.id,  // ❌ Evening session
        });
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response message: ${response.body.message}`);
      
      // Must reject with 400
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/outside.*session|not available in this session/i);
      
      console.log('✅ BUG #2 TEST PASSED: Session boundary validated');
    });
    
    test('Cannot book slot outside any session (12:30 - lunch gap)', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[1].token}`)
        .send({
          doctorId: doctorB.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '12:30',  // ❌ Outside all sessions
          sessionId: morningSession.id,
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/outside.*session/i);
      
      console.log('✅ BUG #2 TEST PASSED: Lunch gap validated');
    });
    
    test('Can book valid slot within session boundaries', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      
      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[2].token}`)
        .send({
          doctorId: doctorB.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '14:30',  // ✅ Valid afternoon slot
          sessionId: afternoonSession.id,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      console.log('✅ BUG #2 TEST PASSED: Valid session booking allowed');
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUG #3: FREE BOOKING EXPLOIT PREVENTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('BUG #3: Free Booking Exploit Prevention', () => {
    test('Concurrent free booking requests - only 1 is free', async () => {
      // Create fresh user
      const newUser = await prisma.user.create({
        data: {
          name: 'Free Booking Test User',
          mobile: '+919900002000',
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isActive: true,
          freeBookingUsed: false,  // First booking should be free
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
      
      console.log('\n🧪 Testing BUG #3: Concurrent free booking exploit...');
      
      // Fire 5 simultaneous booking requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/payments/initiate')
            .set('Authorization', `Bearer ${token}`)
            .send({
              doctorId: doctorB.id,
              clinicId: clinic.id,
              appointmentType: 'OFFLINE',
              appointmentDate: dateStr,
              slotTime: `15:${String(i * 10).padStart(2, '0')}`,  // Different slots
              sessionId: afternoonSession.id,
            })
        );
      }
      
      const results = await Promise.allSettled(promises);
      
      // Count free vs paid bookings
      const freeBookings = results.filter(
        r => r.status === 'fulfilled' && 
             r.value.status === 200 && 
             r.value.body.data?.isFree === true
      );
      
      const paidBookings = results.filter(
        r => r.status === 'fulfilled' && 
             r.value.status === 200 && 
             r.value.body.data?.isFree === false
      );
      
      console.log(`✅ Free bookings: ${freeBookings.length}`);
      console.log(`💰 Paid bookings: ${paidBookings.length}`);
      
      // ✅ CRITICAL: Only ONE can be free
      expect(freeBookings.length).toBe(1);
      
      // Verify user's freeBookingUsed flag
      const updatedUser = await prisma.user.findUnique({
        where: { id: newUser.id },
        select: { freeBookingUsed: true, freeBookingUsedAt: true },
      });
      
      expect(updatedUser.freeBookingUsed).toBe(true);
      expect(updatedUser.freeBookingUsedAt).toBeDefined();
      
      console.log('✅ BUG #3 TEST PASSED: Free booking exploit prevented');
    }, 30000);
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUG #4: QUEUE NUMBER COLLISION PREVENTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('BUG #4: Queue Number Collision Prevention', () => {
    test('10 concurrent bookings - all get unique queue numbers', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      
      console.log('\n🧪 Testing BUG #4: 10 concurrent queue number assignments...');
      
      // Fire 10 simultaneous bookings
      const promises = [];
      for (let i = 3; i < 13; i++) {
        promises.push(
          request(app)
            .post('/api/payments/initiate')
            .set('Authorization', `Bearer ${patientTokens[i].token}`)
            .send({
              doctorId: doctorB.id,
              clinicId: clinic.id,
              appointmentType: 'OFFLINE',
              appointmentDate: dateStr,
              slotTime: `16:${String((i - 3) * 5).padStart(2, '0')}`,  // Different slots
              sessionId: afternoonSession.id,
            })
        );
      }
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      
      console.log(`✅ Successful bookings: ${successful.length}`);
      
      expect(successful.length).toBeGreaterThan(0);
      
      // Fetch all queue numbers
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctorB.id,
          clinicId: clinic.id,
          appointmentDate: { gte: new Date(dateStr) },
          sessionId: afternoonSession.id,
          status: 'BOOKED',
        },
        select: { id: true, queueNumber: true },
      });
      
      const queueNumbers = appointments.map(a => a.queueNumber).filter(q => q !== null);
      
      console.log(`Queue numbers assigned: ${queueNumbers.join(', ')}`);
      
      // ✅ CRITICAL: All queue numbers must be unique
      const uniqueNumbers = new Set(queueNumbers);
      expect(uniqueNumbers.size).toBe(queueNumbers.length);
      
      console.log('✅ BUG #4 TEST PASSED: All queue numbers unique');
    }, 30000);
    
    test('Two doctors - independent queue numbering', async () => {
      const dateStr = testDate.toISOString().split('T')[0];
      
      console.log('\n🧪 Testing BUG #4: Independent queues for two doctors...');
      
      // Book for Doctor A
      const responseA = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[13].token}`)
        .send({
          doctorId: doctorA.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '18:00',
          sessionId: eveningSession.id,
        });
      
      // Book for Doctor B
      const responseB = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${patientTokens[14].token}`)
        .send({
          doctorId: doctorB.id,
          clinicId: clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: dateStr,
          slotTime: '18:00',
          sessionId: eveningSession.id,
        });
      
      expect(responseA.status).toBe(200);
      expect(responseB.status).toBe(200);
      
      const apptA = responseA.body.data.appointment;
      const apptB = responseB.body.data.appointment;
      
      // Both can have queue #1 (independent queues per doctor)
      console.log(`Doctor A queue number: ${apptA.queueNumber}`);
      console.log(`Doctor B queue number: ${apptB.queueNumber}`);
      
      // Verify they belong to different queues
      const queueA = await prisma.queue.findFirst({
        where: {
          clinicId: clinic.id,
          doctorId: doctorA.id,
          date: new Date(dateStr),
          sessionId: eveningSession.id,
        },
      });
      
      const queueB = await prisma.queue.findFirst({
        where: {
          clinicId: clinic.id,
          doctorId: doctorB.id,
          date: new Date(dateStr),
          sessionId: eveningSession.id,
        },
      });
      
      expect(queueA.id).not.toBe(queueB.id);
      
      console.log('✅ BUG #4 TEST PASSED: Independent queues per doctor');
    });
  });
});
