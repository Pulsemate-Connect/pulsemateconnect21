# 🔥 Firebase Console Configuration Checklist

Quick reference for setting up Firebase Phone Authentication in Firebase Console.

---

## 🎯 Firebase Project Details

- **Project ID:** `pulsemateconnect`
- **Project Name:** PulseMate Connect
- **Android Package:** `in.pulsemateconnect.patient`
- **Console URL:** https://console.firebase.google.com/project/pulsemateconnect

---

## ✅ Configuration Steps

### 1️⃣ Enable Phone Authentication

**URL:** https://console.firebase.google.com/project/pulsemateconnect/authentication/providers

**Steps:**
1. Click on **Authentication** in left sidebar
2. Click **Sign-in method** tab
3. Find **Phone** provider in the list
4. Click on **Phone** row
5. Toggle **Enable** switch to ON
6. Click **Save**

**Expected Result:** Phone provider shows as "Enabled"

---

### 2️⃣ Add SHA Fingerprints

**URL:** https://console.firebase.google.com/project/pulsemateconnect/settings/general

**Steps:**
1. Click ⚙️ **Settings** icon → **Project settings**
2. Scroll down to **Your apps** section
3. Find your Android app: `in.pulsemateconnect.patient`
4. Scroll to **SHA certificate fingerprints**
5. Click **Add fingerprint** button

**Add SHA-1:**
```
E0:AC:76:86:0F:79:68:E8:3D:20:47:1D:EF:53:5D:39:D6:00:9E:E1
```
6. Click **Save**

7. Click **Add fingerprint** button again

**Add SHA-256:**
```
CE:A8:43:D7:9C:7C:2B:AC:B5:9A:23:F1:31:6A:46:9F:20:1F:E0:68:4C:B8:79:6A:5B:A9:FA:4A:07:0C:92:8A
```
8. Click **Save**

**Expected Result:** Both fingerprints appear in the list

---

### 3️⃣ Verify Authorized Domains

**URL:** https://console.firebase.google.com/project/pulsemateconnect/authentication/settings

**Steps:**
1. Click **Authentication** → **Settings** tab
2. Scroll to **Authorized domains**
3. Verify these domains are present:
   - ✅ `localhost` (should already be there)
   - ✅ `pulsemateconnect.firebaseapp.com` (auto-added)

**Note:** Mobile apps don't need additional domains. This is primarily for web.

---

### 4️⃣ Generate Service Account Key

**URL:** https://console.firebase.google.com/project/pulsemateconnect/settings/serviceaccounts/adminsdk

**Steps:**
1. Click ⚙️ **Settings** → **Project settings**
2. Click **Service accounts** tab
3. Click **Generate new private key** button
4. Click **Generate key** in confirmation dialog
5. Save the downloaded JSON file securely

**⚠️ IMPORTANT:**
- This file contains sensitive credentials
- Never commit it to version control
- Store it securely
- You'll need to minify it for Render

**Minify the JSON:**
- Go to: https://codebeautify.org/jsonminifier
- Paste the JSON content
- Click "Minify JSON"
- Copy the result (single line, no spaces)

**Example minified format:**
```json
{"type":"service_account","project_id":"pulsemateconnect","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xyz@pulsemateconnect.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xyz%40pulsemateconnect.iam.gserviceaccount.com"}
```

---

## 🎯 Render Configuration

**URL:** https://dashboard.render.com

**Steps:**
1. Go to Render Dashboard
2. Select your **backend service**
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Enter:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** (paste the minified JSON from step 4 above)
6. Click **Save Changes**

**Expected Result:** 
- Backend service will automatically restart
- Check logs for "Firebase Admin SDK initialized"

---

## ✅ Verification Checklist

After completing all steps above:

- [ ] Phone authentication shows as "Enabled" in Firebase Console
- [ ] SHA-1 fingerprint added and visible
- [ ] SHA-256 fingerprint added and visible
- [ ] Service account JSON downloaded and minified
- [ ] Environment variable added to Render
- [ ] Backend logs show "Firebase Admin SDK initialized"
- [ ] No errors in backend logs

---

## 🔍 Verify Configuration

### Check Firebase Console:

**Authentication Enabled:**
```
Console → Authentication → Sign-in method
✓ Phone provider shows "Enabled"
```

**SHA Keys Added:**
```
Console → Project Settings → Your apps → Android
✓ Two fingerprints visible in the list
```

### Check Render Backend:

**Environment Variable:**
```
Render Dashboard → Your Service → Environment
✓ FIREBASE_SERVICE_ACCOUNT_JSON exists
✓ Value starts with {"type":"service_account"...
```

**Backend Logs:**
```
Render Dashboard → Your Service → Logs
✓ Look for: "Firebase Admin SDK initialized"
✗ No errors like "Firebase not configured"
```

---

## 🚨 Common Issues

### Issue: "Firebase not configured"
**Cause:** Service account JSON not set or invalid

**Fix:**
1. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` exists in Render
2. Check the JSON is properly minified (no newlines except in private_key)
3. Restart backend service manually
4. Check logs for specific error

### Issue: "App verification failed"
**Cause:** SHA fingerprints not added

**Fix:**
1. Verify both SHA-1 and SHA-256 are added
2. Make sure you used the **Play Store App Signing keys** (not debug keys)
3. Get keys from: Google Play Console → Setup → App integrity
4. Wait a few minutes after adding (Firebase needs to sync)

### Issue: "Invalid phone number"
**Cause:** Phone format incorrect

**Fix:**
- Use E.164 format: +91XXXXXXXXXX
- 10 digits for Indian numbers
- Always include +91 country code

---

## 📱 Testing After Configuration

1. **Local Testing:**
   ```bash
   npm start
   # Test on emulator
   ```

2. **What to Test:**
   - Enter phone number
   - Tap "Send OTP"
   - Check you receive SMS
   - Enter OTP
   - Verify login successful

3. **What to Check:**
   - Frontend logs (adb logcat)
   - Backend logs (Render dashboard)
   - Firebase Console → Authentication → Users (new user created)

---

## 📞 Support Resources

**Firebase Documentation:**
- https://firebase.google.com/docs/auth/android/phone-auth

**Firebase Console:**
- https://console.firebase.google.com/project/pulsemateconnect

**Firebase Status:**
- https://status.firebase.google.com

**Render Dashboard:**
- https://dashboard.render.com

---

## 🎯 Quick Links

| Task | URL |
|------|-----|
| **Enable Phone Auth** | https://console.firebase.google.com/project/pulsemateconnect/authentication/providers |
| **Add SHA Keys** | https://console.firebase.google.com/project/pulsemateconnect/settings/general |
| **Get Service Account** | https://console.firebase.google.com/project/pulsemateconnect/settings/serviceaccounts/adminsdk |
| **Minify JSON** | https://codebeautify.org/jsonminifier |
| **Render Environment** | https://dashboard.render.com |

---

## ⏱️ Estimated Time

- Enable Phone Auth: **2 minutes**
- Add SHA Keys: **3 minutes**
- Get Service Account: **5 minutes**
- Add to Render: **2 minutes**
- Verify & Test: **5 minutes**

**Total: ~15-20 minutes**

---

**Last Updated:** August 4, 2026  
**Version:** 1.0  
**Status:** Ready to Execute
