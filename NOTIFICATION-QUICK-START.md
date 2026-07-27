# 🚀 Notification System - Quick Start Guide

## ✅ What's Been Built

A **complete production-ready notification system** comparable to Zomato, Swiggy, and Uber with:

- ✅ Push notifications (Firebase FCM)
- ✅ Real-time updates (Socket.IO)
- ✅ Beautiful notification center
- ✅ Scheduled reminders (24h, 2h, 30m before appointments)
- ✅ User preferences & quiet hours
- ✅ Delivery tracking & retries
- ✅ Deep linking
- ✅ 21 pre-configured templates

---

## 🎯 Quick Deploy (5 Steps - 10 Minutes)

### Step 1: Run Database Migration (2 min)

```bash
cd backend
npx prisma migrate deploy
```

This creates 6 new tables:
- `notifications`
- `notification_templates` (with 21 pre-seeded templates)
- `notification_preferences`
- `scheduled_notifications`
- `notification_delivery_log`
- `broadcast_notifications`

### Step 2: Restart Backend (1 min)

The backend will auto-restart on Render and initialize:
- Notification cron jobs (runs every minute)
- Socket.IO notification service
- Firebase FCM integration

**Verify in logs:**
```
[NOTIFICATION-JOB] Notification scheduler started
[SOCKET-NOTIFICATION] Socket.IO notification service initialized
```

### Step 3: Test Backend API (2 min)

```bash
# Test notification endpoint
curl -X POST https://api.pulsemateconnect.in/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "APPOINTMENT_BOOKED",
    "variables": {
      "doctorName": "Dr. Test",
      "date": "Tomorrow",
      "time": "10:00 AM"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Test notification sent",
  "result": {
    "success": true,
    "deliveredCount": 1,
    "totalDevices": 1
  }
}
```

### Step 4: Update Mobile App (3 min)

The notification screen is already created at:
- `src/screens/NotificationsScreen.jsx`
- `src/hooks/useRealtimeNotifications.js`

**Just add to your navigator:**

```javascript
// src/navigation/MainNavigator.js
import NotificationsScreen from '../screens/NotificationsScreen';

<Tab.Screen
  name="Notifications"
  component={NotificationsScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="notifications" size={size} color={color} />
    ),
  }}
/>
```

### Step 5: Build & Test (2 min)

```bash
# Build for Android
npx expo run:android

# Or build with EAS
eas build --platform android --profile development
```

**Test:**
1. Open app
2. Go to Notifications tab
3. Should see any existing notifications
4. Book an appointment
5. Should receive push notification!

---

## 📱 What Users Will See

### 1. Push Notifications
- Work even when app is closed
- Show on lock screen
- Customized icons and priority

### 2. Notification Center
- Beautiful cards with icons
- Unread badge
- Pull to refresh
- Search & filter
- Mark as read / Delete
- Deep linking to relevant screens

### 3. Real-time Updates
- Live queue position updates
- Instant appointment changes
- No need to refresh

### 4. Scheduled Reminders
- 24 hours before appointment
- 2 hours before appointment
- 30 minutes before appointment
- Automatic, no action needed!

---

## 🔌 Integration (Optional - Add to Existing Code)

To trigger notifications from your existing code:

### Appointment Booked
```javascript
const { notifyAppointmentBooked, scheduleAppointmentReminders } = require('../services/notification-enhanced.service');

// After creating appointment
await notifyAppointmentBooked(appointment);
await scheduleAppointmentReminders(appointment);
```

### Queue Updates
```javascript
const { notifyQueueUpdate, notifyYourTurn } = require('../services/notification-enhanced.service');

// When queue position changes
await notifyQueueUpdate(userId, patientsAhead, waitTime, appointmentId);

// When it's patient's turn
await notifyYourTurn(userId, doctorName, appointmentId);
```

### Payment Success
```javascript
const { notifyPaymentSuccess } = require('../services/notification-enhanced.service');

// After payment confirmed
await notifyPaymentSuccess(userId, amount, appointmentId);
```

**See `NOTIFICATION-INTEGRATION-GUIDE.md` for complete integration examples.**

---

## 📊 How It Works

