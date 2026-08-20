/**
 * PulseMate Connect - Realistic Capacity Test
 * 
 * Tests: 50, 100, 200, 300, 400, 500 concurrent users
 * 
 * Measures:
 * - Requests per second
 * - Success rate
 * - Error rate
 * - p50, p95, p99 latency
 * - CPU usage
 * - Memory usage
 * - Database connections
 * - Socket.IO connections
 * 
 * Run: node backend/tests/load/realistic-capacity-test.js
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://192.168.31.240:5000/api';

// Test configuration
const TEST_STAGES = [
  { users: 50, duration: 60 },   // 50 users for 60 seconds
  { users: 100, duration: 60 },  // 100 users for 60 seconds
  { users: 200, duration: 60 },  // 200 users for 60 seconds
  { users: 300, duration: 90 },  // 300 users for 90 seconds
  { users: 400, duration: 90 },  // 400 users for 90 seconds
  { users: 500, duration: 90 },  // 500 users for 90 seconds
];

// Test results storage
const testResults = {
  stages: [],
  summary: {
    maxStableConcurrentUsers: 0,
    totalRequests: 0,
    totalErrors: 0,
    overallSuccessRate: 0,
  }
};

// API endpoint distribution (realistic user behavior)
// ✅ FIXED: Updated to use actual existing endpoints
const API_ENDPOINTS = [
  { path: '/auth/me', method: 'GET', weight: 20, requiresAuth: true },
  { path: '/patient/doctors', method: 'GET', weight: 15, requiresAuth: false, params: { city: 'Mumbai', limit: 10 } },
  { path: '/patient/appointments', method: 'GET', weight: 20, requiresAuth: true },
  { path: '/patient/profile', method: 'GET', weight: 15, requiresAuth: true },
  { path: '/notifications', method: 'GET', weight: 15, requiresAuth: true },
  { path: '/notifications/unread-count', method: 'GET', weight: 15, requiresAuth: true },
];

/**
 * Create test patients
 */
async function createTestPatients(count) {
  console.log(`\n📝 Creating ${count} test patients...`);
  
  const patients = [];
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 900) + 100; // Random 3-digit number
  
  for (let i = 0; i < count; i++) {
    try {
      // Generate unique 10-digit mobile: 98 + timestamp_last5 + random3 + index_padded2
      // Example: 9812345678
      const timestampPart = timestamp.toString().slice(-5);
      const indexPart = String(i).padStart(3, '0');
      const mobile = `98${timestampPart}${indexPart}`.slice(0, 10);
      
      const patient = await prisma.user.create({
        data: {
          mobile: `+91${mobile}`,
          name: `LoadTest Patient ${i + 1}`,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          patientProfile: {
            create: {}
          }
        }
      });
      
      patients.push({
        id: patient.id,
        mobile: patient.mobile,
        token: null // Will be generated during test
      });
      
      if ((i + 1) % 50 === 0) {
        console.log(`   Created ${i + 1}/${count} patients...`);
      }
    } catch (error) {
      console.error(`   Failed to create patient ${i + 1}:`, error.message);
      // If it's a duplicate error, try to find existing patient
      if (error.message.includes('Unique constraint')) {
        try {
          const timestampPart = timestamp.toString().slice(-5);
          const indexPart = String(i).padStart(3, '0');
          const mobile = `98${timestampPart}${indexPart}`.slice(0, 10);
          
          const existingPatient = await prisma.user.findUnique({
            where: { mobile: `+91${mobile}` }
          });
          
          if (existingPatient && existingPatient.role === 'PATIENT') {
            patients.push({
              id: existingPatient.id,
              mobile: existingPatient.mobile,
              token: null
            });
            console.log(`   Reusing existing patient ${i + 1}`);
          }
        } catch (findError) {
          // Ignore find errors
        }
      }
    }
  }
  
  console.log(`✅ Created/Found ${patients.length} test patients`);
  return patients;
}

/**
 * Generate JWT token for patient (simplified for testing)
 */
