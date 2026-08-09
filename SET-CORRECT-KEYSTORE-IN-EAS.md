# 🔑 Set Correct Keystore in EAS

**Goal:** Ensure EAS uses keystore `yKf5TaJ1Kx` (SHA-1: 0B:84:89:11...) for production builds

**Status:** 🟡 Configuration needed

---

## ✅ CONFIRMED: Keystore Exists in EAS

You have verified that the correct keystore already exists in your Expo account:

```
Configuration: Build Credentials yKf5TaJ1Kx
Type:          JKS
Key Alias:     f1a185ee3a5ba7802fd6698297601ca8
SHA1:          0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F ✅
SHA256:        83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6 ✅
Updated:       4 days ago
```

This matches what Google Play Console expects! ✅

---

## 🎯 TASK: Set as Default Keystore

You need to configure EAS to use `yKf5TaJ1Kx` as the default keystore for production builds.

### Method 1: Via EAS Credentials CLI (Interactive)

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Run EAS credentials configuration
eas credentials
```

**Interactive steps:**

1. **Select platform:**
   - Choose: `Android`

2. **Select build profile:**
   - Choose: `production`

3. **View current keystore:**
   - Choose: `Keystore`
   - Choose: `View credentials`
   
   **Check current keystore ID:**
   - If it shows `yKf5TaJ1Kx` → ✅ Already correct! Skip to Method 3
   - If it shows `8Xpt79mt7A` or different ID → ❌ Need to change

4. **Set correct keystore:**
   - Go back to keystore menu
   - Choose: `Use a different Keystore`
   - Choose: `Select an existing Keystore`
   - Choose: `yKf5TaJ1Kx` (the one with SHA-1: 0B:84:89:11...)
   - Confirm selection

5. **Verify change:**
   - Choose: `View credentials` again
   - Verify it now shows `yKf5TaJ1Kx`
   - Verify SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`

---

### Method 2: Via expo.dev Dashboard (Alternative)

If CLI doesn't work, use the web dashboard:

1. **Go to Expo Dashboard:**
   - URL: https://expo.dev/accounts/pulsemateconnect/projects/pulsemate-app/credentials

2. **Navigate to Android Credentials:**
   - Click: `Android` tab
   - Select: `Production` profile

3. **View Current Keystore:**
   - Look for "Keystore" section
   - Check current keystore ID and SHA-1

4. **Change Keystore (if needed):**
   - Click: `Edit` or `Change keystore`
   - Select: `yKf5TaJ1Kx` from dropdown
   - Confirm: `Save changes`

5. **Verify:**
   - Refresh page
   - Verify keystore shows `yKf5TaJ1Kx`
   - Verify SHA-1: `0B:84:89:11...`

---

### Method 3: Test Which Keystore EAS Will Use (Dry Run)

Before building, verify which keystore EAS will use:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Start build but cancel after credential selection
eas build --platform android --profile production
```

**Watch for this output:**

```
√ Using remote Android credentials (Expo server)
√ Using Keystore from configuration: Build Credentials yKf5TaJ1Kx (default)
```

✅ **If you see `yKf5TaJ1Kx`** → Perfect! Press Ctrl+C to cancel, then proceed with real build  
❌ **If you see `8Xpt79mt7A` or different ID** → Press Ctrl+C, go back to Method 1 or 2

---

## 🔍 WHY IS THIS NEEDED?

**The Problem:**
- Previous Build #79 and #80 used keystore `8Xpt79mt7A` (wrong SHA-1: 56:39:95:C3...)
- Your EAS account has **multiple keystores**:
  - `yKf5TaJ1Kx` - The correct one (SHA-1: 0B:84:89:11...) ✅
  - `8Xpt79mt7A` - The wrong one (SHA-1: 56:39:95:C3...) ❌

**The Solution:**
- Explicitly tell EAS to use `yKf5TaJ1Kx` for production builds
- This ensures future builds use the correct certificate

---

## 📋 PRE-BUILD CHECKLIST

Before running the production build:

- [ ] **Gradle fixed:** `android/app/build.gradle` does NOT have `signingConfig signingConfigs.debug` in release block ✅ (already fixed)
- [ ] **EAS config:** `eas.json` has `"credentialsSource": "remote"` ✅ (already set)
- [ ] **Keystore selected:** EAS credentials set to use `yKf5TaJ1Kx` (do this now)
- [ ] **Verified keystore:** Run dry-run build to confirm it uses `yKf5TaJ1Kx`
- [ ] **Version incremented:** Change `versionCode` to 81 in `app.json`

---

## 🚀 STEP-BY-STEP: COMPLETE WORKFLOW

### Step 1: Set Correct Keystore in EAS

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas credentials
```

Follow interactive prompts:
1. Select: `Android`
2. Select: `production`
3. Select: `Keystore`
4. Select: `Use a different Keystore` (if needed)
5. Select: `yKf5TaJ1Kx`
6. Confirm

### Step 2: Verify Keystore Selection

