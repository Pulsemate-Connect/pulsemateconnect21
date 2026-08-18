# PulseMate Connect - Comprehensive QA Test Suite

## Overview

This directory contains automated end-to-end QA tests for the complete clinic + doctor onboarding flow.

**Test Coverage:**
- 20 Clinics
- 25 Doctors per Clinic
- 500 Total Doctor-Clinic Relationships
- 20 Test Scenarios
- Security, Validation, State Machine, and Integration Tests

## Directory Structure

```
tests/qa/
├── README.md                           # This file
├── config/
│   ├── test.config.js                 # Test configuration
│   └── database.config.js             # Test database setup
├── data/
│   ├── generators/
│   │   ├── clinicGenerator.js         # Generate 20 unique clinics
│   │   ├── doctorGenerator.js         # Generate 500 unique doctors
│   │   └── dataSeeder.js              # Seed database with test data
│   └── fixtures/
│       ├── clinics.json               # Generated clinic data
│       └── doctors.json               # Generated doctor data
├── helpers/
│   ├── apiClient.js                   # HTTP client wrapper
│   ├── otpHelper.js                   # OTP generation/verification
│   ├── authHelper.js                  # Authentication utilities
│   ├── databaseHelper.js              # Database validation
│   └── reportGenerator.js             # Test report generation
├── scenarios/
│   ├── test01.clinic-complete-flow.spec.js
│   ├── test02.clinic-wrong-otp.spec.js
│   ├── test03.clinic-admin-rejection.spec.js
│   ├── test04.clinic-invite-before-approval.spec.js
│   ├── test05.doctor-normal-invitation.spec.js
│   ├── test06.doctor-wrong-acceptance.spec.js
│   ├── test07.doctor-expired-invitation.spec.js
│   ├── test08.doctor-otp-flow.spec.js
│   ├── test09.doctor-step-skipping.spec.js
│   ├── test10.doctor-onboarding-validation.spec.js
│   ├── test11.unique-registration-number.spec.js
│   ├── test12.document-upload-security.spec.js
│   ├── test13.doctor-submission.spec.js
│   ├── test14.admin-rejection.spec.js
│   ├── test15.admin-approval.spec.js
│   ├── test16.clinic-manage-doctors.spec.js
│   ├── test17.cross-clinic-security.spec.js
│   ├── test18.doctor-login-dashboard.spec.js
│   ├── test19.limited-profile-editing.spec.js
│   └── test20.complete-500-regression.spec.js
├── validation/
│   ├── backButtonTest.js              # Browser back/forward validation
│   ├── apiBypassTest.js               # API security bypass attempts
│   ├── databaseIntegrityTest.js       # Database relationship validation
│   └── auditLoggingTest.js            # Audit log validation
└── reports/
    ├── test-results.json               # Raw test results
    ├── test-report.html                # HTML test report
    └── test-summary.txt                # Text summary
```

## Installation

```bash
cd backend
npm install
```

## Configuration

### 1. Environment Variables

Create `backend/.env.test`:

```env
NODE_ENV=test
DATABASE_URL="postgresql://user:pass@localhost:5432/pulsemate_test"
JWT_SECRET="test-jwt-secret-key-for-qa"
JWT_EXPIRES_IN="24h"

# Test OTP Configuration
TEST_OTP_ENABLED=true
TEST_OTP_CODE=123456
TEST_OTP_NUMBERS=9000000001,9000000002,9000000003

# Admin Test Account
TEST_ADMIN_EMAIL=sahilnaik1515@gmail.com
TEST_ADMIN_PASSWORD=Nkabu18$

# Test Email Configuration
TEST_EMAIL_ENABLED=true
TEST_EMAIL_PROVIDER=mock

# File Upload
UPLOAD_DIR=./tests/qa/uploads
MAX_FILE_SIZE=5242880
```

### 2. Test Database

Create a separate test database:

```bash
# Create test database
createdb pulsemate_test

# Run migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Generate Prisma Client
npx prisma generate
```

## Usage

### Run All Tests

```bash
npm run test:qa
```

### Run Specific Test Scenario

```bash
npm run test:qa -- --testNamePattern="TEST 01"
```

### Generate Test Data

```bash
npm run test:generate-data
```

### Run Quick Smoke Test (1 Clinic + 5 Doctors)

```bash
npm run test:qa-smoke
```

### Run Full Regression (20 Clinics + 500 Doctors)

```bash
npm run test:qa-full
```

### Generate Report

```bash
npm run test:report
```

## Test Execution Order

1. **Setup Phase**
   - Clear test database
   - Generate test data (20 clinics + 500 doctors)
   - Seed database with initial data

2. **Clinic Tests (TEST 01-04)**
   - Test clinic registration, OTP, approval, rejection

3. **Doctor Invitation Tests (TEST 05-07)**
   - Test invitation flow, acceptance, expiration

4. **Doctor OTP Tests (TEST 08)**
   - Test mobile/email OTP verification

5. **Doctor Onboarding Tests (TEST 09-12)**
   - Test 4-step onboarding, validation, document upload

6. **Admin Verification Tests (TEST 13-15)**
   - Test submission, rejection, approval

7. **Clinic-Doctor Relationship Tests (TEST 16-17)**
   - Test manage doctors, cross-clinic security

