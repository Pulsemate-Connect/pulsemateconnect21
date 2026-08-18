# 45 IDENTITY TEST - VERIFICATION CHECKLIST

Use this checklist to verify test results manually if needed.

## Pre-Test Verification

### Environment Setup
- [ ] `.env` file configured with TEST_MODE settings
- [ ] `ENABLE_TEST_OTP=true` is set
- [ ] `TEST_OTP_CODE=123456` is set
- [ ] Test database is created and accessible
- [ ] Database migrations are applied
- [ ] Admin user exists in database
- [ ] Backend server is running on port 5000
- [ ] Backend health endpoint responds: `http://localhost:5000/api/health`

### Email Service
- [ ] Email provider is configured (SMTP/Resend/Console)
- [ ] Test email can be sent
- [ ] If using SMTP, credentials are valid
- [ ] If using console mode, OTPs appear in logs

### SMS/Mobile OTP Service
- [ ] Message Central is configured OR TEST_OTP_MODE is enabled
- [ ] Test phone numbers are configured in Firebase (if using Firebase)
- [ ] TEST_OTP_NUMBERS includes `90000,91000` prefixes

## During Test Execution

### Phase 1: Clinic Registration (20 Clinics)

For each clinic (CLINIC_001 to CLINIC_020):
- [ ] Email OTP send request succeeds
- [ ] Email OTP verification succeeds
- [ ] Mobile OTP send request succeeds
- [ ] Mobile OTP verification succeeds
- [ ] Clinic application submission succeeds
- [ ] User record created in database
- [ ] Clinic record created in database
- [ ] User.role = CLINIC_OWNER
- [ ] User.approvalStatus = PENDING
- [ ] Clinic.approvalStatus = PENDING
- [ ] Clinic.isActive = false
- [ ] Login attempt is BLOCKED
- [ ] Test result shows PASS

**Spot Check (Clinic 001):**
```sql
SELECT u.id, u.name, u.email, u.mobile, u.role, u."approvalStatus", u."isPhoneVerified", u."isEmailVerified"
FROM users u
WHERE u.email = 'clinic001@pulsematetest.com';

SELECT c.id, c.name, c."approvalStatus", c."isActive", c."ownerId"
FROM clinics c
WHERE c."clinicRegistrationNumber" = 'TEST_REG_CLINIC_001';
```

Expected:
- User exists with role=CLINIC_OWNER, approvalStatus=PENDING
- Clinic exists with approvalStatus=PENDING, isActive=false
- Clinic.ownerId = User.id

### Phase 2: Clinic Approval (20 Clinics)

For each clinic:
- [ ] Admin approval request succeeds
- [ ] User.approvalStatus updated to VERIFIED
- [ ] Clinic.approvalStatus updated to VERIFIED
- [ ] Clinic.isActive updated to true
- [ ] Refresh tokens revoked (if applicable)
- [ ] Login attempt SUCCEEDS
- [ ] JWT token is returned
- [ ] Test result shows PASS

**Spot Check (Clinic 001 after approval):**
```sql
SELECT u."approvalStatus", c."approvalStatus", c."isActive"
FROM users u
JOIN clinics c ON c."ownerId" = u.id
WHERE u.email = 'clinic001@pulsematetest.com';
```

Expected: All show VERIFIED/true

### Post-Phase 2: Database Integrity Check

- [ ] No duplicate users by email
- [ ] No duplicate users by mobile
- [ ] All 20 clinics exist
- [ ] All 20 clinic owners exist
- [ ] All clinics have valid owner references
- [ ] No orphaned clinic records

**Database Queries:**
```sql
-- Check for duplicates
SELECT email, COUNT(*) FROM users WHERE email LIKE '%pulsematetest.com%' GROUP BY email HAVING COUNT(*) > 1;
SELECT mobile, COUNT(*) FROM users WHERE mobile LIKE '90000%' GROUP BY mobile HAVING COUNT(*) > 1;

-- Count test records
SELECT COUNT(*) FROM users WHERE email LIKE 'clinic%@pulsematetest.com%'; -- Should be 20
SELECT COUNT(*) FROM clinics WHERE "clinicRegistrationNumber" LIKE 'TEST_REG_CLINIC%'; -- Should be 20

-- Check all verified
SELECT COUNT(*) FROM users WHERE email LIKE 'clinic%@pulsematetest.com%' AND "approvalStatus" = 'VERIFIED'; -- Should be 20
```

