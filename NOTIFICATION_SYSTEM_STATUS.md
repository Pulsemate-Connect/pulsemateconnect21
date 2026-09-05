# 🔔 Notification System Status & Implementation

## ✅ Currently Working Notifications

### 1. **Appointment Booking Confirmation** ✅
**When:** Immediately after booking (free or paid)
**Sent to:** Patient, Clinic Owner, Receptionists
**Location:** `payment.controller.js` lines 478-484, 833-850, 921-931

```javascript
// Patient notification
sendNotification(patientId, {
  title: '🎉 First Booking Free!',
  body: `Your appointment with Dr. ${doctorName} is confirmed.`,
  data: { type: 'APPOINTMENT_BOOKED', appointmentId, isFree: 'true' }
});

// Doctor + Clinic Owner + Receptionists
notifyStakeholders(confirmed, patientName);
```

**Status:** ✅ Working

---

### 2. **Appointment Reminder - 24 Hours Before** ✅
**When:** 24 hours before appointment
**Sent to:** Patient
**Location:** `appointmentReminder.job.js` line 147
**Schedule:** Runs every hour (cron: `0 * * * *`)

```javascript
title: '📅 Appointment Tomorrow'
body: `Dr. ${doctorName} · ${clinicName}\n${dateStr}${timeStr}`
```

**Status:** ✅ Working

---

### 3. **Appointment Reminder - 2 Hours Before** ✅
**When:** 2 hours before appointment
**Sent to:** Patient
**Location:** `appointmentReminder.job.js` line 148
**Schedule:** Runs every hour (cron: `0 * * * *`)

```javascript
title: '⏰ Appointment in 2 hours'
body: `Dr. ${doctorName} · ${clinicName}\n${dateStr}${timeStr}`
```

**Status:** ✅ Working

---

### 4. **Your Turn - Queue Called** ✅
**When:** Receptionist calls patient from queue
**Sent to:** Patient
**Location:** `reception.controller.js` line 936-948

```javascript
title: '🔔 Your Turn!'
message: `Queue #${queueNumber} — Please proceed to the doctor's room.`
priority: 'HIGH'
```

**Status:** ✅ Working

---

### 5. **Doctor Running Late** ✅
**When:** Doctor is 10+ minutes behind schedule
**Sent to:** All waiting patients
**Location:** `reception.controller.js` line 918-924

```javascript
title: '⏰ Doctor Running Late'
body: `Your doctor is running approximately ${delayMins} minutes behind schedule.`
```

**Status:** ✅ Working

---

### 6. **Daily Clinic Summary** ✅
**When:** Every day at 8 PM IST
**Sent to:** Clinic Owner (Push + Email)
**Location:** `appointmentReminder.job.js` line 153-204
**Schedule:** Daily (cron: `0 20 * * *`)

```javascript
title: `📊 Daily Summary — ${clinic.name}`
body: `Today: ${totalAppts} appts · ${completedAppts} completed · ₹${revenue} revenue`
```

**Status:** ✅ Working

---

## ❌ Missing Notification

### 7. **One Person Ahead - Almost Your Turn** ❌
**When:** When there's 1 person ahead in queue (5-10 mins before turn)
**Sent to:** Next patient in queue
**Priority:** HIGH

**Status:** ⚠️ NOT IMPLEMENTED - Need to add

---

## 🔍 Why Notifications Might Not Be Working

### Check 1: Firebase Configuration
```bash
# Check if FIREBASE_SERVICE_ACCOUNT_JSON is set in Render
node backend/check-render-config.js
```

**If missing:** Add to Render environment variables

---

### Check 2: FCM Tokens
```sql
-- Check if user has FCM token registered
SELECT * FROM "fcm_tokens" WHERE "userId" = 'patient_id';
```

**If empty:** User needs to login to app and grant notification permission

---

### Check 3: Backend Logs
```bash
# Check Render logs for notification errors
[Notification] Push notification failed
[FCM] sendNotification error
```

---

### Check 4: Cron Jobs Running
```bash
# Should see in logs after server starts:
[Reminder] Appointment reminder job scheduled (hourly, IST)
[Digest] Daily owner digest scheduled (8 PM IST)
[No-Show] Auto-cancellation job scheduled (every 15 minutes, IST)
```

---

## 🚀 Implementation Plan: "One Person Ahead" Notification

### Where to Add
File: `backend/src/controllers/reception.controller.js`
Function: `callNext()` around line 900

### Logic
```javascript
// After calling current patient, check if there's a next person
const nextWaitingItem = await prisma.queueItem.findFirst({
  where: { queueId, status: 'WAITING' },
  orderBy: [{ isFollowUp: 'desc' }, { position: 'asc' }],
  skip: 0, // The very next person
});

