# OTP Production Fix — Complete Step-by-Step Guide

## **THE PROBLEM**
- ✅ Website OTP works (web version uses Firebase JS SDK + client-side verification)
- ❌ Production Android app OTP doesn't work (backend firebase SMS provider not configured)

---

## **ROOT CAUSE**
The backend in Render has `SMS_PROVIDER=firebase` configured, but the service account JSON (needed to authenticate Firebase Admin SDK) is **NOT SET** in the Render environment.

**Evidence:** In `render.yaml`:
```yaml
- key: FIREBASE_SERVICE_ACCOUNT_JSON
  sync: false   # set manually in Render dashboard
```

This means the backend is trying to send OTP via Firebase Admin SDK, but **cannot authenticate** because the service account credentials are missing.

---

## **WHAT THE APP DOES**

### Android App Flow:
```
1. User enters phone → App calls POST /auth/patient/send-otp
2. Backend receives request → tries to send OTP via SMS_PROVIDER (firebase)
3. Firebase Admin SDK needs FIREBASE_SERVICE_ACCOUNT_JSON to authenticate
4. ❌ Service account not configured → Firebase fails silently
5. Backend falls back to sendMock() → OTP only logged to console, not sent to phone
6. User never receives SMS
```

### Website Flow (Works):
```
1. User enters phone → Website calls Firebase JS SDK directly (signInWithPhoneNumber)
2. Firebase handles OTP sending itself (no backend needed)
3. ✅ User receives SMS via Firebase Phone Auth
```

---

## **THE FIX: 3 STEPS**

### **STEP 1: Get Firebase Service Account JSON**

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/serviceaccounts/adminsdk
2. Click **"Python"** (or any language)
3. Click **"Generate new private key"** button
4. A JSON file will download: `pulsemateconnect-xxxxx.json`
5. **Keep this file safe** — it's a secret!

### **STEP 2: Add to Render Backend Environment**

1. Go to: https://dashboard.render.com
2. Click **"pulsemate-backend"** service
3. Click **"Environment"** tab
4. Scroll down to `FIREBASE_SERVICE_ACCOUNT_JSON`
5. Click in the value field
6. Open the JSON file you downloaded in a text editor
7. **Copy the entire JSON content** (everything from `{` to `}`)
8. **Paste it into the Render field**
9. Click **"Save Changes"**

**Important:** The entire JSON must be pasted as-is, including:
```json
{
  "type": "service_account",
  "project_id": "pulsemateconnect",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  ...
}
```

### **STEP 3: Verify the Fix**

1. **Backend will auto-restart** after environment change (or manually restart)
2. **Test OTP in production app:**
   - Open the production Android app
   - Go to login screen
   - Enter your phone number
   - Click "Send OTP"
   - **Wait 30 seconds** — check your phone for SMS

3. **If OTP arrives:** ✅ Problem solved!
4. **If OTP still doesn't arrive:**
   - Check backend logs in Render dashboard → Logs tab
   - Look for lines like: `[Firebase] ✓ OTP SMS sent to +91...`
   - If you see errors like `MISSING_CLIENT_IDENTIFIER`, scroll to **Troubleshooting** below

---

## **TROUBLESHOOTING**

### **Issue: "MISSING_CLIENT_IDENTIFIER" error in backend logs**

**Cause:** Firebase Phone Auth is not enabled in Firebase Console

**Fix:**
1. Go to: https://console.firebase.google.com/project/pulsemateconnect/authentication/providers
2. Click **"Phone"** provider
3. Toggle **"Enable"** switch
4. Save

Then retry OTP test.

---

### **Issue: "Firebase Admin SDK not configured" message**

**Cause:** Service account JSON was not pasted correctly

**Fix:**
1. Delete the malformed `FIREBASE_SERVICE_ACCOUNT_JSON` value
2. Download the service account JSON again from Step 1
3. Paste the **entire JSON** (not just the private key)
4. Verify it starts with `{` and ends with `}`

---

### **Issue: Backend keeps restarting (deploy loop)**

**Cause:** Invalid JSON syntax in environment variable

**Fix:**
1. Go to Render dashboard → pulsemate-backend → Settings
2. Click **"Environment"** tab
3. Find `FIREBASE_SERVICE_ACCOUNT_JSON`
4. **Clear it completely** (leave empty)
5. Click **"Save Changes"** — backend should stabilize
6. Then carefully re-paste the JSON with proper formatting

---

## **HOW TO VERIFY IN LOGS**

Once deployed, check backend logs:

1. Go to https://dashboard.render.com → pulsemate-backend
2. Click **"Logs"** tab
3. When you send OTP from the app, look for one of these:

**Success:**
```
[Firebase] ✓ OTP SMS sent to +917022818878 via Firebase
```

**Firebase not enabled:**
```
[Firebase] sendVerificationCode failed: MISSING_CLIENT_IDENTIFIER
[Firebase] Falling back to mock
```

**Misconfigured service account:**
```
[Firebase] Admin credential error: ...
```

---

## **AFTER FIREBASE IS SET UP**

Once OTP starts working via Firebase Admin SDK, you have 2 options:

### **Option A: Keep using Firebase (Current)**
- No additional cost for SMS within Firebase's quota
- Backend sends OTP to phone via Firebase Admin SDK
- Works reliably in production

### **Option B: Switch to 2Factor.in (Faster SMS)**
- More reliable for India
- Slightly faster delivery
- Need API key from https://2factor.in
- Update `SMS_PROVIDER=2factor` in Render
- Add `SMS_API_KEY` with your 2Factor API key

---

## **QUICK REFERENCE**

| Step | Action | Status |
|------|--------|--------|
| 1 | Download Firebase service account JSON | 📋 Do this |
| 2 | Add to Render `FIREBASE_SERVICE_ACCOUNT_JSON` | 📋 Do this |
| 3 | Backend auto-restarts | ⏳ Automatic |
| 4 | Test OTP in production app | ✅ Verify |
| 5 | Check logs for success message | ✅ Verify |

---

## **DONE!** ✅

Once you complete Step 1 and Step 2, your production app OTP will work. 

**Next time users try to login on the Android app, they will receive SMS with the OTP code.**
