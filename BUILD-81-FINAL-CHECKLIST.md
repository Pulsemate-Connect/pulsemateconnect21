# ✅ BUILD 81 - Final Checklist

**Version:** 1.3.7 (Build 81)  
**Date:** August 7, 2026  
**Goal:** Build AAB with correct keystore for Play Store  

---

## 🔧 FIXES APPLIED

### 1. Gradle Configuration Fixed ✅
- **File:** `android/app/build.gradle`
- **Issue:** Release builds were using debug keystore
- **Fix:** Removed `signingConfig signingConfigs.debug` from release block
- **Result:** EAS will now inject the correct production keystore

### 2. Version Code Incremented ✅
- **Changed:** `versionCode: 80` → `versionCode: 81`
- **File:** `app.json`
- **Reason:** New build with corrected signing configuration

### 3. EAS Configuration Verified ✅
- **File:** `eas.json`
- **Setting:** `credentialsSource: "remote"` ✅
- **Setting:** `withoutCredentials: false` ✅
- **Profile:** `production` ✅

---

## 🎯 REQUIRED KEYSTORE

### Target Keystore (Must Use):
```
ID:      yKf5TaJ1Kx
SHA-1:   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
SHA-256: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
Status:  Exists in EAS account ✅
Matches: Google Play Console requirements ✅
```

### Wrong Keystore (Do NOT Use):
```
ID:      8Xpt79mt7A
SHA-1:   56:39:95:C3:CD:73:07:E4:93:CF:75:2A:F4:37:FD:2E:09:2C:B2:61
Used by: Build 79, Build 80
Result:  Play Console rejected ❌
```

---

## 📋 PRE-BUILD CHECKLIST

Complete these steps BEFORE building:

### Step 1: Configure EAS Keystore ⚠️ CRITICAL

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas credentials
```

**Interactive steps:**
- [ ] Select: `Android`
- [ ] Select: `production` profile
- [ ] Select: `Keystore`
- [ ] Check current keystore ID
  - ✅ If shows `yKf5TaJ1Kx` → Perfect! Continue to Step 2
  - ❌ If shows `8Xpt79mt7A` → Select "Use a different Keystore" → Choose `yKf5TaJ1Kx`
- [ ] Verify SHA-1: `0B:84:89:11:44:B1:B8:DB...`

**STOP HERE if keystore is NOT `yKf5TaJ1Kx`!** Do not proceed to build until this is correct.

---

### Step 2: Verify Build Configuration

- [x] **Gradle fixed:** ✅ `signingConfig` removed from release block
- [x] **Version incremented:** ✅ `versionCode: 81`
- [x] **Package name:** ✅ `in.pulsemateconnect.patient`
- [x] **EAS config:** ✅ `credentialsSource: "remote"`
- [ ] **Keystore verified:** Confirmed `yKf5TaJ1Kx` in Step 1

---

### Step 3: Dry-Run Test (Recommended)

Before the real build, verify which keystore EAS will use:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Start build (we'll cancel after credential selection)
eas build --platform android --profile production
```

**Watch for this line:**
```
√ Using Keystore from configuration: Build Credentials yKf5TaJ1Kx (default)
```

**Action:**
- ✅ If shows `yKf5TaJ1Kx` → Press Ctrl+C to cancel, proceed to Step 4
- ❌ If shows `8Xpt79mt7A` or different → Press Ctrl+C, go back to Step 1

---

## 🚀 BUILD COMMAND

After completing all checklist items above:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Build production AAB with cache cleared
eas build --platform android --profile production --clear-cache
```

**Why `--clear-cache`?**
- Ensures fresh build
- No cached credentials from previous builds
- Forces EAS to use latest keystore configuration

---

## 👀 WHAT TO WATCH DURING BUILD

### Expected Output (Correct):

```
√ Logged in as pulsemateconnect
√ Using remote Android credentials (Expo server)
√ Using Keystore from configuration: Build Credentials yKf5TaJ1Kx (default)
√ Compressing project files...
√ Uploaded to EAS
√ Build started
```

✅ **KEY LINE:** `Using Keystore from configuration: Build Credentials yKf5TaJ1Kx`

---

### Wrong Output (Incorrect):

```
√ Using Keystore from configuration: Build Credentials 8Xpt79mt7A (default)
```

❌ **WRONG KEYSTORE!** If you see this:
1. Press Ctrl+C immediately
2. Go back to Step 1 of checklist
3. Set correct keystore
4. Try build again

---

## ⏱️ BUILD TIMELINE

Expected build time: **8-12 minutes**

```
00:00 - Uploading project files (30-60 seconds)
01:00 - Installing dependencies (2-3 minutes)
03:00 - Running Gradle build (4-6 minutes)
08:00 - Signing AAB with keystore (1 minute)
09:00 - Uploading artifacts (1-2 minutes)
10:00 - Build complete! ✅
```

---

## ✅ BUILD SUCCESS INDICATORS

After build completes, verify:

### 1. Build Log Shows Correct Keystore
```
✅ "Using Keystore from configuration: Build Credentials yKf5TaJ1Kx"
```

### 2. Build Status: Success
```
✅ Build finished
🤖 Android app: https://expo.dev/artifacts/eas/[hash].aab
```

### 3. Download AAB
- Click the download link
- Save as: `pulsemateconnect-v1.3.7-build-81.aab`
- File size: ~90-100 MB (typical)

### 4. Verify Build Details (Optional)
```bash
# View build details
eas build:view [build-id]

