# 🔔 FIX: Push Notifications Not Showing After Booking

## ✅ **ISSUE FOUND!**

Push notifications are not being sent because **`FIREBASE_SERVICE_ACCOUNT_JSON` is missing from Render environment variables**.

Your backend code checks for this variable:
```javascript
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // ✅ Send real push notifications via Firebase Admin SDK
} else {
  // ❌ Dev mode: just log to console (THIS IS WHAT'S HAPPENING)
}
```

---

## 🚀 **IMMEDIATE FIX**

### Step 1: Add Firebase Service Account to Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. Select your **backend service**
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Add this variable:

**Key**: `FIREBASE_SERVICE_ACCOUNT_JSON`

**Value**: Copy the value from your `backend/.env` file (the entire JSON on one line)

**How to get it**:
1. Open `backend/.env` file in your project
2. Find the line starting with `FIREBASE_SERVICE_ACCOUNT_JSON=`
3. Copy the entire JSON value (starts with `{"type": "service_account",...`)
4. Paste it into Render as the value

6. Click **Save Changes**
7. Wait for Render to **auto-redeploy** (2-3 minutes)

---

## 📋 **Your Complete Render Environment Variables Should Be**

After adding Firebase, you should have:

```bash
# ✅ KEEP (Already Set)
RAZORPAY_KEY_ID=rzp_live_***
RAZORPAY_KEY_SECRET=***
RESEND_API_KEY=re_***
RESEND_FROM_EMAIL=PulseMate <noreply@pulsemateconnect.in>

# ✅ ADD (Missing - This is why notifications don't work!)
FIREBASE_SERVICE_ACCOUNT_JSON={"type": "service_account",...}  ← Copy from backend/.env

# ❌ REMOVE (Conflicts with Render's dynamic port)
PORT=5000  ← DELETE THIS ONE
```

---

## 🧪 **How to Test After Fix**

### Test 1: Check Render Logs

1. Go to Render Dashboard → Your Service → **Logs**
2. Look for this message after redeploy:
   ```
   ✅ Firebase Admin SDK initialized successfully
   ```

3. If you see:
   ```
   ⚠️ Firebase Admin SDK not available. Push notifications disabled.
   ```
   Then the env var wasn't added correctly.

### Test 2: Book an Appointment

1. Open PulseMate app on your phone
2. Login as Akshata (9663080521)
3. Book an appointment with Dr. Amit Sharma (9 AM-1 PM)
4. Complete payment (₹10 platform fee)
5. **✅ You should get a push notification**: "✅ Appointment Confirmed"

### Test 3: Check Notification in Database

Run this script to verify notifications are being created:

**File**: `backend/check-notifications.js`

```javascript
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotifications() {
  console.log('📊 Checking Recent Notifications...\n');

  // Find Akshata's user ID
  const patient = await prisma.user.findFirst({
    where: { mobile: '9663080521' }
  });

  if (!patient) {
    console.log('❌ Patient not found');
    return;
  }

  console.log(`✅ Patient: ${patient.name} (${patient.id})\n`);

  // Get notifications
  const notifications = await prisma.notification.findMany({
    where: { userId: patient.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`📬 Total Notifications: ${notifications.length}\n`);

  notifications.forEach((notif, i) => {
    console.log(`${i + 1}. ${notif.type}`);
    console.log(`   Title: ${notif.title}`);
    console.log(`   Body: ${notif.message}`);
    console.log(`   Read: ${notif.isRead ? '✅' : '❌'}`);
    console.log(`   Created: ${notif.createdAt}\n`);
  });

  // Get FCM tokens
  const tokens = await prisma.fcmToken.findMany({
    where: { userId: patient.id }
  });

  console.log(`🔔 FCM Tokens Registered: ${tokens.length}`);
  tokens.forEach((token, i) => {
    console.log(`   ${i + 1}. Platform: ${token.platform}`);
    console.log(`      Token: ${token.token.substring(0, 50)}...`);
    console.log(`      Updated: ${token.updatedAt}\n`);
  });

  await prisma.$disconnect();
}

checkNotifications();
```