### Phase 3: Doctor Invitation & Onboarding (25 Doctors)

For each doctor (DOCTOR_001 to DOCTOR_025):
- [ ] Clinic owner invitation request succeeds
- [ ] DoctorInvitation record created
- [ ] Invitation status = INVITATION_SENT
- [ ] Invitation token is generated
- [ ] Invitation email sent (if email service configured)
- [ ] Invitation token can be retrieved
- [ ] Doctor acceptance succeeds
- [ ] User record created (or existing user linked)
- [ ] Mobile OTP send succeeds
- [ ] Mobile OTP verification succeeds
- [ ] User.isPhoneVerified = true
- [ ] Email OTP send succeeds (if email provided)
- [ ] Email OTP verification succeeds (if email provided)
- [ ] User.isEmailVerified = true (if email provided)
- [ ] Profile update step 1 (personal) succeeds
- [ ] Profile update step 2 (professional) succeeds
- [ ] Profile update step 3 (documents) succeeds
- [ ] Profile update step 4 (profile) succeeds
- [ ] Profile submission succeeds
- [ ] DoctorProfile.profileStatus = COMPLETE
- [ ] DoctorProfile.verificationStatus = PENDING
- [ ] User.approvalStatus = PENDING
- [ ] Login attempt is BLOCKED
- [ ] Test result shows PASS

**Spot Check (Doctor 001):**
```sql
SELECT u.id, u.name, u.email, u.mobile, u.role, u."approvalStatus", u."isPhoneVerified", u."isEmailVerified"
FROM users u
WHERE u.mobile = '9100000001';

SELECT dp.id, dp."verificationStatus", dp."profileStatus", dp."medicalRegistrationNumber"
FROM doctor_profiles dp
JOIN users u ON dp."userId" = u.id
WHERE u.mobile = '9100000001';
```

Expected:
- User exists with role=DOCTOR, approvalStatus=PENDING
- DoctorProfile exists with verificationStatus=PENDING, profileStatus=COMPLETE

### Phase 4: Doctor Approval/Rejection

**For Doctors 001-020, 024-025 (22 doctors):**
- [ ] Admin approval request succeeds
- [ ] User.approvalStatus = VERIFIED
- [ ] DoctorProfile.verificationStatus = VERIFIED
- [ ] DoctorProfile.marketplaceVisible = true
- [ ] DoctorClinic relationship created/activated
- [ ] Login attempt SUCCEEDS
- [ ] JWT token returned
- [ ] Test result shows PASS

**For Doctors 021-023 (3 doctors):**
- [ ] Admin rejection request succeeds
- [ ] User.approvalStatus = REJECTED
- [ ] DoctorProfile.verificationStatus = REJECTED
- [ ] rejectionReason stored
- [ ] Login attempt is BLOCKED
- [ ] Test result shows PASS

**Spot Check (Doctor 001 approved, Doctor 021 rejected):**
```sql
-- Doctor 001 (approved)
SELECT u."approvalStatus", dp."verificationStatus", dp."marketplaceVisible"
FROM users u
JOIN doctor_profiles dp ON dp."userId" = u.id
WHERE u.mobile = '9100000001';
-- Expected: VERIFIED, VERIFIED, true

-- Doctor 021 (rejected)
SELECT u."approvalStatus", dp."verificationStatus"
FROM users u
JOIN doctor_profiles dp ON dp."userId" = u.id
WHERE u.mobile = '9100000021';
-- Expected: REJECTED, REJECTED

-- Check DoctorClinic created for approved
SELECT COUNT(*) FROM clinic_doctors dc
JOIN doctor_profiles dp ON dc."doctorId" = dp.id
JOIN users u ON dp."userId" = u.id
WHERE u.mobile = '9100000001';
-- Expected: >= 1
```

