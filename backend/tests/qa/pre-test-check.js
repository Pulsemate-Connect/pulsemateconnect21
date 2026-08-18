/**
 * Pre-Test Check Script
 * Verifies all prerequisites before running 45-identity test
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEnvironment() {
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  PRE-TEST ENVIRONMENT CHECK                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝\n', 'cyan');

  const checks = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Check 1: Environment variables
  log('→ Checking environment variables...', 'cyan');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ENABLE_TEST_OTP',
    'TEST_OTP_CODE',
    'TEST_EMAIL_DOMAIN',
  ];

  let allEnvVarsPresent = true;
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      log(`  ✓ ${varName} is set`, 'green');
    } else {
      log(`  ✗ ${varName} is NOT set`, 'red');
      allEnvVarsPresent = false;
    }
  });

  if (allEnvVarsPresent) {
    log('✓ Environment variables check PASSED\n', 'green');
    checks.passed++;
  } else {
    log('✗ Environment variables check FAILED\n', 'red');
    checks.failed++;
  }

  // Check 2: Database connection
  log('→ Checking database connection...', 'cyan');
  try {
    await prisma.$connect();
    log('✓ Database connection successful\n', 'green');
    checks.passed++;
  } catch (error) {
    log(`✗ Database connection FAILED: ${error.message}\n`, 'red');
    checks.failed++;
  }

  // Check 3: Test admin user
  log('→ Checking test admin user...', 'cyan');
  try {
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'sahilnaik1515@gmail.com';
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      include: { adminProfile: true },
    });

    if (admin && admin.adminProfile) {
      log(`✓ Test admin exists: ${admin.email} (${admin.adminProfile.level})`, 'green');
      log(`  Role: ${admin.role}`, 'green');
      log(`  Status: ${admin.approvalStatus}\n`, 'green');
      checks.passed++;
    } else if (admin) {
      log(`⚠ User exists but has no admin profile`, 'yellow');
      log(`  Email: ${admin.email}`, 'yellow');
      log(`  Role: ${admin.role}\n`, 'yellow');
      checks.warnings++;
    } else {
      log(`✗ Test admin user NOT found: ${adminEmail}\n`, 'red');
      checks.failed++;
    }
  } catch (error) {
    log(`✗ Admin check FAILED: ${error.message}\n`, 'red');
    checks.failed++;
  }

  // Check 4: Backend API availability
  log('→ Checking backend API availability...', 'cyan');
  try {
    const response = await axios.get('http://localhost:5000/api/auth/me', {
      validateStatus: () => true,
    });
    
    if (response.status === 401 || response.status === 403) {
      log('✓ Backend API is responding (authentication required)\n', 'green');
      checks.passed++;
    } else {
      log(`⚠ Backend API responded with status: ${response.status}\n`, 'yellow');
      checks.warnings++;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('✗ Backend API is NOT running on port 5000\n', 'red');
      log('  Please start backend: npm run dev\n', 'yellow');
      checks.failed++;
    } else {
      log(`⚠ Backend API check inconclusive: ${error.message}\n`, 'yellow');
      checks.warnings++;
    }
  }

  // Check 5: Test OTP configuration
  log('→ Checking test OTP configuration...', 'cyan');
  if (process.env.ENABLE_TEST_OTP === 'true') {
    log('✓ Test OTP mode is ENABLED', 'green');
    log(`  Test OTP Code: ${process.env.TEST_OTP_CODE || 'NOT SET'}`, 'green');
    log(`  Test Email Domain: ${process.env.TEST_EMAIL_DOMAIN || 'NOT SET'}\n`, 'green');
    checks.passed++;
  } else {
    log('✗ Test OTP mode is DISABLED', 'red');
    log('  Set ENABLE_TEST_OTP=true in .env\n', 'yellow');
    checks.failed++;
  }

  // Check 6: Email service configuration
  log('→ Checking email service configuration...', 'cyan');
  const emailProvider = process.env.EMAIL_PROVIDER || 'none';
  log(`  Email Provider: ${emailProvider}`, 'cyan');
  
  if (emailProvider === 'console') {
    log('✓ Using console mode (OTPs will be logged)\n', 'green');
    checks.passed++;
  } else if (emailProvider === 'resend' && process.env.RESEND_API_KEY) {
    log('✓ Resend configured\n', 'green');
    checks.passed++;
  } else if (emailProvider === 'smtp' && process.env.SMTP_HOST) {
    log('✓ SMTP configured\n', 'green');
    checks.passed++;
  } else {
    log('⚠ Email service may not be configured\n', 'yellow');
    checks.warnings++;
  }

  // Check 7: Existing test data
  log('→ Checking for existing test data...', 'cyan');
  try {
    const testUsers = await prisma.user.count({
      where: {
        OR: [
          { email: { contains: 'pulsematetest.com' } },
          { mobile: { startsWith: '90000' } },
          { mobile: { startsWith: '91000' } },
        ],
      },
    });

    const testClinics = await prisma.clinic.count({
      where: {
        clinicRegistrationNumber: { startsWith: 'TEST_REG_CLINIC' },
      },
    });

    const testDoctors = await prisma.doctorProfile.count({
      where: {
        medicalRegistrationNumber: { startsWith: 'TEST_MED_REG' },
      },
    });

    if (testUsers > 0 || testClinics > 0 || testDoctors > 0) {
      log(`⚠ Found existing test data:`, 'yellow');
      log(`  Test Users: ${testUsers}`, 'yellow');
      log(`  Test Clinics: ${testClinics}`, 'yellow');
      log(`  Test Doctors: ${testDoctors}`, 'yellow');
      log(`  Consider cleaning up before running new tests\n`, 'yellow');
      checks.warnings++;
    } else {
      log('✓ No existing test data found (clean slate)\n', 'green');
      checks.passed++;
    }
  } catch (error) {
    log(`⚠ Could not check existing test data: ${error.message}\n`, 'yellow');
    checks.warnings++;
  }

  // Summary
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  PRE-TEST CHECK SUMMARY                                          ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`Checks Passed: ${checks.passed}`, 'green');
  log(`Checks Failed: ${checks.failed}`, 'red');
  log(`Warnings: ${checks.warnings}`, 'yellow');

  if (checks.failed === 0) {
    log('\n✓ All critical checks passed! Ready to run 45-identity test.\n', 'green');
    return true;
  } else {
    log('\n✗ Some critical checks failed. Please fix the issues above before running tests.\n', 'red');
    return false;
  }
}

async function main() {
  try {
    const ready = await checkEnvironment();
    process.exit(ready ? 0 : 1);
  } catch (error) {
    log(`\nFATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

