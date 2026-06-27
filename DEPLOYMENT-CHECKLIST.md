# Doctor Availability - Production Deployment Checklist

**Feature:** Doctor Availability Schedule Module  
**Status:** ✅ Ready for Production  
**Date:** June 28, 2026

---

## Pre-Deployment Verification

### ✅ Backend

- [x] `DoctorAvailability` model exists in `prisma/schema.prisma`
- [x] Relations added to `DoctorProfile` and `Clinic` models
- [x] Migration file created: `20260627213212_add_doctor_availability`
- [x] Prisma Client regenerated with `npx prisma generate`
- [x] Controller has validation for all fields
- [x] Controller has authorization checks
- [x] Error messages are specific (not generic)
- [x] No stack traces exposed in production
- [x] API tests pass (`node test-availability-api.js`)

### ✅ Frontend

- [x] Duplicate request prevention added
- [x] Client-side validation enhanced
- [x] Error messages display correctly
- [x] Loading states work properly
- [x] "Save All Changes" aggregates results
- [x] Only one toast appears (not multiple)
- [x] Changes persist after page refresh

### ✅ Documentation

- [x] Technical report created (`DOCTOR-AVAILABILITY-FIX-COMPLETE.md`)
- [x] Quick start guide created (`QUICK-START-DOCTOR-AVAILABILITY.md`)
- [x] Deployment checklist created (`DEPLOYMENT-CHECKLIST.md`)
- [x] API test script created (`test-availability-api.js`)
- [x] Summary document created (`AVAILABILITY-FIX-SUMMARY.txt`)

---

## Deployment Steps

### Step 1: Backend Database Migration

```bash
cd backend

# Run migration
npx prisma migrate deploy

# Verify table created
psql $DATABASE_URL -c "SELECT * FROM doctor_availability LIMIT 1;"

# Expected: Table exists (may be empty)
```

**Status:** [ ] Complete

---

### Step 2: Backend Prisma Client

```bash
cd backend

# Regenerate client
npx prisma generate

# Verify model exists
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('doctorAvailability' in p ? '✅ Model exists' : '❌ Model missing');"

# Expected: ✅ Model exists
```

**Status:** [ ] Complete

---

### Step 3: Backend Environment Variables

Verify these are set in production:

```env
DATABASE_URL=postgresql://user:pass@host:5432/database
NODE_ENV=production
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=30d
FRONTEND_URL=https://yourdomain.com
PORT=5000
```

**Status:** [ ] Complete

---

### Step 4: Backend Server Restart

```bash
# If using PM2
pm2 restart pulsemate-api

# If using systemd
sudo systemctl restart pulsemate-api

# If using Docker
docker-compose restart backend

# Verify server started
curl http://localhost:5000/health

# Expected: {"status":"ok","service":"PulseMate API",...}
```

**Status:** [ ] Complete

---

### Step 5: Backend API Test

```bash
cd backend

# Run automated tests
node test-availability-api.js

# Expected output:
# ✅ Server is running
# ✅ Public endpoints accessible
# ✅ Protected endpoints require auth
# ✅ Prisma model exists
# ✅ Database table exists
```

**Status:** [ ] Complete

---

### Step 6: Frontend Build

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Expected: build/ directory created
```

**Status:** [ ] Complete

---

### Step 7: Frontend Deployment

```bash
# Deploy to hosting provider
# (Vercel, Render, Netlify, etc.)

npm run deploy
# OR
vercel --prod
# OR
netlify deploy --prod

# Verify deployment
curl https://yourdomain.com

# Expected: Frontend loads successfully
```

**Status:** [ ] Complete

---

### Step 8: Android Build

```bash
cd mobile

# Build for production
eas build --platform android --profile production

# Expected: Build completes successfully
# Download AAB file from EAS
```

**Status:** [ ] Complete

---

### Step 9: Android Deployment

```bash
# Upload to Google Play Console
# → Production → Create new release
# → Upload AAB file
# → Fill release notes
# → Submit for review

