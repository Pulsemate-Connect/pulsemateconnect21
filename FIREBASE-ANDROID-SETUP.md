# Firebase Android App Registration Guide

## Overview
You need to register your Android app in Firebase Console to get the `google-services.json` file required for Play Store deployment.

---

## 📋 Prerequisites
- Firebase project: **pulsemateconnect** (already exists)
- Android package name: **com.pulsemate.app**
- Project number: **157620382332**

---

## 🚀 Step-by-Step Registration

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com
2. Sign in with your Google account
3. Select the **pulsemateconnect** project

### Step 2: Add Android App
1. Click the gear icon (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Android icon** (robot) or **"Add app"** → **"Android"**

### Step 3: Register App Details
Fill in the registration form:

```
Android package name: com.pulsemate.app
App nickname (optional): PulseMate
Debug signing certificate SHA-1 (optional): [Leave blank for now - we'll add it later]
```

Click **"Register app"**

### Step 4: Download google-services.json
1. Firebase will generate the `google-services.json` file
2. Click **"Download google-services.json"**
3. Save it to your computer

### Step 5: Place the File in Your Project
Move the downloaded file to:
```
c:\Users\shubh\Desktop\pulsemate123\PulseMateApp\google-services.json
```

**IMPORTANT:** Replace the template file, don't rename it. The exact name must be `google-services.json`.

### Step 6: Copy the Android App ID
1. Open the downloaded `google-services.json` file in a text editor
2. Find the `"mobilesdk_app_id"` field (around line 7)
3. It will look like: `"1:157620382332:android:XXXXXXXXXXXXXXXX"`
4. Copy this entire value

### Step 7: Update firebase.js
1. Open: `PulseMateApp\src\config\firebase.js`
2. Find line 29 (the `appId` field)
3. Replace:
   ```javascript
   appId: '1:157620382332:web:e4156f49d8616a4ee6b7f9',
   ```
   With:
   ```javascript
   appId: '1:157620382332:android:XXXXXXXXXXXXXXXX',  // ← paste your Android App ID here
   ```

---

## ✅ Verification Checklist

After completing the steps above:

- [ ] `google-services.json` exists in `PulseMateApp/` directory
- [ ] File is named exactly `google-services.json` (not .template or .txt)
- [ ] `package_name` in the file is `com.pulsemate.app`
- [ ] `mobilesdk_app_id` starts with `1:157620382332:android:`
- [ ] `firebase.js` line 29 has been updated with the Android App ID
- [ ] The Android App ID matches the one in `google-services.json`

---

## 🔐 Next Step: Add SHA-1 Fingerprint

After registering the app, you need to add the SHA-1 fingerprint from your release keystore.

### Why SHA-1 is Required
- Enables Firebase Phone Authentication for Android
- Required for Google Sign-In (if you add it later)
- Security measure to prevent unauthorized app access

### How to Get SHA-1
1. Open terminal in `PulseMateApp/` directory
2. Run:
   ```bash
   npx eas credentials --platform android
   ```
3. EAS will show your keystore details including SHA-1 fingerprint
4. Copy the SHA-1 hash (looks like: `AA:BB:CC:DD:EE:FF:...`)

### How to Add SHA-1 to Firebase
1. Go back to Firebase Console → Project Settings
2. Scroll to **"Your apps"** → **Android app (com.pulsemate.app)**
3. Click **"Add fingerprint"**
4. Paste the SHA-1 hash
5. Click **"Save"**

---

## 🔒 Security: Restrict API Key

After registration, restrict your Firebase API key to prevent unauthorized usage:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select project: **pulsemateconnect**
3. Find API key: **AIzaSyDrZ9d0zKBLI_Pm-c9o1DAV5q4ldE1I9Nw**
4. Click **"Edit"** (pencil icon)
5. Under **"Application restrictions"**:
   - Select **"Android apps"**
   - Click **"Add an item"**
   - Package name: `com.pulsemate.app`
   - SHA-1 fingerprint: [paste the SHA-1 from EAS]
6. Click **"Save"**

---

## 🐛 Troubleshooting

### Error: "Package name already exists"
- The package `com.pulsemate.app` is already registered in another Firebase project
- Use a different package name or delete the app from the other project

### Error: "google-services.json not found"
- File must be in `PulseMateApp/` root directory (same level as `app.json`)
- Check file name is exactly `google-services.json` (case-sensitive)

### Error: "Invalid mobilesdk_app_id"
- The App ID must start with `1:157620382332:android:`
- Make sure you copied the Android App ID, not the Web App ID

### Phone Auth Not Working
- Verify SHA-1 fingerprint is added in Firebase Console
- Check that API key is properly restricted
- Ensure `google-services.json` package name matches `app.json` (com.pulsemate.app)

---

## 📝 Files Modified After This Setup

1. **New file:** `PulseMateApp/google-services.json`
2. **Modified:** `PulseMateApp/src/config/firebase.js` (line 29: appId)

---

## ⏭️ After Completing This Step

Once you have:
1. ✅ Placed `google-services.json` in the project
2. ✅ Updated `firebase.js` with Android App ID
3. ✅ Added SHA-1 fingerprint to Firebase Console
4. ✅ Restricted API key in Google Cloud Console

You can proceed to:
- **Next:** Run `npx eas init` to set up EAS project ID
- **Then:** Build production AAB with `npx eas build --platform android --profile production`

See `PLAY-STORE-SETUP.md` for the complete workflow.
