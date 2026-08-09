# 🔑 Configure EAS Keystore - Interactive Guide

**Run this command now:**
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas credentials
```

---

## 📋 STEP-BY-STEP INTERACTIVE GUIDE

When you run `eas credentials`, follow these exact steps:

### Step 1: Select Platform
```
? Select platform »
  > Android
    iOS
    Exit
```
**Action:** Press Enter (select Android)

---

### Step 2: Select Build Profile
```
? Which build profile do you want to configure? »
    development
    preview
    apk
  > production
```
**Action:** Use arrow keys to select `production`, then press Enter

---

### Step 3: Main Menu
```
✔ Using build profile: production

What do you want to do? »
  > Keystore
    Google Service Account Key
    FCM Server Key
    Go back
```
**Action:** Press Enter (select Keystore)

---

### Step 4: View Current Keystore
```
? Keystore »
  > View credentials
    Set up a new keystore
    Use a different Keystore
    Remove Keystore
    Go back
```
**Action:** Press Enter (select "View credentials")

---

### Step 5: CHECK CURRENT KEYSTORE ID

**You'll see something like:**
```
Keystore Credentials 8Xpt79mt7A
  SHA1 Fingerprint:   56:39:95:C3:CD:73:07:E4:93:CF:75:2A:F4:37:FD:2E:09:2C:B2:61
  SHA256 Fingerprint: ...
```

**OR:**
```
Keystore Credentials yKf5TaJ1Kx
  SHA1 Fingerprint:   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
  SHA256 Fingerprint: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

---

## ✅ IF YOU SEE `yKf5TaJ1Kx` WITH SHA-1: 0B:84:89:11...

**CONGRATULATIONS! You're already using the correct keystore!**

**Action:**
1. Press `Esc` or select "Go back" until you exit
2. Skip to "BUILD NOW" section below
3. Run the build command

---

## ❌ IF YOU SEE `8Xpt79mt7A` OR DIFFERENT SHA-1

**You need to switch to the correct keystore!**

### Step 6: Go Back to Keystore Menu
```
Press any key to continue...
```
**Action:** Press any key, then select "Go back"

---

### Step 7: Use a Different Keystore
```
? Keystore »
    View credentials
    Set up a new keystore
  > Use a different Keystore
    Remove Keystore
    Go back
```
**Action:** Use arrow keys to select "Use a different Keystore", then press Enter

---

### Step 8: Select Correct Keystore
```
? Select a Keystore »
  > Keystore yKf5TaJ1Kx (SHA1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F)
    Keystore 8Xpt79mt7A (SHA1: 56:39:95:C3:CD:73:07:E4:93:CF:75:2A:F4:37:FD:2E:09:2C:B2:61)
    Go back
```
**Action:** Select `yKf5TaJ1Kx` (the one with SHA1: 0B:84:89:11...), then press Enter

---

### Step 9: Confirm Selection
```
✔ Selected Keystore: yKf5TaJ1Kx
```

---

### Step 10: Verify Change
```
? Keystore »
  > View credentials
    Set up a new keystore
    Use a different Keystore
    Remove Keystore
    Go back
```
**Action:** Select "View credentials" to verify

**Should now show:**
```
Keystore Credentials yKf5TaJ1Kx
  SHA1 Fingerprint:   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F ✅
  SHA256 Fingerprint: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6 ✅
```

---

### Step 11: Exit
**Action:** Select "Go back" repeatedly or press `Esc` until you exit

**You'll see:**
```
✔ All done!
```

---

## 🚀 BUILD NOW

After confirming keystore is `yKf5TaJ1Kx`, run:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Build production AAB
eas build --platform android --profile production --clear-cache
```

**Watch for this critical line:**
```
√ Using Keystore from configuration: Build Credentials yKf5TaJ1Kx (default)
```

✅ **If you see `yKf5TaJ1Kx`** → Perfect! Let build continue (takes ~10 minutes)  
❌ **If you see `8Xpt79mt7A`** → Press Ctrl+C, go back and fix credentials

---

## 🚨 TROUBLESHOOTING

### Issue: Can't Find `yKf5TaJ1Kx` in the List

**Symptoms:**
- Only see `8Xpt79mt7A` in keystore list
- No option for `yKf5TaJ1Kx`

**Solution:**
The keystore might not be uploaded to your production profile yet. You need to upload it:

```bash
eas credentials
# Select: Android → production → Keystore
# Select: "Set up a new keystore"
# Select: "Upload an existing keystore"
# Browse to: c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks
# OR: c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks
```

**You'll need:**
- Keystore password (you must know this)
- Key alias: `f1a185ee3a5ba7802fd6698297601ca8`
- Key password (you must know this)

After upload, verify SHA-1 is: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`

---

### Issue: Don't Know Keystore Password

**If keystore is already in EAS:**
- You don't need password
- Just select it from the list

**If uploading keystore:**
- Check password manager
- Check old documentation
- Check with team member who created it
- Last resort: Create new app in Play Store

---

## ✅ SUMMARY

**What you need to verify:**
1. Run `eas credentials`
2. Navigate to: Android → production → Keystore → View credentials
3. Verify ID: `yKf5TaJ1Kx`
4. Verify SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
5. If wrong, select "Use a different Keystore" → Choose `yKf5TaJ1Kx`
6. Exit and run build

**Then build:**
```bash
eas build --platform android --profile production --clear-cache
```

---

**You can do this! Follow the steps above and you'll be building in 5 minutes.** 🚀
