# 45 IDENTITY COMPREHENSIVE END-TO-END TEST SUITE

## Overview

This test suite performs a comprehensive end-to-end QA test of PulseMate Connect using **45 unique test identity accounts**:

- **20 Clinic Owner accounts** → 20 Clinic records
- **25 Doctor accounts** → 25 Doctor profiles

## Test Coverage

### ✅ What This Test Suite Does

1. **OTP Verification Testing**
   - Real email OTP verification for clinics
   - Real mobile OTP verification for clinics
   - Real email OTP verification for doctors
   - Real mobile OTP verification for doctors

2. **Registration Flow Testing**
   - Complete 6-step clinic registration for all 20 clinics
   - Complete 4-step doctor profile completion for all 25 doctors
   - Validation at every step
   - Error handling verification

3. **Approval/Rejection Flow Testing**
   - Admin approval for 20 clinics
   - Admin approval for 22 doctors
   - Admin rejection for 3 doctors (Doctor021, Doctor022, Doctor023)
   - Status transition verification

4. **Database Integrity Testing**
   - No duplicate users
   - No duplicate clinics
   - No duplicate doctor profiles
   - No orphaned records
   - Proper foreign key relationships
   - Valid approval statuses
   - Correct multi-clinic doctor relationships

5. **Security Testing**
   - PENDING clinics cannot login
   - PENDING doctors cannot login
   - REJECTED users cannot login
   - VERIFIED users can login
   - No authorization bypass possible

6. **Multi-Clinic Doctor Testing**
   - ONE User record per doctor
   - ONE DoctorProfile per doctor
   - MULTIPLE DoctorClinic records for multi-clinic doctors
   - No duplicate accounts on re-invitation

## Prerequisites

### Environment Setup

1. **Test Mode Configuration**

Create/update `.env` file with test mode enabled:

```env
# Test Mode
NODE_ENV=test
ENABLE_TEST_OTP=true
TEST_OTP_CODE=123456

# Test Email Domain
TEST_EMAIL_DOMAIN=pulsematetest.com

# Test Phone Numbers (for Firebase)
TEST_OTP_NUMBERS=90000,91000  # Prefix for test numbers

# Admin Credentials
TEST_ADMIN_EMAIL=sahilnaik1515@gmail.com
TEST_ADMIN_PASSWORD=Nkabu18$

# API Base URL
TEST_API_BASE=http://localhost:5000/api
TEST_FRONTEND_URL=http://localhost:3000
```

2. **Database Setup**

The test uses your existing database. Recommended to use a separate test database:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/pulsemate_test
DIRECT_URL=postgresql://user:pass@localhost:5432/pulsemate_test
```

3. **Email Service Configuration**

The test requires a working email service. Options:

**Option A: SMTP (Recommended for testing)**
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-test-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-test-email@gmail.com
```

**Option B: Resend**
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@pulsematetest.com
```

**Option C: Console (Development)**
```env
EMAIL_PROVIDER=console
```
This will log OTPs to console instead of sending emails.

4. **SMS/Mobile OTP Configuration**

For Firebase Phone Auth:
- Ensure Firebase test phone numbers are configured
- Or use TEST_OTP_MODE to bypass real SMS

For Message Central (alternative):
- Configure Message Central API key

### Test Email Accounts

The test creates email addresses like:
- `clinic001@pulsematetest.com` to `clinic020@pulsematetest.com`
- `doctor001@pulsematetest.com` to `doctor025@pulsematetest.com`

**Options for handling test emails:**

1. **Use a catch-all domain** (Recommended)
   - Set up `pulsematetest.com` with catch-all email
   - All test emails will be received in one inbox

2. **Use email service test mode**
   - Resend: Configure test mode
   - Mailtrap: Use Mailtrap inbox for testing

3. **Use console logging** (Development only)
   - Set `EMAIL_PROVIDER=console`
   - OTPs will be logged to console

### Test Phone Numbers

The test creates phone numbers like:
- Clinics: `9000000001` to `9000000020`
- Doctors: `9100000001` to `9100000025`

**For Firebase Phone Auth:**
1. Add these as test phone numbers in Firebase Console
2. Configure them to accept OTP `123456`

**For Message Central:**
- Use test numbers that won't trigger actual SMS

## Running the Test

### Quick Start

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Set environment variables
cp .env.example .env
# Edit .env with test configuration

# Run the test
node tests/qa/45-identity-comprehensive-test.js
```