### Post-Phase 4: Database Integrity Check

- [ ] No duplicate doctor users by email
- [ ] No duplicate doctor users by mobile
- [ ] All 25 doctor users exist
- [ ] All 25 doctor profiles exist
- [ ] All doctor profiles have valid user references
- [ ] 22 doctors are VERIFIED
- [ ] 3 doctors are REJECTED
- [ ] No orphaned doctor profiles
- [ ] All approved doctors have DoctorClinic relationships

**Database Queries:**
```sql
-- Check for duplicates
SELECT mobile, COUNT(*) FROM users WHERE mobile LIKE '91000%' GROUP BY mobile HAVING COUNT(*) > 1;

-- Count test records
SELECT COUNT(*) FROM users WHERE mobile LIKE '91000%'; -- Should be 25
SELECT COUNT(*) FROM doctor_profiles WHERE "medicalRegistrationNumber" LIKE 'TEST_MED_REG%'; -- Should be 25

-- Check approval counts
SELECT "approvalStatus", COUNT(*) FROM users WHERE mobile LIKE '91000%' GROUP BY "approvalStatus";
-- Expected: VERIFIED=22, REJECTED=3

SELECT "verificationStatus", COUNT(*) FROM doctor_profiles WHERE "medicalRegistrationNumber" LIKE 'TEST_MED_REG%' GROUP BY "verificationStatus";
-- Expected: VERIFIED=22, REJECTED=3
```

### Phase 5: Multi-Clinic Doctor Test

- [ ] Doctor025 exists and is VERIFIED
- [ ] Doctor025 invitation to Clinic002 succeeds
- [ ] ONLY ONE User record exists for Doctor025
- [ ] ONLY ONE DoctorProfile exists for Doctor025
- [ ] TWO DoctorClinic records exist for Doctor025
- [ ] DoctorClinic(Doctor025, Clinic001) exists
- [ ] DoctorClinic(Doctor025, Clinic002) exists
- [ ] No duplicate User created
- [ ] No duplicate DoctorProfile created
- [ ] Test result shows PASS

**Spot Check (Multi-Clinic Doctor):**
```sql
-- Count User records for Doctor025
SELECT COUNT(*) FROM users WHERE mobile = '9100000025';
-- Expected: 1

-- Count DoctorProfile records for Doctor025
SELECT COUNT(*) FROM doctor_profiles dp
JOIN users u ON dp."userId" = u.id
WHERE u.mobile = '9100000025';
-- Expected: 1

-- Count DoctorClinic records for Doctor025
SELECT COUNT(*) FROM clinic_doctors dc
JOIN doctor_profiles dp ON dc."doctorId" = dp.id
JOIN users u ON dp."userId" = u.id
WHERE u.mobile = '9100000025';
-- Expected: 2

-- List all clinics for Doctor025
SELECT c.name, dc."isActive"
FROM clinic_doctors dc
JOIN doctor_profiles dp ON dc."doctorId" = dp.id
JOIN users u ON dp."userId" = u.id
JOIN clinics c ON dc."clinicId" = c.id
WHERE u.mobile = '9100000025';
-- Expected: 2 rows showing both clinics
```

### Phase 6: Final Database Audit

- [ ] No duplicate emails found
- [ ] No duplicate mobiles found
- [ ] No orphaned DoctorProfiles
- [ ] No orphaned DoctorClinics
- [ ] No duplicate DoctorClinic relationships
- [ ] No invalid approval statuses
- [ ] All foreign key relationships intact
- [ ] All test data properly prefixed with TEST_

