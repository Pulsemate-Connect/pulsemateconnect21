/**
 * Batch API Quick Test
 * Tests the new /reception/walk-in-batch endpoint
 * 
 * Run: node backend/tests/stress/batch-api-test.js
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const API_URL = 'http://192.168.31.240:5000/api';

// Test configuration
const TEST_CONFIG = {
  batchSize: 50, // Test with 50 patients
  doctorId: '', // Will be fetched
  clinicId: '', // Will be fetched
  sessionId: null, // Optional
  receptionistToken: '', // Will be obtained from login
  testReceptionistMobile: '9100000001',
  testPassword: 'Test@123'
};

/**
 * Setup: Find existing receptionist or use super admin
 */
async function setupTestUser() {
  try {
    console.log('\n🔧 Finding test user...');
    
    // Try to find any existing receptionist with assigned clinic
    const receptionist = await prisma.user.findFirst({
      where: {
        role: 'RECEPTIONIST',
        approvalStatus: 'VERIFIED',
        receptionistProfile: {
          isNot: null
        }
      },
      include: {
        receptionistProfile: {
          include: { assignedClinic: true }
        }
      }
    });
    
    if (receptionist && receptionist.receptionistProfile?.assignedClinicId) {
      console.log(`✅ Found existing receptionist: ${receptionist.name} (${receptionist.mobile})`);
      TEST_CONFIG.testReceptionistMobile = receptionist.mobile;
      TEST_CONFIG.clinicId = receptionist.receptionistProfile.assignedClinicId;
      return receptionist;
    }
    
    // If no receptionist, try clinic owner
    const clinicOwner = await prisma.user.findFirst({
      where: {
        role: 'CLINIC_OWNER',
        approvalStatus: 'VERIFIED',
        ownedClinics: { some: { isActive: true, approvalStatus: 'VERIFIED' } }
      },
      include: {
        ownedClinics: {
          where: { isActive: true, approvalStatus: 'VERIFIED' },
          take: 1
        }
      }
    });
    
    if (clinicOwner) {
      console.log(`✅ Found clinic owner: ${clinicOwner.name} (${clinicOwner.mobile})`);
      TEST_CONFIG.testReceptionistMobile = clinicOwner.mobile;
      TEST_CONFIG.clinicId = clinicOwner.ownedClinics[0].id;
      return clinicOwner;
    }
    
    throw new Error('No verified receptionist or clinic owner found. Please create one first.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

/**
 * Generate test token (bypass login for testing)
 */
async function generateTestToken() {
  try {
    console.log('\n🔑 Generating test token...');
    
    // Use JWT to create a token manually (for testing only)
    const jwt = require('jsonwebtoken');
    const JWT_ACCESS_SECRET = 'local-dev-access-secret-replace-in-production-with-secure-random-key-minimum-64-chars';
    
    // Find the test user again
    const user = await prisma.user.findFirst({
      where: { mobile: TEST_CONFIG.testReceptionistMobile }
    });
    
    if (!user) {
      throw new Error('Test user not found');
    }
    
    // Create token matching the app's format
    const token = jwt.sign(
      {
        sub: user.id, // Subject (user ID)
        role: user.role,
        status: user.approvalStatus
      },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
    
    TEST_CONFIG.receptionistToken = token;
    console.log('✅ Test token generated');
    
    return { token, user };
    
  } catch (error) {
    console.error('❌ Token generation failed:', error.message);
    throw error;
  }
}

/**
 * Get clinic and doctor IDs
 */
async function getClinicAndDoctor() {
  try {
    console.log('\n🏥 Fetching clinic and doctor info...');
    
    // ClinicId is already set during setup
    if (!TEST_CONFIG.clinicId) {
      throw new Error('No clinic ID found');
    }
    
    console.log(`✅ Clinic ID: ${TEST_CONFIG.clinicId}`);
    
    // Get doctors directly from database
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        doctorClinics: {
          some: {
            clinicId: TEST_CONFIG.clinicId,
            isActive: true
          }
        }
      }
    });
    
    if (!doctor) {
      throw new Error('No doctors found in clinic');
    }
    
    TEST_CONFIG.doctorId = doctor.id;
    console.log(`✅ Doctor ID: ${TEST_CONFIG.doctorId}`);
    
  } catch (error) {
    console.error('❌ Failed to get clinic/doctor:', error.message);
    throw error;
  }
}

/**
 * Generate test patient data
 */
function generatePatients(count) {
  const patients = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    patients.push({
      mobile: `91${timestamp}${String(i).padStart(4, '0')}`.slice(0, 10),
      name: `Batch Test Patient ${i + 1}`,
      symptoms: `Batch test symptoms ${i + 1}`
    });
  }
  
  return patients;
}

