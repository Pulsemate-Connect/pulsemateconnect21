# 🚀 CRITICAL BUGS DEPLOYMENT & TESTING GUIDE
**PulseMate Connect - Production Deployment Checklist**  
**Date:** 2026-08-09  
**Status:** ⚠️ READY FOR DEPLOYMENT - DATABASE MIGRATION REQUIRED

---

## ⚠️ CRITICAL PREREQUISITE

**YOU MUST CONFIGURE DATABASE CONNECTION BEFORE PROCEEDING**

### Step 0: Configure Database URL

1. Open: `backend/.env`
2. Go to your Render dashboard: https://dashboard.render.com
3. Click on "pulsemate-backend" service
4. Go to "Environment" tab
5. Copy these two values:
   - `DATABASE_URL` (External Database URL)
   - `DIRECT_URL` (Internal Database URL)
6. Replace in `.env` file:

```env
# Replace these lines:
DATABASE_URL=PASTE_YOUR_DATABASE_URL_HERE
DIRECT_URL=PASTE_YOUR_DIRECT_URL_HERE

# With actual URLs from Render:
DATABASE_URL=postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/pulsemate_db
DIRECT_URL=postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/pulsemate_db
```

---

## 📋 DEPLOYMENT STEPS

### STEP 1: Backup Current Database ⚠️

**CRITICAL - DO NOT SKIP**

```bash
# Connect to production database
psql "postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/pulsemate_db"

# Create backup
pg_dump -h dpg-xxxxx.oregon-postgres.render.com -U user -d pulsemate_db > backup_pre_migration_$(date +%Y%m%d).sql
```

### STEP 2: Check for Existing Constraint Violations

Run this SQL to identify any existing duplicate bookings or queue numbers:

```sql
-- Check for duplicate slots (will prevent migration if found)
SELECT 
  doctor_id, 
  clinic_id, 
  appointment_date::date, 
  slot_time, 
  COUNT(*) as duplicate_count
FROM appointments
WHERE status NOT IN ('CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT')
  AND slot_time IS NOT NULL
GROUP BY doctor_id, clinic_id, appointment_date::date, slot_time
HAVING COUNT(*) > 1;

-- Check for duplicate queue numbers (will prevent migration if found)
SELECT 
  queue_id, 
  queue_number, 
  COUNT(*) as duplicate_count
FROM queue_items
GROUP BY queue_id, queue_number
HAVING COUNT(*) > 1;
```

**IF DUPLICATES FOUND:**
- Clean them up manually before migration
- Migration will FAIL if constraints are violated

### STEP 3: Run Database Migration

```bash
cd backend

# Check migration status
npx prisma migrate status

# Deploy migration
npx prisma migrate deploy

# Expected output:
# ✅ Migration '20260809_critical_bug_fixes' applied successfully
```

**What this does:**
- ✅ Creates unique index on (doctor_id, clinic_id, date, slot_time)
- ✅ Creates unique index on (queue_id, queue_number)
- ✅ Adds performance indexes for slot lookups
- ✅ Adds performance indexes for free booking checks

### STEP 4: Verify Migration Success

```sql
-- Verify constraints exist
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename IN ('appointments', 'queue_items')
  AND indexname LIKE 'idx_unique%';

-- Expected output:
-- idx_unique_active_appointment_slot
-- idx_unique_queue_number
```

### STEP 5: Install Test Dependencies

```bash
cd backend

# Install if not already installed
npm install --save-dev jest supertest node-mocks-http

# Verify jest config exists
ls jest.config.js
```

### STEP 6: Run Unit Tests (Quick Check)

```bash
# Run existing unit tests
npm run test:unit

# Expected: All existing tests pass
```

### STEP 7: Run E2E Concurrency Tests 🔥

**CRITICAL - THIS VALIDATES ALL 4 BUG FIXES**

