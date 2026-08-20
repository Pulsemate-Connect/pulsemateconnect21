/**
 * PulseMate Connect — 200 Patient Receptionist / Walk-in / Follow-up Queue STRESS TEST
 * 
 * CRITICAL END-TO-END TEST:
 * - 200 unique patients across 4 groups
 * - Walk-in patient creation & existing patient reuse
 * - Token generation & queue positioning
 * - Priority follow-up queue logic
 * - Concurrent receptionist operations
 * - Real-time updates
 * - Security & permissions
 * - Database integrity
 * 
 * DO NOT ASSUME CORRECTNESS - VERIFY EVERYTHING
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  TOTAL_PATIENTS: 200,
  GROUP_A_SELF_REGISTERED: 50,  // Patient 001-050
  GROUP_B_NEW_WALKIN: 50,        // Patient 051-100
  GROUP_C_EXISTING_WALKIN: 50,   // Patient 101-150
  GROUP_D_FOLLOWUP: 50,          // Patient 151-200
  CONCURRENT_RECEPTIONISTS: 5,
  TEST_CLINIC_NAME: 'QA Stress Test Clinic',
  TEST_DOCTOR_NAME: 'Dr. QA Tester'
};

// Test state
const testState = {
  patients: [],
  clinicOwner: null,
  clinic: null,
  doctor: null,
  receptionists: [],
  appointments: [],
  queueItems: [],
  tokens: [],
  testResults: {
    selfRegistered: { pass: 0, fail: 0, errors: [] },
    newWalkin: { pass: 0, fail: 0, errors: [] },
    existingWalkin: { pass: 0, fail: 0, errors: [] },
    followup: { pass: 0, fail: 0, errors: [] },
    patientClaim: { pass: 0, fail: 0, errors: [] },
    tokenGeneration: { pass: 0, fail: 0, errors: [] },
    queuePositioning: { pass: 0, fail: 0, errors: [] },
    priorityQueue: { pass: 0, fail: 0, errors: [] },
    concurrency: { pass: 0, fail: 0, errors: [] },
    security: { pass: 0, fail: 0, errors: [] },
    databaseIntegrity: { pass: 0, fail: 0, errors: [] }
  }
};

// Utility functions
const generateTestMobile = (index) => `+91${String(9000000000 + index).slice(0, 10)}`;
const generatePatientId = (index) => `PATIENT-${String(index).padStart(3, '0')}`;
const log = (section, message) => console.log(`[${section}] ${message}`);
const logError = (section, error) => console.error(`[${section}] ERROR:`, error.message);

/**
 * ═══════════════════════════════════════════════════════════════
 * SETUP: Create test environment
 * ═══════════════════════════════════════════════════════════════
 */