**Run**:
```bash
cd backend
node check-notifications.js
```

**Expected Output**:
```
✅ Patient: Akshata (user-id-here)

📬 Total Notifications: 2

1. APPOINTMENT_BOOKED
   Title: ✅ Appointment Confirmed
   Body: Your appointment with Dr. Amit Sharma on 9/4/2026 is confirmed.
   Read: ❌
   Created: 2026-09-04T10:23:45.000Z

🔔 FCM Tokens Registered: 1
   1. Platform: ANDROID
      Token: ExponentPushToken[xxxxxxxxxxxxxx]...
      Updated: 2026-09-04T09:15:23.000Z
```

---

## 🔍 **How Notifications Work (Technical Flow)**

### 1. **Mobile App Registers FCM Token**

When user opens app:
```javascript
// src/hooks/usePushNotifications.js
await registerFcmToken(token, 'android');
```

Backend saves token:
```javascript
// POST /api/device-token/register
await prisma.fcmToken.upsert({
  where: { token },
  create: { userId, token, platform: 'ANDROID' }
});
```

### 2. **User Books Appointment**

After successful booking:
```javascript
// backend/src/controllers/payment.controller.js (line 454, 782, 842, 1079)
notifyStakeholders(appointment, patientName);
```

### 3. **Notification Sent to Patient**

```javascript
// backend/src/services/fcm.service.js
const sendNotification = async (userId, { title, body, data }) => {
  // Get user's FCM tokens
  const tokens = await prisma.fcmToken.findMany({ where: { userId } });
  
  // Send via Firebase Admin SDK
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {  // ← THIS CHECK!
    const admin = getFirebaseAdmin();
    await admin.messaging().sendEachForMulticast({
      notification: { title, body },
      tokens: tokenList
    });
  }
};
```

### 4. **Push Notification Received on Device**

Firebase sends notification → Android/iOS system → App shows notification banner

---

## ❗ **Common Issues**

### Issue 1: "Notifications still not showing"

**Check**:
1. App has notification permissions enabled
   - Android: Settings → Apps → PulseMate → Notifications → ✅ Allowed
   - iOS: Settings → PulseMate → Notifications → ✅ Allow Notifications

2. FCM token is registered
   - Run `check-notifications.js` script above
   - Should show "🔔 FCM Tokens Registered: 1"

3. App is in background (notifications don't show when app is in foreground - this is normal Expo behavior)

### Issue 2: "Invalid credentials error in logs"

**Solution**: The Firebase service account JSON is malformed.
- Make sure you copied the ENTIRE JSON as one line
- No line breaks or extra spaces

### Issue 3: "Token not registered error"

**Solution**: App's FCM token expired or was deleted.
- Close app completely
- Reopen app (will re-register token)
- Try booking again

---

## ✅ **Success Checklist**

After adding `FIREBASE_SERVICE_ACCOUNT_JSON` to Render:

- [ ] Render redeployed successfully
- [ ] Logs show "Firebase Admin SDK initialized"
- [ ] Booked test appointment
- [ ] Received push notification on phone
- [ ] Notification appears in app's notification tab
- [ ] Doctor/clinic owner also receives notification

---

## 🎯 **Quick Summary**

**Problem**: Push notifications not working after booking

**Root Cause**: `FIREBASE_SERVICE_ACCOUNT_JSON` missing from Render environment variables

**Solution**: Add Firebase service account JSON to Render env vars (Step 1 above)

**Testing**: Book appointment → Should receive "✅ Appointment Confirmed" push notification

**Status**: ⚡ **ACTION REQUIRED** - Add env var to Render

---

## 📞 **After Adding Firebase Env Var**

If notifications still don't work after adding the env var:

1. **Check Render logs** for errors
2. **Run `check-notifications.js`** to verify:
   - Notifications are being created in database
   - FCM tokens are registered
3. **Share the output** and I'll help debug further

The fix should work immediately after adding the environment variable! 🚀