```bash
# Test 1: Two doctors independence
npm test -- backend/src/__tests__/e2e/appointment-two-doctors.test.js

# Expected output:
# ✅ 8 tests passed

# Test 2: ALL 4 critical bugs under concurrent load
npm test -- backend/src/__tests__/e2e/critical-bugs-concurrency.test.js

# Expected output:
# ✅ BUG #1: 10 concurrent same slot → 1 success, 9 conflicts (409)
# ✅ BUG #1: 50 concurrent same slot → 1 success, 49 conflicts (409)
# ✅ BUG #2: Wrong session rejected (400)
# ✅ BUG #2: Lunch gap rejected (400)
# ✅ BUG #2: Valid session accepted (200)
# ✅ BUG #3: Concurrent free bookings → only 1 free
# ✅ BUG #4: 10 concurrent bookings → unique queue numbers
# ✅ BUG #4: Two doctors → independent queues
```

### STEP 8: Run All Tests

```bash
# Run complete test suite
npm test

# Review coverage report
# Check: src/controllers/payment.controller.js coverage > 80%
# Check: src/controllers/patient.controller.js coverage > 80%
```

---

## 🧪 MANUAL TESTING CHECKLIST

### Test BUG #1: Duplicate Slot Prevention

**Scenario:** Two patients book same slot simultaneously

1. Open 2 mobile devices (or browsers with different users)
2. Patient A: Navigate to Doctor A, select date, select 09:30 AM
3. Patient B: Navigate to Doctor A, same date, select 09:30 AM
4. Tap "Book Appointment" on BOTH devices **at the same time**
5. **Expected:**
   - ✅ Patient A: "Appointment Confirmed" (200 OK)
   - ✅ Patient B: "This time slot is no longer available" (409 Conflict)
6. Verify database has only 1 appointment for that slot

### Test BUG #2: Session Boundary Validation

**Scenario:** Book slot outside session hours

1. Doctor A has:
   - Morning: 09:00-12:00
   - Afternoon: 14:00-17:00
   - Evening: 18:00-21:00
2. Try booking: 09:30 with Evening session
3. **Expected:** "Selected time is not available in this session" (400)
4. Try booking: 12:30 (lunch gap)
5. **Expected:** "Selected time is not available in this session" (400)
6. Try booking: 14:30 with Afternoon session
7. **Expected:** "Appointment Confirmed" (200)

### Test BUG #3: Free Booking Exploit

**Scenario:** Patient tries to get multiple free bookings

1. Create new patient account (never booked before)
2. Open 3 devices with same patient logged in
3. Select 3 different slots (09:30, 10:00, 10:30)
4. Tap "Book" on all 3 devices **simultaneously**
5. **Expected:**
   - ✅ Device 1: "🎉 First Booking Free" (amount: 0)
   - ✅ Device 2: "Pay ₹10" (Razorpay order created)
   - ✅ Device 3: "Pay ₹10" (Razorpay order created)
6. Verify database: `users.free_booking_used = true`
7. Verify database: Only 1 payment with `amount = 0`

### Test BUG #4: Queue Number Collision

**Scenario:** Concurrent bookings get unique queue numbers

1. Create 10 test patients
2. Book all 10 for Doctor A, same date, different slots (09:00-10:30)
3. Submit all 10 requests **simultaneously** (use script or load tester)
4. **Expected:**
   - ✅ All 10 bookings succeed (different slots)
   - ✅ Queue numbers: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (all unique)
5. Verify database: No duplicate queue numbers for that queue

---

## 🔍 PRODUCTION MONITORING

### Monitor These SQL Queries