### What the Test Does (Step by Step)

#### Phase 1: Clinic Registration (20 Clinics)

For each clinic (001 to 020):
1. Send email OTP
2. Verify email OTP
3. Send mobile OTP
4. Verify mobile OTP
5. Submit clinic application
6. Verify database state:
   - User created with role=CLINIC_OWNER
   - Clinic created with approvalStatus=PENDING
   - Clinic.isActive=false
7. Attempt login (should be BLOCKED)

**Expected:** All 20 clinics registered in PENDING state

#### Phase 2: Clinic Approval (20 Clinics)

For each clinic:
1. Admin opens clinic application
2. Admin approves clinic
3. Verify database state:
   - User.approvalStatus=VERIFIED
   - Clinic.approvalStatus=VERIFIED
   - Clinic.isActive=true
4. Test login (should SUCCEED)

**Expected:** All 20 clinics approved and can login

#### Phase 3: Doctor Invitation & Onboarding (25 Doctors)

For each doctor (001 to 025):
1. Clinic owner sends invitation
2. Doctor opens invitation link
3. Doctor accepts invitation
4. Verify mobile OTP
5. Verify email OTP
6. Complete profile (4 steps):
   - Personal information
   - Professional information
   - Documents
   - Professional profile
7. Submit for verification
8. Verify database state:
   - User created with role=DOCTOR
   - DoctorProfile created
   - User.approvalStatus=PENDING
   - DoctorProfile.verificationStatus=PENDING
9. Attempt login (should be BLOCKED)

**Expected:** All 25 doctors registered in PENDING state

#### Phase 4: Doctor Approval (22 Approved, 3 Rejected)

For doctors 001-020 and 024-025:
1. Admin approves doctor
2. Verify database state:
   - User.approvalStatus=VERIFIED
   - DoctorProfile.verificationStatus=VERIFIED
3. Test login (should SUCCEED)

For doctors 021-023:
1. Admin rejects doctor
2. Verify database state:
   - User.approvalStatus=REJECTED
   - DoctorProfile.verificationStatus=REJECTED
3. Test login (should be BLOCKED)

**Expected:** 22 approved, 3 rejected

#### Phase 5: Multi-Clinic Doctor Test

1. Take Doctor025 (already verified)
2. Invite to second clinic (Clinic002)
3. Verify database:
   - ONLY ONE User record
   - ONLY ONE DoctorProfile record
   - TWO DoctorClinic records
4. Remove from first clinic
5. Verify doctor still active at second clinic

**Expected:** Multi-clinic support works correctly

#### Phase 6: Final Database Audit

Check for:
- Duplicate emails
- Duplicate mobile numbers
- Duplicate users
- Duplicate doctor profiles
- Orphaned doctor profiles
- Orphaned doctor-clinic relationships
- Invalid approval statuses
- Inconsistent isActive values

**Expected:** No issues found

## Test Output

### Console Output

The test provides colored console output:
- 🔵 Blue: Test steps
- 🟢 Green: Passed tests
- 🔴 Red: Failed tests
- 🟡 Yellow: Blocked/Not Run tests
- 🟣 Magenta: Phase headers

### Reports Generated

1. **JSON Report**
   - `backend/tests/qa/reports/test-report-[timestamp].json`
   - Complete test results with all details
   - Machine-readable for further analysis

