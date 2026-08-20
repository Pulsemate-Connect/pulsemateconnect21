/**
 * Quick Test: Verify Rate Limiting Fix
 * 
 * This script verifies that rate limiting is now per-user, not per-IP.
 * 
 * Expected Behavior:
 * - 3 different users making 150 requests each = 450 total requests
 * - All should succeed (each user has 100 req/min limit)
 * - Old behavior: Would fail with 429 errors after 100 requests total
 * - New behavior: All 450 requests succeed
 * 
 * Run: node backend/tests/load/test-rate-limit-fix.js
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://192.168.31.240:5000/api';

/**
 * Generate JWT token for user (for testing)
 */
function generateTestToken(userId) {
  const jwt = require('jsonwebtoken');
  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'local-dev-access-secret-replace-in-production-with-secure-random-key-minimum-64-chars';
  
  return jwt.sign(
    {
      sub: userId,
      role: 'PATIENT',
      status: 'VERIFIED'
    },
    JWT_ACCESS_SECRET,
    { expiresIn: '2h' }
  );
}

/**
 * Make requests as a specific user
 */
async function makeRequestsAsUser(userId, count) {
  const token = generateTestToken(userId);
  const results = { success: 0, failed: 0, errors: {} };
  
  for (let i = 0; i < count; i++) {
    try {
      await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      results.success++;
    } catch (error) {
      results.failed++;
      const status = error.response?.status || 'timeout';
      results.errors[status] = (results.errors[status] || 0) + 1;
    }
  }
  
  return results;
}

/**
 * Test rate limiting fix
 */
async function testRateLimitFix() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   RATE LIMITING FIX TEST                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log('🎯 TEST GOAL:');
  console.log('   Verify rate limiting is per-user, not per-IP\n');
  
  console.log('📋 TEST PLAN:');
  console.log('   - User A: 40 requests (should ALL succeed)');
  console.log('   - User B: 40 requests (should ALL succeed)');
  console.log('   - User C: 40 requests (should ALL succeed)');
  console.log('   - Total: 120 requests from SAME IP\n');
  
  console.log('✅ EXPECTED: All 120 requests succeed (per-user limit: 100)');
  console.log('❌ OLD BEHAVIOR: Only first 100 requests succeed, rest get 429\n');
  
  console.log('🌐 API URL:', API_URL);
  console.log('\n⏱️  Running test...\n');
  
  try {
    // Find or create 3 test users
    const timestamp = Date.now();
    const users = [];
    
    for (let i = 0; i < 3; i++) {
      try {
        const mobile = `97${timestamp.toString().slice(-8)}`.slice(0, 10);
        const user = await prisma.user.upsert({
          where: { mobile: `+91${mobile}${i}` },
          update: {},
          create: {
            mobile: `+91${mobile}${i}`,
            name: `RateLimitTest User ${i + 1}`,
            role: 'PATIENT',
            approvalStatus: 'VERIFIED',
            isPhoneVerified: true,
            patientProfile: {
              create: {}
            }
          }
        });
        users.push(user);
      } catch (error) {
        console.error(`Failed to create test user ${i + 1}:`, error.message);
      }
    }
    
    if (users.length < 3) {
      throw new Error('Failed to create test users');
    }
    
    console.log(`✅ Created ${users.length} test users\n`);
    
    // Make requests concurrently (simulating same-time requests)
    console.log('🚀 Making requests from 3 users simultaneously...\n');
    
    const startTime = Date.now();
    
    const [resultA, resultB, resultC] = await Promise.all([
      makeRequestsAsUser(users[0].id, 40),
      makeRequestsAsUser(users[1].id, 40),
      makeRequestsAsUser(users[2].id, 40)
    ]);
    
    const duration = (Date.now() - startTime) / 1000;
    
    // Display results
    console.log('📊 RESULTS:\n');
    
    console.log(`User A (${users[0].mobile}):`);
    console.log(`   Successful: ${resultA.success}/40`);
    console.log(`   Failed:     ${resultA.failed}/40`);
    if (Object.keys(resultA.errors).length > 0) {
      console.log('   Errors:', resultA.errors);
    }
    
    console.log(`\nUser B (${users[1].mobile}):`);
    console.log(`   Successful: ${resultB.success}/40`);
    console.log(`   Failed:     ${resultB.failed}/40`);
    if (Object.keys(resultB.errors).length > 0) {
      console.log('   Errors:', resultB.errors);
    }
    
    console.log(`\nUser C (${users[2].mobile}):`);
    console.log(`   Successful: ${resultC.success}/40`);
    console.log(`   Failed:     ${resultC.failed}/40`);
    if (Object.keys(resultC.errors).length > 0) {
      console.log('   Errors:', resultC.errors);
    }
    
    const totalSuccess = resultA.success + resultB.success + resultC.success;
    const totalFailed = resultA.failed + resultB.failed + resultC.failed;
    const successRate = (totalSuccess / 120 * 100).toFixed(2);
    
    console.log('\n' + '─'.repeat(60));
    console.log(`\nTOTAL:`);
    console.log(`   Successful: ${totalSuccess}/120 (${successRate}%)`);
    console.log(`   Failed:     ${totalFailed}/120`);
    console.log(`   Duration:   ${duration.toFixed(2)}s`);
    
    // Verdict
    console.log('\n' + '═'.repeat(60));
    if (totalSuccess === 120) {
      console.log('\n✅ TEST PASSED!');
      console.log('\n   Rate limiting is now PER-USER, not per-IP.');
      console.log('   All 120 requests from 3 users succeeded.');
      console.log('   System ready for capacity testing.');
    } else if (totalSuccess >= 100) {
      console.log('\n⚠️  TEST PARTIALLY PASSED');
      console.log(`\n   ${totalSuccess}/120 requests succeeded.`);
      console.log('   Rate limiting may still have issues.');
      console.log('   Check errors above for details.');
    } else {
      console.log('\n❌ TEST FAILED!');
      console.log('\n   Rate limiting is still per-IP, not per-user.');
      console.log('   Only first 100 requests succeeded (across all users).');
      console.log('   Backend changes may not have been applied.');
      console.log('\n   Action: Restart backend server and rerun this test.');
    }
    console.log('\n' + '═'.repeat(60) + '\n');
    
    // Cleanup
    console.log('🧹 Cleaning up test users...');
    await prisma.user.deleteMany({
      where: { id: { in: users.map(u => u.id) } }
    });
    console.log('✅ Cleanup complete\n');
    
    process.exit(totalSuccess === 120 ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testRateLimitFix();
