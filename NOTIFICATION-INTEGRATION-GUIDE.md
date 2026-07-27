# 🔌 Notification System Integration Guide

This guide shows you exactly where to add notification triggers in your existing code.

---

## 📋 Integration Checklist

- [ ] Run database migration
- [ ] Update appointment booking flow
- [ ] Update queue management
- [ ] Update payment processing
- [ ] Update prescription creation
- [ ] Test each notification type
- [ ] Deploy to production

---

## 1️⃣ Appointment Booking

### File: `backend/src/controllers/appointment.controller.js`

```javascript
// At the top of the file
const {
  notifyAppointmentBooked,
  scheduleAppointmentReminders,
  notifyDoctorNewAppointment,
} = require('../services/notification-enhanced.service');

// In your createAppointment or bookAppointment handler
exports.bookAppointment = async (req, res, next) => {
  try {
    // ... existing booking logic ...
    
    const appointment = await prisma.appointment.create({
      data: {
        // ... your appointment data ...
      },
      include: {
        doctor: {
          include: { user: true },
        },
        patient: true,
      },
    });

    // 🔔 ADD THIS: Send notifications
    await notifyAppointmentBooked(appointment);
    await scheduleAppointmentReminders(appointment);
    await notifyDoctorNewAppointment(
      appointment.doctor.userId,
      appointment.patient.name,
      new Date(appointment.appointmentDate).toLocaleDateString('en-IN'),
      appointment.slotTime,
      appointment.id
    );

    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};
```

---

## 2️⃣ Appointment Cancellation

### File: `backend/src/controllers/appointment.controller.js`

```javascript
// At the top
const { notifyAppointmentCancelled } = require('../services/notification-enhanced.service');

// In your cancelAppointment handler
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    // 🔔 ADD THIS: Notify cancellation
    await notifyAppointmentCancelled(
      appointment.patientId,
      appointment.doctor.user.name,
      new Date(appointment.appointmentDate).toLocaleDateString('en-IN'),
      appointment.id
    );

    // Also cancel scheduled reminders
    await prisma.scheduledNotification.updateMany({
      where: { appointmentId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};
```

---

## 3️⃣ Queue Updates

### File: `backend/src/controllers/queue.controller.js`

```javascript
// At the top
const {
  notifyQueueUpdate,
  notifyYourTurn,
  notifyAlmostYourTurn,
} = require('../services/notification-enhanced.service');
const { emitQueueUpdate } = require('../services/socket-notification.service');

// When calling next patient
exports.callNextPatient = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    // Get current queue item
    const currentItem = await prisma.queueItem.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: { position: 'asc' },
      include: {
        patient: true,
        queue: {
          include: {
            doctor: { include: { user: true } },
          },
        },
      },
    });

    if (!currentItem) {
      return res.status(404).json({ success: false, message: 'No patients in queue' });
    }

    // Update current patient status
    await prisma.queueItem.update({
      where: { id: currentItem.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
    });

    // 🔔 ADD THIS: Notify the called patient
    const doctorName = currentItem.queue.doctor.user.name;
    await notifyYourTurn(currentItem.patientId, doctorName, currentItem.appointmentId);

    // Get next patient in line
    const nextItem = await prisma.queueItem.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: { position: 'asc' },
      skip: 1,
      include: { patient: true },
    });

    // 🔔 ADD THIS: Notify next patient they're almost up
    if (nextItem) {
      await notifyAlmostYourTurn(nextItem.patientId, doctorName, nextItem.appointmentId);
    }

    // 🔔 ADD THIS: Update all waiting patients about their position
    const waitingPatients = await prisma.queueItem.findMany({
      where: { queueId, status: 'WAITING' },
      orderBy: { position: 'asc' },
      include: { patient: true },
    });

    for (let i = 0; i < waitingPatients.length; i++) {
      const patient = waitingPatients[i];
      const patientsAhead = i;
      const estimatedWait = patientsAhead * 10; // Assume 10 min per patient

      await notifyQueueUpdate(
        patient.patientId,
        patientsAhead,
        estimatedWait,
        patient.appointmentId
      );

      // Also emit real-time update
      emitQueueUpdate(patient.patientId, {
        position: i + 1,
        patientsAhead,
        estimatedWait,
        queueNumber: patient.queueNumber,
      });
    }

    res.json({ success: true, calledPatient: currentItem });
  } catch (error) {
    next(error);
  }
};
```

