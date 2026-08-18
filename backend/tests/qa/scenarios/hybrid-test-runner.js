#!/usr/bin/env node

/**
 * Hybrid Test Runner - 20 Test Cases
 * Semi-automated validation with manual verification points
 */

const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'sahilnaik1515@gmail.com';
const ADMIN_PASSWORD = 'Nkabu18$';
const TEST_OTP = '123456';

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  manual: 0,
  tests: []
};

// CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
};

// Utility functions
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
};

const recordTest = (testNum, name, status, details = '') => {
  results.tests.push({ testNum, name, status, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else if (status === 'MANUAL') results.manual++;
};

// API calls
const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true // Don't throw on any status
});

let adminToken = null;

// Test implementations
async function test01_ClinicRegistration() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST 01: Clinic Registration → OTP → PENDING', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('📋 This test requires MANUAL execution via UI', 'warning');
  log('   1. Open http://localhost:3000/register');
  log('   2. Register "Test Medical Center 001"');
  log('   3. Use mobile: 9999999001, email: testclinic001@gmail.com');
  log('   4. Verify OTP (123456)');
  log('   5. Check status becomes PENDING');
  log('   6. Try to invite doctor (should be blocked)\n');

  const answer = await ask('Did you complete this test? (yes/no/skip): ');
  
  if (answer === 'yes') {
    const passed = await ask('Did ALL steps work correctly? (yes/no): ');
    if (passed === 'yes') {
      recordTest(1, 'Clinic Registration → OTP → PENDING', 'PASS');
      log('✅ TEST 01 PASSED\n', 'success');
      return true;
    } else {
      const issue = await ask('What failed? ');
      recordTest(1, 'Clinic Registration → OTP → PENDING', 'FAIL', issue);
      log('❌ TEST 01 FAILED\n', 'error');
      return false;
    }
  } else {
    recordTest(1, 'Clinic Registration → OTP → PENDING', 'MANUAL', 'Skipped');
    log('⊘ TEST 01 SKIPPED\n', 'warning');
    return null;
  }
}

async function test02_AdminApproval() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST 02: Clinic Admin Approval', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('Attempting to login as admin...', 'info');
  
  try {
    const loginRes = await api.post('/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (loginRes.status === 200 && loginRes.data.data?.token) {
      adminToken = loginRes.data.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      log('✅ Admin login successful\n', 'success');

      log('📋 Now approve the clinic manually:', 'warning');
      log('   1. Go to http://localhost:3000/admin/pending-clinics');
      log('   2. Find "Test Medical Center 001"');
      log('   3. Click "Approve"');
      log('   4. Verify status becomes VERIFIED');
      log('   5. Login as clinic and verify can access "Invite Doctor"\n');

      const answer = await ask('Did you complete the approval? (yes/no/skip): ');
      
      if (answer === 'yes') {
        const passed = await ask('Did clinic get VERIFIED status? (yes/no): ');
        if (passed === 'yes') {
          recordTest(2, 'Clinic Admin Approval', 'PASS');
          log('✅ TEST 02 PASSED\n', 'success');
          return true;
        } else {
          recordTest(2, 'Clinic Admin Approval', 'FAIL', 'Status not VERIFIED');
          log('❌ TEST 02 FAILED\n', 'error');
          return false;
        }
      } else {
        recordTest(2, 'Clinic Admin Approval', 'MANUAL', 'Skipped');
        log('⊘ TEST 02 SKIPPED\n', 'warning');
        return null;
      }
    } else {
      recordTest(2, 'Clinic Admin Approval', 'FAIL', 'Admin login failed');
      log('❌ Admin login failed\n', 'error');
      return false;
    }
  } catch (error) {
    recordTest(2, 'Clinic Admin Approval', 'FAIL', error.message);
    log(`❌ Error: ${error.message}\n`, 'error');
    return false;
  }
}

async function test03_OTPFailure() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST 03: Clinic OTP Failure', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('📋 Test OTP security manually:', 'warning');
  log('   1. Register new clinic: Test Medical Center 002');
  log('   2. Try wrong OTP: 000000');
  log('   3. Try reusing an old OTP');
  log('   4. Request OTP 6 times (check rate limiting)');
  log('   5. Verify all invalid attempts are blocked\n');

  const answer = await ask('Did you complete OTP security tests? (yes/no/skip): ');
  
  if (answer === 'yes') {
    const passed = await ask('Were all invalid OTPs rejected? (yes/no): ');
    if (passed === 'yes') {
      recordTest(3, 'Clinic OTP Failure', 'PASS');
      log('✅ TEST 03 PASSED\n', 'success');
      return true;
    } else {
      const issue = await ask('What security issue was found? ');
      recordTest(3, 'Clinic OTP Failure', 'FAIL', issue);
      log('❌ TEST 03 FAILED\n', 'error');
      return false;
    }
  } else {
    recordTest(3, 'Clinic OTP Failure', 'MANUAL', 'Skipped');
    log('⊘ TEST 03 SKIPPED\n', 'warning');
    return null;
  }
}