**Final Database Queries:**
```sql
-- Duplicate emails
SELECT email, COUNT(*) as count FROM users WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Duplicate mobiles
SELECT mobile, COUNT(*) as count FROM users GROUP BY mobile HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Orphaned DoctorProfiles
SELECT dp.id FROM doctor_profiles dp LEFT JOIN users u ON dp."userId" = u.id WHERE u.id IS NULL;
-- Expected: 0 rows

-- Orphaned DoctorClinics
SELECT dc.id FROM clinic_doctors dc
LEFT JOIN doctor_profiles dp ON dc."doctorId" = dp.id
LEFT JOIN clinics c ON dc."clinicId" = c.id
WHERE dp.id IS NULL OR c.id IS NULL;
-- Expected: 0 rows

-- Duplicate DoctorClinic relationships
SELECT "doctorId", "clinicId", COUNT(*) FROM clinic_doctors GROUP BY "doctorId", "clinicId" HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Invalid approval statuses
SELECT * FROM users WHERE "approvalStatus" NOT IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'UNDER_REVIEW', 'CHANGES_REQUIRED');
-- Expected: 0 rows

-- Summary counts
SELECT 
  (SELECT COUNT(*) FROM users WHERE email LIKE '%pulsematetest.com%') as total_test_users,
  (SELECT COUNT(*) FROM clinics WHERE "clinicRegistrationNumber" LIKE 'TEST%') as total_test_clinics,
  (SELECT COUNT(*) FROM doctor_profiles WHERE "medicalRegistrationNumber" LIKE 'TEST%') as total_test_doctors,
  (SELECT COUNT(*) FROM clinic_doctors WHERE "doctorId" IN (SELECT id FROM doctor_profiles WHERE "medicalRegistrationNumber" LIKE 'TEST%')) as total_doctor_clinic_relationships;
-- Expected: 45, 20, 25, 26 (25 doctors + 1 multi-clinic)
```

## Post-Test Verification

### Test Reports
- [ ] JSON report generated in `tests/qa/reports/`
- [ ] Markdown report generated in `tests/qa/reports/`
- [ ] Reports contain all 72 test results
- [ ] Pass rate is >= 95%
- [ ] Failed tests (if any) have detailed error messages

### Console Output Review
- [ ] All phases completed
- [ ] No unexpected errors
- [ ] All OTP verifications succeeded
- [ ] All database checks passed
- [ ] Final summary shows high pass rate

### Manual Spot Checks

**Random Clinic Check:**
- [ ] Pick any clinic (e.g., CLINIC_010)
- [ ] Verify can login with credentials
- [ ] Verify dashboard loads
- [ ] Verify clinic data is correct

**Random Doctor Check:**
- [ ] Pick any approved doctor (e.g., DOCTOR_010)
- [ ] Verify can login with credentials
- [ ] Verify dashboard loads
- [ ] Verify profile data is correct

**Multi-Clinic Doctor Check:**
- [ ] Login as Doctor025
- [ ] Verify can see both clinics
- [ ] Verify can switch between clinics
- [ ] Verify appointments/schedules work for both

## Failure Investigation

If any test fails, check:

### OTP Failures
- [ ] Check email service logs
- [ ] Check SMS service logs
- [ ] Verify TEST_OTP_CODE matches
- [ ] Verify ENABLE_TEST_OTP is true
- [ ] Check OTP expiry settings

### Registration Failures
- [ ] Check API endpoint responses
- [ ] Check validation errors
- [ ] Check database constraints
- [ ] Check backend logs
- [ ] Verify required fields are provided

### Approval Failures
- [ ] Check admin token validity
- [ ] Check approval endpoint logs
- [ ] Verify admin has proper permissions
- [ ] Check database transaction completion
- [ ] Verify audit logs created

### Database Failures
- [ ] Check database connection
- [ ] Check migration status
- [ ] Verify foreign key constraints
- [ ] Check unique constraints
- [ ] Review database logs

### Login Failures
- [ ] Verify password is correct
- [ ] Check authentication middleware logs
- [ ] Verify approval status is correct
- [ ] Check JWT token generation
- [ ] Verify session creation

## Cleanup Checklist

After test completion (optional):

- [ ] Review all test results
- [ ] Document any issues found
- [ ] Fix application bugs (if any)
- [ ] Re-run tests to verify fixes
- [ ] Clean up test data from database (if desired)
- [ ] Archive test reports
- [ ] Update documentation with findings

## Sign-Off

Test executed by: ________________
Date: ________________
Overall Result: ☐ PASS  ☐ FAIL
Pass Rate: ______%

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

