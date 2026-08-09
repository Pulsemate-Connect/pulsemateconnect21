# 🔑 Upload Original Keystore to New EAS Account

**Goal:** Upload keystore with SHA-1 `0B:84:89:11...` to your new EAS account

**Why:** This avoids Play Console rejection and enables direct app updates

---

## 📁 AVAILABLE KEYSTORE FILES

You have these keystore files:
```
1. c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks
2. c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks
3. c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.bak.jks
4. c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\android\app\pulsemate-release-key.keystore
```

**One of these should have SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`**

---

## 🎯 STEP-BY-STEP: Upload Keystore

### Step 1: Open Terminal
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
```

### Step 2: Run EAS Credentials
```bash
eas credentials
```

### Step 3: Navigate to Keystore Setup

You'll see interactive menus:

**Screen 1: Select Platform**
```
? Select platform ›
❯ Android
```
**Action:** Press Enter

**Screen 2: Select Build Profile**
```
? Which build profile do you want to configure? ›
❯ production
```
**Action:** Arrow down to select `production`, press Enter

**Screen 3: Main Menu**
```
What do you want to do? ›
❯ Keystore
```
**Action:** Press Enter

**Screen 4: Keystore Actions**
```
? Keystore ›
  View credentials
❯ Set up a new keystore
  Remove Keystore
```
**Action:** Arrow down to select `Set up a new keystore`, press Enter

**Screen 5: Upload or Generate**
```
? How would you like to set up your Keystore? ›
❯ Upload an existing keystore
  Generate new keystore
```
**Action:** Press Enter (select "Upload an existing keystore")

---

### Step 4: Provide Keystore File Path

**You'll be prompted:**
```
? Path to keystore file: 
```

**Type one of these paths:**
```
c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks
```

**OR**
```
c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks
```

**Press Enter**

---

### Step 5: Provide Keystore Password

```
? Keystore password: 
```

**Type:** [Your keystore password]  
**Press Enter**

**⚠️ CRITICAL:** You MUST know this password! Check:
- Password manager
- Old documentation
- Email/notes
- Previous team members

---

### Step 6: Provide Key Alias

```
? Key alias: 
```

**Type exactly:**
```
f1a185ee3a5ba7802fd6698297601ca8
```

**Press Enter**

---

### Step 7: Provide Key Password

```
? Key password: 
```

**Type:** [Your key password]  
**Press Enter**

*Note: Key password might be the same as keystore password*

---

### Step 8: Verify Upload

EAS will upload and process the keystore. You'll see:

```
✔ Keystore uploaded successfully
```

Then verify the SHA-1:

**Navigate:** Keystore menu → View credentials

**Should show:**
```
Keystore Credentials [new-id]
  SHA1 Fingerprint:   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F ✅
  SHA256 Fingerprint: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6 ✅
```

**VERIFY SHA-1 MATCHES!**

---

### Step 9: Exit
Select "Go back" until you exit

---

## 🚀 REBUILD WITH CORRECT KEYSTORE

After uploading the keystore:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Increment version code first
# Edit app.json: change versionCode to 82

# Rebuild
eas build --platform android --profile production --clear-cache
```

**Watch for:**
```
√ Using Keystore from configuration: [keystore-id]
```

Verify the SHA-1 matches `0B:84:89:11...`

---

## ✅ AFTER REBUILD

### Upload to Play Console
1. Download new AAB
2. Go to: https://play.google.com/console
3. Upload to Production
4. Should be **ACCEPTED** ✅ (matches expected SHA-1)
5. No need for Play App Signing!

---

## 🚨 IF YOU DON'T KNOW PASSWORD

### Option A: Try Common Passwords
- `android`
- `123456`
- Your usual password
- Project name variations

### Option B: Check Keystore Files

Try all keystore files with `keytool` to see which one works:

```bash
# Try first keystore
keytool -list -v -keystore "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks"
# Enter password when prompted

# If fails, try second
keytool -list -v -keystore "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks"

# Etc...
```

**Look for SHA-1: `0B:84:89:11...` in the output**

### Option C: Use Play App Signing

If you cannot get the password:
1. Use the auto-generated keystore (`fWuNBo7oSr`)
2. Download the AAB from previous build
3. Enable Play App Signing in Play Console
4. Upload AAB (will be accepted)

---

## 📊 COMPARISON

### Current Build (Auto-generated keystore):
```
Keystore ID: fWuNBo7oSr
SHA-1:       [Different from Play Console]
Result:      ❌ Play will reject OR ✅ Works with Play App Signing
```

### After Uploading Original Keystore:
```
Keystore ID: [New ID in your account]
SHA-1:       0B:84:89:11:44:B1:B8:DB... (matches Play Console)
Result:      ✅ Play will accept directly
```

---

## 🎯 RECOMMENDED APPROACH

### If You Have Keystore Password:
1. ✅ Upload original keystore (follow steps above)
2. ✅ Rebuild with correct keystore
3. ✅ Upload to Play Console
4. ✅ Direct acceptance

### If You DON'T Have Password:
1. ✅ Use existing build with auto-generated keystore
2. ✅ Enable Play App Signing in Play Console
3. ✅ Upload to Play Console
4. ✅ Will be accepted

**Both approaches work! Choose based on whether you have the password.**

---

## 📝 SUMMARY

**To upload the original keystore:**
1. Run: `eas credentials` in YOUR terminal
2. Navigate: Android → production → Keystore → Set up new → Upload existing
3. Provide: File path, keystore password, key alias, key password
4. Verify: SHA-1 matches `0B:84:89:11...`
5. Rebuild: `eas build --platform android --profile production`
6. Upload to Play Console

---

**Next command to run in YOUR terminal:**
```bash
eas credentials
```

Then follow the steps above! 🔑