async function test04to10_DoctorFlow() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST 04-10: Complete Doctor Onboarding Flow', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('📋 Complete doctor onboarding manually:', 'warning');
  log('   TEST 04: Clinic invites doctor');
  log('   TEST 05: Test invalid invitations');
  log('   TEST 06: Wrong doctor tries to accept');
  log('   TEST 07: Doctor mobile OTP tests');
  log('   TEST 08: Doctor email OTP tests');
  log('   TEST 09: Navigation bypass attempts');
  log('   TEST 10: Personal information validation\n');

  const answer = await ask('Did you complete ALL doctor tests 04-10? (yes/no/skip): ');
  
  if (answer === 'yes') {
    const passed = await ask('Did ALL tests pass? (yes/no): ');
    if (passed === 'yes') {
      for (let i = 4; i <= 10; i++) {
        recordTest(i, `Doctor Flow Test ${i}`, 'PASS');
      }
      log('✅ TESTS 04-10 PASSED\n', 'success');
      return true;
    } else {
      const issue = await ask('Which tests failed? ');
      for (let i = 4; i <= 10; i++) {
        recordTest(i, `Doctor Flow Test ${i}`, 'FAIL', issue);
      }
      log('❌ TESTS 04-10 FAILED\n', 'error');
      return false;
    }
  } else {
    for (let i = 4; i <= 10; i++) {
      recordTest(i, `Doctor Flow Test ${i}`, 'MANUAL', 'Skipped');
    }
    log('⊘ TESTS 04-10 SKIPPED\n', 'warning');
    return null;
  }
}

async function test11to19_ValidationAndSecurity() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST 11-19: Validation, Security & Profile Tests', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('📋 Complete validation and security tests:', 'warning');
  log('   TEST 11: Professional information validation');
  log('   TEST 12: Unique registration number');
  log('   TEST 13: Document upload security');
  log('   TEST 14: Doctor submission');
  log('   TEST 15: Admin rejection');
  log('   TEST 16: Admin approval + relationship');
  log('   TEST 17: Clinic manage doctors');
  log('   TEST 18: Doctor login + dashboard');
  log('   TEST 19: Limited profile editing\n');

  const answer = await ask('Did you complete tests 11-19? (yes/no/skip): ');
  
  if (answer === 'yes') {
    const passed = await ask('Did ALL tests pass? (yes/no): ');
    if (passed === 'yes') {
      for (let i = 11; i <= 19; i++) {
        recordTest(i, `Validation/Security Test ${i}`, 'PASS');
      }
      log('✅ TESTS 11-19 PASSED\n', 'success');
      return true;
    } else {
      const issue = await ask('Which tests failed? ');
      for (let i = 11; i <= 19; i++) {
        recordTest(i, `Validation/Security Test ${i}`, 'FAIL', issue);
      }
      log('❌ TESTS 11-19 FAILED\n', 'error');
      return false;
    }
  } else {
    for (let i = 11; i <= 19; i++) {
      recordTest(i, `Validation/Security Test ${i}`, 'MANUAL', 'Skipped');
    }
    log('⊘ TESTS 11-19 SKIPPED\n', 'warning');
    return null;
  }
}