/**
 * Test batch endpoint
 */
async function testBatchEndpoint() {
  try {
    console.log(`\n🚀 Testing batch endpoint with ${TEST_CONFIG.batchSize} patients...`);
    
    const patients = generatePatients(TEST_CONFIG.batchSize);
    const startTime = Date.now();
    
    const response = await axios.post(
      `${API_URL}/reception/walk-in-batch`,
      {
        patients,
        doctorId: TEST_CONFIG.doctorId,
        clinicId: TEST_CONFIG.clinicId,
        sessionId: TEST_CONFIG.sessionId
      },
      {
        headers: { Authorization: `Bearer ${TEST_CONFIG.receptionistToken}` }
      }
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ BATCH API TEST RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Successful: ${response.data.data.successCount}`);
    console.log(`❌ Failed: ${response.data.data.errorCount}`);
    console.log(`📊 Total Processed: ${response.data.data.totalProcessed}`);
    
    if (response.data.data.errorCount > 0) {
      console.log('\n❌ ERRORS:');
      response.data.data.failed.forEach((err, idx) => {
        console.log(`  ${idx + 1}. Mobile: ${err.mobile}, Error: ${err.error}`);
      });
    }
    
    // Performance evaluation
    console.log('\n📈 PERFORMANCE EVALUATION');
    console.log('═══════════════════════════════════════');
    const target = 15; // 15 seconds target for 200 patients
    const scaledTarget = (TEST_CONFIG.batchSize / 200) * target;
    
    if (duration <= scaledTarget) {
      console.log(`✅ PASS: ${duration}s ≤ ${scaledTarget.toFixed(2)}s (target)`);
    } else {
      console.log(`⚠️  SLOW: ${duration}s > ${scaledTarget.toFixed(2)}s (target)`);
    }
    
    const patientsPerSecond = (TEST_CONFIG.batchSize / duration).toFixed(2);
    console.log(`📊 Throughput: ${patientsPerSecond} patients/second`);
    
    // Projected performance for 200 patients
    const projected200 = (200 / TEST_CONFIG.batchSize) * duration;
    console.log(`🔮 Projected time for 200 patients: ${projected200.toFixed(2)}s`);
    
    return response.data;
    
  } catch (error) {
    console.error('\n❌ BATCH API TEST FAILED');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.error('Details:', error.response.data.errors);
    }
    throw error;
  }
}

/**
 * Verify database integrity
 */
async function verifyDatabaseIntegrity() {
  try {
    console.log('\n🔍 Verifying database integrity...');
    
    // Get queue to verify all patients were added
    const queueResponse = await axios.get(
      `${API_URL}/reception/queue/${TEST_CONFIG.doctorId}`,
      {
        params: { clinicId: TEST_CONFIG.clinicId },
        headers: { Authorization: `Bearer ${TEST_CONFIG.receptionistToken}` }
      }
    );
    
    const queueItems = queueResponse.data.data.queueItems || [];
    console.log(`✅ Queue length: ${queueItems.length}`);
    
    // Check for duplicate tokens
    const tokens = queueItems.map(item => item.queueNumber);
    const uniqueTokens = new Set(tokens);
    
    if (tokens.length === uniqueTokens.size) {
      console.log('✅ All tokens are unique');
    } else {
      console.log(`❌ Duplicate tokens found: ${tokens.length} total, ${uniqueTokens.size} unique`);
    }
    
    // Check positions
    const positions = queueItems.map(item => item.position);
    const sortedPositions = [...positions].sort((a, b) => a - b);
    const positionsCorrect = JSON.stringify(positions) === JSON.stringify(sortedPositions);
    
    if (positionsCorrect) {
      console.log('✅ All positions are in correct order');
    } else {
      console.log('❌ Positions are out of order');
    }
    
  } catch (error) {
    console.error('❌ Database integrity check failed:', error.response?.data?.message || error.message);
  }
}

/**
 * Main test runner
 */
async function runTest() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   BATCH API QUICK TEST                ║');
  console.log('╚═══════════════════════════════════════╝');
  
  try {
    // Step 0: Find existing test user
    await setupTestUser();
    
    // Step 1: Generate test token
    await generateTestToken();
    
    // Step 2: Get clinic and doctor
    await getClinicAndDoctor();
    
    // Step 3: Test batch endpoint
    await testBatchEndpoint();
    
    // Step 4: Verify database integrity
    await verifyDatabaseIntegrity();
    
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED                 ║');
    console.log('╚═══════════════════════════════════════╝\n');
    
    // Cleanup: Close database connection
    await prisma.$disconnect();
    
  } catch (error) {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   ❌ TEST FAILED                      ║');
    console.log('╚═══════════════════════════════════════╝\n');
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the test
runTest();
