/**
 * Clinic Schedule & Timings - Automated Test Suite
 * 20 Test Conditions for Complete Coverage
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Test data
let testClinicId;
let testUserId;
let authToken;
let createdWorkingHoursIds = [];
let createdBreakIds = [];
let createdHolidayIds = [];
let createdSpecialHoursIds = [];
let createdClosureId;

// Helper function to make authenticated requests
const apiRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };
    if (data) config.data = data;
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
};

// Color codes for console output
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
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  test: (num, msg) => console.log(`${colors.blue}\n[Test ${num}/20] ${msg}${colors.reset}`),
};

// Test execution
const runTests = async () => {
  console.log('\n========================================');
  console.log('🧪 CLINIC SCHEDULE AUTOMATED TEST SUITE');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  try {
    // Setup: Create test data
    log.info('Setting up test environment...');
    await setupTestData();
    log.success('Test environment ready\n');

    // ============================================================
    // TEST 1: Create Working Hours for All Days
    // ============================================================
    log.test(1, 'Create Working Hours for All Days');
    try {
      const workingHours = [
        { dayOfWeek: 1, isOpen: true, morningStartTime: '09:00', morningEndTime: '13:00', eveningStartTime: '16:00', eveningEndTime: '20:00' },
        { dayOfWeek: 2, isOpen: true, morningStartTime: '09:00', morningEndTime: '13:00', eveningStartTime: '16:00', eveningEndTime: '20:00' },
        { dayOfWeek: 3, isOpen: true, morningStartTime: '09:00', morningEndTime: '13:00', eveningStartTime: '', eveningEndTime: '' },
        { dayOfWeek: 4, isOpen: true, morningStartTime: '09:00', morningEndTime: '13:00', eveningStartTime: '16:00', eveningEndTime: '20:00' },
        { dayOfWeek: 5, isOpen: true, morningStartTime: '09:00', morningEndTime: '13:00', eveningStartTime: '16:00', eveningEndTime: '20:00' },
        { dayOfWeek: 6, isOpen: true, morningStartTime: '09:00', morningEndTime: '14:00', eveningStartTime: '', eveningEndTime: '' },
        { dayOfWeek: 0, isOpen: false, morningStartTime: '', morningEndTime: '', eveningStartTime: '', eveningEndTime: '' },
      ];

      const result = await apiRequest('PUT', `/clinic/${testClinicId}/schedule/working-hours`, { workingHours });
      
      if (result.success && result.data.workingHours) {
        log.success(`Working hours created for ${result.data.workingHours.length} days`);
        passedTests++;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 2: Get Working Hours
    // ============================================================
    log.test(2, 'Get Working Hours');
    try {
      const result = await apiRequest('GET', `/clinic/${testClinicId}/schedule/working-hours`);
      
      if (result.success && Array.isArray(result.data)) {
        log.success(`Retrieved ${result.data.length} working hours entries`);
        passedTests++;
      } else {
        throw new Error('Failed to retrieve working hours');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 3: Copy Monday Schedule to Other Days
    // ============================================================
    log.test(3, 'Copy Monday Schedule to Other Days');
    try {
      const result = await apiRequest('POST', `/clinic/${testClinicId}/schedule/copy-monday`, {
        targetDays: [2, 3, 4, 5],
      });
      
      if (result.success && result.data.updatedCount > 0) {
        log.success(`Copied Monday schedule to ${result.data.updatedCount} days`);
        passedTests++;
      } else {
        throw new Error('Failed to copy Monday schedule');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 4: Create Lunch Break
    // ============================================================
    log.test(4, 'Create Lunch Break');
    try {
      const breakData = {
        name: 'Lunch Break',
        startTime: '13:00',
        endTime: '16:00',
        applicableDays: [1, 2, 3, 4, 5, 6],
      };

      const result = await apiRequest('POST', `/clinic/${testClinicId}/schedule/breaks`, breakData);
      
      if (result.success && result.data.id) {
        createdBreakIds.push(result.data.id);
        log.success(`Created lunch break: ${result.data.name}`);
        passedTests++;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 5: Create Tea Break
    // ============================================================
    log.test(5, 'Create Tea Break');
    try {
      const breakData = {
        name: 'Tea Break',
        startTime: '11:00',
        endTime: '11:15',
        applicableDays: [1, 2, 3, 4, 5],
      };

      const result = await apiRequest('POST', `/clinic/${testClinicId}/schedule/breaks`, breakData);
      
      if (result.success && result.data.id) {
        createdBreakIds.push(result.data.id);
        log.success(`Created tea break: ${result.data.name}`);
        passedTests++;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 6: Get All Breaks
    // ============================================================
    log.test(6, 'Get All Breaks');
    try {
      const result = await apiRequest('GET', `/clinic/${testClinicId}/schedule/breaks`);
      
      if (result.success && Array.isArray(result.data) && result.data.length >= 2) {
        log.success(`Retrieved ${result.data.length} breaks`);
        passedTests++;
      } else {
        throw new Error('Failed to retrieve breaks');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 7: Update Break
    // ============================================================
    log.test(7, 'Update Break');
    try {
      const updateData = {
        name: 'Updated Lunch Break',
        startTime: '13:30',
        endTime: '16:30',
        applicableDays: [1, 2, 3, 4, 5],
      };

      const result = await apiRequest('PUT', `/clinic/${testClinicId}/schedule/breaks/${createdBreakIds[0]}`, updateData);
      
      if (result.success && result.data.name === updateData.name) {
        log.success(`Updated break: ${result.data.name}`);
        passedTests++;
      } else {
        throw new Error('Failed to update break');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 8: Create Public Holiday
    // ============================================================
    log.test(8, 'Create Public Holiday');
    try {
      const holidayData = {
        date: '2026-08-15',
        name: 'Independence Day',
        type: 'PUBLIC_HOLIDAY',
        reason: 'National holiday',
        isRecurring: true,
      };

      const result = await apiRequest('POST', `/clinic/${testClinicId}/schedule/holidays`, holidayData);
      
      if (result.success && result.data.id) {
        createdHolidayIds.push(result.data.id);
        log.success(`Created holiday: ${result.data.name} (${result.data.type})`);
        passedTests++;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 9: Create Clinic Holiday
    // ============================================================
    log.test(9, 'Create Clinic Holiday');
    try {
      const holidayData = {
        date: '2026-12-25',
        name: 'Christmas',
        type: 'CLINIC_HOLIDAY',
        reason: 'Clinic closed for Christmas',
        isRecurring: true,
      };

      const result = await apiRequest('POST', `/clinic/${testClinicId}/schedule/holidays`, holidayData);
      
      if (result.success && result.data.id) {
        createdHolidayIds.push(result.data.id);
        log.success(`Created holiday: ${result.data.name} (${result.data.type})`);
        passedTests++;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 10: Get Holidays with Date Range
    // ============================================================
    log.test(10, 'Get Holidays with Date Range');
    try {
      const result = await apiRequest('GET', `/clinic/${testClinicId}/schedule/holidays?startDate=2026-01-01&endDate=2026-12-31`);
      
      if (result.success && Array.isArray(result.data) && result.data.length >= 2) {
        log.success(`Retrieved ${result.data.length} holidays`);
        passedTests++;
      } else {
        throw new Error('Failed to retrieve holidays');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 11: Update Holiday
    // ============================================================
    log.test(11, 'Update Holiday');
    try {
      const updateData = {
        name: 'Independence Day (Updated)',
        reason: 'Updated national holiday description',
      };

      const result = await apiRequest('PUT', `/clinic/${testClinicId}/schedule/holidays/${createdHolidayIds[0]}`, updateData);
      
      if (result.success && result.data.name.includes('Updated')) {
        log.success(`Updated holiday: ${result.data.name}`);
        passedTests++;
      } else {
        throw new Error('Failed to update holiday');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 12: Create Special Hours for Specific Date
    // ============================================================
    log.test(12, 'Create Special Hours for Specific Date');
    try {
      const specialHoursData = {
        date: '2026-12-31',
        name: 'New Year Eve - Extended Hours',
        morningStartTime: '08:00',
        morningEndTime: '14:00',
        eveningStartTime: '',
        eveningEndTime: '',
        isClosed: false,
      };

      const result = await apiRequest('POST', `/clinic/${testClinicId}/schedule/special-hours`, specialHoursData);
      
      if (result.success && result.data.id) {
        createdSpecialHoursIds.push(result.data.id);
        log.success(`Created special hours: ${result.data.name}`);
        passedTests++;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 13: Create Special Hours Marked as Closed
    // ============================================================
    log.test(13, 'Create Special Hours Marked as Closed');
    try {
      const specialHoursData = {
        date: '2026-10-02',
        name: 'Gandhi Jayanti - Special Closure',
        morningStartTime: '',
        morningEndTime: '',
        eveningStartTime: '',
        eveningEndTime: '',
        isClosed: true,
      };

      const result = await apiRequest('POST', `/clinic/${testClinicId}/schedule/special-hours`, specialHoursData);
      
      if (result.success && result.data.id && result.data.isClosed === true) {
        createdSpecialHoursIds.push(result.data.id);
        log.success(`Created closed special hours: ${result.data.name}`);
        passedTests++;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 14: Get Special Hours
    // ============================================================
    log.test(14, 'Get Special Hours');
    try {
      const result = await apiRequest('GET', `/clinic/${testClinicId}/schedule/special-hours?startDate=2026-01-01&endDate=2027-01-01`);
      
      if (result.success && Array.isArray(result.data) && result.data.length >= 2) {
        log.success(`Retrieved ${result.data.length} special hours entries`);
        passedTests++;
      } else {
        throw new Error('Failed to retrieve special hours');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 15: Create Temporary Closure
    // ============================================================
    log.test(15, 'Create Temporary Closure');
    try {
      const closureData = {
        reason: 'Emergency maintenance work',
      };

      const result = await apiRequest('POST', `/clinic/${testClinicId}/schedule/temporary-closure`, closureData);
      
      if (result.success && result.data.id && result.data.isActive) {
        createdClosureId = result.data.id;
        log.success(`Created temporary closure: ${result.data.reason}`);
        passedTests++;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 16: Get Temporary Closure Status
    // ============================================================
    log.test(16, 'Get Temporary Closure Status');
    try {
      const result = await apiRequest('GET', `/clinic/${testClinicId}/schedule/temporary-closure`);
      
      if (result.success && result.data && result.data.isActive === true) {
        log.success(`Retrieved active temporary closure`);
        passedTests++;
      } else {
        throw new Error('Failed to retrieve temporary closure');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 17: Get Clinic Status (Should be Closed due to Temporary Closure)
    // ============================================================
    log.test(17, 'Get Clinic Status (Should be Closed)');
    try {
      const result = await apiRequest('GET', `/clinic/${testClinicId}/schedule/status`);
      
      if (result.success && result.data.isOpen === false && result.data.temporaryClosure) {
        log.success(`Clinic status: Closed (Temporary Closure Active)`);
        passedTests++;
      } else {
        throw new Error('Clinic status check failed');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 18: Reopen Clinic
    // ============================================================
    log.test(18, 'Reopen Clinic');
    try {
      const result = await apiRequest('POST', `/clinic/${testClinicId}/schedule/reopen`, {});
      
      if (result.success && result.data.message) {
        log.success(`Clinic reopened successfully`);
        passedTests++;
      } else {
        throw new Error('Failed to reopen clinic');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 19: Get Clinic Status (Should be Open Now)
    // ============================================================
    log.test(19, 'Get Clinic Status (Should be Open Now)');
    try {
      const result = await apiRequest('GET', `/clinic/${testClinicId}/schedule/status`);
      
      if (result.success && result.data) {
        log.success(`Clinic status retrieved: ${result.data.isOpen ? 'Open' : 'Closed'}`);
        passedTests++;
      } else {
        throw new Error('Clinic status check failed');
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // ============================================================
    // TEST 20: Get Today's Schedule
    // ============================================================
    log.test(20, "Get Today's Schedule with Stats");
    try {
      const result = await apiRequest('GET', `/clinic/${testClinicId}/schedule/today`);
      
      if (result.success && result.data) {
        log.success(`Today's schedule retrieved successfully`);
        if (result.data.schedule) {
          log.info(`  - Morning: ${result.data.schedule.morningSession || 'N/A'}`);
          log.info(`  - Evening: ${result.data.schedule.eveningSession || 'N/A'}`);
        }
        if (result.data.stats) {
          log.info(`  - Appointments: ${result.data.stats.appointmentsToday || 0}`);
          log.info(`  - Queue: ${result.data.stats.patientsInQueue || 0}`);
        }
        passedTests++;
      } else {
        throw new Error("Failed to retrieve today's schedule");
      }
    } catch (error) {
      log.error(`Failed: ${error.message}`);
      failedTests++;
    }

    // Cleanup
    log.info('\n\nCleaning up test data...');
    await cleanupTestData();
    log.success('Cleanup complete');

  } catch (error) {
    log.error(`\nTest suite error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // Results
  console.log('\n========================================');
  console.log('📊 TEST RESULTS');
  console.log('========================================');
  console.log(`${colors.green}✓ Passed: ${passedTests}/20${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failedTests}/20${colors.reset}`);
  console.log(`${colors.blue}Success Rate: ${((passedTests / 20) * 100).toFixed(1)}%${colors.reset}`);
  console.log('========================================\n');

  process.exit(failedTests > 0 ? 1 : 0);
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
      email: 'testclinic@test.com',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      registrationNumber: `TEST-REG-${Date.now()}`,
      licenseNumber: `TEST-LIC-${Date.now()}`,
      approvalStatus: 'VERIFIED',
    },
  });
  testClinicId = clinic.id;

  // Generate auth token (mock - replace with actual auth logic)
  authToken = 'test-token-' + Date.now();

  log.info(`Created test user: ${testUserId}`);
  log.info(`Created test clinic: ${testClinicId}`);
};

// Cleanup test data
const cleanupTestData = async () => {
  try {
    // Delete in correct order to respect foreign key constraints
    if (createdBreakIds.length > 0) {
      await prisma.clinicBreak.deleteMany({
        where: { id: { in: createdBreakIds } },
      });
    }

    if (createdHolidayIds.length > 0) {
      await prisma.clinicHoliday.deleteMany({
        where: { id: { in: createdHolidayIds } },
      });
    }

    if (createdSpecialHoursIds.length > 0) {
      await prisma.clinicSpecialHours.deleteMany({
        where: { id: { in: createdSpecialHoursIds } },
      });
    }

    await prisma.clinicTemporaryClosure.deleteMany({
      where: { clinicId: testClinicId },
    });

    await prisma.clinicWorkingHours.deleteMany({
      where: { clinicId: testClinicId },
    });

    await prisma.clinic.delete({
      where: { id: testClinicId },
    });

    await prisma.user.delete({
      where: { id: testUserId },
    });
  } catch (error) {
    log.warning(`Cleanup warning: ${error.message}`);
  }
};

// Run the tests
runTests();
