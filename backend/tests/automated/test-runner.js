/**
 * Main Test Runner - Executes All 20 Tests
 * PulseMate Connect Automated Test Suite
 */

const { CONFIG, TEST_DATA, helpers } = require('./setup');

// Import all test modules
const test01 = require('./tests/test-01-clinic-registration');
const test02 = require('./tests/test-02-admin-approval');
const test03 = require('./tests/test-03-otp-failure');
const test04 = require('./tests/test-04-doctor-invitation');
const test05 = require('./tests/test-05-invitation-security');
const test06 = require('./tests/test-06-wrong-doctor-acceptance');
const test07 = require('./tests/test-07-doctor-mobile-otp');
const test08 = require('./tests/test-08-doctor-email-otp');
const test09 = require('./tests/test-09-navigation-bypass');
const test10 = require('./tests/test-10-personal-info-validation');
const test11 = require('./tests/test-11-professional-info-validation');
const test12 = require('./tests/test-12-unique-registration');
const test13 = require('./tests/test-13-document-upload');
const test14 = require('./tests/test-14-doctor-submission');
const test15 = require('./tests/test-15-admin-rejection');
const test16 = require('./tests/test-16-admin-approval-relationship');
const test17 = require('./tests/test-17-clinic-manage-doctors');
const test18 = require('./tests/test-18-doctor-login-dashboard');
const test19 = require('./tests/test-19-limited-profile-editing');
const test20 = require('./tests/test-20-full-regression');

// Test Suite
const TEST_SUITE = [
  { number: 1, name: 'Clinic Registration → OTP → Pending', test: test01 },
  { number: 2, name: 'Admin Approval', test: test02 },
  { number: 3, name: 'OTP Failure Conditions', test: test03 },
  { number: 4, name: 'Doctor Invitation Creation', test: test04 },
  { number: 5, name: 'Invitation Security', test: test05 },
  { number: 6, name: 'Wrong Doctor Acceptance', test: test06 },
  { number: 7, name: 'Doctor Mobile OTP', test: test07 },
  { number: 8, name: 'Doctor Email OTP', test: test08 },
  { number: 9, name: 'Navigation Bypass Prevention', test: test09 },
  { number: 10, name: 'Personal Information Validation', test: test10 },
  { number: 11, name: 'Professional Information Validation', test: test11 },
  { number: 12, name: 'Unique Registration Number', test: test12 },
  { number: 13, name: 'Document Upload', test: test13 },
  { number: 14, name: 'Doctor Submission', test: test14 },
  { number: 15, name: 'Admin Rejection', test: test15 },
  { number: 16, name: 'Admin Approval + Relationship', test: test16 },
  { number: 17, name: 'Clinic Manage Doctors', test: test17 },
  { number: 18, name: 'Doctor Login + Dashboard', test: test18 },
  { number: 19, name: 'Limited Profile Editing', test: test19 },
  { number: 20, name: 'Complete 20×25 Regression', test: test20 },
];

/**
 * Main Test Execution
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('PULSEMATE CONNECT - AUTOMATED TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log(`Backend URL: ${CONFIG.BACKEND_URL}`);
  console.log(`Frontend URL: ${CONFIG.FRONTEND_URL}`);
  console.log('='.repeat(80) + '\n');

  const results = [];
  const startTime = Date.now();

  for (const testCase of TEST_SUITE) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`▶️  Starting TEST ${testCase.number}: ${testCase.name}`);
    console.log('─'.repeat(80));

    try {
      const result = await testCase.test.execute();
      
      results.push({
        testNumber: testCase.number,
        testName: testCase.name,
        status: result.status,
        duration: result.duration,
        details: result.details,
        error: result.error || null,
        timestamp: new Date().toISOString(),
      });

      helpers.log(testCase.number, testCase.name, result.status, result.details);

      // Stop on critical failures
      if (result.status === 'FAIL' && result.critical) {
        console.log('\n🚨 CRITICAL FAILURE - Stopping test suite');
        break;
      }

    } catch (error) {
      console.error(`\n❌ TEST ${testCase.number} ERROR:`, error.message);
      results.push({
        testNumber: testCase.number,
        testName: testCase.name,
        status: 'FAIL',
        duration: 0,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test Suite Completed in ${totalDuration}s`);
  console.log('='.repeat(80));

  // Generate and display report
  const report = helpers.generateReport(results);

  // Save results to file
  const resultsFile = helpers.saveResults({
    summary: report,
    tests: results,
    config: CONFIG,
    duration: totalDuration,
    timestamp: new Date().toISOString(),
  });

  // Exit with appropriate code
  process.exit(report.failed > 0 ? 1 : 0);
}

/**
 * Run specific tests
 */
async function runSpecificTests(testNumbers) {
  const testsToRun = TEST_SUITE.filter(t => testNumbers.includes(t.number));
  
  console.log(`\nRunning ${testsToRun.length} specific tests: ${testNumbers.join(', ')}\n`);

  for (const testCase of testsToRun) {
    console.log(`\n▶️  TEST ${testCase.number}: ${testCase.name}`);
    try {
      const result = await testCase.test.execute();
      helpers.log(testCase.number, testCase.name, result.status, result.details);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
Usage: node test-runner.js [options]

Options:
  --all              Run all 20 tests (default)
  --test <numbers>   Run specific tests (e.g., --test 1,2,3)
  --help             Show this help message

Examples:
  node test-runner.js                    # Run all tests
  node test-runner.js --test 1,2,3       # Run tests 1, 2, and 3
  node test-runner.js --test 1-5         # Run tests 1 through 5
  `);
  process.exit(0);
}

if (args.includes('--test')) {
  const testArg = args[args.indexOf('--test') + 1];
  let testNumbers = [];
  
  if (testArg.includes('-')) {
    // Range format: 1-5
    const [start, end] = testArg.split('-').map(Number);
    testNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  } else {
    // Comma-separated format: 1,2,3
    testNumbers = testArg.split(',').map(Number);
  }
  
  runSpecificTests(testNumbers);
} else {
  // Run all tests by default
  runAllTests();
}