# Should show:
# - Build ID: [unique ID]
# - Platform: Android
# - Profile: production
# - Status: Finished
# - Credentials: yKf5TaJ1Kx ✅
```

---

## 📤 UPLOAD TO PLAY CONSOLE

After downloading AAB:

### Step 1: Go to Play Console
1. URL: https://play.google.com/console
2. Select: **PulseMate Connect**
3. Navigate: **Production** → **Create new release**

### Step 2: Upload AAB
1. Click: **Upload** or drag-and-drop AAB file
2. File: `pulsemateconnect-v1.3.7-build-81.aab`
3. Wait for upload to complete (1-2 minutes)

### Step 3: Check for Errors
**Expected (Success):**
```
✅ AAB uploaded successfully
✅ Version code: 81
✅ Signature verified
✅ No errors or warnings
```

**If Error Occurs:**
```
❌ "Your Android App Bundle is signed with the wrong key"
❌ Expected SHA-1: 0B:84:89:11...
❌ Received SHA-1: [different value]
```

**Action if error:**
- Check build logs to confirm it used `yKf5TaJ1Kx`
- If used wrong keystore, rebuild with correct one
- If used correct keystore but still error, enable Play App Signing (see below)

### Step 4: Fill Release Information
```
Release name: Version 1.3.7 (Build 81)

What's new:
• Fixed authentication signing configuration
• Enhanced security with proper keystore management
• Updated Android SDK to API 34
• Performance improvements and bug fixes
```

### Step 5: Submit for Review
1. Click: **Review release**
2. Verify all details
3. Click: **Start rollout to Production**
4. Confirm rollout

---

## 🚨 IF UPLOAD STILL FAILS

### Option A: Enable Play App Signing (Recommended)

If Play Console still rejects the AAB even with correct keystore:

1. Go to: **Setup** → **App integrity** → **App signing**
2. Click: **"Use Play App Signing"**
3. Select: **"Let Google create and manage my app signing key"**
4. Confirm enrollment
5. **Retry upload of Build 81** (same AAB, no rebuild needed)
6. Should be accepted now! ✅

**Why this works:**
- Your keystore becomes the "upload key" (can be anything)
- Google creates new "app signing key" for users
- No more keystore mismatch issues
- Can reset upload key if needed

---

### Option B: Verify Keystore File Locally (Advanced)

If you want to manually verify the keystore:

```bash
# Check SHA-1 of local keystore files
keytool -list -v -keystore "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks"

# Or check the other one
keytool -list -v -keystore "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks"

# Should show SHA-1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
```

If local keystore matches, upload it to EAS:
```bash
eas credentials
# Select: Android → production → Keystore
# Select: Set up a new keystore → Upload existing keystore
# Browse to correct .jks file
# Enter passwords
```

---

## 📊 BUILD COMPARISON

| Build | Version Code | Keystore | SHA-1 | Result |
|-------|-------------|----------|-------|--------|
| 78 | 78 | Unknown | Unknown | APK for testing ✅ |
| 79 | 79 | 8Xpt79mt7A | 56:39:95:C3... | Play rejected ❌ |
| 80 | 80 | 8Xpt79mt7A | 56:39:95:C3... | Play rejected ❌ |
| **81** | **81** | **yKf5TaJ1Kx** | **0B:84:89:11...** | **Should work! ✅** |

---

## ✅ FINAL PRE-BUILD COMMAND

**Copy and paste this command sequence:**

```bash
# Navigate to project
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# FIRST: Verify keystore (interactive)
eas credentials

# After confirming yKf5TaJ1Kx is selected, run:
eas build --platform android --profile production --clear-cache

# Watch for: "Using Keystore from configuration: Build Credentials yKf5TaJ1Kx"
# If correct, let build continue
# If wrong, press Ctrl+C and fix credentials
```

---

## 🎯 SUCCESS CRITERIA

Build 81 is successful when:

- [x] Version code: 81
- [x] Gradle config: No debug signing in release
- [ ] EAS keystore: yKf5TaJ1Kx (verify in Step 1)
- [ ] Build output: Shows yKf5TaJ1Kx in logs
- [ ] Build status: Finished successfully
- [ ] AAB downloaded: ~90-100 MB file
- [ ] Play Console: AAB accepted
- [ ] Release created: Version 1.3.7 (Build 81)
- [ ] Status: Pending publication

---

## 📞 READY TO BUILD?

Before running the build command:

1. ✅ Have you run `eas credentials` and verified keystore is `yKf5TaJ1Kx`?
2. ✅ Have you confirmed SHA-1: `0B:84:89:11:44:B1:B8:DB...`?
3. ✅ Are you ready to wait 8-12 minutes for build to complete?

**If all ✅, run the build command above!** 🚀

**If any ❌, complete checklist first!** ⚠️