2. **Markdown Report**
   - `backend/tests/qa/reports/test-report-[timestamp].md`
   - Human-readable summary
   - Tables for all test results
   - Failed test details with errors

### Sample Output

```
═══════════════════════════════════════════════════════════════════
  PULSEMATE CONNECT - 45 IDENTITY COMPREHENSIVE E2E TEST SUITE
═══════════════════════════════════════════════════════════════════

→ Logging in as admin...
✓ Admin logged in successfully

╔══════════════════════════════════════════════════════════════════╗
║  PHASE 1: CLINIC REGISTRATION (20 Clinics)                       ║
╚══════════════════════════════════════════════════════════════════╝

→ Testing CLINIC_001: TEST_CLINIC_001
  Step 1: Sending email OTP...
  Step 2: Verifying email OTP...
  Step 3: Sending mobile OTP...
  Step 4: Verifying mobile OTP...
  Step 5: Submitting clinic application...
  Step 6: Verifying database state...
  Step 7: Attempting login (should be BLOCKED)...
✓ CLINIC_001: TEST_CLINIC_001 - PASS

[... continues for all 20 clinics ...]

═══════════════════════════════════════════════════════════════════
  FINAL TEST REPORT
═══════════════════════════════════════════════════════════════════

TOTAL TESTS: 72
PASSED: 70
FAILED: 2
BLOCKED: 0
NOT RUN: 0

PASS RATE: 97.2%
```

## Understanding Test Results

### Test Result Values

- **PASS** - Test completed successfully, all checks passed
- **FAIL** - Test failed, check error details
- **BLOCKED** - Test couldn't run (dependency failure)
- **NOT_TESTED** - Step was skipped
- **NOT RUN** - Test was not executed

### Common Failure Scenarios

#### OTP Verification Failures

**Symptom:** OTP verification fails
**Possible Causes:**
- Email service not configured
- SMS service not configured
- TEST_OTP_CODE not matching
- ENABLE_TEST_OTP not set to 'true'

**Fix:**
```env
ENABLE_TEST_OTP=true
TEST_OTP_CODE=123456
```

#### Database State Mismatch

**Symptom:** Database checks fail
**Possible Causes:**
- Async timing issues (not waiting for DB commit)
- Transaction not committed
- Cascade delete issues

**Fix:**
- Increase wait time after operations
- Check database logs
- Verify Prisma schema relationships

#### Login Blocked Unexpectedly

**Symptom:** VERIFIED user cannot login
**Possible Causes:**
- Password mismatch
- Session/token issues
- Middleware blocking incorrectly

**Fix:**
- Check auth.controller.js login logic
- Verify password hashing
- Check middleware requirements

#### Multi-Clinic Doctor Issues

**Symptom:** Duplicate User or DoctorProfile created
**Possible Causes:**
- Invitation logic not checking for existing user
- Email/mobile lookup failing

**Fix:**
- Check doctor.controller.js `acceptInvitation()`
- Verify User lookup by email AND mobile
- Check unique constraints

## Debugging

### Enable Verbose Logging

```javascript
// Add to test file
const DEBUG = true;

if (DEBUG) {
  console.log('Debug info:', data);
}
```

### Check Database State

```sql
-- Check test users
SELECT id, name, mobile, email, role, "approvalStatus"
FROM users
WHERE email LIKE '%pulsematetest.com%'
ORDER BY "createdAt" DESC;

-- Check test clinics
SELECT id, name, "approvalStatus", "isActive", "ownerId"
FROM clinics
WHERE "clinicRegistrationNumber" LIKE 'TEST%'
ORDER BY "createdAt" DESC;

-- Check test doctors
SELECT dp.id, u.name, dp."verificationStatus", dp."profileStatus"
FROM doctor_profiles dp
JOIN users u ON dp."userId" = u.id
WHERE dp."medicalRegistrationNumber" LIKE 'TEST%'
ORDER BY dp."createdAt" DESC;

-- Check doctor-clinic relationships
SELECT dc.id, dp."medicalRegistrationNumber", c.name, dc."isActive"
FROM clinic_doctors dc
JOIN doctor_profiles dp ON dc."doctorId" = dp.id
JOIN clinics c ON dc."clinicId" = c.id
WHERE dp."medicalRegistrationNumber" LIKE 'TEST%';
```

