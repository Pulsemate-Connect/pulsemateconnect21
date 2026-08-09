# ⚡ QUICK FIX: Upload AAB to Play Store

**Problem:** AAB signed with wrong keystore (SHA-1: 56:39:95:C3...)  
**Solution:** Rebuild AAB with correct keystore from EAS  
**Time:** 10-15 minutes  

---

## ✅ GOOD NEWS

Your EAS account **already has the correct keystore** configured!

```
✅ EAS Keystore Credentials: yKf5TaJ1Kx
✅ SHA-1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
✅ This matches what Google Play Console expects!
```

The problem was that **Build #79** (the AAB you tried to upload) was somehow signed with a different keystore (SHA-1: `56:39:95:C3...`).

---

## 🎯 SOLUTION: Rebuild AAB

Simply rebuild the AAB - EAS will use the correct keystore this time.

### Step 1: Increment Version Code
```bash
# Open app.json and find "versionCode"
# Current: 79
# Change to: 80
```

Edit `app.json`:
```json
{
  "expo": {
    "android": {
      "versionCode": 80
    }
  }
}
```

### Step 2: Rebuild AAB
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Build production AAB
eas build --platform android --profile production
```

**Expected:**
- Build starts on EAS servers
- Uses keystore: `yKf5TaJ1Kx` (SHA-1: 0B:84:89:11...)
- Takes ~8-10 minutes
- Returns download link when done

### Step 3: Download New AAB
```bash
# After build completes, download from:
# https://expo.dev/artifacts/eas/[build-id].aab

# Or download via CLI:
eas build:list
# Find Build #80, copy download link
```

### Step 4: Upload to Google Play Console
1. Go to: https://play.google.com/console
2. Select: **PulseMate Connect**
3. Navigate: **Production** → **Create new release**
4. Upload: `application-[build-id].aab` (Build 80)
5. Should succeed ✅ (correct SHA-1 signature)

---

## 🔍 WHY DID BUILD 79 FAIL?

There are a few possible reasons Build 79 had the wrong signature:

### Theory 1: Wrong EAS Profile Used
- Build 79 might have used `preview` or `apk` profile instead of `production`
- Different profiles can use different keystores

### Theory 2: Keystore Changed Recently
- EAS keystore was updated 4 days ago (as shown in credentials)
- Build 79 might have been built before keystore update

### Theory 3: Manual Build
- If Build 79 was built locally (`./gradlew bundleRelease`), it would use local keystore
- Local keystore has different SHA-1

---

## 🧪 VERIFY CORRECT KEYSTORE BEFORE BUILD

Before rebuilding, let's confirm EAS has the right keystore:

```bash
# Check EAS credentials
eas credentials

# Select: Android
# Select: Production
# Select: Keystore
# View: Show details

# Should show:
# SHA-1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F ✅
```

**If SHA-1 matches** → Proceed with build  
**If SHA-1 doesn't match** → Something is wrong, contact me

---

## 📱 ALTERNATIVE: Configure Play App Signing (Recommended)

If you want to avoid keystore issues in the future, enable **Google Play App Signing**:

### Benefits:
- Google manages final app signing key
- You can reset upload key if you lose it
- More secure and flexible
- Industry standard

### How:
1. Go to: https://play.google.com/console
2. Select: **PulseMate Connect**
3. Navigate: **Setup** → **App integrity** → **App signing**
4. Click: **"Use Play App Signing"**
5. Select: **"Let Google create and manage my app signing key"**
6. Confirm

This makes your current keystore (SHA-1: 0B:84:89:11...) the **upload key**, and Google will create a separate **app signing key** for the final APKs distributed to users.

---

## ✅ QUICK CHECKLIST

- [ ] Open `app.json`
- [ ] Change `versionCode` from 79 to 80
- [ ] Save file
- [ ] Run: `eas build --platform android --profile production`
- [ ] Wait ~10 minutes for build
- [ ] Download AAB when ready
- [ ] Upload to Play Console
- [ ] Verify upload succeeds ✅
- [ ] Create release
- [ ] Publish to Production 🚀

---

## 🚨 IF BUILD STILL FAILS

If the new build (Build 80) still has wrong signature:

### Check EAS Profile
Look at `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "remote" // ← Must be "remote"
      }
    }
  }
}
```

`"credentialsSource": "remote"` means use EAS keystore (correct)  
`"credentialsSource": "local"` means use local keystore (wrong)

### Verify Build Uses Production Profile
```bash
# Make sure you use --profile production
eas build --platform android --profile production

# NOT --profile preview or --profile apk
```

### Last Resort: Upload Keystore Again
If EAS somehow has wrong keystore:
```bash
eas credentials

# Select: Android → Production → Keystore
# Choose: Remove keystore
# Confirm removal

# Then add correct keystore
# Choose: Set up a new keystore → Upload existing keystore
# Browse to: credentials/android/keystore.jks or @pulsemateconnect__pulsemate-app.jks
# Enter password (you'll need to know/remember this)
```

---

## 🎯 EXPECTED TIMELINE

- ⏰ **Now:** Edit `app.json` (1 minute)
- ⏰ **+2 min:** Start EAS build
- ⏰ **+10 min:** Build completes
- ⏰ **+15 min:** Download AAB
- ⏰ **+20 min:** Upload to Play Console
- ⏰ **+25 min:** Create release
- ⏰ **+30 min:** Submit for review! 🎉

Google review: 1-3 days → Live on Play Store!

---

**Bottom Line:** Just rebuild with `eas build --platform android --profile production` and it should work! ✅