```
User Books Appointment
         ↓
1. Create notification in DB
2. Send Firebase FCM push (to all devices)
3. Send Socket.IO real-time update (if app open)
4. Schedule 3 future reminders
         ↓
User Receives Notification
         ↓
Tap Notification
         ↓
Deep Link to Appointment Details
```

---

## 🎨 Notification Types

| Type | When | Icon |
|------|------|------|
| Appointment Booked | Booking confirmed | ✅ |
| Reminder 24h | 24h before | 📅 |
| Reminder 2h | 2h before | ⏰ |
| Reminder 30m | 30m before | 🚗 |
| Queue Update | Position changes | 👥 |
| Almost Your Turn | 1-2 patients ahead | 🔔 |
| Your Turn | Consultation starting | 🩺 |
| Cancelled | Appointment cancelled | ❌ |
| Payment Success | Payment received | 💳 |
| Prescription Ready | Prescription available | 📄 |

**+ 11 more types for doctors, receptionists, and owners!**

---

## ⚙️ Configuration

### User Preferences

Users can control their notifications in Settings:

```javascript
// API: PATCH /api/notifications/preferences
{
  "pushEnabled": true,
  "inAppEnabled": true,
  "appointmentReminders": true,
  "queueUpdates": true,
  "prescriptionAlerts": true,
  "paymentAlerts": true,
  "marketingEnabled": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00"
}
```

### Quiet Hours

During quiet hours (e.g., 10 PM - 7 AM):
- Only URGENT notifications are sent
- Others are held until quiet hours end

---

## 📈 Monitoring

### Check Notification Stats

```bash
# SSH to your server or run in Render shell
psql $DATABASE_URL -c "
SELECT 
  type,
  COUNT(*) as total,
  SUM(CASE WHEN delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read
FROM notifications
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY type;
"
```

### Check Failed Notifications

```bash
psql $DATABASE_URL -c "
SELECT id, title, delivery_status, error_message, retry_count
FROM notifications
WHERE delivery_status = 'FAILED'
AND created_at >= NOW() - INTERVAL '24 hours';
"
```

---

## 🐛 Troubleshooting

### Issue: No notifications received

**Check:**
1. Firebase service account configured? (`FIREBASE_SERVICE_ACCOUNT_JSON`)
2. User has FCM tokens registered? (check `fcm_tokens` table)
3. Notification preferences enabled?
4. Check backend logs for errors

**Quick Fix:**
```bash
# Test notification API
curl -X POST https://api.pulsemateconnect.in/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: Real-time not working

**Check:**
1. Socket.IO connection logs in app
2. Backend Socket.IO initialization logs
3. User authentication token valid
4. Network connectivity

### Issue: Scheduled reminders not sending

**Check:**
1. Cron job running (check logs for `[NOTIFICATION-JOB]`)
2. Scheduled notifications in database (`scheduled_notifications` table)
3. Appointment dates are in future
4. Backend is running continuously (not sleeping)

---

## 📚 Documentation

- `NOTIFICATION-SYSTEM-COMPLETE.md` - Full architecture & features
- `NOTIFICATION-INTEGRATION-GUIDE.md` - Integration examples
- `NOTIFICATION-STATUS-REPORT.md` - Current implementation status

---

## ✅ Success Checklist

Your notification system is working if:

- [ ] Users receive push when booking appointment
- [ ] Notification center shows all notifications
- [ ] Unread badge updates correctly
- [ ] Tap notification opens correct screen
- [ ] Real-time updates work (queue position)
- [ ] Scheduled reminders send at correct times
- [ ] User preferences are respected
- [ ] Failed notifications retry automatically

---

## 🎯 Next Steps

1. **Deploy:** Run database migration and restart backend
2. **Test:** Book an appointment and verify notifications
3. **Integrate:** Add notification triggers to existing controllers
4. **Monitor:** Check delivery stats and logs
5. **Iterate:** Add more notification types as needed

---

**Status:** ✅ READY TO DEPLOY

**Time to Deploy:** ~10 minutes

**Deployment Command:**
```bash
# Just push to GitHub - Render will auto-deploy
git push origin main
```

That's it! Your notification system is ready to go. 🚀