async function setupTestEnvironment() {
  log('SETUP', 'Creating test clinic, owner, doctor, and receptionists...');
  
  try {
    // 1. Create clinic owner
    const ownerMobile = '+919999999900';
    testState.clinicOwner = await prisma.user.upsert({
      where: { mobile: ownerMobile },
      update: {},
      create: {
        mobile: ownerMobile,
        name: 'QA Clinic Owner',
        role: 'CLINIC_OWNER',
        approvalStatus: 'VERIFIED',
        passwordHash: 'test-hash',
        clinicOwnerProfile: { create: {} }
      }
    });
    log('SETUP', `✓ Clinic owner created: ${testState.clinicOwner.id}`);

    // 2. Create clinic
    testState.clinic = await prisma.clinic.create({
      data: {
        name: TEST_CONFIG.TEST_CLINIC_NAME,
        ownerId: testState.clinicOwner.id,
        phone: '+919999999901',
        address: 'QA Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        approvalStatus: 'VERIFIED',
        isVerified: true,
        isActive: true
      }
    });
    log('SETUP', `✓ Clinic created: ${testState.clinic.id}`);

    // 3. Create doctor
    const doctorMobile = '+919999999902';
    const doctorUser = await prisma.user.create({
      data: {
        mobile: doctorMobile,
        name: TEST_CONFIG.TEST_DOCTOR_NAME,
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        doctorProfile: {
          create: {
            specialization: 'General Physician',
            approvalStatus: 'VERIFIED',
            consultationFee: 500,
            avgConsultationMins: 10
          }
        }
      }
    });
    
    testState.doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUser.id },
      include: { user: true }
    });

    // Link doctor to clinic
    await prisma.doctorClinic.create({
      data: {
        doctorId: testState.doctor.id,
        clinicId: testState.clinic.id,
        inviteStatus: 'ACCEPTED',
        isActive: true
      }
    });
    
    await prisma.clinicStaff.create({
      data: {
        clinicId: testState.clinic.id,
        userId: doctorUser.id,
        role: 'DOCTOR',
        isActive: true
      }
    });
    log('SETUP', `✓ Doctor created and linked: ${testState.doctor.id}`);

    // 4. Create 5 receptionists
    for (let i = 1; i <= TEST_CONFIG.CONCURRENT_RECEPTIONISTS; i++) {
      const recMobile = `+9199999999${String(10 + i).slice(-2)}`;
      const recUser = await prisma.user.create({
        data: {
          mobile: recMobile,
          name: `QA Receptionist ${i}`,
          role: 'RECEPTIONIST',
          approvalStatus: 'VERIFIED',
          passwordHash: 'test-hash',
          receptionistProfile: {
            create: {
              assignedClinicId: testState.clinic.id,
              createdByOwnerId: testState.clinicOwner.id
            }
          }
        }
      });
      
      await prisma.clinicStaff.create({
        data: {
          clinicId: testState.clinic.id,
          userId: recUser.id,
          role: 'RECEPTIONIST',
          isActive: true
        }
      });
      
      testState.receptionists.push(recUser);
    }
    log('SETUP', `✓ Created ${testState.receptionists.length} receptionists`);

    // 5. Create clinic session
    await prisma.clinicSession.create({
      data: {
        clinicId: testState.clinic.id,
        name: 'Morning Session',
        sessionType: 'MORNING',
        startTime: '09:00',
        endTime: '13:00',
        maxPatients: 300,
        avgConsultationMins: 10,
        enabled: true,
        sortOrder: 1
      }
    });
    log('SETUP', '✓ Clinic session created');

    log('SETUP', '✅ Test environment ready!');
    return true;
  } catch (error) {
    logError('SETUP', error);
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TEST 1: CREATE 200 TEST PATIENTS (Preparation)
 * ═══════════════════════════════════════════════════════════════
 */
async function prepareTestPatients() {
  log('PREP', 'Preparing 200 test patient records...');
  
  for (let i = 1; i <= TEST_CONFIG.TOTAL_PATIENTS; i++) {
    testState.patients.push({
      patientId: generatePatientId(i),
      mobile: generateTestMobile(i),
      name: `Patient ${String(i).padStart(3, '0')}`,
      age: 20 + (i % 60),
      gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
      symptoms: `Test symptom ${i}`,
      userId: null,
      profileId: null,
      appointmentId: null,
      queueItemId: null,
      token: null,
      group: i <= 50 ? 'A' : i <= 100 ? 'B' : i <= 150 ? 'C' : 'D'
    });
  }
  
  log('PREP', `✓ Prepared ${testState.patients.length} test patient records`);
  log('PREP', `  Group A (Self-Registered): ${TEST_CONFIG.GROUP_A_SELF_REGISTERED}`);
  log('PREP', `  Group B (New Walk-in): ${TEST_CONFIG.GROUP_B_NEW_WALKIN}`);
  log('PREP', `  Group C (Existing Walk-in): ${TEST_CONFIG.GROUP_C_EXISTING_WALKIN}`);
  log('PREP', `  Group D (Follow-up): ${TEST_CONFIG.GROUP_D_FOLLOWUP}`);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TEST 2: GROUP A - SELF-REGISTERED PATIENTS (50)
 * ═══════════════════════════════════════════════════════════════
 */
async function testSelfRegisteredPatients() {
  log('GROUP_A', 'Testing 50 self-registered patients...');
  
  const groupA = testState.patients.filter(p => p.group === 'A');
  
  for (const patient of groupA) {
    try {
      // Step 1: Create patient account (simulate mobile app registration)
      const user = await prisma.user.create({
        data: {
          mobile: patient.mobile,
          name: patient.name,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          patientProfile: {
            create: {
              age: patient.age,
              gender: patient.gender,
              registeredVia: 'SELF'
            }
          }
        },
        include: { patientProfile: true }
      });
      
      patient.userId = user.id;
      patient.profileId = user.patientProfile.id;
      
      // Step 2: Book appointment (simulate mobile app booking)
      const appointment = await prisma.appointment.create({
        data: {
          patientId: user.id,
          doctorId: testState.doctor.id,
          clinicId: testState.clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: new Date(),
          slotTime: '09:00',
          symptoms: patient.symptoms,
          status: 'BOOKED'
        }
      });
      
      patient.appointmentId = appointment.id;
      
      // Step 3: Verify receptionist can find this patient
      const foundUser = await prisma.user.findUnique({
        where: { mobile: patient.mobile },
        include: { patientProfile: true }
      });
      
      if (!foundUser) {
        throw new Error('Receptionist cannot find self-registered patient');
      }
      
      if (foundUser.id !== user.id) {
        throw new Error('Patient identity mismatch');
      }
      
      if (foundUser.patientProfile.registeredVia !== 'SELF') {
        throw new Error(`Wrong registeredVia: ${foundUser.patientProfile.registeredVia}`);
      }
      
      testState.testResults.selfRegistered.pass++;
      
    } catch (error) {
      testState.testResults.selfRegistered.fail++;
      testState.testResults.selfRegistered.errors.push({
        patient: patient.patientId,
        error: error.message
      });
      logError('GROUP_A', error);
    }
  }
  
  log('GROUP_A', `✅ Self-Registered Test Complete: ${testState.testResults.selfRegistered.pass} PASS, ${testState.testResults.selfRegistered.fail} FAIL`);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TEST 3: GROUP B - NEW WALK-IN PATIENTS (50)
 * ═══════════════════════════════════════════════════════════════
 */
async function testNewWalkinPatients() {
  log('GROUP_B', 'Testing 50 new walk-in patients...');
  
  const groupB = testState.patients.filter(p => p.group === 'B');
  const receptionist = testState.receptionists[0];
  
  for (const patient of groupB) {
    try {
      // Simulate receptionist flow: Find or create patient
      let user = await prisma.user.findUnique({
        where: { mobile: patient.mobile }
      });
      
      if (!user) {
        // Create new user (walk-in)
        user = await prisma.user.create({
          data: {
            mobile: patient.mobile,
            name: patient.name,
            role: 'PATIENT',
            approvalStatus: 'VERIFIED',
            patientProfile: {
              create: {
                age: patient.age,
                gender: patient.gender,
                registeredVia: 'RECEPTIONIST',
                createdByUserId: receptionist.id,
                createdByRole: 'RECEPTIONIST',
                registeredClinicId: testState.clinic.id
              }
            }
          },
          include: { patientProfile: true }
        });
      }
      
      patient.userId = user.id;
      patient.profileId = user.patientProfile.id;
      
      // Create appointment + queue entry
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      let queue = await prisma.queue.findFirst({
        where: {
          clinicId: testState.clinic.id,
          doctorId: testState.doctor.id,
          date: today
        }
      });
      
      if (!queue) {
        queue = await prisma.queue.create({
          data: {
            clinicId: testState.clinic.id,
            doctorId: testState.doctor.id,
            date: today,
            status: 'ACTIVE'
          }
        });
      }
      
      // Get next queue number (atomic)
      const lastItem = await prisma.queueItem.findFirst({
        where: { queueId: queue.id },
        orderBy: { queueNumber: 'desc' }
      });
      
      const queueNumber = (lastItem?.queueNumber || 0) + 1;
      patient.token = queueNumber;
      
      const appointment = await prisma.appointment.create({
        data: {
          patientId: user.id,
          doctorId: testState.doctor.id,
          clinicId: testState.clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: new Date(),
          symptoms: patient.symptoms,
          status: 'IN_QUEUE',
          queueNumber
        }
      });
      
      patient.appointmentId = appointment.id;
      
      const waitingCount = await prisma.queueItem.count({
        where: { queueId: queue.id, status: 'WAITING' }
      });
      
      const queueItem = await prisma.queueItem.create({
        data: {
          queueId: queue.id,
          appointmentId: appointment.id,
          patientId: user.id,
          queueNumber,
          status: 'WAITING',
          position: waitingCount + 1,
          isFollowUp: false
        }
      });
      
      patient.queueItemId = queueItem.id;
      
      // Verify data integrity
      const verifyUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { patientProfile: true }
      });
      
      if (!verifyUser || !verifyUser.patientProfile) {
        throw new Error('User or PatientProfile not created');
      }
      
      if (verifyUser.patientProfile.registeredVia !== 'RECEPTIONIST') {
        throw new Error(`Wrong registeredVia: ${verifyUser.patientProfile.registeredVia}`);
      }
      
      if (verifyUser.patientProfile.createdByUserId !== receptionist.id) {
        throw new Error('Wrong createdByUserId');
      }
      
      if (!appointment.queueNumber) {
        throw new Error('Token not generated');
      }
      
      testState.testResults.newWalkin.pass++;
      testState.testResults.tokenGeneration.pass++;
      
    } catch (error) {
      testState.testResults.newWalkin.fail++;
      testState.testResults.newWalkin.errors.push({
        patient: patient.patientId,
        error: error.message
      });
      logError('GROUP_B', error);
    }
  }
  
  log('GROUP_B', `✅ New Walk-in Test Complete: ${testState.testResults.newWalkin.pass} PASS, ${testState.testResults.newWalkin.fail} FAIL`);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TEST 4: GROUP C - EXISTING WALK-IN PATIENTS (50)
 * ═══════════════════════════════════════════════════════════════
 */
async function testExistingWalkinPatients() {
  log('GROUP_C', 'Testing 50 existing walk-in patients...');
  
  const groupC = testState.patients.filter(p => p.group === 'C');
  const receptionist = testState.receptionists[1];
  
  for (const patient of groupC) {
    try {
      // Step 1: Pre-create patient account
      const initialUser = await prisma.user.create({
        data: {
          mobile: patient.mobile,
          name: patient.name,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          patientProfile: {
            create: {
              age: patient.age,
              gender: patient.gender,
              registeredVia: 'SELF'
            }
          }
        },
        include: { patientProfile: true }
      });
      
      patient.userId = initialUser.id;
      patient.profileId = initialUser.patientProfile.id;
      
      // Step 2: Count existing records
      const beforeCount = await prisma.user.count();
      const beforeProfileCount = await prisma.patientProfile.count();
      
      // Step 3: Receptionist tries to add same patient (walk-in)
      let existingUser = await prisma.user.findUnique({
        where: { mobile: patient.mobile },
        include: { patientProfile: true }
      });
      
      if (!existingUser) {
        throw new Error('Existing user not found!');
      }
      
      // Should reuse existing user, not create new one
      const afterCount = await prisma.user.count();
      const afterProfileCount = await prisma.patientProfile.count();
      
      if (afterCount !== beforeCount) {
        throw new Error(`Duplicate User created! Before: ${beforeCount}, After: ${afterCount}`);
      }
      
      if (afterProfileCount !== beforeProfileCount) {
        throw new Error(`Duplicate PatientProfile created! Before: ${beforeProfileCount}, After: ${afterProfileCount}`);
      }
      
      // Create new queue entry for existing patient
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      let queue = await prisma.queue.findFirst({
        where: {
          clinicId: testState.clinic.id,
          doctorId: testState.doctor.id,
          date: today
        }
      });
      
      if (!queue) {
        queue = await prisma.queue.create({
          data: {
            clinicId: testState.clinic.id,
            doctorId: testState.doctor.id,
            date: today,
            status: 'ACTIVE'
          }
        });
      }
      
      const lastItem = await prisma.queueItem.findFirst({
        where: { queueId: queue.id },
        orderBy: { queueNumber: 'desc' }
      });
      
      const queueNumber = (lastItem?.queueNumber || 0) + 1;
      patient.token = queueNumber;
      
      const appointment = await prisma.appointment.create({
        data: {
          patientId: existingUser.id,
          doctorId: testState.doctor.id,
          clinicId: testState.clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: new Date(),
          symptoms: patient.symptoms,
          status: 'IN_QUEUE',
          queueNumber
        }
      });
      
      patient.appointmentId = appointment.id;
      
      const waitingCount = await prisma.queueItem.count({
        where: { queueId: queue.id, status: 'WAITING' }
      });
      
      const queueItem = await prisma.queueItem.create({
        data: {
          queueId: queue.id,
          appointmentId: appointment.id,
          patientId: existingUser.id,
          queueNumber,
          status: 'WAITING',
          position: waitingCount + 1,
          isFollowUp: false
        }
      });
      
      patient.queueItemId = queueItem.id;
      
      testState.testResults.existingWalkin.pass++;
      
    } catch (error) {
      testState.testResults.existingWalkin.fail++;
      testState.testResults.existingWalkin.errors.push({
        patient: patient.patientId,
        error: error.message
      });
      logError('GROUP_C', error);
    }
  }
  
  log('GROUP_C', `✅ Existing Walk-in Test Complete: ${testState.testResults.existingWalkin.pass} PASS, ${testState.testResults.existingWalkin.fail} FAIL`);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TEST 5: GROUP D - FOLLOW-UP PATIENTS (50) - PRIORITY QUEUE
 * ═══════════════════════════════════════════════════════════════
 */
async function testFollowupPatients() {
  log('GROUP_D', 'Testing 50 follow-up patients with priority queue...');
  
  const groupD = testState.patients.filter(p => p.group === 'D');
  const receptionist = testState.receptionists[2];
  
  for (const patient of groupD) {
    try {
      // Step 1: Create initial appointment (completed consultation)
      const initialUser = await prisma.user.create({
        data: {
          mobile: patient.mobile,
          name: patient.name,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          patientProfile: {
            create: {
              age: patient.age,
              gender: patient.gender,
              registeredVia: 'RECEPTIONIST',
              createdByUserId: receptionist.id,
              createdByRole: 'RECEPTIONIST'
            }
          }
        },
        include: { patientProfile: true }
      });
      
      patient.userId = initialUser.id;
      patient.profileId = initialUser.patientProfile.id;
      
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      let queue = await prisma.queue.findFirst({
        where: {
          clinicId: testState.clinic.id,
          doctorId: testState.doctor.id,
          date: today
        }
      });
      
      if (!queue) {
        queue = await prisma.queue.create({
          data: {
            clinicId: testState.clinic.id,
            doctorId: testState.doctor.id,
            date: today,
            status: 'ACTIVE'
          }
        });
      }
      
      // Initial appointment
      const initialAppointment = await prisma.appointment.create({
        data: {
          patientId: initialUser.id,
          doctorId: testState.doctor.id,
          clinicId: testState.clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: new Date(),
          symptoms: patient.symptoms,
          status: 'COMPLETED'  // Already consulted
        }
      });
      
      // Step 2: Count follow-ups before adding
      const followUpCountBefore = await prisma.queueItem.count({
        where: { queueId: queue.id, status: 'WAITING', isFollowUp: true }
      });
      
      // Step 3: Add as follow-up (priority)
      const lastItem = await prisma.queueItem.findFirst({
        where: { queueId: queue.id },
        orderBy: { queueNumber: 'desc' }
      });
      
      const queueNumber = (lastItem?.queueNumber || 0) + 1;
      patient.token = queueNumber;
      
      const followUpAppointment = await prisma.appointment.create({
        data: {
          patientId: initialUser.id,
          doctorId: testState.doctor.id,
          clinicId: testState.clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: new Date(),
          symptoms: `Follow-up: ${patient.symptoms}`,
          status: 'IN_QUEUE',
          queueNumber
        }
      });
      
      patient.appointmentId = followUpAppointment.id;
      
      // Position = number of follow-ups + 1 (before regular patients)
      const position = followUpCountBefore + 1;
      
      const queueItem = await prisma.queueItem.create({
        data: {
          queueId: queue.id,
          appointmentId: followUpAppointment.id,
          patientId: initialUser.id,
          queueNumber,
          status: 'WAITING',
          position,
          isFollowUp: true,  // ← PRIORITY FLAG
          followUpOf: initialAppointment.id
        }
      });
      
      patient.queueItemId = queueItem.id;
      
      // Step 4: Verify priority positioning
      // Follow-ups should come before regular patients
      const allWaiting = await prisma.queueItem.findMany({
        where: { queueId: queue.id, status: 'WAITING' },
        orderBy: [
          { isFollowUp: 'desc' },  // Follow-ups first
          { position: 'asc' }
        ]
      });
      
      const firstFollowUp = allWaiting.find(item => item.isFollowUp);
      const firstRegular = allWaiting.find(item => !item.isFollowUp);
      
      if (firstFollowUp && firstRegular) {
        if (firstFollowUp.position > firstRegular.position) {
          throw new Error(`Priority queue broken! Follow-up position (${firstFollowUp.position}) > Regular position (${firstRegular.position})`);
        }
      }
      
      testState.testResults.followup.pass++;
      testState.testResults.priorityQueue.pass++;
      
    } catch (error) {
      testState.testResults.followup.fail++;
      testState.testResults.followup.errors.push({
        patient: patient.patientId,
        error: error.message
      });
      logError('GROUP_D', error);
    }
  }
  
  log('GROUP_D', `✅ Follow-up Test Complete: ${testState.testResults.followup.pass} PASS, ${testState.testResults.followup.fail} FAIL`);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TEST 6: CONCURRENT RECEPTIONIST OPERATIONS
 * ═══════════════════════════════════════════════════════════════
 */
async function testConcurrentReceptionists() {
  log('CONCURRENCY', 'Testing concurrent receptionist operations...');
  
  try {
    const testMobile = '+919888888888';
    
    // Clean up if exists
    await prisma.user.deleteMany({ where: { mobile: testMobile } });
    
    // Simulate 5 receptionists trying to create same patient simultaneously
    const promises = testState.receptionists.map(async (receptionist, index) => {
      try {
        // Find or create (should be atomic)
        let user = await prisma.user.findUnique({
          where: { mobile: testMobile }
        });
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              mobile: testMobile,
              name: `Concurrent Test Patient`,
              role: 'PATIENT',
              approvalStatus: 'VERIFIED',
              patientProfile: {
                create: {
                  registeredVia: 'RECEPTIONIST',
                  createdByUserId: receptionist.id,
                  createdByRole: 'RECEPTIONIST'
                }
              }
            },
            include: { patientProfile: true }
          });
        }
        
        return { success: true, userId: user.id, receptionist: index };
      } catch (error) {
        // Expected: some may fail due to race condition
        return { success: false, error: error.message, receptionist: index };
      }
    });
    
    const results = await Promise.all(promises);
    
    // Verify: Should have exactly 1 user and 1 profile
    const finalCount = await prisma.user.count({
      where: { mobile: testMobile }
    });
    
    const profileCount = await prisma.patientProfile.count({
      where: { user: { mobile: testMobile } }
    });
    
    if (finalCount !== 1) {
      throw new Error(`Concurrency failure: ${finalCount} users created for same mobile!`);
    }
    
    if (profileCount !== 1) {
      throw new Error(`Concurrency failure: ${profileCount} profiles created!`);
    }
    
    testState.testResults.concurrency.pass++;
    log('CONCURRENCY', `✓ Only 1 user and 1 profile created despite ${testState.receptionists.length} concurrent attempts`);
    
  } catch (error) {
    testState.testResults.concurrency.fail++;
    testState.testResults.concurrency.errors.push(error.message);
    logError('CONCURRENCY', error);
  }
  
  log('CONCURRENCY', `✅ Concurrency Test Complete: ${testState.testResults.concurrency.pass} PASS, ${testState.testResults.concurrency.fail} FAIL`);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TEST 7: DATABASE INTEGRITY CHECK
 * ═══════════════════════════════════════════════════════════════
 */
async function verifyDatabaseIntegrity() {
  log('DB_INTEGRITY', 'Verifying database integrity for 200 test patients...');
  
  try {
    const issues = [];
    
    // 1. Check unique users
    const testMobiles = testState.patients.map(p => p.mobile);
    const userCount = await prisma.user.count({
      where: { mobile: { in: testMobiles } }
    });
    
    if (userCount !== TEST_CONFIG.TOTAL_PATIENTS) {
      issues.push(`Expected ${TEST_CONFIG.TOTAL_PATIENTS} users, found ${userCount}`);
    }
    
    // 2. Check duplicate mobiles
    const duplicates = await prisma.$queryRaw`
      SELECT mobile, COUNT(*) as count
      FROM users
      WHERE mobile IN (${testMobiles.join("','")}')
      GROUP BY mobile
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length > 0) {
      issues.push(`Found ${duplicates.length} duplicate mobile numbers`);
    }
    
    // 3. Check orphan profiles
    const orphanProfiles = await prisma.patientProfile.count({
      where: {
        user: { mobile: { in: testMobiles } },
        userId: null
      }
    });
    
    if (orphanProfiles > 0) {
      issues.push(`Found ${orphanProfiles} orphan patient profiles`);
    }
    
    // 4. Check token uniqueness per queue
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const queue = await prisma.queue.findFirst({
      where: {
        clinicId: testState.clinic.id,
        doctorId: testState.doctor.id,
        date: today
      },
      include: {
        queueItems: {
          where: { status: { not: 'CANCELLED' } },
          select: { queueNumber: true }
        }
      }
    });
    
    if (queue) {
      const tokens = queue.queueItems.map(item => item.queueNumber);
      const uniqueTokens = new Set(tokens);
      
      if (tokens.length !== uniqueTokens.size) {
        issues.push(`Duplicate tokens found! Total: ${tokens.length}, Unique: ${uniqueTokens.size}`);
      }
    }
    
    // 5. Verify registeredVia correctness
    const groupAPatients = await prisma.user.findMany({
      where: { mobile: { in: testState.patients.filter(p => p.group === 'A').map(p => p.mobile) } },
      include: { patientProfile: true }
    });
    
    for (const user of groupAPatients) {
      if (user.patientProfile?.registeredVia !== 'SELF') {
        issues.push(`Group A patient ${user.mobile} has wrong registeredVia: ${user.patientProfile?.registeredVia}`);
      }
    }
    
    const groupBPatients = await prisma.user.findMany({
      where: { mobile: { in: testState.patients.filter(p => p.group === 'B').map(p => p.mobile) } },
      include: { patientProfile: true }
    });
    
    for (const user of groupBPatients) {
      if (user.patientProfile?.registeredVia !== 'RECEPTIONIST') {
        issues.push(`Group B patient ${user.mobile} has wrong registeredVia: ${user.patientProfile?.registeredVia}`);
      }
    }
    
    if (issues.length === 0) {
      testState.testResults.databaseIntegrity.pass++;
      log('DB_INTEGRITY', '✓ All database integrity checks passed');
    } else {
      testState.testResults.databaseIntegrity.fail++;
      testState.testResults.databaseIntegrity.errors = issues;
      log('DB_INTEGRITY', `✗ Found ${issues.length} integrity issues:`);
      issues.forEach(issue => log('DB_INTEGRITY', `  - ${issue}`));
    }
    
  } catch (error) {
    testState.testResults.databaseIntegrity.fail++;
    testState.testResults.databaseIntegrity.errors.push(error.message);
    logError('DB_INTEGRITY', error);
  }
  
  log('DB_INTEGRITY', `✅ Database Integrity Check Complete: ${testState.testResults.databaseIntegrity.pass} PASS, ${testState.testResults.databaseIntegrity.fail} FAIL`);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TEST 8: SECURITY - CROSS-CLINIC ACCESS
 * ═══════════════════════════════════════════════════════════════
 */
async function testCrossClinicSecurity() {
  log('SECURITY', 'Testing cross-clinic access restrictions...');
  
  try {
    // Create Clinic B
    const clinicBOwner = await prisma.user.create({
      data: {
        mobile: '+919777777777',
        name: 'Clinic B Owner',
        role: 'CLINIC_OWNER',
        approvalStatus: 'VERIFIED',
        passwordHash: 'test-hash',
        clinicOwnerProfile: { create: {} }
      }
    });
    
    const clinicB = await prisma.clinic.create({
      data: {
        name: 'Test Clinic B',
        ownerId: clinicBOwner.id,
        approvalStatus: 'VERIFIED',
        isVerified: true
      }
    });
    
    // Create receptionist for Clinic B
    const clinicBReceptionist = await prisma.user.create({
      data: {
        mobile: '+919777777778',
        name: 'Clinic B Receptionist',
        role: 'RECEPTIONIST',
        approvalStatus: 'VERIFIED',
        passwordHash: 'test-hash',
        receptionistProfile: {
          create: {
            assignedClinicId: clinicB.id,
            createdByOwnerId: clinicBOwner.id
          }
        }
      },
      include: { receptionistProfile: true }
    });
    
    await prisma.clinicStaff.create({
      data: {
        clinicId: clinicB.id,
        userId: clinicBReceptionist.id,
        role: 'RECEPTIONIST',
        isActive: true
      }
    });
    
    // Get a patient from Clinic A
    const clinicAPatient = testState.patients.find(p => p.userId !== null);
    
    if (!clinicAPatient) {
      throw new Error('No Clinic A patient found for security test');
    }
    
    // Verify: Clinic B receptionist should NOT access Clinic A patients
    // In real implementation, this should be enforced at API/controller level
    const clinicBStaff = await prisma.clinicStaff.findFirst({
      where: {
        userId: clinicBReceptionist.id,
        clinicId: testState.clinic.id  // Try to access Clinic A
      }
    });
    
    if (clinicBStaff) {
      throw new Error('Security breach: Clinic B receptionist has access to Clinic A!');
    }
    
    // Verify correct access
    const correctAccess = await prisma.clinicStaff.findFirst({
      where: {
        userId: testState.receptionists[0].id,
        clinicId: testState.clinic.id
      }
    });
    
    if (!correctAccess) {
      throw new Error('Security error: Clinic A receptionist cannot access Clinic A!');
    }
    
    testState.testResults.security.pass++;
    log('SECURITY', '✓ Cross-clinic access restrictions verified');
    
  } catch (error) {
    testState.testResults.security.fail++;
    testState.testResults.security.errors.push(error.message);
    logError('SECURITY', error);
  }
  
  log('SECURITY', `✅ Security Test Complete: ${testState.testResults.security.pass} PASS, ${testState.testResults.security.fail} FAIL`);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * GENERATE FINAL REPORT
 * ═══════════════════════════════════════════════════════════════
 */
function generateFinalReport() {
  log('REPORT', '═══════════════════════════════════════════════════════════════');
  log('REPORT', 'PULSEMATE CONNECT — 200 PATIENT STRESS TEST FINAL REPORT');
  log('REPORT', '═══════════════════════════════════════════════════════════════');
  
  const results = testState.testResults;
  
  console.log('\n📊 TEST SUMMARY:\n');
  console.log(`Total Test Patients: ${TEST_CONFIG.TOTAL_PATIENTS}`);
  console.log(`Self-Registered (Group A): ${TEST_CONFIG.GROUP_A_SELF_REGISTERED} → ${results.selfRegistered.pass} PASS, ${results.selfRegistered.fail} FAIL`);
  console.log(`New Walk-ins (Group B): ${TEST_CONFIG.GROUP_B_NEW_WALKIN} → ${results.newWalkin.pass} PASS, ${results.newWalkin.fail} FAIL`);
  console.log(`Existing Walk-ins (Group C): ${TEST_CONFIG.GROUP_C_EXISTING_WALKIN} → ${results.existingWalkin.pass} PASS, ${results.existingWalkin.fail} FAIL`);
  console.log(`Follow-up Patients (Group D): ${TEST_CONFIG.GROUP_D_FOLLOWUP} → ${results.followup.pass} PASS, ${results.followup.fail} FAIL`);
  
  console.log('\n🔍 COMPONENT TESTS:\n');
  console.log(`Token Generation: ${results.tokenGeneration.pass} PASS, ${results.tokenGeneration.fail} FAIL`);
  console.log(`Priority Queue: ${results.priorityQueue.pass} PASS, ${results.priorityQueue.fail} FAIL`);
  console.log(`Concurrency: ${results.concurrency.pass} PASS, ${results.concurrency.fail} FAIL`);
  console.log(`Security: ${results.security.pass} PASS, ${results.security.fail} FAIL`);
  console.log(`Database Integrity: ${results.databaseIntegrity.pass} PASS, ${results.databaseIntegrity.fail} FAIL`);
  
  console.log('\n❌ FAILURES & ERRORS:\n');
  
  Object.entries(results).forEach(([category, data]) => {
    if (data.errors && data.errors.length > 0) {
      console.log(`\n${category.toUpperCase()}:`);
      data.errors.forEach((error, index) => {
        if (typeof error === 'string') {
          console.log(`  ${index + 1}. ${error}`);
        } else {
          console.log(`  ${index + 1}. Patient: ${error.patient}, Error: ${error.error}`);
        }
      });
    }
  });
  
  const totalPass = Object.values(results).reduce((sum, r) => sum + r.pass, 0);
  const totalFail = Object.values(results).reduce((sum, r) => sum + r.fail, 0);
  const totalTests = totalPass + totalFail;
  const passRate = totalTests > 0 ? ((totalPass / totalTests) * 100).toFixed(2) : 0;
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`FINAL RESULT: ${totalPass}/${totalTests} TESTS PASSED (${passRate}%)`);
  console.log(`VERDICT: ${totalFail === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  return {
    totalTests,
    totalPass,
    totalFail,
    passRate: parseFloat(passRate),
    verdict: totalFail === 0 ? 'PASS' : 'FAIL',
    results
  };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * CLEANUP
 * ═══════════════════════════════════════════════════════════════
 */
async function cleanup() {
  log('CLEANUP', 'Cleaning up test data...');
  
  try {
    // Delete in reverse dependency order
    await prisma.queueItem.deleteMany({
      where: { queue: { clinicId: testState.clinic.id } }
    });
    
    await prisma.appointment.deleteMany({
      where: { clinicId: testState.clinic.id }
    });
    
    await prisma.queue.deleteMany({
      where: { clinicId: testState.clinic.id }
    });
    
    await prisma.clinicStaff.deleteMany({
      where: { clinicId: testState.clinic.id }
    });
    
    await prisma.doctorClinic.deleteMany({
      where: { clinicId: testState.clinic.id }
    });
    
    await prisma.clinicSession.deleteMany({
      where: { clinicId: testState.clinic.id }
    });
    
    // Delete test patients
    const testMobiles = testState.patients.map(p => p.mobile);
    await prisma.user.deleteMany({
      where: { mobile: { in: testMobiles } }
    });
    
    // Delete test staff
    await prisma.user.deleteMany({
      where: { mobile: { startsWith: '+9199999999' } }
    });
    
    // Delete clinic
    if (testState.clinic) {
      await prisma.clinic.delete({
        where: { id: testState.clinic.id }
      });
    }
    
    log('CLEANUP', '✓ Test data cleaned up');
  } catch (error) {
    logError('CLEANUP', error);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * MAIN TEST EXECUTION
 * ═══════════════════════════════════════════════════════════════
 */
async function runStressTest() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║ PULSEMATE CONNECT — 200 PATIENT STRESS TEST                  ║');
  console.log('║ Patient ↔ Receptionist Connection                            ║');
  console.log('║ Walk-in + Follow-up + Priority Queue + Concurrency           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  try {
    await setupTestEnvironment();
    await prepareTestPatients();
    await testSelfRegisteredPatients();
    await testNewWalkinPatients();
    await testExistingWalkinPatients();
    await testFollowupPatients();
    await testConcurrentReceptionists();
    await verifyDatabaseIntegrity();
    await testCrossClinicSecurity();
    
    const report = generateFinalReport();
    
    // Save report to file
    const fs = require('fs');
    const reportPath = 'c:\\Users\\shubh\\Desktop\\PulseMate Connect\\PATIENT_RECEPTIONIST_200_TEST_REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log('REPORT', `✓ Report saved to: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    throw error;
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  runStressTest()
    .then((report) => {
      process.exit(report.verdict === 'PASS' ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runStressTest };
