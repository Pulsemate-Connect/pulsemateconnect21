# 🔧 Fix: Download Updated google-services.json from Firebase

## ❌ PROBLEM: auth/argument-error in Production

The error you're seeing is because `google-services.json` is **OUTDATED**. It only contains the old SHA-1 fingerprint, NOT your production keystore's SHA-1.

**Current SHA-1 in google-services.json:**
```
5e8f16062ea3cd2c4a0d547876baa6f38cabf625
```

**Required SHA-1 (Production Keystore):**
```
0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
```

---

## ✅ SOLUTION: Download Fresh google-services.json

### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general

### Step 2: Find Your Android App
Scroll down to **"Your apps"** section and find:
- **Package name:** `in.pulsemateconnect.patient`
- **App nickname:** PulseMate Connect (or similar)

### Step 3: Download Updated google-services.json
1. Click on your Android app card
2. You'll see a **"Download google-services.json"** button
3. Click it to download the **UPDATED** file (it now includes your production SHA fingerprints)

### Step 4: Replace the Old File
Replace the file at:
```
android/app/google-services.json
```

With the newly downloaded file.

### Step 5: Verify the New File
Open the new `google-services.json` and check the `oauth_client` section. You should see **MULTIPLE** entries with different `certificate_hash` values, including:
- Your production keystore SHA-1: `0b8489114...`
- Possibly Expo Go SHA-1 (if you added it)

**Example of correct structure:**
```json
"oauth_client": [
  {
    "client_id": "xxx.apps.googleusercontent.com",
    "client_type": 1,
    "android_info": {
      "package_name": "in.pulsemateconnect.patient",
      "certificate_hash": "0b8489114...YOUR_PRODUCTION_SHA1..."
    }
  },
  {
    "client_id": "xxx.apps.googleusercontent.com",
    "client_type": 1,
    "android_info": {
      "package_name": "in.pulsemateconnect.patient",
      "certificate_hash": "5e8f16062...ANOTHER_SHA1_IF_ADDED..."
    }
  }
]
```

### Step 6: Build New AAB
After replacing `google-services.json`, build a new AAB:

```bash
npx eas build --platform android --profile production
```

Version will be automatically bumped to **71** (already configured in app.json).

### Step 7: Upload to Play Store and Test
1. Upload the new AAB (v71) to Play Store
2. Download from Play Store
3. Test OTP login

**SafetyNet will now work silently** because the app is signed with the keystore that matches the SHA-1 in `google-services.json`!

---

## 📌 Key Points

1. **Firebase Console generates a NEW google-services.json** every time you add/remove SHA fingerprints
2. You MUST download the updated file and replace the old one
3. Without the correct SHA-1 in google-services.json, SafetyNet attestation fails → auth/argument-error
4. This is NOT a code issue - it's a configuration issue

---

## 🎯 Expected Result After Fix

**Logs should show:**
```
LOG [Auth] 📱 Sending OTP to: +917022818878
LOG [Auth] 🔐 Using Native SafetyNet (React Native Firebase)
LOG [Auth] ✅ OTP sent successfully
LOG [Auth] 🔑 VerificationId: AM6...xyz
```

**NO MORE:**
- ❌ "Failed to initialize reCAPTCHA Enterprise config"
- ❌ "auth/argument-error"
- ❌ "Configuration error. Please try again."

---

## 🔍 Why This Happens

Firebase Phone Auth uses **Google Play Services SafetyNet** to verify your app is legitimate. SafetyNet checks:
1. Is the app signed with a registered keystore?
2. Does the SHA-1 match what's in `google-services.json`?

If NO → SafetyNet fails → auth/argument-error

If YES → SafetyNet passes → OTP sent successfully ✅

---

**Next:** Download the updated google-services.json from Firebase Console NOW!
