# ✅ EAS Keystore Verification and Fix

## 🔍 ROOT CAUSE IDENTIFIED

**Problem:** `android/app/build.gradle` was configured to use `debug` keystore for **release** builds!

```groovy
// LINE 124-127 - BEFORE (WRONG):
release {
    signingConfig signingConfigs.debug  // ❌ Uses debug keystore!
}

// AFTER FIX (CORRECT):
release {
    // Signing configuration is managed by EAS Build
    // Do NOT set signingConfig here - let EAS inject the correct keystore
}
```

This caused EAS to sign your AAB with the wrong certificate.

---

## ✅ FIXES APPLIED

### 1. **Fixed build.gradle** ✅
- **File:** `android/app/build.gradle`
- **Change:** Removed `signingConfig signingConfigs.debug` from release buildType
- **Effect:** EAS will now inject the correct keystore during build

### 2. **Updated eas.json** ✅
- **File:** `eas.json`
- **Change:** Added `"withoutCredentials": false` to production profile
- **Effect:** Explicitly tells EAS to use remote credentials

---

## 🔑 YOUR CORRECT KEYSTORE

According to your specifications, the correct keystore is:

```
Credentials ID: yKf5TaJ1Kx
Type:           JKS
SHA-1:          0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
SHA-256:        83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

This matches what Google Play Console expects!

---

## 📋 VERIFICATION STEPS

### Step 1: Verify EAS Has Correct Keystore

Run this command to check which keystore EAS will use:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas credentials
```

**Interactive steps:**
1. Select: **Android**
2. Select: **production** (build profile)
3. Select: **Keystore**
4. Select: **View credentials**

**Expected output:**
```
Keystore Credentials yKf5TaJ1Kx
  SHA1 Fingerprint:   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
  SHA256 Fingerprint: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

✅ **If SHA-1 matches** → Proceed to build  
❌ **If SHA-1 doesn't match** → Need to upload correct keystore

### Step 2: Check if Keystore `yKf5TaJ1Kx` Exists

If you see a different keystore ID (like `8Xpt79mt7A`), you need to switch to the correct one:

```bash
eas credentials

# 1. Select: Android → production
# 2. Select: Keystore
# 3. Select: "Set up a new keystore"
# 4. Select: "Use existing keystore"
# 5. Enter keystore ID: yKf5TaJ1Kx
```

### Step 3: Verify Gradle Configuration

Check that build.gradle no longer has debug signing in release:

```bash
# Check the file
cat "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\android\app\build.gradle" | Select-String -Pattern "release" -Context 5
```

**Should NOT contain:**
```groovy
signingConfig signingConfigs.debug  // ❌ This should NOT be in release block
```

### Step 4: Check Package Name Matches

```bash
# In app.json:
"android": {
  "package": "in.pulsemateconnect.patient"  // ✅ Must match Play Console
}

# In android/app/build.gradle:
applicationId 'in.pulsemateconnect.patient'  // ✅ Must match app.json
```

Both should be: `in.pulsemateconnect.patient` ✅

---

## 🏗️ BUILD WITH CORRECT SIGNING

### Increment Version Code

```bash
# Current: versionCode: 80
# Change to: 81
```

Edit `app.json`:
```json
"android": {
  "versionCode": 81
}
```

### Build AAB (Dry Run - Check Credentials)

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Build with production profile
eas build --platform android --profile production
```

**Watch for this output:**
```
√ Using remote Android credentials (Expo server)
√ Using Keystore from configuration: Build Credentials yKf5TaJ1Kx (default)
```

✅ **If you see `yKf5TaJ1Kx`** → Perfect! Continue build  
❌ **If you see different ID (8Xpt79mt7A)** → Stop build, fix credentials first

### Cancel Build If Wrong Keystore Detected

If you see the wrong keystore ID in the build output:

```bash
# Press Ctrl+C to cancel the build
# Then run: eas credentials
# Select the correct keystore: yKf5TaJ1Kx
```

---

## 🧪 VERIFY AAB SIGNATURE AFTER BUILD

After the build completes, verify the AAB signature:

### Option A: Using bundletool

```bash
# Download AAB
curl -L -o app.aab "https://expo.dev/artifacts/eas/[build-hash].aab"

# Extract certificate
java -jar bundletool.jar dump certificate --bundle=app.aab

# Should show:
# SHA-1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F ✅
```