```sql
-- 1. Check for duplicate slots (should always be 0)
SELECT COUNT(*) as violation_count
FROM (
  SELECT doctor_id, clinic_id, appointment_date::date, slot_time
  FROM appointments
  WHERE status NOT IN ('CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT')
    AND slot_time IS NOT NULL
  GROUP BY doctor_id, clinic_id, appointment_date::date, slot_time
  HAVING COUNT(*) > 1
) violations;

-- 2. Check for duplicate queue numbers (should always be 0)
SELECT COUNT(*) as violation_count
FROM (
  SELECT queue_id, queue_number
  FROM queue_items
  GROUP BY queue_id, queue_number
  HAVING COUNT(*) > 1
) violations;

-- 3. Check for free booking abuse (each user should have ≤ 1)
SELECT COUNT(*) as abuse_count
FROM (
  SELECT patient_id
  FROM payments
  WHERE amount = 0 AND status = 'PAID'
  GROUP BY patient_id
  HAVING COUNT(*) > 1
) abusers;

-- 4. Monitor 409 conflict rate
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status = 'BOOKED') as successful,
  COUNT(*) FILTER (WHERE status = 'PENDING_PAYMENT' AND 
                         created_at < NOW() - INTERVAL '10 minutes') as abandoned
FROM appointments
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Setup CloudWatch/Datadog Alerts

```javascript
// Alert if duplicate slots found
if (duplicateSlotCount > 0) {
  alert('🚨 CRITICAL: Duplicate slot bookings detected!');
}

// Alert if duplicate queue numbers found
if (duplicateQueueCount > 0) {
  alert('🚨 CRITICAL: Duplicate queue numbers detected!');
}

// Alert if free booking abuse detected
if (freeBookingAbuseCount > 0) {
  alert('⚠️ WARNING: Free booking abuse detected!');
}

// Alert if 409 conflict rate > 10%
if (conflictRate > 0.10) {
  alert('⚠️ WARNING: High booking conflict rate (>10%)');
}
```

---

## 🎯 ROLLBACK PROCEDURE (IF NEEDED)

**IF TESTS FAIL OR PRODUCTION ISSUES OCCUR:**

### Step 1: Revert Migration

```bash
cd backend

# Reset to previous state
npx prisma migrate reset --skip-seed

# Deploy previous migration
npx prisma migrate deploy
```

### Step 2: Restore Database Backup

```bash
# Restore from backup
psql "postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/pulsemate_db" \
  < backup_pre_migration_20260809.sql
```

### Step 3: Revert Code Changes

```bash
git log --oneline
git revert <commit-hash-of-bug-fixes>
git push origin main
```

---

## ✅ SUCCESS CRITERIA

### All checks must PASS before production deployment:

- [ ] ✅ Database backup created
- [ ] ✅ No existing constraint violations
- [ ] ✅ Migration applied successfully
- [ ] ✅ Unique indexes created
- [ ] ✅ Unit tests pass (100%)
- [ ] ✅ E2E tests pass (23/23 tests)
- [ ] ✅ Manual test BUG #1: Only 1 booking succeeds
- [ ] ✅ Manual test BUG #2: Session validation works
- [ ] ✅ Manual test BUG #3: Only 1 free booking
- [ ] ✅ Manual test BUG #4: Unique queue numbers
- [ ] ✅ Staging deployment successful
- [ ] ✅ 48-hour staging monitoring (no issues)
- [ ] ✅ Production monitoring setup
- [ ] ✅ Rollback procedure tested
- [ ] ✅ Team notified of changes

---

## 📊 EXPECTED TEST RESULTS

### Automated Test Output

```bash
# E2E Test: appointment-two-doctors.test.js
PASS backend/src/__tests__/e2e/appointment-two-doctors.test.js
  E2E: Two Doctors - Same Clinic
    ✓ Setup test environment (250ms)
    ✓ Doctor A slots are independent from Doctor B (180ms)
    ✓ Booking Doctor A slot does not affect Doctor B availability (150ms)
    ✓ Doctor A queue does not include Doctor B patients (120ms)
    ✓ Morning appointments do not appear in afternoon session (100ms)
    ✓ Session-specific queue numbering works correctly (130ms)
    ✓ Concurrent bookings to different doctors succeed (200ms)
    ✓ Cleanup test data (80ms)

Tests: 8 passed, 8 total
Time: 12.5s