```bash
# Check which keystore will be used
eas build --platform android --profile production

# Look for output:
# "Using Keystore from configuration: Build Credentials yKf5TaJ1Kx"

# If correct, press Ctrl+C to cancel
# If wrong, go back to Step 1
```

### Step 3: Increment Version Code

Edit `app.json`:
```json
{
  "expo": {
    "android": {
      "versionCode": 81  // Changed from 80
    }
  }
}
```

### Step 4: Build Production AAB

```bash
# Now build for real
eas build --platform android --profile production --clear-cache
```

**Note:** `--clear-cache` ensures a fresh build with no cached credentials

### Step 5: Monitor Build Output

Watch for these lines:
```
√ Using remote Android credentials (Expo server)
√ Using Keystore from configuration: Build Credentials yKf5TaJ1Kx (default)
```

✅ If you see `yKf5TaJ1Kx` → Continue build  
❌ If you see different ID → Cancel and fix

### Step 6: Download and Verify AAB

After build completes:
```bash
# Download AAB
# URL: https://expo.dev/artifacts/eas/[hash].aab

# Verify signature (optional - requires bundletool)
# Should show SHA-1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
```

### Step 7: Upload to Play Console

1. Go to: https://play.google.com/console
2. Select: **PulseMate Connect**
3. Navigate: **Production** → **Create new release**
4. Upload: AAB file (Build 81)
5. Should be accepted! ✅

---

## 🚨 TROUBLESHOOTING

### Issue: EAS Still Shows Wrong Keystore ID

**Symptoms:**
- Dry-run build shows: `Using Keystore: 8Xpt79mt7A`
- Not `yKf5TaJ1Kx`

**Solution A - Set via CLI:**
```bash
eas credentials

# Navigate: Android → production → Keystore
# Select: Use a different Keystore
# Select: yKf5TaJ1Kx
# Confirm
```

**Solution B - Remove Wrong Keystore:**
```bash
eas credentials

# Navigate: Android → production → Keystore
# Select: Remove Keystore (removes 8Xpt79mt7A)
# Then: Set up a new keystore
# Then: Select an existing Keystore
# Select: yKf5TaJ1Kx
```

**Solution C - Check Default Keystore:**
```bash
# List all keystores
eas credentials

# Navigate: Android → production → Keystore
# Select: View all keystores
# Check which one is marked as "default"
# Set yKf5TaJ1Kx as default if not already
```

### Issue: Can't Find yKf5TaJ1Kx in List

**Symptoms:**
- `eas credentials` doesn't show `yKf5TaJ1Kx` as an option
- Only shows `8Xpt79mt7A`

**Solution - Upload Keystore:**
You need to upload the keystore file to EAS:

```bash
eas credentials

# Navigate: Android → production → Keystore
# Select: Set up a new keystore
# Select: Upload an existing keystore
# Browse to one of these files:
#   - c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks
#   - c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks
#   - c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\android\app\pulsemateconnect.jks
```

**You'll need:**
- Keystore password (you must know this)
- Key alias: `f1a185ee3a5ba7802fd6698297601ca8`
- Key password (you must know this)

After upload, verify SHA-1 matches: `0B:84:89:11:44:B1:B8:DB...`

### Issue: Don't Know Keystore Password

**If keystore is already in EAS:**
- Password is managed by EAS automatically
- No need to know password
- Just select `yKf5TaJ1Kx` from existing keystores

**If uploading new keystore:**
- You MUST know the password
- Check these locations for password:
  - Old build logs
  - Previous documentation
  - Password manager
  - Team member who created it

**If password is lost:**
- Cannot upload keystore
- Cannot use that keystore
- Must create new app in Play Store (last resort)

---

## ✅ SUCCESS INDICATORS

You'll know it's configured correctly when:

1. ✅ `eas credentials` shows keystore `yKf5TaJ1Kx` for production profile
2. ✅ SHA-1 fingerprint: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
3. ✅ Build output shows: `Using Keystore from configuration: Build Credentials yKf5TaJ1Kx`
4. ✅ No errors during build
5. ✅ AAB signature matches expected SHA-1
6. ✅ Play Console accepts AAB upload
7. ✅ No "wrong key" error

---

## 📊 EXPECTED vs ACTUAL

### What Google Play Expects:
```
SHA-1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
```

### What Your Keystore Has (yKf5TaJ1Kx):
```
SHA-1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
```

✅ **PERFECT MATCH!** This is the correct keystore to use.

### What Previous Builds Used (8Xpt79mt7A):
```
SHA-1: 56:39:95:C3:CD:73:07:E4:93:CF:75:2A:F4:37:FD:2E:09:2C:B2:61
```

❌ **MISMATCH!** This is why uploads were rejected.

---

## 🎯 NEXT ACTION

**Run this command now:**

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas credentials
```

Then:
1. Select: `Android` → `production` → `Keystore`
2. Check if current keystore is `yKf5TaJ1Kx`
3. If not, select `Use a different Keystore` → Choose `yKf5TaJ1Kx`
4. Verify SHA-1: `0B:84:89:11:44:B1:B8:DB...`
5. Exit credentials menu

**After that, you're ready to build Build #81!** 🚀