# OR use automated submission
eas submit -p android --latest
```

**Status:** [ ] Complete

---

## Post-Deployment Verification

### Test 1: Doctor Login & Schedule Save (Web)

1. [ ] Open https://yourdomain.com
2. [ ] Login as a doctor
3. [ ] Navigate to Schedule page
4. [ ] Enable Monday
5. [ ] Set 09:00 – 17:00, 15 min slots, 20 max patients
6. [ ] Click "Save"
7. [ ] Verify: "Monday schedule saved" toast appears
8. [ ] Verify: No errors in browser console
9. [ ] Refresh page
10. [ ] Verify: Schedule still shows (persisted)

**Status:** [ ] Pass  [ ] Fail

---

### Test 2: Save All Changes (Web)

1. [ ] Enable Monday through Friday
2. [ ] Set different times for each day
3. [ ] Click "Save All Changes"
4. [ ] Verify: "All 5 day(s) saved successfully" toast appears
5. [ ] Verify: No errors in browser console
6. [ ] Refresh page
7. [ ] Verify: All days persist correctly

**Status:** [ ] Pass  [ ] Fail

---

### Test 3: Patient Booking (Web)

1. [ ] Logout from doctor account
2. [ ] Login as a patient
3. [ ] Navigate to booking page
4. [ ] Select the doctor from Test 1
5. [ ] Select clinic
6. [ ] Verify: Only Monday–Friday appear in calendar
7. [ ] Select Monday
8. [ ] Verify: Slots appear (09:00, 09:15, 09:30, ...)
9. [ ] Verify: Past slots are disabled
10. [ ] Book a slot
11. [ ] Verify: Booked slot disappears from list

**Status:** [ ] Pass  [ ] Fail

---

### Test 4: Doctor Login & Schedule Save (Android)

1. [ ] Open PulseMate app on Android
2. [ ] Login as a doctor
3. [ ] Navigate to Schedule page
4. [ ] Enable Tuesday
5. [ ] Set 10:00 – 18:00, 20 min slots, 30 max patients
6. [ ] Click "Save"
7. [ ] Verify: "Tuesday schedule saved" toast appears
8. [ ] Close and reopen app
9. [ ] Verify: Schedule still shows (persisted)

**Status:** [ ] Pass  [ ] Fail

---

### Test 5: Patient Booking (Android)

1. [ ] Logout from doctor account
2. [ ] Login as a patient
3. [ ] Navigate to booking page
4. [ ] Select the doctor from Test 4
5. [ ] Verify: Tuesday appears in calendar
6. [ ] Select Tuesday
7. [ ] Verify: Slots appear (10:00, 10:20, 10:40, ...)
8. [ ] Book a slot
9. [ ] Verify: Booked slot disappears

**Status:** [ ] Pass  [ ] Fail

---

### Test 6: Validation (Web)

1. [ ] Login as doctor
2. [ ] Enable Wednesday
3. [ ] Set start time: 17:00
4. [ ] Set end time: 09:00 (before start)
5. [ ] Click "Save"
6. [ ] Verify: "endTime must be after startTime" error appears
7. [ ] Fix: Set end time to 18:00
8. [ ] Click "Save"
9. [ ] Verify: Saves successfully

**Status:** [ ] Pass  [ ] Fail

---

### Test 7: Authorization (API)

```bash
# Test without auth token
curl -X POST https://your-api-url/api/doctor/availability \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"test","dayOfWeek":1,"startTime":"09:00","endTime":"17:00"}'

# Expected: 401 Unauthorized
# {"success":false,"message":"Authentication required"}
```

**Status:** [ ] Pass  [ ] Fail

---

### Test 8: Database Verification

```sql
-- Check if schedules are saved
SELECT COUNT(*) FROM doctor_availability;

-- Expected: Count > 0

-- View recent schedules
SELECT 
  da.*,
  dp."userId" as doctor_user_id,
  c.name as clinic_name
FROM doctor_availability da
JOIN doctor_profiles dp ON da."doctorId" = dp.id
JOIN clinics c ON da."clinicId" = c.id
ORDER BY da."createdAt" DESC
LIMIT 10;

-- Expected: Shows saved schedules
```

**Status:** [ ] Pass  [ ] Fail

---

### Test 9: Server Logs

```bash
# Check for errors
pm2 logs pulsemate-api --lines 100