# E2E Test: critical-bugs-concurrency.test.js
PASS backend/src/__tests__/e2e/critical-bugs-concurrency.test.js
  CRITICAL BUG FIXES - Concurrency Tests
    BUG #1: Duplicate Slot Booking Prevention
      ✓ 10 concurrent bookings for same slot - only 1 succeeds (2500ms)
        ✅ Successful: 1
        ⚠️  Conflicts (409): 9
        ✅ BUG #1 TEST PASSED: Duplicate bookings prevented
      ✓ 50 concurrent bookings for same slot - only 1 succeeds (8000ms)
        ✅ Successful: 1
        ⚠️  Conflicts (409): 49
        ✅ BUG #1 STRESS TEST PASSED
    
    BUG #2: Session Boundary Validation
      ✓ Cannot book morning slot (09:30) with evening sessionId (150ms)
        Response status: 400
        ✅ BUG #2 TEST PASSED: Session boundary validated
      ✓ Cannot book slot outside any session (12:30 - lunch gap) (120ms)
      ✓ Can book valid slot within session boundaries (180ms)
    
    BUG #3: Free Booking Exploit Prevention
      ✓ Concurrent free booking requests - only 1 is free (3000ms)
        ✅ Free bookings: 1
        💰 Paid bookings: 4
        ✅ BUG #3 TEST PASSED: Free booking exploit prevented
    
    BUG #4: Queue Number Collision Prevention
      ✓ 10 concurrent bookings - all get unique queue numbers (2800ms)
        ✅ Successful bookings: 10
        Queue numbers assigned: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
        ✅ BUG #4 TEST PASSED: All queue numbers unique
      ✓ Two doctors - independent queue numbering (250ms)
        ✅ BUG #4 TEST PASSED: Independent queues per doctor

Tests: 15 passed, 15 total
Time: 28.7s
```

---

## 🔒 SECURITY NOTES

### What Was Fixed

1. **Race Condition Protection**
   - Database unique constraints prevent duplicates
   - PostgreSQL advisory locks prevent collisions
   - Serializable transactions prevent dirty reads

2. **Atomic Operations**
   - Free booking claim uses `updateMany` with WHERE clause
   - Queue number generation locked with `pg_advisory_xact_lock`
   - Slot availability re-checked inside transaction

3. **Input Validation**
   - Backend validates session boundaries
   - Cannot trust client-sent sessionId
   - All times validated against doctor/clinic schedule

4. **Error Handling**
   - 409 Conflict for duplicate bookings (user-friendly)
   - 400 Bad Request for session violations
   - P2002 Prisma errors mapped to HTTP status codes

### What Still Needs Attention

1. **Frontend Updates Required**
   - Handle 409 responses by refreshing available slots
   - Show user-friendly messages for conflicts
   - Prevent double-tap on Book button
   - Add loading states during booking

2. **Performance Monitoring**
   - Watch transaction duration under load
   - Monitor advisory lock wait times
   - Track 409 conflict rate (normal: <5%)

3. **Load Testing**
   - Test with 100+ concurrent users
   - Test during peak hours (morning 9-10 AM)
   - Test with slow network conditions

---

## 📞 SUPPORT CONTACTS

**If tests fail or production issues:**

1. Check logs: `pm2 logs pulsemate-backend`
2. Check database: Run monitoring SQL queries above
3. Check Sentry/error tracking for exceptions
4. Review CloudWatch metrics for anomalies

**Emergency rollback:**
- Follow rollback procedure above
- Notify team immediately
- Create incident report

---

## ✨ FINAL DEPLOYMENT COMMAND

**After ALL tests pass:**

```bash
# 1. Commit changes
git add .
git commit -m "fix: Critical bug fixes - duplicate bookings, session validation, free booking exploit, queue collisions"

# 2. Push to staging
git push origin staging

# 3. Deploy to staging
# (Render auto-deploys from staging branch)

# 4. Monitor staging for 48 hours

# 5. If staging stable, merge to production
git checkout main
git merge staging
git push origin main

# 6. Monitor production closely for first 24 hours
```

---

**DEPLOYMENT CHECKLIST COMPLETE ✅**

**Next Action:** Configure DATABASE_URL in `.env` and run Step 1
