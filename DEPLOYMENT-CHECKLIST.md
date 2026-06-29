# ✅ DEPLOYMENT CHECKLIST - QUICK WINS

**Date:** June 28, 2026  
**Sprint:** Quick Wins Implementation  
**Branch:** `feature/fixes-and-improvements`

---

## 🚨 CRITICAL - DO FIRST

### ⚠️ Production Database Fix
**Status:** [ ] Not Done  
**Priority:** CRITICAL  
**Time:** 15 minutes

```bash
# Step 1: Set production database URL
set DATABASE_URL=postgresql://username:password@host:5432/database

# Step 2: Navigate to backend
cd backend

# Step 3: Run fix script
node fix-sessions.js

# Expected output:
# ✅ Fixed session timings
# ✅ Created DoctorAvailability records
# ✅ Database updated successfully
```

**Verification:**
- [ ] Script completed without errors
- [ ] Open mobile app
- [ ] Navigate to BookingScreen
- [ ] Verify slots are visible (not "Fully Booked")

---

## 📦 BACKEND DEPLOYMENT

### 1. Pre-Deployment Tests
**Status:** [ ] Not Done  
**Time:** 5 minutes

```bash
cd backend

# Run all tests
npm test

# Expected: 58/58 passing
```

**Checklist:**
- [ ] All tests passing
- [ ] No console errors
- [ ] Coverage >80%

---

### 2. Code Review
**Status:** [ ] Not Done  
**Time:** 10 minutes

**Files to Review:**
- [ ] `dashboard.controller.js` - New dashboard API
- [ ] `notification.controller.js` - New notification API
- [ ] `notification.service.js` - Notification logic
- [ ] `clinic.controller.js` - Booking control added
- [ ] `clinicSession.controller.js` - Validation added
- [ ] `server.js` - New routes registered

---

### 3. Git Commit & Push
**Status:** [ ] Not Done  
**Time:** 5 minutes

```bash
# Check status
git status

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Quick wins: Dashboard API, Notifications, Booking control, Session validation + 58 tests

Features:
- Dashboard API (combined endpoint, reduces calls from 5+ to 1)
- Notification system (create, read, mark as read, badge count)
- Booking control (stop/resume bookings, check status)
- Session validation (enforce morning/afternoon/evening times)
- Enhanced empty states (added action buttons)

Tests:
- 58 comprehensive tests added
- 85%+ expected coverage
- Performance tests included

Docs:
- Complete feature documentation
- Test suite guide
- Deployment instructions"

# Push to branch
git push origin feature/fixes-and-improvements
```

**Checklist:**
- [ ] Commit message is descriptive
- [ ] All files staged
- [ ] Pushed to correct branch

---

### 4. Production Deployment
**Status:** [ ] Not Done  
**Time:** 10-20 minutes (depends on platform)

#### Option A: Render
```bash
# Render auto-deploys from GitHub
# Just push and wait for build
```

#### Option B: Heroku
```bash
git push heroku feature/fixes-and-improvements:main
heroku logs --tail
```

#### Option C: AWS/Custom
```bash
# Your custom deployment process
```

**Checklist:**
- [ ] Deployment triggered
- [ ] Build successful
- [ ] No deployment errors
- [ ] Health check passing

---

### 5. Post-Deployment Verification
**Status:** [ ] Not Done  
**Time:** 10 minutes

**API Endpoint Tests:**

```bash
# Set production URL
set API_URL=https://api.pulsemateconnect.in/api

# Test health check
curl %API_URL%/../health

# Test dashboard API
curl %API_URL%/dashboard/clinic/{clinicId}/quick

# Test notification count
curl %API_URL%/notifications/unread-count?userId={userId}

# Test booking status
curl %API_URL%/clinic/{clinicId}/booking-status
```

**Manual Tests:**
- [ ] Dashboard API returns data
- [ ] Notification endpoints work
- [ ] Booking control endpoints work
- [ ] Session validation enforced
- [ ] No 500 errors in logs

---

## 📱 MOBILE APP DEPLOYMENT

### 1. Update Version
**Status:** [ ] Not Done  
**Time:** 2 minutes

**File:** `app.json`

```json
{
  "expo": {
    "version": "1.0.10",
    "android": {
      "versionCode": 10
    }
  }
}
```

**Checklist:**
- [ ] Version incremented (1.0.9 → 1.0.10)
- [ ] Version code incremented (9 → 10)

---

### 2. Build Android APK
**Status:** [ ] Not Done  
**Time:** 15-30 minutes

```bash
# Build production APK
npx eas build --platform android --profile production

# Wait for build to complete
# EAS will show build URL
```

**Checklist:**
- [ ] Build started successfully
- [ ] Build completed without errors
- [ ] APK downloadable

