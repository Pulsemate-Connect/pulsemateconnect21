# 🔧 Play Store Signing Issue - Fix Steps

## Problem
Your AAB is signed with a different certificate than Play Console expects:
- **Expected SHA1:** `46:00:0C:3E:1A:D5:79:6F:FF:1E:61:FC:EC:ED:8E:61:21:FF:15:A7`
- **Actual SHA1:** `67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D`

---

## Solution 1: Accept New Certificate in Play Console (EASIEST)

Since you're having signing issues, the easiest solution is to register the new certificate:

### Step 1: Go to App Integrity Page
1. In Play Console, click on **"App integrity"** in the left sidebar (under Testing → Pre-registration → App integrity)
2. Or go to: **Setup → App signing**

### Step 2: Request Upload Key Reset
1. Look for **"Request upload key reset"** link or button
2. Click it
3. Follow the instructions to register your new certificate
4. You'll need to provide the new certificate details:
   - **SHA1:** `67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D`

### Step 3: Alternative - Use App Signing by Google Play
1. In **App integrity** page, look for **"Use Google Play App Signing"**
2. Click **"Continue"**
3. Choose **"Let Google create and manage my app signing key"**
4. This will accept your new certificate automatically

### Step 4: Upload AAB Again
Once the certificate is accepted:
1. Go back to **Internal testing → Create release**
2. Upload your AAB: `application-bab3d08d-6d67-488e-8af2-38300be0e88e (3).aab`
3. This time it should work!

---

## Solution 2: Use Original Keystore (If You Have It)

If you have the original `.jks` or `.keystore` file that matches SHA1 `46:00:0C:3E:1A:D5:79:6F:FF:1E:61:FC:EC:ED:8E:61:21:FF:15:A7`:

### Step 1: Configure EAS to Use Local Keystore

Update `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease",
        "credentialsSource": "local"
      }
    }
  }
}
```

### Step 2: Place Keystore File
```bash
# Create credentials directory
mkdir credentials\android

# Copy your keystore
copy path\to\your\old.keystore credentials\android\keystore.jks
```

### Step 3: Update credentials.json
```json
{
  "android": {
    "keystore": {
      "keystorePath": "credentials/android/keystore.jks",
      "keystorePassword": "YOUR_KEYSTORE_PASSWORD",
      "keyAlias": "YOUR_KEY_ALIAS",
      "keyPassword": "YOUR_KEY_PASSWORD"
    }
  }
}
```

### Step 4: Rebuild
```bash
eas build --platform android --profile production
```

---

## Fix Advertising ID Warning

Add this to `app.json` plugins:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": false
          }
        }
      ]
    ]
  }
}
```

And install:
```bash
npx expo install expo-build-properties
```

Then add to `app.json`:
```json
{
  "android": {
    "permissions": [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE",
      "android.permission.POST_NOTIFICATIONS",
      "com.google.android.gms.permission.AD_ID"
    ]
  }
}
```

---

## RECOMMENDED IMMEDIATE STEPS:

### For Now (Quick Fix):
1. **Go to Play Console → App integrity**
2. **Click "Request upload key reset"** or **"Use Google Play App Signing"**
3. **Accept the new certificate** (SHA1: 67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D)
4. **Upload your AAB again**

This is the fastest way to get your app uploaded!

---

## Current Status:
- ✅ Version code updated to 4
- ✅ AAB file ready
- ⚠️ Signing key mismatch blocking upload
- ⚠️ AD_ID permission warning (non-blocking)
- ⚠️ Device support warning (non-blocking)

**Once signing is fixed, you're ready to publish!** 🚀
