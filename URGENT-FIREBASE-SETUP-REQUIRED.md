# ⚠️ URGENT: Firebase Configuration Required

## Push Notifications Will NOT Work Until This is Done

The mobile notification system has been **completely fixed**, but requires **one critical configuration step** to work in production.

---

## 🔥 REQUIRED ACTION: Configure Firebase Service Account

### Step 1: Get Firebase Service Account JSON

1. Go to https://console.firebase.google.com/
2. Select **pulsemateconnect** project
3. Click ⚙️ **Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **"Generate New Private Key"** button
6. Download the JSON file (e.g., `pulsemateconnect-firebase-adminsdk-xxxxx.json`)

### Step 2: Convert to Single Line

The JSON must be on a single line for environment variables.

**On Windows PowerShell:**
```powershell
(Get-Content pulsemateconnect-firebase-adminsdk-xxxxx.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress) -replace '\r?\n',''
```

Copy the output.

**On Linux/Mac:**
```bash
cat pulsemateconnect-firebase-adminsdk-xxxxx.json | jq -c '.' | tr -d '\n'
```

### Step 3: Add to Render Environment Variables

1. Go to https://dashboard.render.com
2. Click on **pulsemate-backend** service
3. Go to **Environment** tab
4. Click **"Add Environment Variable"**
5. Key: `FIREBASE_SERVICE_ACCOUNT_JSON`
6. Value: *Paste the single-line JSON from Step 2*
7. Click **"Save Changes"**

**Render will automatically redeploy the backend.**

---

## ✅ Verify Configuration

After Render redeploys (takes ~2-3 minutes):

```bash
curl -X GET https://api.pulsemateconnect.in/api/notifications/firebase-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "initialized": true,
    "error": null,
    "mode": "PRODUCTION"
  }
}
```

**If Still Dev Mode:**
```json
{
  "data": {
    "configured": false,
    "mode": "DEVELOPMENT (Logs only)"
  }
}
```

This means the environment variable is not set correctly.

---

## 🧪 Test Notifications

After Firebase is configured, test with:

```bash
curl -X POST https://api.pulsemateconnect.in/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**You should receive a test notification on your mobile device immediately.**

---

## 🚨 Without This Configuration

- ✅ Backend will run without errors
- ✅ Database notifications will be created
- ❌ Push notifications will NOT be sent
- ⚠️ Backend logs will show: `[FCM DEV] Notification to user...` (dev mode)

---

## 📋 What Was Fixed (Already Deployed)

1. ✅ Database notifications now trigger push notifications
2. ✅ Mobile API endpoint corrected (404 error fixed)
3. ✅ Error logging added (no more silent failures)
4. ✅ Test endpoints created for debugging

**See `NOTIFICATION-SYSTEM-FIX-REPORT.md` for complete details.**

---

## ⏱️ Time Required

- Firebase configuration: **5 minutes**
- Render redeploy: **2-3 minutes**
- Testing: **2 minutes**

**Total: ~10 minutes**

---

## 🆘 Need Help?

If you encounter issues:

1. Check Render deployment logs
2. Call `/api/notifications/firebase-status`
3. Check that JSON is valid (no line breaks, proper escaping)
4. Verify Firebase project ID matches `pulsemateconnect`

---

**This is the ONLY remaining step to enable mobile push notifications.**