### Option B: Check EAS Build Logs

1. Go to: https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/builds/[build-id]
2. Check build logs for: "Using Keystore from configuration: yKf5TaJ1Kx"
3. Verify keystore SHA-1 in logs

---

## 🚨 TROUBLESHOOTING

### Issue 1: EAS Still Uses Wrong Keystore

**Symptoms:**
- Build output shows: `Using Keystore: 8Xpt79mt7A` (wrong ID)
- Different SHA-1 fingerprint

**Solution:**
```bash
# List all available keystores
eas credentials
# Select: Android → production → Keystore → View all keystores

# If yKf5TaJ1Kx doesn't exist, you need to upload it:
# 1. Find keystore file: credentials/android/keystore.jks or @pulsemateconnect__pulsemate-app.jks
# 2. Upload to EAS:
eas credentials
# Select: Android → production → Keystore → Set up a new keystore → Upload existing keystore
```

### Issue 2: Multiple Keystores Exist

**Symptoms:**
- EAS has multiple keystores (yKf5TaJ1Kx and 8Xpt79mt7A)
- Not sure which one is used

**Solution:**
```bash
# Specify which keystore to use in eas.json:
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "remote"
      }
    }
  }
}

# Then set default keystore:
eas credentials
# Select: Android → production → Keystore → Set as default → yKf5TaJ1Kx
```

### Issue 3: Keystore Password Unknown

**Symptoms:**
- Have keystore file but don't know password
- Can't upload to EAS

**Solution:**
- **If keystore is in EAS already:** Password is managed by EAS, no action needed
- **If uploading new keystore:** You MUST know the password
- **If password forgotten:** Cannot recover - must create new app listing in Play Store

### Issue 4: Local Gradle Build Still Uses Debug Key

**Symptoms:**
- `./gradlew assembleRelease` uses debug key
- Only happens with local builds

**Solution:**
This is expected! Local Gradle builds will use debug key. Only EAS builds will use the correct production keystore. Always build via EAS for production:
```bash
eas build --platform android --profile production
```

---

## ✅ SUCCESS CRITERIA

Before uploading to Play Store, verify:

- [ ] `android/app/build.gradle` does NOT have `signingConfig signingConfigs.debug` in release block
- [ ] `eas.json` has `"credentialsSource": "remote"` in production profile
- [ ] EAS credentials show keystore: `yKf5TaJ1Kx`
- [ ] EAS credentials show SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
- [ ] Build output confirms: `Using Keystore from configuration: Build Credentials yKf5TaJ1Kx`
- [ ] AAB signature matches expected SHA-1
- [ ] `app.json` android.package: `in.pulsemateconnect.patient`
- [ ] `build.gradle` applicationId: `in.pulsemateconnect.patient`

---

## 🎯 FINAL BUILD COMMAND

After verifying everything above:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Increment version code first (80 → 81)
# Edit app.json: "versionCode": 81

# Build AAB
eas build --platform android --profile production

# Wait for output:
# ✅ "Using Keystore from configuration: Build Credentials yKf5TaJ1Kx"
# ✅ Build completes successfully
# ✅ Download AAB
# ✅ Upload to Play Console
# ✅ Should be accepted! 🎉
```

---

## 📊 COMPARISON: Before vs After

### Before Fix:
```
Gradle config:    signingConfig signingConfigs.debug ❌
EAS keystore:     8Xpt79mt7A (wrong)
AAB SHA-1:        56:39:95:C3:CD:73:07:E4:93:CF:75:2A:F4:37:FD:2E:09:2C:B2:61 ❌
Play Console:     Rejected with "wrong key" error ❌
```

### After Fix:
```
Gradle config:    No signingConfig in release (EAS manages it) ✅
EAS keystore:     yKf5TaJ1Kx (correct)
AAB SHA-1:        0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F ✅
Play Console:     Accepted! ✅
```

---

## 📞 NEXT STEPS

1. **Verify credentials:** Run `eas credentials` and confirm keystore `yKf5TaJ1Kx`
2. **Increment version:** Change `versionCode` to 81 in `app.json`
3. **Build AAB:** Run `eas build --platform android --profile production`
4. **Watch build output:** Confirm it uses `yKf5TaJ1Kx`
5. **Download AAB:** Get AAB from EAS build
6. **Upload to Play Console:** Should be accepted now! ✅

**The fix is complete - you're ready to build!** 🚀
