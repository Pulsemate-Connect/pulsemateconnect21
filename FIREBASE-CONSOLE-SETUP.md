# 🔥 FIREBASE CONSOLE CONFIGURATION (REQUIRED)

## ❌ CURRENT STATUS: APP CRASHES ON STARTUP

Your app is crashing because **Firebase Phone Authentication is NOT configured**.

---

## ✅ STEP-BY-STEP FIX (5 minutes)

### 1️⃣ Enable Phone Authentication

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/authentication/providers
2. Click **"Phone"** in the Sign-in providers list
3. Toggle **"Enable"**
4. Click **"Save"**

### 2️⃣ Add SHA Fingerprints

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Scroll to **"Your apps"** section
3. Find: **in.pulsemateconnect.patient** (Android app)
4. Click **"Add fingerprint"**
5. Add **SHA-1** (click "Add fingerprint" again for second one):
   ```
   E0:AC:76:86:0F:79:68:E8:3D:20:47:1D:EF:53:5D:39:D6:00:9E:E1
   ```
6. Add **SHA-256**:
   ```
   CE:A8:43:D7:9C:7C:2B:AC:B5:9A:23:F1:31:6A:46:9F:20:1F:E0:68:4C:B8:79:6A:5B:A9:FA:4A:07:0C:92:8A
   ```

### 3️⃣ Download NEW google-services.json

1. After adding SHA fingerprints, click **"Download google-services.json"**
2. Replace the file at:
   ```
   pulsemateconnect21/android/app/google-services.json
   ```

### 4️⃣ Rebuild the App

After configuration, rebuild:

```bash
cd android
gradlew clean
gradlew assembleRelease
```

Or with EAS (when builds available):
```bash
eas build --platform android --profile apk
```

---

## 🔐 BACKEND CONFIGURATION (Also Required)

### Get Firebase Service Account JSON

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Download the JSON file (it will look like `pulsemateconnect-firebase-adminsdk-xxxxx.json`)

### Add to Render Environment

1. Go to: https://dashboard.render.com/
2. Find your backend service
3. Go to **Environment** tab
4. Add new variable:
   - Key: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Value: (paste the ENTIRE JSON content from the file you downloaded)
5. Remove old variable:
   - Delete: `TWOFACTOR_API_KEY`
6. Click **"Save Changes"**

---

## ✅ VERIFICATION CHECKLIST

Before testing:
- [ ] Phone Authentication enabled in Firebase Console
- [ ] SHA-1 fingerprint added
- [ ] SHA-256 fingerprint added
- [ ] NEW google-services.json downloaded and replaced
- [ ] App rebuilt (clean build)
- [ ] Firebase Service Account JSON added to Render
- [ ] TWOFACTOR_API_KEY removed from Render
- [ ] Render redeployed with latest commit (e743406)

---

## 🚀 AFTER CONFIGURATION

Once all steps complete:
1. App will open successfully (no crash)
2. Login screen will show
3. Enter phone number → Firebase sends OTP
4. Enter OTP → Firebase verifies → Backend creates JWT
5. User logged in successfully

---

## 📊 CURRENT STATUS

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Mobile Code | ✅ Ready | None |
| Backend Code | ✅ Ready | None |
| Firebase Phone Auth | ❌ Disabled | Enable it |
| SHA Fingerprints | ❌ Missing | Add them |
| google-services.json | ⚠️ Outdated | Download new |
| Service Account JSON | ❌ Missing | Generate & add to Render |
| App Build | ⚠️ Old | Rebuild after config |

---

## ⏰ TIME ESTIMATE

- Firebase Console setup: **5 minutes**
- Render configuration: **2 minutes**
- App rebuild: **10-15 minutes** (local) or **wait until Sept 1** (EAS)

**Total: 17-22 minutes** (if building locally)

---

## 🔗 QUICK LINKS

- [Firebase Console - Phone Auth](https://console.firebase.google.com/project/pulsemateconnect/authentication/providers)
- [Firebase Console - App Settings](https://console.firebase.google.com/project/pulsemateconnect/settings/general)
- [Firebase Console - Service Accounts](https://console.firebase.google.com/project/pulsemateconnect/settings/serviceaccounts/adminsdk)
- [Render Dashboard](https://dashboard.render.com/)
- [GitHub Repository](https://github.com/Pulsemate-Connect/pulsemateconnect21)

---

## ❓ NEED HELP?

If you get stuck:
1. Check Firebase Console for error messages
2. Check Render logs for backend errors
3. Check app logs: `adb logcat | findstr "Firebase"`
4. Verify all SHA fingerprints are correct
5. Verify google-services.json is in correct location

---

**Last Updated:** August 4, 2026
**Current Commit:** e743406
**App Version:** 1.3.6 (Build 76)