if (nextWaitingItem) {
  // Notify the person who will be called next
  createNotification({
    userId: nextWaitingItem.patientId,
    type: 'QUEUE_ALMOST_YOUR_TURN',
    title: '⏰ You're Next!',
    message: `One person ahead of you. Queue #${nextWaitingItem.queueNumber}. Please be ready.`,
    metadata: {
      queueId,
      queueNumber: nextWaitingItem.queueNumber,
      estimatedWaitMinutes: avgConsultationMins, // ~10 mins
    },
    priority: 'HIGH',
  }).catch(() => {});
}
```

---

## 🧪 Testing Notifications

### Test 1: Booking Notification
```bash
# Book an appointment
POST /api/payments/initiate
# Check: Should receive push notification immediately
```

### Test 2: Reminder Notifications
```bash
# Create appointment 23 hours from now
# Wait for hourly cron job
# Check logs: [Reminder] 24h — sent 1 reminder(s)
```

### Test 3: Queue Call Notification
```bash
# As receptionist: Call next patient
PATCH /api/reception/queue/:queueId/call-next
# Check: Patient should receive "Your Turn!" notification
```

### Test 4: Check FCM Token
```javascript
// Frontend: Check if token is registered
import * as Notifications from 'expo-notifications';
const token = await Notifications.getExpoPushTokenAsync();
console.log('FCM Token:', token.data);
```

---

## 📝 Common Issues & Solutions

### Issue 1: "Push notification failed"
**Cause:** Missing FIREBASE_SERVICE_ACCOUNT_JSON in Render
**Solution:** Add environment variable from `backend/.env`

### Issue 2: Notifications not received on device
**Cause:** User hasn't granted notification permission
**Solution:** 
1. App should request permission on first launch
2. Check: Settings → PulseMate → Notifications → Allow

### Issue 3: Reminders not sending
**Cause:** Cron job not running or wrong timezone
**Solution:** 
1. Check logs for `[Reminder] Appointment reminder job scheduled`
2. Verify timezone: `Asia/Kolkata` (IST)

### Issue 4: Database notifications created but no push
**Cause:** FCM token not registered for user
**Solution:** 
1. User must login to app at least once
2. Check `fcm_tokens` table for user's token

---

## ✅ Quick Fix Checklist

- [ ] Add FIREBASE_SERVICE_ACCOUNT_JSON to Render
- [ ] Verify cron jobs are running (check logs)
- [ ] Ensure users have granted notification permission
- [ ] Check FCM tokens are being registered on login
- [ ] Add "One Person Ahead" notification (see implementation above)
- [ ] Test all notification types

---

## 📊 Notification Flow

```
1. Event Happens (booking/queue call/reminder time)
   ↓
2. createNotification() called
   ↓
3. Saves to database (notifications table)
   ↓
4. Calls fcmService.sendNotification()
   ↓
5. Looks up FCM token (fcm_tokens table)
   ↓
6. Sends via Firebase Admin SDK
   ↓
7. User's device receives push notification
```

---

**Next Step:** Add environment variables to Render and implement "One Person Ahead" notification!
