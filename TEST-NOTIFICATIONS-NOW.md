# ✅ Test Notifications - Step by Step

## Prerequisites

1. ✅ All code fixes are deployed (already done)
2. ⚠️ Firebase must be configured in Render (5 minutes)
3. 📱 You need a JWT token from a logged-in user

---

## Step 1: Get Your JWT Token

### Option A: From Web App
1. Login to https://www.pulsemateconnect.in
2. Press **F12** (open DevTools)
3. Go to **Console** tab
4. Type: `localStorage.getItem('token')`
5. Copy the token (without quotes)

### Option B: From Mobile App (if using debugger)
1. Connect device to React Native debugger
2. Open console
3. Type: `AsyncStorage.getItem('token')`
4. Copy the token

---

## Step 2: Test Firebase Configuration

**Windows Command Prompt:**
```cmd
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" https://api.pulsemateconnect.in/api/notifications/firebase-status
```

**Expected if Firebase NOT configured:**
```json
{
  "success": true,
  "data": {
    "configured": false,
    "initialized": false,
    "mode": "DEVELOPMENT (Logs only)"
  }
}
```

**Expected if Firebase IS configured:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "initialized": true,
    "mode": "PRODUCTION"
  }
}
```

### ⚠️ If Firebase is NOT configured:

**You must configure it first!**

See: `URGENT-FIREBASE-SETUP-REQUIRED.md`

Quick steps:
1. Get Firebase service account JSON from Firebase Console
2. Convert to single line
3. Add to Render environment variables as `FIREBASE_SERVICE_ACCOUNT_JSON`
4. Wait 2-3 minutes for Render to redeploy
5. Re-run this test

---

## Step 3: Check Registered Tokens

```cmd
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" https://api.pulsemateconnect.in/api/notifications/tokens
```

**Expected if mobile app has registered:**
```json
{
  "success": true,
  "data": {
    "count": 1,
    "tokens": [{
      "platform": "ANDROID",
      "registeredAt": "2026-08-10T12:00:00.000Z",
      "tokenPreview": "ExponentPushToken[xxxx]..."
    }]
  }
}
```

**Expected if NO tokens registered:**
```json
{
  "success": true,
  "data": {
    "count": 0,
    "tokens": []
  }
}
```

### ⚠️ If count is 0:

**The mobile app hasn't registered a token yet.**

Reasons:
1. Mobile app needs to be rebuilt with the API fix
2. User hasn't logged in on mobile device
3. Mobile app not installed

**To fix:**
1. Build new mobile APK/AAB: `eas build --profile production --platform android`
2. Install on device
3. Login
4. Re-run this test

---

## Step 4: Send Test Notification

```cmd
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" https://api.pulsemateconnect.in/api/notifications/test
```

**Expected SUCCESS:**
```json
{
  "success": true,
  "data": {
    "tokenCount": 1,
    "tokens": [{
      "platform": "ANDROID",
      "registeredAt": "2026-08-10...",
      "tokenPreview": "ExponentPushToken[xxxx]..."
    }]
  },
  "message": "Test notification sent successfully"
}
```

**On your mobile device, you should immediately see:**
```
🔔 Test Notification
This is a test notification sent at [current time]
```

### ⚠️ If test fails:

Check the error message returned by the API.

**Common errors:**

1. **"No FCM tokens registered"**
   - Solution: Mobile app needs to register token (see Step 3)

2. **"FCM send failed: Firebase not configured"**
   - Solution: Configure Firebase (see Step 2)

3. **"Invalid token"** or **"Token not registered"**
   - Solution: Token expired, user needs to logout/login on mobile

---

## Step 5: Test Real Booking Notification

Once Steps 1-4 are working:

1. **Book an appointment** via mobile app or web
2. **Check your mobile device** - Should receive notification:
   ```
   ✅ Appointment Confirmed
   Your appointment with Dr. [Name] is confirmed...
   ```
3. **Doctor should also receive** (if doctor has mobile app):
   ```
   📅 New Appointment Booked
   [Patient Name] booked an appointment...
   ```

---

## Troubleshooting

### Issue: curl command not found on Windows

**Solution**: Use PowerShell instead:

```powershell
Invoke-RestMethod -Uri "https://api.pulsemateconnect.in/api/notifications/firebase-status" -Headers @{"Authorization"="Bearer YOUR_JWT_TOKEN_HERE"}
```

### Issue: 401 Unauthorized

**Solution**: Your JWT token is invalid or expired. Get a fresh token (Step 1).

### Issue: 404 Not Found

**Solution**: Backend not deployed yet. Wait a few minutes and try again.

### Issue: Firebase shows "not configured"

**Solution**: Follow `URGENT-FIREBASE-SETUP-REQUIRED.md` to configure Firebase.

### Issue: Token count is 0

**Solution**: Mobile app needs the API fix. Rebuild with:
```bash
eas build --profile production --platform android
```

---

## Quick Test Script (Windows PowerShell)

Save this as `test.ps1` and run it:

```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$baseUrl = "https://api.pulsemateconnect.in/api/notifications"

Write-Host "Testing Firebase Status..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/firebase-status" -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json

Write-Host "`nChecking Tokens..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/tokens" -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json

Write-Host "`nSending Test Notification..." -ForegroundColor Yellow
Invoke-RestMethod -Method Post -Uri "$baseUrl/test" -Headers @{"Authorization"="Bearer $token"} | ConvertTo-Json
```

Run: `.\test.ps1`

---

## Expected Complete Flow

```
1. Firebase Status
   ✓ configured: true
   ✓ initialized: true
   ✓ mode: PRODUCTION

2. Registered Tokens
   ✓ count: 1 (or more)
   ✓ platform: ANDROID

3. Test Notification
   ✓ API returns success
   ✓ Mobile device receives notification

4. Real Booking
   ✓ Patient books appointment
   ✓ Patient receives notification
   ✓ Doctor receives notification
```

---

## What Each Test Checks

| Test | Checks | Status |
|------|--------|--------|
| Firebase Status | Firebase Admin SDK configured | Backend only |
| Registered Tokens | Mobile app registered push token | Mobile + Backend |
| Test Notification | Complete notification pipeline works | End-to-end |
| Real Booking | Production flow works | Complete system |

---

## Next Steps After All Tests Pass

1. ✅ Test appointment cancellation → notification
2. ✅ Test queue call → "Your Turn" notification
3. ✅ Test multiple devices (same user on 2 phones)
4. ✅ Test logout → token removed
5. ✅ Test app reinstall → new token registered

---

**Last Updated**: August 10, 2026  
**Status**: Ready for testing after Firebase configuration