# Look for:
# ✅ No HTTP 500 errors
# ✅ "Availability saved successfully" messages
# ❌ Any stack traces or crashes
```

**Status:** [ ] Pass  [ ] Fail

---

### Test 10: Performance

```bash
# Test response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-api-url/api/doctor/test-doctor-id/availability?clinicId=test-clinic-id

# Expected: Response time < 500ms
```

**Status:** [ ] Pass  [ ] Fail

---

## Monitoring Setup

### Metrics to Track

- [ ] HTTP 500 errors (should be ZERO)
- [ ] Average response time for availability endpoints
- [ ] Number of schedules created per day
- [ ] Number of bookings created per day
- [ ] Failed save attempts (validation errors)
- [ ] Doctor-clinic authorization failures

### Alerts to Configure

- [ ] Alert if HTTP 500 errors > 0 in 5 minutes
- [ ] Alert if response time > 2 seconds
- [ ] Alert if database connection fails
- [ ] Alert if Prisma query times out

---

## Rollback Plan

If issues occur after deployment:

### Option 1: Rollback Backend Only

```bash
# Stop current server
pm2 stop pulsemate-api

# Checkout previous version
git checkout <previous-commit-hash>

# Install dependencies
npm install

# Restart server
pm2 start pulsemate-api
```

### Option 2: Rollback Database Migration

```bash
# NOT RECOMMENDED - Will delete doctor_availability table

cd backend
npx prisma migrate resolve --rolled-back 20260627213212_add_doctor_availability

# Then manually drop table
psql $DATABASE_URL -c "DROP TABLE IF EXISTS doctor_availability CASCADE;"
```

⚠️ **WARNING:** This will delete all saved schedules!

### Option 3: Disable Feature via Feature Flag

```javascript
// In frontend code, add:
const AVAILABILITY_FEATURE_ENABLED = false;

if (!AVAILABILITY_FEATURE_ENABLED) {
  return <div>Feature temporarily disabled</div>;
}
```

---

## Success Criteria

All tests must pass before marking deployment as successful:

- [ ] ✅ Backend migration applied
- [ ] ✅ Backend server running
- [ ] ✅ API tests pass
- [ ] ✅ Frontend deployed
- [ ] ✅ Android app updated
- [ ] ✅ Doctor can save schedule (Web)
- [ ] ✅ Doctor can save schedule (Android)
- [ ] ✅ Patient sees slots (Web)
- [ ] ✅ Patient sees slots (Android)
- [ ] ✅ Validation works correctly
- [ ] ✅ Authorization works correctly
- [ ] ✅ Database stores schedules
- [ ] ✅ No HTTP 500 errors in logs
- [ ] ✅ Response times acceptable (< 500ms)
- [ ] ✅ Monitoring alerts configured

---

## Sign-Off

### Developers

- [ ] Backend Developer: ___________________ Date: ___________
- [ ] Frontend Developer: ___________________ Date: ___________
- [ ] Mobile Developer: ___________________ Date: ___________

### QA

- [ ] QA Engineer: ___________________ Date: ___________
- [ ] Test Results: [ ] Pass  [ ] Fail

### DevOps

- [ ] DevOps Engineer: ___________________ Date: ___________
- [ ] Monitoring Configured: [ ] Yes  [ ] No

### Product Owner

- [ ] Product Owner: ___________________ Date: ___________
- [ ] Approved for Production: [ ] Yes  [ ] No

---

## Post-Deployment Actions

### Immediate (Within 24 hours)

- [ ] Monitor logs for errors
- [ ] Check database for new schedules being created
- [ ] Verify patient bookings work
- [ ] Respond to any user reports

### Short-term (Within 1 week)

- [ ] Collect user feedback
- [ ] Analyze usage metrics
- [ ] Fix any minor issues discovered
- [ ] Document lessons learned

### Long-term (Within 1 month)

- [ ] Review performance metrics
- [ ] Optimize slow queries (if any)
- [ ] Plan feature enhancements
- [ ] Update documentation

---

**Deployment Status:** [ ] 🟢 Complete  [ ] 🟡 In Progress  [ ] 🔴 Blocked

**Last Updated:** June 28, 2026  
**Next Review:** _______________