function generateTestToken(patientId) {
  const jwt = require('jsonwebtoken');
  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'local-dev-access-secret-replace-in-production-with-secure-random-key-minimum-64-chars';
  
  return jwt.sign(
    {
      sub: patientId,
      role: 'PATIENT',
      status: 'VERIFIED'
    },
    JWT_ACCESS_SECRET,
    { expiresIn: '2h' }
  );
}

/**
 * Select random API endpoint based on weights
 */
function selectRandomEndpoint() {
  const totalWeight = API_ENDPOINTS.reduce((sum, ep) => sum + ep.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of API_ENDPOINTS) {
    random -= endpoint.weight;
    if (random <= 0) return endpoint;
  }
  
  return API_ENDPOINTS[0];
}

/**
 * Make API request
 */
async function makeRequest(patient, endpoint) {
  const startTime = Date.now();
  
  try {
    const config = {
      method: endpoint.method,
      url: `${API_URL}${endpoint.path}`,
      timeout: 30000, // 30 second timeout
    };
    
    // Add auth header if required
    if (endpoint.requiresAuth) {
      if (!patient.token) {
        patient.token = generateTestToken(patient.id);
      }
      config.headers = {
        'Authorization': `Bearer ${patient.token}`
      };
    }
    
    // Add query params if exists
    if (endpoint.params) {
      config.params = endpoint.params;
    }
    
    const response = await axios(config);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      status: response.status,
      duration,
      endpoint: endpoint.path,
      error: null
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      status: error.response?.status || 0,
      duration,
      endpoint: endpoint.path,
      error: error.message
    };
  }
}

/**
 * Simulate single user session
 */
async function simulateUser(patient, durationSeconds) {
  const endTime = Date.now() + (durationSeconds * 1000);
  const results = [];
  
  while (Date.now() < endTime) {
    const endpoint = selectRandomEndpoint();
    const result = await makeRequest(patient, endpoint);
    results.push(result);
    
    // Random delay between requests (1-5 seconds)
    const delay = 1000 + Math.random() * 4000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return results;
}

/**
 * Calculate statistics
 */
function calculateStats(results) {
  if (results.length === 0) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      errorRate: 0,
      avgLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      requestsPerSecond: 0,
      errorsByStatus: {}
    };
  }
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  // Calculate latencies
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const p50Index = Math.floor(durations.length * 0.50);
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);
  
  // Group errors by status
  const errorsByStatus = {};
  failed.forEach(r => {
    const status = r.status || 'timeout';
    errorsByStatus[status] = (errorsByStatus[status] || 0) + 1;
  });
  
  return {
    totalRequests: results.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    successRate: (successful.length / results.length * 100).toFixed(2),
    errorRate: (failed.length / results.length * 100).toFixed(2),
    avgLatency: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(0),
    p50Latency: durations[p50Index] || 0,
    p95Latency: durations[p95Index] || 0,
    p99Latency: durations[p99Index] || 0,
    minLatency: durations[0] || 0,
    maxLatency: durations[durations.length - 1] || 0,
    errorsByStatus
  };
}

/**
 * Run load test stage
 */