8. **Doctor Profile Tests (TEST 18-19)**
   - Test login, dashboard, limited editing

9. **Full Regression Test (TEST 20)**
   - Test all 500 doctor-clinic relationships

10. **Validation Tests**
    - Back button test
    - API bypass test
    - Database integrity test
    - Audit logging test

11. **Teardown Phase**
    - Generate test report
    - Clean up test data (optional)

## Test Data

### Clinics (20 Total)

```
CLINIC-001: Test Medical Clinic 001
  Email: clinic001@pulsematetest.com
  Mobile: 9000000001
  Owner: Dr. Owner 001
  
CLINIC-002: Test Medical Clinic 002
  Email: clinic002@pulsematetest.com
  Mobile: 9000000002
  Owner: Dr. Owner 002
  
...

CLINIC-020: Test Medical Clinic 020
  Email: clinic020@pulsematetest.com
  Mobile: 9000000020
  Owner: Dr. Owner 020
```

### Doctors (500 Total = 25 per Clinic)

```
CLINIC-001:
  clinic001.doctor001@pulsematetest.com (9100000001)
  clinic001.doctor002@pulsematetest.com (9100000002)
  ...
  clinic001.doctor025@pulsematetest.com (9100000025)

CLINIC-002:
  clinic002.doctor001@pulsematetest.com (9100000026)
  clinic002.doctor002@pulsematetest.com (9100000027)
  ...
  clinic002.doctor025@pulsematetest.com (9100000050)

...

CLINIC-020:
  clinic020.doctor001@pulsematetest.com (9100000476)
  clinic020.doctor002@pulsematetest.com (9100000477)
  ...
  clinic020.doctor025@pulsematetest.com (9100000500)
```

## Expected Results

After successful execution:

```
✓ 20 Clinics Registered
✓ 20 Clinics OTP Verified
✓ 20 Clinics Approved
✓ 500 Doctors Invited
✓ 500 Doctors Accepted Invitations
✓ 500 Doctors Completed Onboarding
✓ 500 Doctors Approved by Admin
✓ 500 Active Clinic-Doctor Relationships
✓ 500 Doctors Can Login
✓ All Security Tests Passed
✓ All Validation Tests Passed
✓ Database Integrity Verified
```

## Test Report Example

```
═══════════════════════════════════════════════════════
PULSEMATE CONNECT - QA TEST REPORT
═══════════════════════════════════════════════════════

Execution Date: 2026-08-17 14:30:00
Duration: 2h 15m 30s

SUMMARY
───────────────────────────────────────────────────────
Clinics Tested:             20
Doctors Tested:             500
Total Scenarios:            20
Total Test Cases:           1,250

RESULTS
───────────────────────────────────────────────────────
✓ Passed:                   1,240 (99.2%)
✗ Failed:                   8 (0.6%)
⊘ Blocked:                  2 (0.2%)
⊙ Skipped:                  0 (0.0%)

FAILURES BY CATEGORY
───────────────────────────────────────────────────────
Critical Security:          0
Data Integrity:             2
Authentication:             0
Authorization:              1
OTP Verification:           3
Onboarding Flow:            1
Document Upload:            1
Clinic Relationship:        0
Profile Permissions:        0

DETAILED RESULTS
───────────────────────────────────────────────────────

TEST 01 - CLINIC COMPLETE FLOW
  ✓ Clinic 001 Registration           PASS
  ✓ Clinic 001 OTP Verification       PASS
  ✓ Clinic 001 Admin Approval         PASS
  Status: ✓ PASSED (20/20 clinics)

TEST 02 - CLINIC WRONG OTP
  ✓ Invalid OTP Rejected              PASS
  ✓ Expired OTP Rejected              PASS
  ✗ Reused OTP Not Rejected           FAIL
  Status: ⚠ PARTIAL (18/20 clinics)

...

PRODUCTION READINESS: ⚠ NOT READY
───────────────────────────────────────────────────────
Critical Issues:        0
High Priority:          3
Medium Priority:        5
Low Priority:           0

RECOMMENDATIONS
───────────────────────────────────────────────────────
1. Fix OTP reuse vulnerability in auth.controller.js
2. Add database constraint for unique registration numbers
3. Strengthen document upload validation

═══════════════════════════════════════════════════════
```

## Troubleshooting

### Database Connection Errors

```bash
# Check database is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Reset test database
npm run test:db-reset
```

### Test Timeouts

Increase timeout in `jest.config.js`:

```javascript
module.exports = {
  testTimeout: 60000, // 60 seconds
};
```

### OTP Issues

Check `.env.test`:

```env
TEST_OTP_ENABLED=true
TEST_OTP_CODE=123456
```

### File Upload Failures

Check upload directory permissions:

```bash
mkdir -p tests/qa/uploads
chmod 755 tests/qa/uploads
```

## Contributing

When adding new tests:

1. Follow naming convention: `testXX.description.spec.js`
2. Use consistent test data patterns
3. Include database validation
4. Add proper cleanup in `afterEach`
5. Document expected behavior
6. Update this README

## Support

For issues or questions:
- Check existing test scenarios for examples
- Review `helpers/` for utility functions
- Consult `COMPLETE_TESTING_GUIDE.md` for manual testing reference
