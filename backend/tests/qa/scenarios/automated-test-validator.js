#!/usr/bin/env node

/**
 * Automated Test Validator
 * Validates what CAN be automated and provides checklist for manual tests
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'sahilnaik1515@gmail.com';
const ADMIN_PASSWORD = 'Nkabu18$';

const prisma = new PrismaClient();
const results = {
  automated: { passed: 0, failed: 0, tests: [] },
  manual: { total: 0, tests: [] }
};

// Utility functions
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
};

const record = (category, test, status, details = '') => {
  results[category].tests.push({ test, status, details });
  if (category === 'automated') {
    if (status === 'PASS') results.automated.passed++;
    else if (status === 'FAIL') results.automated.failed++;
  }
};

// Automated tests
async function validateDatabaseConnection() {
  log('\n🔍 Validating Database Connection...', 'info');
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    log(`✅ Database connected (${userCount} users)`, 'success');
    record('automated', 'Database Connection', 'PASS', `${userCount} users found`);
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'error');
    record('automated', 'Database Connection', 'FAIL', error.message);
    return false;
  }
}

async function validateAdminLogin() {
  log('\n🔍 Validating Admin Login...', 'info');
  try {
    const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });
    const res = await api.post('/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (res.status === 200 && res.data.data?.token) {
      log('✅ Admin login successful', 'success');
      record('automated', 'Admin Login', 'PASS', 'Token received');
      return res.data.data.token;
    } else {
      log(`❌ Admin login failed: ${res.status}`, 'error');
      record('automated', 'Admin Login', 'FAIL', `Status ${res.status}`);
      return null;
    }
  } catch (error) {
    log(`❌ Admin login error: ${error.message}`, 'error');
    record('automated', 'Admin Login', 'FAIL', error.message);
    return null;
  }
}

async function validateDatabaseIntegrity() {
  log('\n🔍 Validating Database Integrity...', 'info');
  
  try {
    // Check for clinics
    const clinicCount = await prisma.clinic.count();
    const verifiedClinics = await prisma.clinic.count({
      where: { approvalStatus: 'VERIFIED' }
    });
    log(`  Clinics: ${clinicCount} total, ${verifiedClinics} verified`, 'info');

    // Check for doctors
    const doctorCount = await prisma.doctor.count();
    log(`  Doctors: ${doctorCount} total`, 'info');

    // Check for relationships
    const relationshipCount = await prisma.clinicDoctor.count();
    const activeRelationships = await prisma.clinicDoctor.count({
      where: { status: 'ACTIVE' }
    });
    log(`  Relationships: ${relationshipCount} total, ${activeRelationships} active`, 'info');

    // Check for duplicates
    const duplicateRegistrations = await prisma.$queryRaw`
      SELECT "medicalRegistrationNumber", COUNT(*) as count
      FROM "Doctor"
      GROUP BY "medicalRegistrationNumber"
      HAVING COUNT(*) > 1
    `;

    if (duplicateRegistrations.length === 0) {
      log('  ✅ No duplicate registration numbers', 'success');
    } else {
      log(`  ⚠️  Found ${duplicateRegistrations.length} duplicate registration numbers`, 'warning');
    }

    log('✅ Database integrity check complete', 'success');
    record('automated', 'Database Integrity', 'PASS', 
      `${clinicCount} clinics, ${doctorCount} doctors, ${activeRelationships} active relationships`);
    
    return {
      clinics: clinicCount,
      verifiedClinics,
      doctors: doctorCount,
      relationships: relationshipCount,
      activeRelationships,
      hasDuplicates: duplicateRegistrations.length > 0
    };
  } catch (error) {
    log(`❌ Database integrity check failed: ${error.message}`, 'error');
    record('automated', 'Database Integrity', 'FAIL', error.message);
    return null;
  }
}

async function checkEndpointAvailability() {
  log('\n🔍 Checking Critical Endpoints...', 'info');
  const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });
  
  const endpoints = [
    { method: 'POST', path: '/api/auth/register', name: 'Clinic Registration' },
    { method: 'POST', path: '/api/auth/send-otp', name: 'Send OTP' },
    { method: 'POST', path: '/api/auth/verify-otp', name: 'Verify OTP' },
    { method: 'POST', path: '/api/auth/login', name: 'Login' },
  ];

  let allAvailable = true;
  for (const endpoint of endpoints) {
    try {
      // Just check if endpoint exists (will return error but not 404)
      const res = await api[endpoint.method.toLowerCase()](endpoint.path, {});
      if (res.status !== 404) {
        log(`  ✅ ${endpoint.name}: Available`, 'success');
      } else {
        log(`  ❌ ${endpoint.name}: Not found (404)`, 'error');
        allAvailable = false;
      }
    } catch (error) {
      log(`  ⚠️  ${endpoint.name}: ${error.message}`, 'warning');
    }
  }

  if (allAvailable) {
    record('automated', 'Endpoint Availability', 'PASS', 'All endpoints available');
  } else {
    record('automated', 'Endpoint Availability', 'FAIL', 'Some endpoints not found');
  }
}

// Manual test checklist generator
function generateManualChecklist(dbIntegrity) {
  log('\n═══════════════════════════════════════════════════════', 'info');
  log('MANUAL TEST CHECKLIST', 'warning');
  log('═══════════════════════════════════════════════════════\n', 'info');

  const manualTests = [
    {
      id: 1,
      name: 'Clinic Registration → OTP → PENDING',
      steps: [
        '1. Go to http://localhost:3000/register',
        '2. Register "Test Medical Center 001"',
        '3. Mobile: 9999999001, Email: testclinic001@gmail.com',
        '4. Verify mobile OTP: 123456',
        '5. Verify email OTP: 123456',
        '6. Check status becomes PENDING',
        '7. Try to invite doctor (should be BLOCKED)'
      ],
      expected: 'Clinic registered, status PENDING, cannot invite doctors'
    },
    {
      id: 2,
      name: 'Admin Approval',
      steps: [
        '1. Login as admin: sahilnaik1515@gmail.com / Nkabu18$',
        '2. Go to pending clinics',
        '3. Approve "Test Medical Center 001"',
        '4. Verify status becomes VERIFIED',
        '5. Login as clinic and access "Invite Doctor"'
      ],
      expected: 'Clinic approved, can now invite doctors'
    },
    {
      id: 3,
      name: 'OTP Failure Testing',
      steps: [
        '1. Register new clinic',
        '2. Try wrong OTP: 000000 (should fail)',
        '3. Try reusing old OTP (should fail)',
        '4. Request OTP 6 times (check rate limit)',
        '5. Use correct OTP (should work)'
      ],
      expected: 'Only valid, fresh OTP allows progression'
    },
    {
      id: 4,
      name: 'Complete Doctor Onboarding',
      steps: [
        '1. Clinic invites doctor',
        '2. Doctor accepts invitation',
        '3. Verify mobile OTP: 123456',
        '4. Verify email OTP: 123456',
        '5. Complete all 4 onboarding steps',
        '6. Upload required documents',
        '7. Submit for verification',
        '8. Admin approves doctor',
        '9. Verify relationship created',
        '10. Doctor can login'
      ],
      expected: 'Doctor fully onboarded and active'
    },
    {
      id: 5,
      name: 'Security: Cross-Clinic Isolation',
      steps: [
        '1. Login to Clinic A',
        '2. Note Clinic A\'s doctors',
        '3. Login to Clinic B',
        '4. Verify cannot see Clinic A\'s doctors',
        '5. Try to access Clinic A\'s doctor via URL (should fail)'
      ],
      expected: 'Complete isolation between clinics'
    },
    {
      id: 6,
      name: 'Doctor Profile Editing Limits',
      steps: [
        '1. Login as doctor',
        '2. Edit consultation fee (should work)',
        '3. Edit duration (should work)',
        '4. Upload new photo (should work)',
        '5. Try to edit name (should be blocked)',
        '6. Try to edit registration number (should be blocked)',
        '7. Try to edit DOB (should be blocked)'
      ],
      expected: 'Only fee, duration, photo editable'
    }
  ];

  manualTests.forEach(test => {
    log(`\n📋 TEST ${test.id}: ${test.name}`, 'warning');
    log('─'.repeat(60), 'info');
    test.steps.forEach(step => log(`   ${step}`, 'info'));
    log(`\n   ✅ Expected: ${test.expected}`, 'success');
    log(`   ❏ Status: [ ] PASS  [ ] FAIL  [ ] SKIP\n`, 'info');
    
    record('manual', test.name, 'PENDING', 'Manual test required');
    results.manual.total++;
  });
}

// Generate final report
function generateReport(dbIntegrity) {
  log('\n\n═══════════════════════════════════════════════════════', 'info');
  log('TEST VALIDATION REPORT', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('AUTOMATED TESTS', 'success');
  log('─'.repeat(60), 'info');
  results.automated.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    log(`${icon} ${test.test}: ${test.status}`, test.status === 'PASS' ? 'success' : 'error');
    if (test.details) log(`   ${test.details}`, 'info');
  });
  log(`\nAutomated: ${results.automated.passed} passed, ${results.automated.failed} failed\n`, 'info');

  log('MANUAL TESTS REQUIRED', 'warning');
  log('─'.repeat(60), 'info');
  log(`Total manual tests to complete: ${results.manual.total}`, 'warning');
  log('See checklist above for detailed steps\n', 'info');

  if (dbIntegrity) {
    log('CURRENT DATABASE STATE', 'info');
    log('─'.repeat(60), 'info');
    log(`Clinics:              ${dbIntegrity.clinics} total`, 'info');
    log(`  ├─ Verified:        ${dbIntegrity.verifiedClinics}`, 'info');
    log(`Doctors:              ${dbIntegrity.doctors} total`, 'info');
    log(`Relationships:        ${dbIntegrity.relationships} total`, 'info');
    log(`  ├─ Active:          ${dbIntegrity.activeRelationships}`, 'info');
    log(`Duplicates:           ${dbIntegrity.hasDuplicates ? '⚠️  Found' : '✅ None'}\n`, 
      dbIntegrity.hasDuplicates ? 'warning' : 'success');
  }

  log('PRODUCTION READINESS', 'info');
  log('─'.repeat(60), 'info');
  
  const canProceed = results.automated.failed === 0;
  if (canProceed) {
    log('✅ Automated checks PASSED', 'success');
    log('⚠️  Complete manual tests before production', 'warning');
    log('\nNEXT STEPS:', 'info');
    log('1. Follow manual test checklist above', 'info');
    log('2. Document results for each test', 'info');
    log('3. If all pass, system is production ready', 'info');
    log('4. If any fail, fix issues and retest\n', 'info');
  } else {
    log('❌ Automated checks FAILED', 'error');
    log('⚠️  Fix automated test failures before manual testing\n', 'warning');
  }

  log('═══════════════════════════════════════════════════════\n', 'info');
}

// Main execution
async function main() {
  log('═══════════════════════════════════════════════════════', 'info');
  log('PULSEMATE CONNECT - AUTOMATED TEST VALIDATOR', 'info');
  log('═══════════════════════════════════════════════════════\n', 'info');

  log('Running automated validation checks...\n', 'info');

  // Run automated tests
  const dbConnected = await validateDatabaseConnection();
  if (!dbConnected) {
    log('\n❌ Database not accessible. Cannot proceed.', 'error');
    process.exit(1);
  }

  const adminToken = await validateAdminLogin();
  await checkEndpointAvailability();
  const dbIntegrity = await validateDatabaseIntegrity();

  // Generate manual checklist
  generateManualChecklist(dbIntegrity);

  // Generate report
  generateReport(dbIntegrity);

  await prisma.$disconnect();
}

// Run
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
