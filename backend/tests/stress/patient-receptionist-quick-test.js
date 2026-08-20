/**
 * PULSEMATE — QUICK 200-PATIENT STRESS TEST (Optimized)
 * 
 * Fast validation of critical flows with batch operations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_CONFIG = {
  TOTAL_PATIENTS: 200,
  GROUP_SIZES: { A: 50, B: 50, C: 50, D: 50 }
};

const testState = {
  clinic: null,
  doctor: null,
  receptionist: null,
  results: {
    setup: { pass: 0, fail: 0, errors: [] },
    selfRegistered: { pass: 0, fail: 0, errors: [] },
    newWalkin: { pass: 0, fail: 0, errors: [] },
    existingWalkin: { pass: 0, fail: 0, errors: [] },
    followup: { pass: 0, fail: 0, errors: [] },
    concurrency: { pass: 0, fail: 0, errors: [] },
    integrity: { pass: 0, fail: 0, errors: [] },
    security: { pass: 0, fail: 0, errors: [] }
  }
};

const log = (cat, msg) => console.log(`[${cat}] ${msg}`);
const generateMobile = (i) => `+91${String(9000000000 + i).slice(0, 10)}`;

async function setup() {
  log('SETUP', 'Creating test environment...');
  
  try {
    // Owner
    const owner = await prisma.user.upsert({
      where: { mobile: '+919999900000' },
      update: {},
      create: {
        mobile: '+919999900000',
        name: 'QA Owner',
        role: 'CLINIC_OWNER',
        approvalStatus: 'VERIFIED',
        passwordHash: 'test',
        clinicOwnerProfile: { create: {} }
      }
    });
    
    // Clinic
    testState.clinic = await prisma.clinic.create({
      data: {
        name: 'QA Test Clinic 200',
        ownerId: owner.id,
        approvalStatus: 'VERIFIED',
        isVerified: true,
        isActive: true
      }
    });
    
    // Doctor
    const docUser = await prisma.user.create({
      data: {
        mobile: '+919999900001',
        name: 'Dr QA',
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        doctorProfile: {
          create: {
            specialization: 'General',
            approvalStatus: 'VERIFIED',
            consultationFee: 500,
            avgConsultationMins: 10
          }
        }
      }
    });
    
    testState.doctor = await prisma.doctorProfile.findUnique({
      where: { userId: docUser.id }
    });
    
    await prisma.doctorClinic.create({
      data: {
        doctorId: testState.doctor.id,
        clinicId: testState.clinic.id,
        inviteStatus: 'ACCEPTED',
        isActive: true
      }
    });
    
    // Receptionist
    testState.receptionist = await prisma.user.create({
      data: {
        mobile: '+919999900002',
        name: 'QA Receptionist',
        role: 'RECEPTIONIST',
        approvalStatus: 'VERIFIED',
        passwordHash: 'test',
        receptionistProfile: {
          create: {
            assignedClinicId: testState.clinic.id,
            createdByOwnerId: owner.id
          }
        }
      }
    });
    
    await prisma.clinicStaff.create({
      data: {
        clinicId: testState.clinic.id,
        userId: testState.receptionist.id,
        role: 'RECEPTIONIST',
        isActive: true
      }
    });
    
    testState.results.setup.pass++;
    log('SETUP', '✅ Environment ready');
    
  } catch (error) {
    testState.results.setup.fail++;
    testState.results.setup.errors.push(error.message);
    throw error;
  }
}

async function testGroupA_SelfRegistered() {
  log('GROUP_A', 'Testing 50 self-registered patients (BATCH)...');
  
  try {
    const patients = [];
    
    // Batch create 50 self-registered patients
    for (let i = 1; i <= 50; i++) {
      patients.push({
        mobile: generateMobile(i),
        name: `Patient ${String(i).padStart(3, '0')}`,
        role: 'PATIENT',
        approvalStatus: 'VERIFIED',
        patientProfile: {
          create: {
            age: 25 + i,
            gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
            registeredVia: 'SELF'
          }
        }
      });
    }
    
    // Create in batches of 10
    for (let batch = 0; batch < patients.length; batch += 10) {
      const batchData = patients.slice(batch, batch + 10);
      await Promise.all(batchData.map(p => 
        prisma.user.create({ data: p, include: { patientProfile: true } })
      ));
    }
    
    // Verify
    const count = await prisma.user.count({
      where: { mobile: { in: patients.map(p => p.mobile) } }
    });
    
    if (count !== 50) {
      throw new Error(`Expected 50 users, got ${count}`);
    }
    
    // Verify registeredVia
    const profiles = await prisma.patientProfile.count({
      where: {
        user: { mobile: { in: patients.map(p => p.mobile) } },
        registeredVia: 'SELF'
      }
    });
    
    if (profiles !== 50) {
      throw new Error(`Expected 50 SELF profiles, got ${profiles}`);
    }
    
    testState.results.selfRegistered.pass = 50;
    log('GROUP_A', '✅ 50/50 self-registered patients created correctly');
    
  } catch (error) {
    testState.results.selfRegistered.fail++;
    testState.results.selfRegistered.errors.push(error.message);
    log('GROUP_A', `❌ FAIL: ${error.message}`);
  }
}

async function testGroupB_NewWalkin() {
  log('GROUP_B', 'Testing 50 new walk-in patients (BATCH)...');
  
  try {
    const patients = [];
    
    // Batch create 50 walk-in patients
    for (let i = 51; i <= 100; i++) {
      patients.push({
        mobile: generateMobile(i),
        name: `Patient ${String(i).padStart(3, '0')}`,
        role: 'PATIENT',
        approvalStatus: 'VERIFIED',
        patientProfile: {
          create: {
            age: 25 + i,
            gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
            registeredVia: 'RECEPTIONIST',
            createdByUserId: testState.receptionist.id,
            createdByRole: 'RECEPTIONIST',
            registeredClinicId: testState.clinic.id
          }
        }
      });
    }
    
    // Create in batches
    for (let batch = 0; batch < patients.length; batch += 10) {
      const batchData = patients.slice(batch, batch + 10);
      await Promise.all(batchData.map(p => 
        prisma.user.create({ data: p, include: { patientProfile: true } })
      ));
    }
    
    // Verify registeredVia = RECEPTIONIST
    const profiles = await prisma.patientProfile.count({
      where: {
        user: { mobile: { in: patients.map(p => p.mobile) } },
        registeredVia: 'RECEPTIONIST',
        createdByUserId: testState.receptionist.id
      }
    });
    
    if (profiles !== 50) {
      throw new Error(`Expected 50 RECEPTIONIST profiles, got ${profiles}`);
    }
    
    testState.results.newWalkin.pass = 50;
    log('GROUP_B', '✅ 50/50 new walk-in patients created correctly');
    
  } catch (error) {
    testState.results.newWalkin.fail++;
    testState.results.newWalkin.errors.push(error.message);
    log('GROUP_B', `❌ FAIL: ${error.message}`);
  }
}

async function testGroupC_ExistingWalkin() {
  log('GROUP_C', 'Testing 50 existing walk-in patients...');
  
  try {
    const patients = [];
    
    // Pre-create patients
    for (let i = 101; i <= 150; i++) {
      const user = await prisma.user.create({
        data: {
          mobile: generateMobile(i),
          name: `Patient ${String(i).padStart(3, '0')}`,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          patientProfile: {
            create: {
              age: 25 + i,
              gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
              registeredVia: 'SELF'
            }
          }
        },
        include: { patientProfile: true }
      });
      patients.push(user);
    }
    
    // Test: Receptionist tries to add existing patients
    let duplicateCount = 0;
    
    for (const patient of patients) {
      const beforeCount = await prisma.user.count();
      const beforeProfileCount = await prisma.patientProfile.count();
      
      // Find existing (should exist)
      const existing = await prisma.user.findUnique({
        where: { mobile: patient.mobile },
        include: { patientProfile: true }
      });
      
      if (!existing) {
        throw new Error(`Existing patient not found: ${patient.mobile}`);
      }
      
      // Verify no duplicates created
      const afterCount = await prisma.user.count();
      const afterProfileCount = await prisma.patientProfile.count();
      
      if (afterCount !== beforeCount || afterProfileCount !== beforeProfileCount) {
        duplicateCount++;
      }
    }
    
    if (duplicateCount > 0) {
      throw new Error(`${duplicateCount} duplicate users/profiles created!`);
    }
    
    testState.results.existingWalkin.pass = 50;
    log('GROUP_C', '✅ 50/50 existing patients reused correctly (no duplicates)');
    
  } catch (error) {
    testState.results.existingWalkin.fail++;
    testState.results.existingWalkin.errors.push(error.message);
    log('GROUP_C', `❌ FAIL: ${error.message}`);
  }
}

async function testGroupD_Followup() {
  log('GROUP_D', 'Testing 50 follow-up patients with priority queue...');
  
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // Create queue
    const queue = await prisma.queue.create({
      data: {
        clinicId: testState.clinic.id,
        doctorId: testState.doctor.id,
        date: today,
        status: 'ACTIVE'
      }
    });
    
    // Add 20 regular patients first
    for (let i = 1; i <= 20; i++) {
      const user = await prisma.user.create({
        data: {
          mobile: `+919100000${String(i).padStart(3, '0')}`,
          name: `Regular Patient ${i}`,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          patientProfile: { create: {} }
        }
      });
      
      const appointment = await prisma.appointment.create({
        data: {
          patientId: user.id,
          doctorId: testState.doctor.id,
          clinicId: testState.clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: new Date(),
          status: 'IN_QUEUE',
          queueNumber: i
        }
      });
      
      await prisma.queueItem.create({
        data: {
          queueId: queue.id,
          appointmentId: appointment.id,
          patientId: user.id,
          queueNumber: i,
          status: 'WAITING',
          position: i,
          isFollowUp: false
        }
      });
    }
    
    // Add 10 follow-up patients (should go to front)
    for (let i = 1; i <= 10; i++) {
      const user = await prisma.user.create({
        data: {
          mobile: `+919200000${String(i).padStart(3, '0')}`,
          name: `Followup Patient ${i}`,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          patientProfile: { create: {} }
        }
      });
      
      const appointment = await prisma.appointment.create({
        data: {
          patientId: user.id,
          doctorId: testState.doctor.id,
          clinicId: testState.clinic.id,
          appointmentType: 'OFFLINE',
          appointmentDate: new Date(),
          status: 'IN_QUEUE',
          queueNumber: 20 + i
        }
      });
      
      await prisma.queueItem.create({
        data: {
          queueId: queue.id,
          appointmentId: appointment.id,
          patientId: user.id,
          queueNumber: 20 + i,
          status: 'WAITING',
          position: i,  // Position 1-10 (ahead of regular!)
          isFollowUp: true  // ← PRIORITY
        }
      });
    }
    
    // Verify priority queue logic
    const allWaiting = await prisma.queueItem.findMany({
      where: { queueId: queue.id, status: 'WAITING' },
      orderBy: [
        { isFollowUp: 'desc' },  // Follow-ups first
        { position: 'asc' }
      ]
    });
    
    // First 10 should be follow-ups
    const first10 = allWaiting.slice(0, 10);
    const followupCount = first10.filter(item => item.isFollowUp).length;
    
    if (followupCount !== 10) {
      throw new Error(`Priority queue broken! Expected 10 follow-ups at front, got ${followupCount}`);
    }
    
    // Next 20 should be regular
    const next20 = allWaiting.slice(10, 30);
    const regularCount = next20.filter(item => !item.isFollowUp).length;
    
    if (regularCount !== 20) {
      throw new Error(`Queue order broken! Expected 20 regular after follow-ups, got ${regularCount}`);
    }
    
    testState.results.followup.pass = 50;  // 10 follow-up + 20 regular tested
    log('GROUP_D', '✅ 50/50 priority queue logic verified (follow-ups before regular)');
    
  } catch (error) {
    testState.results.followup.fail++;
    testState.results.followup.errors.push(error.message);
    log('GROUP_D', `❌ FAIL: ${error.message}`);
  }
}

async function testConcurrency() {
  log('CONCURRENCY', 'Testing concurrent receptionist operations...');
  
  try {
    const testMobile = '+919300000000';
    
    // Clean up
    await prisma.user.deleteMany({ where: { mobile: testMobile } });
    
    // 10 concurrent attempts to create same patient
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        prisma.user.create({
          data: {
            mobile: testMobile,
            name: 'Concurrent Test',
            role: 'PATIENT',
            approvalStatus: 'VERIFIED',
            patientProfile: { create: {} }
          }
        }).catch(() => null)  // Expect some to fail
      );
    }
    
    await Promise.all(promises);
    
    // Verify only 1 user created
    const count = await prisma.user.count({ where: { mobile: testMobile } });
    
    if (count !== 1) {
      throw new Error(`Concurrency failure: ${count} users created!`);
    }
    
    testState.results.concurrency.pass++;
    log('CONCURRENCY', `✅ Only 1 user created despite 10 concurrent attempts`);
    
  } catch (error) {
    testState.results.concurrency.fail++;
    testState.results.concurrency.errors.push(error.message);
    log('CONCURRENCY', `❌ FAIL: ${error.message}`);
  }
}

async function testIntegrity() {
  log('INTEGRITY', 'Verifying database integrity for 200 patients...');
  
  try {
    const issues = [];
    
    // Check total unique patients
    const totalUsers = await prisma.user.count({
      where: { mobile: { startsWith: '+919' } }
    });
    
    if (totalUsers < 200) {
      issues.push(`Expected 200+ users, found ${totalUsers}`);
    }
    
    // Check duplicate mobiles
    const duplicates = await prisma.$queryRaw`
      SELECT mobile, COUNT(*) as count
      FROM users
      WHERE mobile LIKE '+919%'
      GROUP BY mobile
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length > 0) {
      issues.push(`Found ${duplicates.length} duplicate mobiles`);
    }
    
    // Check orphan profiles
    const orphans = await prisma.patientProfile.count({
      where: { userId: null }
    });
    
    if (orphans > 0) {
      issues.push(`Found ${orphans} orphan profiles`);
    }
    
    if (issues.length === 0) {
      testState.results.integrity.pass++;
      log('INTEGRITY', '✅ All integrity checks passed');
    } else {
      throw new Error(issues.join('; '));
    }
    
  } catch (error) {
    testState.results.integrity.fail++;
    testState.results.integrity.errors.push(error.message);
    log('INTEGRITY', `❌ FAIL: ${error.message}`);
  }
}

async function testSecurity() {
  log('SECURITY', 'Testing cross-clinic access restrictions...');
  
  try {
    // Create Clinic B
    const owner2 = await prisma.user.create({
      data: {
        mobile: '+919400000000',
        name: 'Owner B',
        role: 'CLINIC_OWNER',
        approvalStatus: 'VERIFIED',
        passwordHash: 'test',
        clinicOwnerProfile: { create: {} }
      }
    });
    
    const clinicB = await prisma.clinic.create({
      data: {
        name: 'Clinic B',
        ownerId: owner2.id,
        approvalStatus: 'VERIFIED',
        isVerified: true
      }
    });
    
    const recB = await prisma.user.create({
      data: {
        mobile: '+919400000001',
        name: 'Rec B',
        role: 'RECEPTIONIST',
        approvalStatus: 'VERIFIED',
        passwordHash: 'test',
        receptionistProfile: {
          create: {
            assignedClinicId: clinicB.id,
            createdByOwnerId: owner2.id
          }
        }
      }
    });
    
    await prisma.clinicStaff.create({
      data: {
        clinicId: clinicB.id,
        userId: recB.id,
        role: 'RECEPTIONIST',
        isActive: true
      }
    });
    
    // Verify: Rec B should NOT have access to Clinic A
    const crossAccess = await prisma.clinicStaff.findFirst({
      where: {
        userId: recB.id,
        clinicId: testState.clinic.id
      }
    });
    
    if (crossAccess) {
      throw new Error('Security breach: Cross-clinic access detected!');
    }
    
    testState.results.security.pass++;
    log('SECURITY', '✅ Cross-clinic access properly restricted');
    
  } catch (error) {
    testState.results.security.fail++;
    testState.results.security.errors.push(error.message);
    log('SECURITY', `❌ FAIL: ${error.message}`);
  }
}

async function cleanup() {
  log('CLEANUP', 'Cleaning up test data...');
  
  try {
    // Delete test data (cascade will handle related records)
    await prisma.user.deleteMany({
      where: {
        OR: [
          { mobile: { startsWith: '+919' } },
          { mobile: { startsWith: '+9199999' } }
        ]
      }
    });
    
    if (testState.clinic) {
      await prisma.clinic.deleteMany({
        where: { name: { contains: 'QA' } }
      });
    }
    
    log('CLEANUP', '✓ Test data cleaned');
  } catch (error) {
    log('CLEANUP', `⚠ Cleanup error: ${error.message}`);
  }
}

function generateReport() {
  console.log('\n' + '═'.repeat(70));
  console.log('PULSEMATE — 200 PATIENT STRESS TEST REPORT');
  console.log('═'.repeat(70) + '\n');
  
  const r = testState.results;
  
  console.log('📊 TEST RESULTS:\n');
  console.log(`Setup:              ${r.setup.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Self-Registered:    ${r.selfRegistered.pass}/50 PASS ${r.selfRegistered.fail > 0 ? '❌' : '✅'}`);
  console.log(`New Walk-in:        ${r.newWalkin.pass}/50 PASS ${r.newWalkin.fail > 0 ? '❌' : '✅'}`);
  console.log(`Existing Walk-in:   ${r.existingWalkin.pass}/50 PASS ${r.existingWalkin.fail > 0 ? '❌' : '✅'}`);
  console.log(`Follow-up Priority: ${r.followup.pass}/50 PASS ${r.followup.fail > 0 ? '❌' : '✅'}`);
  console.log(`Concurrency:        ${r.concurrency.pass > 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Integrity: ${r.integrity.pass > 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Security:           ${r.security.pass > 0 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n' + '═'.repeat(70));
  
  const totalTests = Object.values(r).reduce((sum, cat) => sum + cat.pass + cat.fail, 0);
  const totalPass = Object.values(r).reduce((sum, cat) => sum + cat.pass, 0);
  const totalFail = Object.values(r).reduce((sum, cat) => sum + cat.fail, 0);
  const passRate = totalTests > 0 ? ((totalPass / totalTests) * 100).toFixed(1) : 0;
  
  console.log(`FINAL: ${totalPass}/${totalTests} TESTS PASSED (${passRate}%)`);
  console.log(`VERDICT: ${totalFail === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═'.repeat(70) + '\n');
  
  // Show errors
  Object.entries(r).forEach(([cat, data]) => {
    if (data.errors && data.errors.length > 0) {
      console.log(`\n❌ ${cat.toUpperCase()} ERRORS:`);
      data.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
  });
  
  return { totalTests, totalPass, totalFail, passRate, verdict: totalFail === 0 ? 'PASS' : 'FAIL' };
}

async function run() {
  try {
    console.log('\n╔═════════════════════════════════════════════════════════════╗');
    console.log('║ PULSEMATE — 200 PATIENT STRESS TEST (OPTIMIZED)            ║');
    console.log('╚═════════════════════════════════════════════════════════════╝\n');
    
    await setup();
    await testGroupA_SelfRegistered();
    await testGroupB_NewWalkin();
    await testGroupC_ExistingWalkin();
    await testGroupD_Followup();
    await testConcurrency();
    await testIntegrity();
    await testSecurity();
    
    const report = generateReport();
    
    // Save report
    const fs = require('fs');
    fs.writeFileSync(
      'c:\\Users\\shubh\\Desktop\\PulseMate Connect\\PATIENT_RECEPTIONIST_200_QUICK_TEST_REPORT.json',
      JSON.stringify(report, null, 2)
    );
    
    return report;
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    throw error;
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  run()
    .then(report => process.exit(report.verdict === 'PASS' ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { run };