### Check Audit Logs

```sql
SELECT "userId", action, "entityType", "entityId", metadata, "createdAt"
FROM audit_logs
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;
```

### Manual Test Execution

You can run individual phases:

```javascript
// Comment out phases in runTests() function
// async function runTests() {
//   ...
//   // await testClinicRegistration(1);  // Run only clinic 1
//   // Skip phases as needed
// }
```

## Cleanup

### Manual Cleanup (if needed)

```sql
-- Delete test data
DELETE FROM audit_logs
WHERE "userId" IN (SELECT id FROM users WHERE email LIKE '%pulsematetest.com%');

DELETE FROM clinic_doctors
WHERE "doctorId" IN (
  SELECT id FROM doctor_profiles
  WHERE "medicalRegistrationNumber" LIKE 'TEST%'
);

DELETE FROM doctor_profiles
WHERE "medicalRegistrationNumber" LIKE 'TEST%';

DELETE FROM clinics
WHERE "clinicRegistrationNumber" LIKE 'TEST%';

DELETE FROM users
WHERE email LIKE '%pulsematetest.com%'
   OR mobile LIKE '90000%'
   OR mobile LIKE '91000%';
```

## Best Practices

### Before Running Tests

1. ✅ Use a separate test database
2. ✅ Configure test email service
3. ✅ Configure test phone numbers
4. ✅ Enable test OTP mode
5. ✅ Ensure backend is running
6. ✅ Backup production data (if using prod DB)

### During Test Execution

1. ✅ Don't interrupt the test mid-execution
2. ✅ Monitor console output for errors
3. ✅ Watch for rate limiting issues
4. ✅ Check database connections

### After Test Completion

1. ✅ Review test reports
2. ✅ Check database integrity
3. ✅ Investigate all failures
4. ✅ Clean up test data (if desired)
5. ✅ Document any bugs found

## Troubleshooting

### Test Hangs/Freezes

**Cause:** API timeout or database connection issue
**Fix:**
- Check backend is running: `http://localhost:5000/api/health`
- Check database connection
- Restart backend server

### Rate Limiting Issues

**Cause:** Too many requests too quickly
**Fix:**
- Increase throttle delay in test code
- Disable rate limiting for test environment
- Use separate API key for testing

### Firebase Auth Issues

**Cause:** Firebase test numbers not configured
**Fix:**
- Add test numbers in Firebase Console
- Or use TEST_OTP_MODE to bypass Firebase

### Email Not Received

**Cause:** Email service configuration issue
**Fix:**
- Check SMTP credentials
- Verify email service API keys
- Use console mode for development
- Check spam folder

## Continuous Integration

### GitHub Actions Example

```yaml
name: 45 Identity E2E Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: pulsemate_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend
          npm install
          
      - name: Run migrations
        run: |
          cd backend
          npx prisma migrate deploy
          
      - name: Run 45 Identity Test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pulsemate_test
          ENABLE_TEST_OTP: true
          TEST_OTP_CODE: 123456
          TEST_EMAIL_DOMAIN: pulsematetest.com
          EMAIL_PROVIDER: console
        run: |
          cd backend
          node tests/qa/45-identity-comprehensive-test.js
          
      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: backend/tests/qa/reports/
```

## Support

If you encounter issues:

1. Check this README thoroughly
2. Review test output and error messages
3. Check database state manually
4. Consult the COMPLETE_FLOW_AUDIT_REPORT.md
5. Contact development team with:
   - Error messages
   - Test output
   - Database state
   - Configuration used

## License

Internal testing tool for PulseMate Connect development team.

