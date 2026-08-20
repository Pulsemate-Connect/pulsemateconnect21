/**
 * Clinic Schedule & Timings - Standalone Unit Tests
 * 20 Test Conditions - No server required
 * Tests database operations directly using Prisma
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test data
let testClinicId;
let testUserId;
let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  test: (num, msg) => console.log(`${colors.blue}\n[Test ${num}/20] ${msg}${colors.reset}`),
};

// Test runner
const runTests = async () => {
  console.log('\n========================================');
  console.log('🧪 CLINIC SCHEDULE UNIT TEST SUITE');
  console.log('   (Standalone - No Server Required)');
  console.log('========================================\n');

  try {
    // Setup
    log.info('Setting up test environment...');
    await setupTestData();
    log.success('Test environment ready\n');

    // ============================================================
    // TEST 1: Create Working Hours for Monday
    // ============================================================
    await runTest(1, 'Create Working Hours for Monday', async () => {
      const workingHour = await prisma.clinicWorkingHours.create({
        data: {
          clinicId: testClinicId,
          dayOfWeek: 1, // Monday
          isOpen: true,
          morningStartTime: '09:00',
          morningEndTime: '13:00',
          eveningStartTime: '16:00',
          eveningEndTime: '20:00',
        },
      });
      return workingHour && workingHour.id;
    });

    // ============================================================
    // TEST 2: Create Working Hours for All Days
    // ============================================================
    await runTest(2, 'Create Working Hours for All 7 Days', async () => {
      const days = [
        { dayOfWeek: 2, isOpen: true, morningStartTime: '09:00', morningEndTime: '13:00', eveningStartTime: '16:00', eveningEndTime: '20:00' },
        { dayOfWeek: 3, isOpen: true, morningStartTime: '09:00', morningEndTime: '13:00', eveningStartTime: '', eveningEndTime: '' },
        { dayOfWeek: 4, isOpen: true, morningStartTime: '09:00', morningEndTime: '13:00', eveningStartTime: '16:00', eveningEndTime: '20:00' },
        { dayOfWeek: 5, isOpen: true, morningStartTime: '09:00', morningEndTime: '13:00', eveningStartTime: '16:00', eveningEndTime: '20:00' },
        { dayOfWeek: 6, isOpen: true, morningStartTime: '09:00', morningEndTime: '14:00', eveningStartTime: '', eveningEndTime: '' },
        { dayOfWeek: 0, isOpen: false, morningStartTime: '', morningEndTime: '', eveningStartTime: '', eveningEndTime: '' },
      ];

      for (const day of days) {
        await prisma.clinicWorkingHours.create({
          data: { clinicId: testClinicId, ...day },
        });
      }

      const count = await prisma.clinicWorkingHours.count({
        where: { clinicId: testClinicId },
      });

      return count === 7;
    });

    // ============================================================
    // TEST 3: Get All Working Hours
    // ============================================================
    await runTest(3, 'Get All Working Hours', async () => {
      const hours = await prisma.clinicWorkingHours.findMany({
        where: { clinicId: testClinicId },
        orderBy: { dayOfWeek: 'asc' },
      });
      return hours.length === 7;
    });

    // ============================================================
    // TEST 4: Update Working Hours
    // ============================================================
    await runTest(4, 'Update Working Hours for a Day', async () => {
      const updated = await prisma.clinicWorkingHours.updateMany({
        where: { clinicId: testClinicId, dayOfWeek: 1 },
        data: { morningStartTime: '08:00', morningEndTime: '12:00' },
      });
      return updated.count > 0;
    });

    // ============================================================
    // TEST 5: Create Lunch Break
    // ============================================================
    await runTest(5, 'Create Lunch Break', async () => {
      const breakItem = await prisma.clinicBreak.create({
        data: {
          clinicId: testClinicId,
          name: 'Lunch Break',
          startTime: '13:00',
          endTime: '16:00',
          applicableDays: [1, 2, 3, 4, 5, 6],
          isActive: true,
        },
      });
      return breakItem && breakItem.id;
    });

    // ============================================================
    // TEST 6: Create Tea Break
    // ============================================================
    await runTest(6, 'Create Tea Break', async () => {
      const breakItem = await prisma.clinicBreak.create({
        data: {
          clinicId: testClinicId,
          name: 'Tea Break',
          startTime: '11:00',
          endTime: '11:15',
          applicableDays: [1, 2, 3, 4, 5],
          isActive: true,
        },
      });
      return breakItem && breakItem.id;
    });

    // ============================================================
    // TEST 7: Get All Breaks
    // ============================================================
    await runTest(7, 'Get All Breaks', async () => {
      const breaks = await prisma.clinicBreak.findMany({
        where: { clinicId: testClinicId },
      });
      return breaks.length === 2;
    });

    // ============================================================
    // TEST 8: Update Break
    // ============================================================
    await runTest(8, 'Update Break Name and Time', async () => {
      const updated = await prisma.clinicBreak.updateMany({
        where: { clinicId: testClinicId, name: 'Lunch Break' },
        data: { name: 'Updated Lunch Break', startTime: '13:30' },
      });
      return updated.count > 0;
    });

    // ============================================================
    // TEST 9: Create Public Holiday
    // ============================================================
    await runTest(9, 'Create Public Holiday', async () => {
      const holiday = await prisma.clinicHoliday.create({
        data: {
          clinicId: testClinicId,
          date: new Date('2026-08-15'),
          name: 'Independence Day',
          type: 'PUBLIC_HOLIDAY',
          reason: 'National holiday',
          isRecurring: true,
        },
      });
      return holiday && holiday.id;
    });

    // ============================================================
    // TEST 10: Create Clinic Holiday
    // ============================================================
    await runTest(10, 'Create Clinic Holiday', async () => {
      const holiday = await prisma.clinicHoliday.create({
        data: {
          clinicId: testClinicId,
          date: new Date('2026-12-25'),
          name: 'Christmas',
          type: 'CLINIC_HOLIDAY',
          reason: 'Clinic closed for Christmas',
          isRecurring: true,
        },
      });
      return holiday && holiday.id;
    });

    // ============================================================
    // TEST 11: Get Holidays in Date Range
    // ============================================================
    await runTest(11, 'Get Holidays in Date Range', async () => {
      const holidays = await prisma.clinicHoliday.findMany({
        where: {
          clinicId: testClinicId,
          date: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-12-31'),
          },
        },
      });
      return holidays.length === 2;
    });

    // ============================================================
    // TEST 12: Update Holiday
    // ============================================================
    await runTest(12, 'Update Holiday Details', async () => {
      const updated = await prisma.clinicHoliday.updateMany({
        where: { clinicId: testClinicId, name: 'Independence Day' },
        data: { name: 'Independence Day (Updated)' },
      });
      return updated.count > 0;
    });

    // ============================================================
    // TEST 13: Create Special Hours (Extended)
    // ============================================================
    await runTest(13, 'Create Special Hours - Extended', async () => {
      const specialHours = await prisma.clinicSpecialHours.create({
        data: {
          clinicId: testClinicId,
          date: new Date('2026-12-31'),
          name: 'New Year Eve - Extended Hours',
          morningStartTime: '08:00',
          morningEndTime: '14:00',
          eveningStartTime: '',
          eveningEndTime: '',
          isClosed: false,
        },
      });
      return specialHours && specialHours.id;
    });

    // ============================================================
    // TEST 14: Create Special Hours (Closed)
    // ============================================================
    await runTest(14, 'Create Special Hours - Closed', async () => {
      const specialHours = await prisma.clinicSpecialHours.create({
        data: {
          clinicId: testClinicId,
          date: new Date('2026-10-02'),
          name: 'Gandhi Jayanti - Closed',
          morningStartTime: '',
          morningEndTime: '',
          eveningStartTime: '',
          eveningEndTime: '',
          isClosed: true,
        },
      });
      return specialHours && specialHours.id;
    });

    // ============================================================
    // TEST 15: Get Special Hours
    // ============================================================
    await runTest(15, 'Get All Special Hours', async () => {
      const specialHours = await prisma.clinicSpecialHours.findMany({
        where: { clinicId: testClinicId },
      });
      return specialHours.length === 2;
    });

    // ============================================================
    // TEST 16: Create Temporary Closure
    // ============================================================
    await runTest(16, 'Create Temporary Closure', async () => {
      const closure = await prisma.clinicTemporaryClosure.create({
        data: {
          clinicId: testClinicId,
          startTime: new Date(),
          reason: 'Emergency maintenance work',
          isActive: true,
          createdBy: testUserId,
        },
      });
      return closure && closure.id && closure.isActive === true;
    });

    // ============================================================
    // TEST 17: Get Active Temporary Closure
    // ============================================================
    await runTest(17, 'Get Active Temporary Closure', async () => {
      const closure = await prisma.clinicTemporaryClosure.findFirst({
        where: { clinicId: testClinicId, isActive: true },
      });
      return closure && closure.isActive === true;
    });

    // ============================================================
    // TEST 18: Deactivate Temporary Closure (Reopen)
    // ============================================================
    await runTest(18, 'Reopen Clinic (Deactivate Closure)', async () => {
      const updated = await prisma.clinicTemporaryClosure.updateMany({
        where: { clinicId: testClinicId, isActive: true },
        data: { isActive: false, endTime: new Date() },
      });
      return updated.count > 0;
    });

    // ============================================================
    // TEST 19: Verify No Active Closure
    // ============================================================
    await runTest(19, 'Verify No Active Closure After Reopen', async () => {
      const closure = await prisma.clinicTemporaryClosure.findFirst({
        where: { clinicId: testClinicId, isActive: true },
      });
      return closure === null;
    });

    // ============================================================
    // TEST 20: Complex Query - Get Today's Schedule Data
    // ============================================================
    await runTest(20, "Get Today's Complete Schedule", async () => {
      const today = new Date();
      const dayOfWeek = today.getDay();

      const schedule = await prisma.clinicWorkingHours.findFirst({
        where: { clinicId: testClinicId, dayOfWeek },
      });

      const breaks = await prisma.clinicBreak.findMany({
        where: {
          clinicId: testClinicId,
          isActive: true,
        },
      });

      const activeClosure = await prisma.clinicTemporaryClosure.findFirst({
        where: { clinicId: testClinicId, isActive: true },
      });

      return schedule !== null && breaks.length >= 0;
    });

    // Cleanup
    log.info('\n\nCleaning up test data...');
    await cleanupTestData();
    log.success('Cleanup complete');

  } catch (error) {
    log.error(`\nTest suite error: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }

  // Results
  printResults();
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Helper function to run a test
const runTest = async (num, name, testFn) => {
  log.test(num, name);
  try {
    const result = await testFn();
    if (result) {
      log.success(`Test passed`);
      testResults.passed++;
      testResults.tests.push({ num, name, status: 'PASS' });
    } else {
      throw new Error('Test returned false');
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ num, name, status: 'FAIL', error: error.message });
  }
};

// Setup test data
const setupTestData = async () => {
  // Create test user
  const user = await prisma.user.create({
    data: {
      name: 'Test Clinic Owner',
      mobile: `TEST${Date.now()}`,
      email: `testowner${Date.now()}@test.com`,
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash: 'test-hash',
    },
  });
  testUserId = user.id;

  // Create test clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Test Clinic for Schedule',
      ownerId: testUserId,
      phone: '9999999999',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      clinicRegistrationNumber: `TEST-REG-${Date.now()}`,
      approvalStatus: 'VERIFIED',
    },
  });
  testClinicId = clinic.id;

  log.info(`Created test user: ${testUserId.substring(0, 8)}...`);
  log.info(`Created test clinic: ${testClinicId.substring(0, 8)}...`);
};

// Cleanup test data
const cleanupTestData = async () => {
  try {
    await prisma.clinicBreak.deleteMany({ where: { clinicId: testClinicId } });
    await prisma.clinicHoliday.deleteMany({ where: { clinicId: testClinicId } });
    await prisma.clinicSpecialHours.deleteMany({ where: { clinicId: testClinicId } });
    await prisma.clinicTemporaryClosure.deleteMany({ where: { clinicId: testClinicId } });
    await prisma.clinicWorkingHours.deleteMany({ where: { clinicId: testClinicId } });
    await prisma.clinic.delete({ where: { id: testClinicId } });
    await prisma.user.delete({ where: { id: testUserId } });
  } catch (error) {
    log.error(`Cleanup warning: ${error.message}`);
  }
};

// Print results
const printResults = () => {
  console.log('\n========================================');
  console.log('📊 TEST RESULTS');
  console.log('========================================');
  console.log(`${colors.green}✓ Passed: ${testResults.passed}/20${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${testResults.failed}/20${colors.reset}`);
  console.log(`${colors.blue}Success Rate: ${((testResults.passed / 20) * 100).toFixed(1)}%${colors.reset}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter((t) => t.status === 'FAIL')
      .forEach((t) => {
        console.log(`  ${t.num}. ${t.name}`);
        console.log(`     Error: ${t.error}`);
      });
  }
  
  console.log('========================================\n');
};

// Run the tests
runTests();