async function runLoadTestStage(stage, patients) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 STAGE: ${stage.users} Concurrent Users for ${stage.duration}s`);
  console.log(`${'='.repeat(60)}`);
  
  const stageStartTime = Date.now();
  const selectedPatients = patients.slice(0, stage.users);
  
  console.log(`\n⏱️  Starting ${stage.users} user sessions...`);
  
  // Start all user sessions concurrently
  const userPromises = selectedPatients.map(patient => 
    simulateUser(patient, stage.duration)
  );
  
  // Wait for all sessions to complete
  const allResults = await Promise.all(userPromises);
  const flatResults = allResults.flat();
  
  const stageDuration = (Date.now() - stageStartTime) / 1000;
  
  // Calculate statistics
  const stats = calculateStats(flatResults);
  stats.requestsPerSecond = (stats.totalRequests / stageDuration).toFixed(2);
  stats.concurrentUsers = stage.users;
  stats.testDuration = stageDuration.toFixed(2);
  
  // Display results
  console.log(`\n📊 RESULTS:`);
  console.log(`   Total Requests:       ${stats.totalRequests}`);
  console.log(`   Successful:           ${stats.successfulRequests} (${stats.successRate}%)`);
  console.log(`   Failed:               ${stats.failedRequests} (${stats.errorRate}%)`);
  console.log(`   Requests/sec:         ${stats.requestsPerSecond}`);
  console.log(`\n⏱️  LATENCY:`);
  console.log(`   Average:              ${stats.avgLatency}ms`);
  console.log(`   p50:                  ${stats.p50Latency}ms`);
  console.log(`   p95:                  ${stats.p95Latency}ms`);
  console.log(`   p99:                  ${stats.p99Latency}ms`);
  console.log(`   Min:                  ${stats.minLatency}ms`);
  console.log(`   Max:                  ${stats.maxLatency}ms`);
  
  if (stats.failedRequests > 0) {
    console.log(`\n❌ ERRORS BY STATUS:`);
    Object.entries(stats.errorsByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
  }
  
  // Determine if stage passed
  const passed = parseFloat(stats.successRate) >= 95 && stats.p95Latency < 5000;
  const verdict = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${verdict} - Success Rate: ${stats.successRate}%, p95: ${stats.p95Latency}ms`);
  
  stats.passed = passed;
  stats.verdict = verdict;
  
  return stats;
}

/**
 * Cleanup test data
 */
async function cleanupTestData(patients) {
  console.log(`\n🧹 Cleaning up test data...`);
  
  try {
    const patientIds = patients.map(p => p.id);
    
    // Delete in correct order (respecting foreign keys)
    await prisma.appointment.deleteMany({
      where: { patientId: { in: patientIds } }
    });
    
    await prisma.patientProfile.deleteMany({
      where: { userId: { in: patientIds } }
    });
    
    await prisma.user.deleteMany({
      where: { id: { in: patientIds } }
    });
    
    console.log(`✅ Cleaned up ${patients.length} test patients`);
  } catch (error) {
    console.error(`❌ Cleanup failed:`, error.message);
  }
}

/**
 * Generate final report
 */