---

## 4️⃣ Payment Success

### File: `backend/src/controllers/payment.controller.js`

```javascript
// At the top
const { notifyPaymentSuccess } = require('../services/notification-enhanced.service');

// In your Razorpay webhook handler or payment verification
exports.verifyPayment = async (req, res, next) => {
  try {
    // ... existing payment verification logic ...

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidAt: new Date() },
      include: { appointment: true },
    });

    // 🔔 ADD THIS: Notify payment success
    await notifyPaymentSuccess(
      payment.patientId,
      payment.amount,
      payment.appointmentId
    );

    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};
```

---

## 5️⃣ Prescription Ready

### File: `backend/src/controllers/prescription.controller.js`

```javascript
// At the top
const { notifyPrescriptionReady } = require('../services/notification-enhanced.service');

// In your createPrescription handler
exports.createPrescription = async (req, res, next) => {
  try {
    // ... existing prescription creation logic ...

    const prescription = await prisma.prescriptions.create({
      data: {
        // ... your prescription data ...
      },
      include: {
        doctor_profiles: { include: { user: true } },
        appointments: true,
      },
    });

    // 🔔 ADD THIS: Notify prescription ready
    await notifyPrescriptionReady(
      prescription.patientId,
      prescription.doctor_profiles.user.name,
      prescription.appointmentId
    );

    res.json({ success: true, prescription });
  } catch (error) {
    next(error);
  }
};
```

---

## 6️⃣ Admin Broadcasts

### Example: Emergency Notice

```javascript
// backend/src/controllers/admin.controller.js
const { sendNotification } = require('../services/notification-enhanced.service');
const prisma = require('../config/database');

exports.sendEmergencyNotice = async (req, res, next) => {
  try {
    const { title, message, targetUserIds } = req.body;

    // Get all users if no specific targets
    const users = targetUserIds || await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    }).then(users => users.map(u => u.id));

    // Send to all users
    const results = await Promise.allSettled(
      users.map(userId =>
        sendNotification({
          userId,
          type: 'ADMIN_EMERGENCY',
          variables: { message: message },
          skipPreferences: true, // Always send emergency notices
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    res.json({
      success: true,
      message: `Sent to ${successCount}/${users.length} users`,
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 7️⃣ Real-time Socket.IO Integration

### File: `backend/src/socket.js`

Add notification event listeners:

```javascript
// In your initializeSocket function
function initializeSocket(io) {
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    
    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Existing socket handlers...
    
    // 🔔 ADD THIS: Notification acknowledgment
    socket.on('notification:read', async ({ notificationId }) => {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true, readAt: new Date() },
        });
        
        // Emit updated unread count
        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false },
        });
        
        socket.emit('notification:unread-count', { count: unreadCount });
      } catch (error) {
        console.error('Notification read error:', error);
      }
    });
  });
}
```

---

## 8️⃣ Mobile App Integration

### File: `App.js`

```javascript
import useRealtimeNotifications from './src/hooks/useRealtimeNotifications';
import { useState, useEffect } from 'react';