async function test20_FullRegression() {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('TEST 20: Complete 20×25 Regression (500 doctors)', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('⚠️  WARNING: This test requires significant time', 'warning');
  log('   Expected duration: 2-3 hours minimum\n', 'warning');

  log('📋 Full regression checklist:', 'info');
  log('   - 20 clinics registered and approved');
  log('   - 500 doctors invited and onboarded');
  log('   - 500 admin approvals');
  log('   - 500 active relationships created');
  log('   - Database integrity verified');
  log('   - No duplicates, no cross-clinic leaks\n');

  const answer = await ask('Did you complete the full regression? (yes/no/skip): ');
  
  if (answer === 'yes') {
    log('\nVerifying database integrity...', 'info');
    
    const passed = await ask('Confirm:\n  - 20 clinics VERIFIED\n  - 500 doctors VERIFIED\n  - 500 ACTIVE relationships\n  - No duplicates\nAll correct? (yes/no): ');
    
    if (passed === 'yes') {
      recordTest(20, 'Complete 20×25 Regression', 'PASS');
      log('✅ TEST 20 PASSED\n', 'success');
      return true;
    } else {
      const issue = await ask('What failed in database verification? ');
      recordTest(20, 'Complete 20×25 Regression', 'FAIL', issue);
      log('❌ TEST 20 FAILED\n', 'error');
      return false;
    }
  } else {
    recordTest(20, 'Complete 20×25 Regression', 'MANUAL', 'Skipped');
    log('⊘ TEST 20 SKIPPED\n', 'warning');
    return null;
  }
}

function generateReport() {
  log('\n\n═══════════════════════════════════════════════════════', 'info');
  log('FINAL TEST REPORT', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('Test Summary:', 'info');
  log(`  Total Tests:    20`, 'info');
  log(`  ✅ Passed:      ${results.passed}`, 'success');
  log(`  ❌ Failed:      ${results.failed}`, 'error');
  log(`  ⊘ Manual:       ${results.manual}`, 'warning');
  
  const passRate = ((results.passed / 20) * 100).toFixed(1);
  log(`  Pass Rate:      ${passRate}%\n`, 'info');

  log('Detailed Results:', 'info');
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⊘';
    const color = test.status === 'PASS' ? 'success' : test.status === 'FAIL' ? 'error' : 'warning';
    log(`  ${icon} TEST ${test.testNum.toString().padStart(2, '0')}: ${test.name}`, color);
    if (test.details) {
      log(`     Details: ${test.details}`, 'info');
    }
  });

  log('\n═══════════════════════════════════════════════════════', 'info');
  log('PRODUCTION READINESS DECISION', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  if (results.passed >= 19 && results.failed === 0) {
    log('✅ PRODUCTION READY', 'success');
    log('   All critical tests passed. System ready for deployment.\n', 'success');
  } else if (results.passed >= 15 && results.failed <= 2) {
    log('⚠️  PRODUCTION READY WITH WARNINGS', 'warning');
    log('   Most tests passed. Review failures before deployment.\n', 'warning');
  } else {
    log('❌ NOT PRODUCTION READY', 'error');
    log('   Critical issues found. Fix before deployment.\n', 'error');
  }

  log('Pass Criteria:', 'info');
  log(`  ✅ 20/20 Tests Passed:          ${results.passed === 20 ? 'YES' : 'NO'}`);
  log(`  ✅ 0 Failed Tests:              ${results.failed === 0 ? 'YES' : 'NO'}`);
  log(`  ✅ All Security Tests Passed:   ${results.failed === 0 ? 'YES' : 'UNKNOWN'}`);
  log(`  ✅ Database Integrity Verified: MANUAL CHECK REQUIRED\n`);
}

// Main test runner
async function runTests() {
  log('═══════════════════════════════════════════════════════', 'info');
  log('PULSEMATE CONNECT - HYBRID TEST RUNNER', 'info');
  log('20 Test Cases for Clinic + Doctor Onboarding', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('⚠️  IMPORTANT NOTES:', 'warning');
  log('   - This is a HYBRID test runner (semi-automated)');
  log('   - Many tests require MANUAL execution via UI');
  log('   - You will be prompted to confirm each test');
  log('   - Backend must be running on http://localhost:5000');
  log('   - Frontend must be running on http://localhost:3000\n');

  const ready = await ask('Are both servers running? (yes/no): ');
  if (ready !== 'yes') {
    log('\n❌ Please start both servers first:', 'error');
    log('   Terminal 1: cd backend && npm run dev');
    log('   Terminal 2: cd frontend && npm run dev\n');
    rl.close();
    return;
  }

  log('\n🚀 Starting test execution...\n', 'info');

  // Run tests
  await test01_ClinicRegistration();
  await test02_AdminApproval();
  await test03_OTPFailure();
  await test04to10_DoctorFlow();
  await test11to19_ValidationAndSecurity();
  
  const runFullRegression = await ask('\nRun full 500-doctor regression (2-3 hours)? (yes/no): ');
  if (runFullRegression === 'yes') {
    await test20_FullRegression();
  } else {
    recordTest(20, 'Complete 20×25 Regression', 'MANUAL', 'Skipped by user');
  }

  // Generate report
  generateReport();

  rl.close();
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'error');
  rl.close();
  process.exit(1);
});