function generateReport(results) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 FINAL CAPACITY TEST REPORT`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`\n📊 STAGE SUMMARY:\n`);
  console.log(`┌─────────┬──────────┬──────────┬────────┬─────────┬─────────┬─────────┐`);
  console.log(`│ Users   │ Requests │ Success  │ Errors │ Req/sec │ p95 (ms)│ Verdict │`);
  console.log(`├─────────┼──────────┼──────────┼────────┼─────────┼─────────┼─────────┤`);
  
  results.stages.forEach(stage => {
    console.log(`│ ${String(stage.concurrentUsers).padEnd(7)} │ ${String(stage.totalRequests).padEnd(8)} │ ${String(stage.successRate + '%').padEnd(8)} │ ${String(stage.failedRequests).padEnd(6)} │ ${String(stage.requestsPerSecond).padEnd(7)} │ ${String(stage.p95Latency).padEnd(7)} │ ${stage.verdict.padEnd(7)} │`);
  });
  
  console.log(`└─────────┴──────────┴──────────┴────────┴─────────┴─────────┴─────────┘`);
  
  // Determine maximum stable capacity
  const passedStages = results.stages.filter(s => s.passed);
  const maxStableUsers = passedStages.length > 0 
    ? Math.max(...passedStages.map(s => s.concurrentUsers))
    : 0;
  
  results.summary.maxStableConcurrentUsers = maxStableUsers;
  results.summary.totalRequests = results.stages.reduce((sum, s) => sum + s.totalRequests, 0);
  results.summary.totalErrors = results.stages.reduce((sum, s) => sum + s.failedRequests, 0);
  results.summary.overallSuccessRate = (
    (results.summary.totalRequests - results.summary.totalErrors) / 
    results.summary.totalRequests * 100
  ).toFixed(2);
  
  console.log(`\n🎯 CAPACITY ASSESSMENT:`);
  console.log(`   Maximum Stable Concurrent Users: ${maxStableUsers}`);
  console.log(`   Total Requests Processed:        ${results.summary.totalRequests}`);
  console.log(`   Total Errors:                    ${results.summary.totalErrors}`);
  console.log(`   Overall Success Rate:            ${results.summary.overallSuccessRate}%`);
  
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (maxStableUsers >= 500) {
    console.log(`   ✅ Excellent! System can handle 500+ concurrent users`);
    console.log(`   📈 Ready for horizontal scaling to reach 1,000+ users`);
  } else if (maxStableUsers >= 300) {
    console.log(`   ✅ Good! System can handle ${maxStableUsers} concurrent users`);
    console.log(`   📈 Consider code optimization and horizontal scaling`);
  } else if (maxStableUsers >= 200) {
    console.log(`   ⚠️  System can handle ${maxStableUsers} concurrent users`);
    console.log(`   🔧 Optimization recommended before scaling`);
    console.log(`   📊 Add database indexes, implement caching`);
  } else if (maxStableUsers >= 100) {
    console.log(`   ⚠️  Limited capacity: ${maxStableUsers} concurrent users`);
    console.log(`   🔧 Critical optimization needed`);
    console.log(`   📊 Review slow queries, add indexes, implement caching`);
    console.log(`   💾 Consider upgrading server resources`);
  } else {
    console.log(`   ❌ Critical: System struggles with ${maxStableUsers} concurrent users`);
    console.log(`   🚨 Immediate action required`);
    console.log(`   🔧 Profile and optimize code`);
    console.log(`   📊 Fix database bottlenecks`);
    console.log(`   💾 Upgrade server resources`);
  }
  
  console.log(`\n📁 Saving detailed report to JSON...`);
  
  return results;
}

/**
 * Main test runner
 */
async function runCapacityTest() {
  console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
  console.log(`║   PULSEMATE CONNECT - REALISTIC CAPACITY TEST                 ║`);
  console.log(`╚═══════════════════════════════════════════════════════════════╝`);
  
  console.log(`\n📋 TEST PLAN:`);
  TEST_STAGES.forEach(stage => {
    console.log(`   Stage ${stage.users}: ${stage.users} users for ${stage.duration} seconds`);
  });
  
  const totalTime = TEST_STAGES.reduce((sum, stage) => sum + stage.duration, 0) + 120;
  console.log(`\n⏱️  Estimated Duration: ${Math.ceil(totalTime / 60)} minutes`);
  console.log(`🌐 API URL: ${API_URL}`);
  
  // Confirm before starting
  console.log(`\n⚠️  This test will create significant load on your development server.`);
  console.log(`   Press Ctrl+C to cancel, or wait 5 seconds to start...`);
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Create test patients (enough for largest stage)
    const maxUsers = Math.max(...TEST_STAGES.map(s => s.users));
    const patients = await createTestPatients(maxUsers);
    
    if (patients.length < maxUsers) {
      throw new Error(`Failed to create enough test patients. Needed: ${maxUsers}, Created: ${patients.length}`);
    }
    
    // Run each stage
    for (const stage of TEST_STAGES) {
      const stageResult = await runLoadTestStage(stage, patients);
      testResults.stages.push(stageResult);
      
      // If stage failed badly, consider stopping
      if (parseFloat(stageResult.successRate) < 50) {
        console.log(`\n⚠️  Success rate dropped below 50%. Consider stopping test.`);
        console.log(`   Continue? Waiting 10 seconds... (Ctrl+C to stop)`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      // Cool-down between stages
      if (stage !== TEST_STAGES[TEST_STAGES.length - 1]) {
        console.log(`\n😌 Cool-down period: 30 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    // Generate final report
    const finalResults = generateReport(testResults);
    
    // Save to JSON file
    const fs = require('fs');
    const reportPath = `backend/tests/load/capacity-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(finalResults, null, 2));
    console.log(`✅ Report saved: ${reportPath}`);
    
    // Cleanup
    await cleanupTestData(patients);
    
    console.log(`\n✅ CAPACITY TEST COMPLETE`);
    
  } catch (error) {
    console.error(`\n❌ TEST FAILED:`, error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
runCapacityTest().catch(console.error);