function RootNavigator({ navigationRef }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔔 ADD THIS: Real-time notifications
  useRealtimeNotifications(
    // On new notification
    (notification) => {
      console.log('📬 New notification:', notification.title);
      // Optional: Show local toast or alert
    },
    // On queue update
    (queueData) => {
      console.log('👥 Queue update:', queueData);
      // Update queue screen if it's visible
    },
    // On unread count update
    (count) => {
      console.log('🔔 Unread count:', count);
      setUnreadCount(count);
    }
  );

  // Fetch initial unread count
  useEffect(() => {
    if (user) {
      api.get('/notifications/unread-count').then(res => {
        if (res.data.success) {
          setUnreadCount(res.data.unreadCount);
        }
      });
    }
  }, [user]);

  return user ? <MainNavigator unreadCount={unreadCount} /> : <AuthNavigator />;
}
```

### Add Badge to Tab Navigator

```javascript
// src/navigation/MainNavigator.js
<Tab.Screen
  name="Notifications"
  component={NotificationsScreen}
  options={{
    tabBarLabel: 'Notifications',
    tabBarIcon: ({ color, size }) => (
      <View>
        <Ionicons name="notifications" size={size} color={color} />
        {unreadCount > 0 && (
          <View style={{
            position: 'absolute',
            right: -6,
            top: -3,
            backgroundColor: '#EF4444',
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    ),
  }}
/>
```

---

## 9️⃣ Testing Checklist

### Backend Tests

```bash
# 1. Test notification API
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "APPOINTMENT_BOOKED", "variables": {"doctorName": "Dr. Test", "date": "Tomorrow", "time": "10:00 AM"}}'

# 2. Check notification created in database
psql -U postgres -d pulsemate_db -c "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;"

# 3. Verify scheduled notifications
psql -U postgres -d pulsemate_db -c "SELECT * FROM scheduled_notifications WHERE status = 'PENDING';"

# 4. Check delivery logs
psql -U postgres -d pulsemate_db -c "SELECT * FROM notification_delivery_log ORDER BY sent_at DESC LIMIT 10;"
```

### Mobile App Tests

1. **Push Notification**: Book an appointment → Should receive push
2. **Real-time**: Open app → Should connect to Socket.IO (check logs)
3. **Notification Center**: Open notifications screen → Should show all notifications
4. **Mark as Read**: Tap notification → Should mark as read
5. **Deep Link**: Tap appointment notification → Should open appointment details
6. **Badge**: Check notification tab → Should show unread count
7. **Preferences**: Go to settings → Change notification preferences → Should respect settings

---

## 🔟 Deployment Steps

### Step 1: Run Migration

```bash
cd backend
npx prisma migrate deploy
```

### Step 2: Seed Templates

```sql
-- Templates are auto-seeded by migration
-- Verify:
SELECT type, title_template FROM notification_templates;
```

### Step 3: Restart Backend

```bash
# Render will auto-restart on deploy
# Verify cron jobs started:
# Check logs for:
# [NOTIFICATION-JOB] Notification scheduler started
# [NOTIFICATION-JOB] Notification retry job started
```

### Step 4: Test Endpoints

```bash
# Health check
curl https://api.pulsemateconnect.in/health

# Get notifications (requires auth token)
curl https://api.pulsemateconnect.in/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 5: Update Mobile App

```bash
cd ../
eas build --platform android --profile production
# Or
npx expo run:android
```

---

## 📊 Monitoring Queries

### Check Notification Stats
```sql
SELECT 
  type,
  COUNT(*) as total,
  SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read,
  SUM(CASE WHEN delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered
FROM notifications
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY type
ORDER BY total DESC;
```

### Check Failed Notifications
```sql
SELECT id, user_id, title, delivery_status, error_message, retry_count
FROM notifications
WHERE delivery_status = 'FAILED'
AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Check Scheduled Notifications
```sql
SELECT 
  reminder_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent
FROM scheduled_notifications
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY reminder_type;
```

---

## 🎯 Success Criteria

Your notification system is working if:

✅ Users receive push notifications when app is closed
✅ Real-time updates work when app is open
✅ Notification center shows all notifications
✅ Unread badge updates correctly
✅ Deep linking works (tap notification → correct screen)
✅ Scheduled reminders are sent at correct times
✅ Failed notifications are retried automatically
✅ User preferences are respected
✅ Delivery logs are created for debugging

---

## 🆘 Troubleshooting

**Problem:** Notifications not sending
- Check Firebase service account is configured
- Verify FCM tokens are registered for user
- Check notification preferences
- Review backend logs for errors

**Problem:** Real-time not working
- Check Socket.IO connection in app logs
- Verify authentication token is valid
- Check backend Socket.IO initialization logs
- Verify network connectivity

**Problem:** Scheduled notifications not firing
- Check cron job is running (check logs)
- Verify scheduled_notifications table has pending items
- Check appointment dates are in future
- Review scheduler logs for errors

---

**Status:** ✅ Ready to integrate and deploy!

**Next:** Follow the steps above to integrate notifications into your existing controllers.
