# 🚀 Notification System - Quick Start Guide

## ⚡ 5-Minute Setup

### What Was Fixed?
✅ Notifications now actually work (were completely broken)  
✅ Mobile API endpoint corrected (404 error fixed)  
✅ Proper error logging (no more silent failures)  
✅ Test endpoints for easy debugging

---

## 🎯 One Thing You MUST Do

**Configure Firebase in Render** (takes 5 minutes):

1. **Get Firebase JSON**:
   - https://console.firebase.google.com/
   - Select `pulsemateconnect` project
   - Settings → Service Accounts → Generate New Private Key
   - Download JSON file

2. **Convert to Single Line** (Windows PowerShell):
   ```powershell
   (Get-Content firebase-key.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress) -replace '\r?\n',''
   ```
   Copy the output.

3. **Add to Render**:
   - https://dashboard.render.com
   - Select `pulsemate-backend`
   - Environment tab
   - Add: `FIREBASE_SERVICE_ACCOUNT_JSON` = paste JSON
   - Save

**That's it!** Render will auto-deploy (~3 minutes).

---

## 🧪 Test It

### Option 1: Automated Test Script (Recommended)

**Windows PowerShell:**
```powershell
.\test-notifications.ps1 YOUR_JWT_TOKEN
```

**Linux/Mac:**
```bash
bash test-notifications.sh YOUR_JWT_TOKEN
```

This will:
- ✓ Check Firebase configuration
- ✓ Check if mobile tokens are registered
- ✓ Send test notification to your device

### Option 2: Manual cURL Commands

```bash
# Check Firebase status
curl https://api.pulsemateconnect.in/api/notifications/firebase-status \
  -H "Authorization: Bearer YOUR_JWT"

# List your registered tokens
curl https://api.pulsemateconnect.in/api/notifications/tokens \
  -H "Authorization: Bearer YOUR_JWT"

# Send test notification
curl -X POST https://api.pulsemateconnect.in/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT"
```

**Expected**: Test notification appears on your mobile device.

---

## 📱 How to Get JWT Token

### From Mobile App (React Native Debugger)
1. Connect device to debugger
2. Open console
3. Run: `AsyncStorage.getItem('token')`

### From Web App (Chrome DevTools)
1. Login to https://www.pulsemateconnect.in
2. Press F12 (DevTools)
3. Console tab
4. Run: `localStorage.getItem('token')`

Copy the token (without quotes).

---

## ✅ Expected Results After Setup

1. **Firebase Status**:
   ```json
   {
     "configured": true,
     "initialized": true,
     "mode": "PRODUCTION"
   }
   ```

2. **Tokens Registered**:
   ```json
   {
     "count": 1,
     "tokens": [{
       "platform": "ANDROID",
       "registeredAt": "2026-08-10..."
     }]
   }
   ```

3. **Test Notification**: Appears on mobile device with message "🔔 Test Notification"

4. **Real Notifications**: Work automatically
   - Patient books appointment → Doctor gets notification
   - Appointment confirmed → Patient gets notification
   - Queue called → Patient gets notification

---

## 🐛 Troubleshooting

### Issue: Firebase status shows "DEVELOPMENT (Logs only)"
**Solution**: `FIREBASE_SERVICE_ACCOUNT_JSON` not set in Render. Go back to setup step 3.

### Issue: Token count is 0
**Solution**: 
1. Mobile app needs the API fix (already deployed to GitHub)
2. Rebuild mobile APK/AAB
3. Login to mobile app
4. Token registers automatically

### Issue: Test notification fails with "No FCM tokens"
**Solution**: See above - mobile app needs to register tokens first.

### Issue: Backend logs show "FCM DEV"
**Solution**: Firebase not configured. Check Render environment variables.

---

## 📊 Notification Flow (Now Working)

```
User Action (e.g., Book Appointment)
        ↓
Backend creates DB notification
        ↓
Backend calls FCM service ← THIS WAS MISSING!
        ↓
FCM sends to Firebase Cloud Messaging
        ↓
Firebase delivers to device
        ↓
Mobile app displays notification ✅
```

---

## 📚 Full Documentation

- **Complete Technical Report**: `NOTIFICATION-SYSTEM-FIX-REPORT.md`
- **Firebase Setup Details**: `URGENT-FIREBASE-SETUP-REQUIRED.md`
- **This Quick Guide**: `NOTIFICATION-QUICK-START.md`

---

## 🎯 Success Checklist

- [ ] Firebase configured in Render
- [ ] Render redeployed (automatic, ~3 min)
- [ ] Test script shows all green checkmarks
- [ ] Test notification received on device
- [ ] Book test appointment → Notifications work

**Total Time**: 10 minutes  
**Difficulty**: Easy  
**Files Changed**: Already committed and pushed

---

## 🆘 Need Help?

Check backend logs in Render dashboard for detailed error messages.
All notification operations now log success/failure.

---

**Last Updated**: August 10, 2026  
**Status**: ✅ Code fixes deployed, Firebase setup required