---

### 3. Test APK Locally
**Status:** [ ] Not Done  
**Time:** 10 minutes

```bash
# Download APK from EAS
# Install on test device
adb install app-release.apk

# Test critical flows
```

**Manual Tests:**
- [ ] App opens without crash
- [ ] BookingScreen shows slots (not "Fully Booked")
- [ ] Empty state shows "Contact Clinic" button
- [ ] API calls work
- [ ] No console errors

---

### 4. Submit to Play Store
**Status:** [ ] Not Done  
**Time:** 5 minutes (review takes 1-3 days)

```bash
# Submit to Google Play Console
npx eas submit --platform android
```

**Checklist:**
- [ ] Submission successful
- [ ] Review requested
- [ ] Release notes added

---

## 🌐 WEB FRONTEND DEPLOYMENT

### NOT APPLICABLE (No web changes in this sprint)

---

## 📊 POST-DEPLOYMENT MONITORING

### 1. Error Monitoring
**Status:** [ ] Not Done  
**Time:** Ongoing

**Check:**
- [ ] Server logs (no 500 errors)
- [ ] Sentry/error tracking (no new errors)
- [ ] Database performance (no slow queries)

---

### 2. User Testing
**Status:** [ ] Not Done  
**Time:** 1 hour

**Test Scenarios:**

**Scenario 1: Booking Flow**
- [ ] User opens app
- [ ] Selects clinic
- [ ] Sees available slots (not "Fully Booked")
- [ ] Successfully books appointment

**Scenario 2: Notification**
- [ ] User receives booking confirmation
- [ ] Notification appears in backend
- [ ] Badge count increments

**Scenario 3: Booking Control**
- [ ] Clinic owner stops bookings
- [ ] New users see "Not accepting bookings"
- [ ] Existing appointments remain valid
- [ ] Owner resumes bookings

**Scenario 4: Session Validation**
- [ ] Clinic owner creates morning session
- [ ] Time must be 6AM-12PM
- [ ] Invalid time is rejected
- [ ] Helpful error message shown

---

### 3. Performance Monitoring
**Status:** [ ] Not Done  
**Time:** Ongoing

**Metrics:**
- [ ] Dashboard API <1s response time
- [ ] Notification API <500ms response time
- [ ] Database queries optimized
- [ ] No memory leaks

---

## 🐛 ROLLBACK PLAN

### If Deployment Fails

**Step 1: Identify Issue**
```bash
# Check logs
heroku logs --tail
# or
tail -f /var/log/app.log
```

**Step 2: Rollback**
```bash
# Rollback to previous version
heroku rollback
# or
git revert HEAD
git push origin feature/fixes-and-improvements
```

**Step 3: Fix & Redeploy**
```bash
# Fix the issue locally
# Run tests
npm test

# Commit fix
git commit -m "Fix: [describe fix]"
git push origin feature/fixes-and-improvements
```

---

## 📋 FINAL CHECKLIST

### Before You Call It Done

- [ ] ✅ Production database fixed
- [ ] ✅ Backend deployed and tested
- [ ] ✅ Mobile app built and tested
- [ ] ✅ All manual tests passing
- [ ] ✅ No errors in production logs
- [ ] ✅ API endpoints responding
- [ ] ✅ Monitoring set up
- [ ] ✅ Team notified
- [ ] ✅ Documentation updated
- [ ] ✅ Stakeholders informed

---

## 📞 SUPPORT CONTACTS

**If Something Goes Wrong:**

**Backend Issues:**
- Check: `backend/src/server.js` logs
- Rollback: Previous git commit

**Database Issues:**
- Backup: `fix-production-sessions.sql` (undo script)
- Support: Database admin

**Mobile App Issues:**
- Rollback: Previous version in Play Store
- Support: React Native developer

---

## 🎯 SUCCESS CRITERIA

### You Know It's Working When:

✅ **Backend:**
- Dashboard API returns data
- Notification endpoints work
- Booking control works
- Session validation enforced

✅ **Mobile App:**
- BookingScreen shows slots
- Empty state has button
- No crashes

✅ **Database:**
- Sessions have correct times
- DoctorAvailability records exist
- No orphaned data

✅ **Users:**
- Can book appointments
- See available slots
- Get better error messages

---

## 📈 NEXT STEPS AFTER DEPLOYMENT

### Immediate (Same Day)
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify metrics

### This Week
- [ ] Build Dashboard UI
- [ ] Build Notification UI
- [ ] Build Booking Control UI

### Next Week
- [ ] Real-time features
- [ ] Queue management
- [ ] Reports module

---

**Deployment Checklist Version:** 1.0  
**Last Updated:** June 28, 2026  
**Status:** Ready for deployment 🚀
